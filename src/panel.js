import css from "./panel.css";
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const glyph = {
  function: "ƒ",
  method: "ƒ",
  variable: "x",
  constant: "=",
  snippet: "{}",
  type: "T",
  object: "o",
  library: "#",
};
export class CompletionPanel {
  constructor({ onPick, onClose, onLayout }) {
    this.onPick = onPick;
    this.onClose = onClose;
    this.onLayout = onLayout;
    this.selected = 0;
    this.expanded = false;
    this.host = el("div");
    this.host.id = "tinkercomplete-suggestions";
    this.host.hidden = true;
    const shadow = this.host.attachShadow({ mode: "open" }),
      style = el("style");
    style.textContent = css;
    shadow.append(style);
    this.box = el("section", "panel");
    this.box.setAttribute("aria-label", "TinkerComplete suggestions");
    shadow.append(this.box);
    const top = el("div", "top");
    top.append(
      el("span", "brand", "TinkerComplete"),
      el("span", "", "LOCAL · ARDUINO"),
    );
    this.box.append(top);
    this.list = el("div", "list");
    this.list.setAttribute("role", "listbox");
    this.list.setAttribute("aria-label", "Code suggestions");
    this.box.append(this.list);
    this.details = el("div", "details");
    this.details.hidden = true;
    this.box.append(this.details);
    const foot = el("div", "foot");
    foot.append(
      el("span", "", "↑↓ select · TAB insert"),
      el("span", "", "Alt+I details · Esc close"),
    );
    this.box.append(foot);
    this.live = el("div", "sr");
    this.live.setAttribute("role", "status");
    this.live.setAttribute("aria-live", "polite");
    shadow.append(this.live);
    this.box.addEventListener("mousedown", (e) => {
      if (!e.target.closest("a")) e.preventDefault();
    });
    document.body.append(this.host);
  }
  show(result) {
    this.result = result;
    this.selected = 0;
    this.expanded = false;
    this.host.hidden = false;
    this.render();
    this.live.textContent = `${result.entries.length} suggestions. ${result.entries[0]?.label ?? ""}. Use arrow keys and Tab.`;
  }
  get visible() {
    return !this.host.hidden;
  }
  render() {
    this.list.replaceChildren();
    this.result.entries.forEach((entry, index) => {
      const row = el("div", "option");
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(index === this.selected));
      row.dataset.label = entry.label;
      row.append(el("span", "kind", glyph[entry.kind] ?? "·"));
      const name = el("div", "name");
      name.append(
        el("div", "label", entry.label),
        el("span", "summary", entry.summary),
      );
      row.append(name);
      const info = el("button", "info", "i");
      info.type = "button";
      info.title = "More information (Alt+I)";
      info.setAttribute("aria-label", `More information about ${entry.label}`);
      info.setAttribute(
        "aria-expanded",
        String(index === this.selected && this.expanded),
      );
      info.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.selected !== index) {
          this.selected = index;
          this.expanded = true;
        } else this.expanded = !this.expanded;
        this.render();
        this.onLayout();
      });
      row.append(info);
      row.addEventListener("click", () => this.onPick(entry));
      this.list.append(row);
    });
    const row = this.list.children[this.selected];
    if (row) {
      if (row.offsetTop < this.list.scrollTop)
        this.list.scrollTop = row.offsetTop;
      else if (
        row.offsetTop + row.offsetHeight >
        this.list.scrollTop + this.list.clientHeight
      )
        this.list.scrollTop =
          row.offsetTop + row.offsetHeight - this.list.clientHeight;
    }
    this.renderDetails();
  }
  renderDetails() {
    this.details.hidden = !this.expanded;
    this.details.replaceChildren();
    if (!this.expanded) return;
    const entry = this.current;
    this.details.append(
      el("code", "signature", entry.signature ?? entry.label),
      el("p", "", entry.details || entry.summary),
    );
    if (entry.parameters?.length) {
      const dl = el("dl");
      for (const p of entry.parameters) {
        dl.append(el("dt", "", p.name), el("dd", "", p.description));
      }
      this.details.append(dl);
    }
    if (entry.example)
      this.details.append(el("code", "example", entry.example));
    this.details.append(el("p", "", entry.source));
    if (entry.url?.startsWith("https://")) {
      const link = el("a", "", "Open reference ↗");
      link.href = entry.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      this.details.append(link);
    }
  }
  get current() {
    return this.result?.entries[this.selected];
  }
  move(delta) {
    this.selected =
      (this.selected + delta + this.result.entries.length) %
      this.result.entries.length;
    this.render();
    this.live.textContent = this.current.label;
    this.onLayout();
  }
  toggleDetails() {
    this.expanded = !this.expanded;
    this.render();
    this.onLayout();
  }
  position(coords) {
    const margin = 8,
      width = this.host.getBoundingClientRect().width || 390;
    const above = Math.max(0, coords.top - margin - 5),
      below = Math.max(0, innerHeight - coords.bottom - margin - 5);
    this.box.style.maxHeight = innerHeight - margin * 2 + "px";
    const desired = this.host.getBoundingClientRect().height;
    const useAbove = below < desired && above > below;
    const available = Math.max(50, useAbove ? above : below);
    this.list.style.maxHeight =
      (this.expanded ? Math.max(50, Math.min(160, available * 0.42)) : 230) +
      "px";
    this.box.style.maxHeight = available + "px";
    const height = this.host.getBoundingClientRect().height;
    const top = useAbove
      ? Math.max(margin, coords.top - height - 5)
      : coords.bottom + 5;
    this.host.style.left =
      Math.max(margin, Math.min(coords.left, innerWidth - width - margin)) +
      "px";
    this.host.style.top = top + "px";
  }
  hide() {
    this.host.hidden = true;
    this.result = null;
    this.live.textContent = "";
  }
  destroy() {
    this.host.remove();
  }
}
