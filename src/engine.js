import {
  core,
  constants,
  types,
  snippets,
  serialMethods,
  stringMethods,
  fn,
} from "./catalog.js";
import { libraries, fileMethods } from "./libraries.js";
import { analyze, lexical, visibleSymbols } from "./syntax.js";
export const MAX_CODE_SIZE = 120000;
const memberMethods = (items, source, url) =>
  items.map((x) => ({ ...x, source, url: url ?? x.url, kind: "method" }));
export function complete(
  code,
  offset,
  { explicit = false, threshold = 2, analysis } = {},
) {
  if (code.length > MAX_CODE_SIZE) return null;
  const before = code.slice(0, offset),
    line = before.slice(before.lastIndexOf("\n") + 1);
  const include = line.match(/^\s*#\s*include\s*([<"])([^>"\n]*)$/);
  const lex = lexical(before);
  if (include && !["block", "line", "raw"].includes(lex.state)) {
    const prefix = include[2],
      from = offset - prefix.length;
    const tail = code.slice(offset).match(/^[^>"\n]*/)?.[0] ?? "";
    const close = include[1] === "<" ? ">" : '"';
    const entries = libraries
      .filter((l) => l.header.toLowerCase().startsWith(prefix.toLowerCase()))
      .map((l) => ({
        label: l.header,
        kind: "library",
        source: "Bundled",
        summary: `Enable ${l.type} completions.`,
        url: l.url,
        template:
          l.header + (code[offset + tail.length] === close ? "" : close),
        details:
          "This adds an include statement and enables local suggestions. It does not install a library in Tinkercad.",
      }));
    return { from, to: offset + tail.length, entries, member: false };
  }
  if (lex.state !== "code" || /^\s*#/.test(line)) return null;
  const prefix = before.match(/[A-Za-z_]\w*$/)?.[0] ?? "";
  const from = offset - prefix.length;
  const memberMatch = before
    .slice(0, from)
    .match(/([A-Za-z_]\w*)\s*(?:\.|->)\s*$/);
  if (!explicit && !memberMatch && prefix.length < threshold) return null;
  // Automatic suggestions only at identifiers / member access, not after whitespace.
  if (!explicit && !prefix && !memberMatch) return null;
  analysis ??= analyze(code);
  const visible = visibleSymbols(analysis, offset),
    active = libraries.filter((l) => analysis.includes.has(l.header));
  let entries = [];
  if (memberMatch) {
    const receiver = memberMatch[1],
      symbol = visible.find((s) => s.name === receiver);
    if (receiver === "Serial" && !symbol)
      entries = memberMethods(serialMethods, "Arduino Serial");
    else if (symbol?.type === "String")
      entries = memberMethods(stringMethods, "Arduino String");
    else if (symbol?.type === "File" && analysis.includes.has("SD.h"))
      entries = memberMethods(fileMethods, "SD");
    else {
      const lib = active.find((l) =>
        symbol ? l.type === symbol.type : l.global === receiver,
      );
      if (lib) entries = memberMethods(lib.methods, lib.header, lib.url);
    }
  } else {
    const user = visible.map((s) =>
      s.kind === "function"
        ? fn(s.name, s.args, `Function declared in this sketch.`, {
            source: "Your sketch",
            kind: "function",
            url: undefined,
          })
        : {
            label: s.name,
            template: s.name,
            kind: s.kind,
            summary: s.type
              ? `${s.type} declared in this sketch.`
              : "Defined in this sketch.",
            source: "Your sketch",
          },
    );
    const globals = [
      {
        label: "Serial",
        template: "Serial",
        kind: "object",
        source: "Arduino",
        summary: "Hardware serial port. Type a dot to see methods.",
      },
    ];
    for (const l of active) {
      globals.push({
        label: l.global ?? l.type,
        template: l.global ?? l.type,
        kind: l.global ? "object" : "type",
        source: l.header,
        url: l.url,
        summary: `${l.type} from ${l.header}.`,
        details: l.details,
      });
      if (l.declaration)
        globals.push({
          label: l.type + " declaration",
          filter: l.type,
          template: l.declaration,
          kind: "snippet",
          source: l.header,
          url: l.url,
          summary: `Create a ${l.type} instance.`,
          details: l.details,
        });
      for (const label of l.constants ?? [])
        globals.push({
          label,
          template: label,
          kind: "constant",
          source: l.header,
          summary: `Constant from ${l.header}.`,
          url: l.url,
        });
    }
    entries = [
      ...user,
      ...core,
      ...snippets,
      ...constants,
      ...types,
      ...globals,
    ];
  }
  const lower = prefix.toLowerCase();
  const ranked = entries
    .map((entry, i) => ({
      entry,
      i,
      score:
        score(entry.filter ?? entry.label, prefix) +
        (entry.source === "Your sketch" ? 8 : 0),
    }))
    .filter((x) => !lower || x.score >= 0)
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const seen = new Set();
  entries = ranked
    .map((x) => x.entry)
    .filter((e) => {
      const key = e.label + "|" + e.kind;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 60);
  const rest = code.slice(offset).match(/^\w*/)?.[0] ?? "";
  return { from, to: offset + rest.length, entries, member: !!memberMatch };
}
function score(name, prefix) {
  if (!prefix) return 0;
  if (name === prefix) return 100;
  if (name.startsWith(prefix)) return 80;
  if (name.toLowerCase().startsWith(prefix.toLowerCase())) return 60;
  const initials = name
    .replace(/([A-Z])/g, " $1")
    .split(/[\s_]+/)
    .map((s) => s[0] ?? "")
    .join("")
    .toLowerCase();
  return initials.startsWith(prefix.toLowerCase()) ? 30 : -100;
}
export function insertionTemplate(entry, result, code) {
  if (!["function", "method"].includes(entry.kind)) return entry.template;
  const after = code.slice(result.to),
    line = code.slice(0, result.from).split("\n").at(-1);
  if (/^\s*\(/.test(after)) return entry.label; // Existing call: preserve its arguments.
  const receiverStart = result.member
    ? line.replace(/[A-Za-z_]\w*\s*(?:\.|->)\s*$/, "")
    : line;
  const statement = /(?:^|[;{}])\s*$/.test(receiverStart);
  const needsSemicolon =
    statement && !/^\s*[;(]/.test(after) && /^\s*(?:$|\}|\/\/)/.test(after);
  return entry.template + (needsSemicolon ? ";" : "") + "${0}";
}
