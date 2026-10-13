import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
const cmSource = await readFile(
  "node_modules/codemirror/lib/codemirror.js",
  "utf8",
);
const mode = await readFile(
  "node_modules/codemirror/mode/clike/clike.js",
  "utf8",
);
const bundle = await build({
  entryPoints: ["src/editor.js"],
  bundle: true,
  format: "iife",
  write: false,
  loader: { ".css": "text" },
});
function fixture(code = "") {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div class="js-code_panel__texteditor"><textarea></textarea></div></body></html>',
    {
      url: "https://www.tinkercad.com/things/test/editel",
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  w.focus = () => {};
  const rect = () => ({
    left: 10,
    right: 600,
    top: 10,
    bottom: 30,
    width: 590,
    height: 20,
  });
  w.Range.prototype.getBoundingClientRect = rect;
  w.Range.prototype.getClientRects = () => [rect()];
  w.HTMLElement.prototype.getBoundingClientRect = rect;
  w.HTMLElement.prototype.getClientRects = () => [rect()];
  w.eval(cmSource);
  w.eval(mode);
  const cm = w.CodeMirror.fromTextArea(w.document.querySelector("textarea"), {
    mode: "text/x-c++src",
    indentUnit: 2,
    extraKeys: { Tab: "indentMore" },
  });
  cm.setValue(code);
  cm.setCursor(cm.posFromIndex(code.length));
  cm.clearHistory();
  cm.focus();
  w.eval(bundle.outputFiles[0].text);
  const key = (key, extra = {}) => {
    const codes = {
      Tab: 9,
      Escape: 27,
      Enter: 13,
      " ": 32,
      ArrowDown: 40,
      ArrowUp: 38,
    };
    const e = new w.KeyboardEvent("keydown", {
      key,
      keyCode: codes[key] ?? key.toUpperCase().charCodeAt(0),
      code: key === " " ? "Space" : key,
      bubbles: true,
      cancelable: true,
      ...extra,
    });
    cm.getInputField().dispatchEvent(e);
    return e.defaultPrevented;
  };
  const suggest = () => key(" ", { ctrlKey: true });
  const panel = () => w.document.querySelector("#tinkercomplete-suggestions");
  const selected = () => cm.getSelection();
  const type = (text) => {
    cm.replaceSelection(text, "end", "+input");
  };
  return { w, cm, key, suggest, panel, selected, type, close: () => w.close() };
}
test("CodeMirror 4.7 integration: insert a call, replace arguments, move forward/back, undo", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    assert.equal(f.panel().hidden, false);
    assert.equal(f.key("Tab"), true);
    assert.equal(f.cm.getValue(), "pinMode(pin, OUTPUT);");
    assert.equal(f.selected(), "pin");
    f.type("LED_BUILTIN");
    f.key("Tab");
    assert.equal(f.selected(), "OUTPUT");
    f.key("Tab", { shiftKey: true });
    assert.equal(f.selected(), "LED_BUILTIN");
    f.key("Tab");
    f.key("Tab");
    assert.equal(f.selected(), "");
    assert.equal(f.cm.getCursor().ch, f.cm.getValue().length);
    f.cm.undo();
    assert(!f.cm.getValue().includes("LED_BUILTIN"));
  } finally {
    f.close();
  }
});
test("repeated snippet fields update when the first field is edited", () => {
  const f = fixture("for");
  try {
    f.suggest();
    f.key("Tab");
    assert.equal(f.selected(), "i");
    f.type("index");
    assert.equal(f.cm.getValue().match(/index/g)?.length, 3);
    f.key("Tab");
    assert.equal(f.selected(), "0");
    f.key("Tab");
    assert.equal(f.selected(), "10");
    f.key("Tab");
    assert.equal(f.cm.getCursor().line, 1);
  } finally {
    f.close();
  }
});
test("empty arguments remain navigable and Escape exits snippet handling", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    f.key("Tab");
    f.type("");
    f.key("Tab");
    assert.equal(f.selected(), "OUTPUT");
    assert.equal(f.key("Escape"), true);
    const before = f.cm.getValue();
    f.key("Tab");
    assert.notEqual(f.cm.getValue(), before);
  } finally {
    f.close();
  }
});
test("read-only and Python editors never capture TAB or open suggestions", () => {
  for (const [option, value] of [
    ["readOnly", true],
    ["mode", "text/x-python"],
  ]) {
    const f = fixture("pin");
    try {
      f.cm.setOption(option, value);
      assert.equal(f.key(" ", { ctrlKey: true }), false);
      assert.equal(f.panel().hidden, true);
    } finally {
      f.close();
    }
  }
});
test("a document swap clears pending suggestions and snippet markers", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    f.key("Tab");
    f.cm.swapDoc(new f.w.CodeMirror.Doc("Serial.", "text/x-c++src"));
    f.cm.setCursor(0, 7);
    f.cm.focus();
    f.suggest();
    assert.equal(f.panel().hidden, false);
    assert.equal(f.cm.getAllMarks().length, 0);
    assert(f.panel().shadowRoot.textContent.includes("println"));
  } finally {
    f.close();
  }
});
test("info button shows documentation without inserting code; Escape dismisses it", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    const button = f.panel().shadowRoot.querySelector("button");
    button.click();
    assert.equal(f.panel().shadowRoot.querySelector(".details").hidden, false);
    assert.equal(f.cm.getValue(), "pin");
    f.key("Escape");
    assert.equal(f.panel().hidden, true);
  } finally {
    f.close();
  }
});
test("cursor movement outside a snippet cancels it without moving the cursor back", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    f.key("Tab");
    f.cm.setCursor(0, 0);
    assert.equal(f.cm.getAllMarks().length, 0);
  } finally {
    f.close();
  }
});
test("plain suggestions inside snippet arguments preserve the remaining tab stops", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    f.key("Tab");
    f.type("LED");
    f.suggest();
    f.key("Tab");
    assert.equal(f.cm.getValue(), "pinMode(LED_BUILTIN, OUTPUT);");
    f.key("Tab");
    assert.equal(f.selected(), "OUTPUT");
  } finally {
    f.close();
  }
});
test("TAB flushes pending textarea input before selecting the next argument", () => {
  const f = fixture("pin");
  try {
    f.suggest();
    f.key("Tab");
    const input = f.cm.getInputField();
    input.value = "LED_BUILTIN";
    input.setSelectionRange(11, 11);
    input.dispatchEvent(new f.w.Event("input", { bubbles: true }));
    f.key("Tab");
    assert.equal(f.cm.getValue(), "pinMode(LED_BUILTIN, OUTPUT);");
    assert.equal(f.selected(), "OUTPUT");
  } finally {
    f.close();
  }
});
test("fast TAB preserves the final letter in a linked loop variable", () => {
  const f = fixture("for");
  try {
    f.suggest();
    f.key("Tab");
    const input = f.cm.getInputField();
    input.value = "index";
    input.setSelectionRange(5, 5);
    input.dispatchEvent(new f.w.Event("input", { bubbles: true }));
    f.key("Tab");
    assert.equal(f.cm.getValue().match(/index/g)?.length, 3);
    assert.equal(f.selected(), "0");
  } finally {
    f.close();
  }
});
