import { complete, insertionTemplate, MAX_CODE_SIZE } from "./engine.js";
import { analyze } from "./syntax.js";
import { expandSnippet, SnippetSession } from "./snippets.js";
import { CompletionPanel } from "./panel.js";
import { defaults, normalizeSettings } from "./settings.js";

export function isEditableArduino(cm) {
  const wrapper = cm.getWrapperElement(),
    panel = wrapper.closest(".js-code_panel__texteditor");
  const mode = cm.getOption("mode");
  return (
    !!panel &&
    !cm.getOption("readOnly") &&
    (mode === "text/x-c++src" || mode?.name === "text/x-c++src") &&
    wrapper.isConnected &&
    wrapper.getClientRects().length > 0 &&
    getComputedStyle(wrapper).visibility !== "hidden"
  );
}
export class EditorController {
  constructor(cm, settings = defaults) {
    this.cm = cm;
    this.settings = settings;
    this.cache = null;
    this.timer = null;
    this.snippet = null;
    this.applying = false;
    this.panel = new CompletionPanel({
      onPick: (entry) => this.accept(entry),
      onClose: () => this.panel.hide(),
      onLayout: () => this.layout(),
    });
    this.handlers = {
      changes: (_cm, changes) => this.changed(changes),
      beforeChange: (_cm, change) => {
        if (
          this.snippet &&
          !this.applying &&
          !this.snippet.busy &&
          (!this.snippet.allowsChange(change) ||
            ["undo", "redo"].includes(change.origin))
        )
          this.clearSnippet();
      },
      cursorActivity: () => {
        if (!this.applying) {
          if (this.panel.visible && this.panelCursor !== this.cursorKey())
            this.panel.hide();
          if (this.snippet && !this.snippet.containsSelection())
            this.clearSnippet();
        }
      },
      blur: () => {
        clearTimeout(this.timer);
        this.panel.hide();
      },
      scroll: () => this.layout(),
      swapDoc: () => {
        this.cache = null;
        this.reset();
      },
    };
    for (const [name, handler] of Object.entries(this.handlers))
      cm.on(name, handler);
    this.composing = false;
    this.keymap = Object.fromEntries(
      [
        "Ctrl-Space",
        "Alt-Space",
        "Alt-I",
        "Down",
        "Up",
        "Tab",
        "Shift-Tab",
        "Enter",
        "Esc",
      ].map((key) => [key, () => this.handleKey(key)]),
    );
    this.keymap.name = "TinkerComplete";
    cm.addKeyMap(this.keymap);
    this.startComposition = () => {
      this.composing = true;
      this.reset();
    };
    this.endComposition = () => {
      this.composing = false;
    };
    cm.getInputField().addEventListener(
      "compositionstart",
      this.startComposition,
    );
    cm.getInputField().addEventListener("compositionend", this.endComposition);
    this.reposition = () => {
      if (this.panel.visible) this.layout();
    };
    window.addEventListener("resize", this.reposition);
    window.addEventListener("scroll", this.reposition, true);
  }
  active() {
    return (
      this.settings.enabled && isEditableArduino(this.cm) && !this.composing
    );
  }
  reset() {
    clearTimeout(this.timer);
    this.panel.hide();
    this.clearSnippet();
  }
  clearSnippet() {
    this.snippet?.clear();
    this.snippet = null;
  }
  changed(changes) {
    this.cache = null;
    clearTimeout(this.timer);
    if (this.applying) return;
    if (this.resultCode !== this.cm.getValue()) this.panel.hide();
    if (this.snippet && !this.snippet.busy) this.snippet.mirror();
    if (
      this.settings.auto &&
      changes.some((c) => c.origin === "+input" || c.origin === "paste")
    )
      this.timer = setTimeout(() => this.suggest(false), this.settings.delay);
  }
  suggest(explicit) {
    clearTimeout(this.timer);
    if (!this.active() || !this.cm.hasFocus()) return this.panel.hide();
    // A selected snippet placeholder may be replaced by an explicit completion.
    if (this.cm.somethingSelected() && !explicit) return this.panel.hide();
    const code = this.cm.getValue();
    if (code.length > MAX_CODE_SIZE) return this.panel.hide();
    this.cache ??= analyze(code);
    let offset = this.cm.indexFromPos(this.cm.getCursor("to"));
    const result = complete(code, offset, {
      explicit,
      threshold: this.settings.threshold,
      analysis: this.cache,
    });
    if (!result?.entries.length) return this.panel.hide();
    if (this.cm.somethingSelected()) {
      result.from = this.cm.indexFromPos(this.cm.getCursor("from"));
      result.to = offset;
    }
    this.resultCode = code;
    this.panelCursor = this.cursorKey();
    this.panel.show(result);
    this.layout();
  }
  layout() {
    if (this.panel.visible) {
      if (!this.active()) return this.reset();
      this.panel.position(this.cm.cursorCoords(null, "window"));
    }
  }
  accept(entry = this.panel.current) {
    if (!entry || !this.panel.result || !this.active()) return;
    const cm = this.cm,
      code = cm.getValue(),
      result = this.panel.result;
    if (code !== this.resultCode) {
      this.panel.hide();
      return;
    }
    const template = insertionTemplate(entry, result, code),
      start = cm.posFromIndex(result.from);
    const indent = cm.getLine(start.line).match(/^\s*/)[0],
      unit = cm.getOption("indentWithTabs")
        ? "\t"
        : " ".repeat(cm.getOption("indentUnit") || 2);
    const expanded = expandSnippet(template, { indent, unit });
    const keepParent = this.snippet && !/\$\{[1-9]/.test(template);
    if (!keepParent) this.clearSnippet();
    this.panel.hide();
    this.applying = true;
    cm.operation(() => {
      cm.replaceRange(
        expanded.text,
        start,
        cm.posFromIndex(result.to),
        "+tinkercomplete",
      );
      if (keepParent) {
        cm.setCursor(cm.posFromIndex(result.from + expanded.text.length));
      } else {
        this.snippet = new SnippetSession(cm, expanded, result.from);
        this.snippet.next();
      }
    });
    this.applying = false;
    if (keepParent) this.snippet.mirror();
    cm.focus();
  }
  cursorKey() {
    return JSON.stringify([this.cm.getCursor("from"), this.cm.getCursor("to")]);
  }
  handleKey(key) {
    const pass = window.CodeMirror.Pass;
    if (!this.active()) return pass;
    if (key === "Ctrl-Space" || key === "Alt-Space") {
      this.suggest(true);
      return;
    }
    if (this.panel.visible) {
      if (key === "Alt-I") {
        this.panel.toggleDetails();
        return;
      }
      if (key === "Down" || key === "Up") {
        this.panel.move(key === "Down" ? 1 : -1);
        return;
      }
      if (key === "Tab" || key === "Enter") {
        // Native keymaps flush CodeMirror's pending textarea input before running.
        // Recompute any stale suggestion range after that flush.
        const label = this.panel.current?.label;
        if (this.resultCode !== this.cm.getValue()) this.suggest(true);
        if (this.panel.visible)
          this.accept(
            this.panel.result.entries.find((e) => e.label === label) ??
              this.panel.current,
          );
        return;
      }
      if (key === "Esc") {
        this.panel.hide();
        return;
      }
      if (key === "Shift-Tab") this.panel.hide();
    }
    if ((key === "Tab" || key === "Shift-Tab") && this.snippet?.groups.length) {
      this.snippet.mirror();
      this.applying = true;
      this.snippet.next(key === "Shift-Tab");
      this.applying = false;
      return;
    }
    if (key === "Esc" && this.snippet?.groups.length) {
      this.clearSnippet();
      return;
    }
    return pass;
  }
  update(settings) {
    this.settings = settings;
    if (!settings.enabled) this.reset();
  }
  destroy() {
    this.reset();
    for (const [name, handler] of Object.entries(this.handlers))
      this.cm.off(name, handler);
    this.cm.removeKeyMap(this.keymap);
    this.cm
      .getInputField()
      .removeEventListener("compositionstart", this.startComposition);
    this.cm
      .getInputField()
      .removeEventListener("compositionend", this.endComposition);
    window.removeEventListener("resize", this.reposition);
    window.removeEventListener("scroll", this.reposition, true);
    this.panel.destroy();
  }
}
export function start() {
  if (document.getElementById("tinkercomplete-runtime")) return;
  const style = document.createElement("style");
  style.id = "tinkercomplete-runtime";
  style.textContent =
    ".CodeMirror .tinkercomplete-field{background:rgba(52,144,92,.10);border-bottom:1px dotted #469663}";
  document.head.append(style);
  let settings = defaults;
  const controllers = new Map();
  const scan = () => {
    const route = /^\/things\/[^/]+\/editel\/?$/.test(location.pathname);
    for (const [cm, c] of controllers) {
      if (!route || !cm.getWrapperElement().isConnected) {
        c.destroy();
        controllers.delete(cm);
      } else if (!c.active()) c.reset();
    }
    if (route && settings.enabled)
      for (const el of document.querySelectorAll(
        ".js-code_panel__texteditor .CodeMirror",
      )) {
        const cm = el.CodeMirror;
        if (
          cm &&
          ["getValue", "markText", "on", "getOption", "replaceRange"].every(
            (k) => typeof cm[k] === "function",
          ) &&
          !controllers.has(cm)
        )
          controllers.set(cm, new EditorController(cm, settings));
      }
    style.dataset.status = !settings.enabled
      ? "disabled"
      : [...controllers.values()].some((c) => c.active())
        ? "ready"
        : "waiting";
  };
  window.addEventListener("message", (e) => {
    if (
      e.source !== window ||
      e.origin !== location.origin ||
      e.data?.type !== "tinkercomplete:settings"
    )
      return;
    settings = normalizeSettings(e.data.settings);
    for (const c of controllers.values()) c.update(settings);
    scan();
  });
  window.postMessage({ type: "tinkercomplete:ready" }, location.origin);
  scan();
  // Tinkercad is an SPA and swaps CodeMirror documents and components dynamically.
  setInterval(scan, 750);
  window.addEventListener("pagehide", () => {
    for (const c of controllers.values()) c.destroy();
    controllers.clear();
  });
}
start();
