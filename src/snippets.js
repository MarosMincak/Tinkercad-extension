export function expandSnippet(template, { indent = "", unit = "  " } = {}) {
  template = template.replace(/\n/g, "\n" + indent).replace(/\t/g, unit);
  const defaults = new Map();
  for (const match of template.matchAll(/\$\{(\d+)(?::([^}]*))?\}/g))
    if (match[2] !== undefined) defaults.set(+match[1], match[2]);
  const stops = [];
  let text = "",
    last = 0;
  for (const match of template.matchAll(/\$\{(\d+)(?::([^}]*))?\}/g)) {
    text += template.slice(last, match.index);
    const value = match[2] ?? defaults.get(+match[1]) ?? "";
    stops.push({
      number: +match[1],
      from: text.length,
      to: text.length + value.length,
    });
    text += value;
    last = match.index + match[0].length;
  }
  text += template.slice(last);
  if (!stops.some((s) => s.number === 0))
    stops.push({ number: 0, from: text.length, to: text.length });
  return { text, stops };
}
export class SnippetSession {
  constructor(cm, expanded, start) {
    this.cm = cm;
    this.busy = false;
    this.index = -1;
    this.groups = [...new Set(expanded.stops.map((s) => s.number))].sort(
      (a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b),
    );
    this.marks = expanded.stops.map((s) => ({
      number: s.number,
      mark: cm.markText(
        cm.posFromIndex(start + s.from),
        cm.posFromIndex(start + s.to),
        {
          className: "tinkercomplete-field",
          inclusiveLeft: true,
          inclusiveRight: true,
          clearWhenEmpty: false,
        },
      ),
    }));
  }
  next(back = false) {
    if (!this.groups.length) return false;
    this.index = Math.max(0, this.index + (back ? -1 : 1));
    if (this.index >= this.groups.length) {
      this.clear();
      return false;
    }
    const number = this.groups[this.index],
      range = this.marks.find((m) => m.number === number)?.mark.find();
    if (!range) {
      this.clear();
      return false;
    }
    this.busy = true;
    this.cm.setSelection(range.from, range.to);
    this.busy = false;
    if (number === 0) this.clear();
    return true;
  }
  containsSelection() {
    if (this.busy) return true;
    const range = this.marks
      .find((m) => m.number === this.groups[this.index])
      ?.mark.find();
    if (!range) return false;
    const cm = this.cm,
      a = cm.indexFromPos(cm.getCursor("from")),
      b = cm.indexFromPos(cm.getCursor("to"));
    return a >= cm.indexFromPos(range.from) && b <= cm.indexFromPos(range.to);
  }
  allowsChange(change) {
    const range = this.marks
      .find((m) => m.number === this.groups[this.index])
      ?.mark.find();
    if (!range) return false;
    return (
      this.cm.indexFromPos(change.from) >= this.cm.indexFromPos(range.from) &&
      this.cm.indexFromPos(change.to) <= this.cm.indexFromPos(range.to)
    );
  }
  mirror() {
    if (this.busy || !this.groups.length) return;
    const number = this.groups[this.index],
      same = this.marks.filter((m) => m.number === number),
      range = same[0]?.mark.find();
    if (!range || same.length < 2) return;
    const value = this.cm.getRange(range.from, range.to);
    this.busy = true;
    this.cm.operation(() => {
      for (const m of same.slice(1).reverse()) {
        const r = m.mark.find();
        if (r && this.cm.getRange(r.from, r.to) !== value)
          this.cm.replaceRange(value, r.from, r.to, "+tinkercomplete-mirror");
      }
    });
    this.busy = false;
  }
  clear() {
    for (const m of this.marks) m.mark.clear();
    this.marks = [];
    this.groups = [];
  }
}
