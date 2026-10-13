import { parser } from "@lezer/cpp";
// Same-length masking keeps offsets stable, including while a string/comment is unfinished.
export function lexical(code) {
  let clean = "",
    commentsOnly = "",
    state = "code",
    quote = "",
    rawEnd = "";
  for (let i = 0; i < code.length; i++) {
    const c = code[i],
      n = code[i + 1];
    if (state === "line") {
      if (c === "\n") state = "code";
      clean += c === "\n" ? "\n" : " ";
      commentsOnly += c === "\n" ? "\n" : " ";
      continue;
    }
    if (state === "block") {
      if (c === "*" && n === "/") {
        clean += "  ";
        commentsOnly += "  ";
        i++;
        state = "code";
      } else {
        clean += c === "\n" ? "\n" : " ";
        commentsOnly += c === "\n" ? "\n" : " ";
      }
      continue;
    }
    if (state === "raw") {
      if (code.startsWith(rawEnd, i)) {
        clean += " ".repeat(rawEnd.length);
        commentsOnly += rawEnd;
        i += rawEnd.length - 1;
        state = "code";
      } else {
        clean += c === "\n" ? "\n" : " ";
        commentsOnly += c;
      }
      continue;
    }
    if (state === "string") {
      commentsOnly += c;
      clean += c === "\n" ? "\n" : " ";
      if (c === "\\" && n) {
        clean += n === "\n" ? "\n" : " ";
        commentsOnly += n;
        i++;
      } else if (c === quote) {
        state = "code";
      }
      continue;
    }
    if (c === "/" && (n === "/" || n === "*")) {
      state = n === "/" ? "line" : "block";
      clean += "  ";
      commentsOnly += "  ";
      i++;
      continue;
    }
    const raw =
      c === "R" && n === '"'
        ? code.slice(i).match(/^R"([^\s()\\]{0,16})\(/)
        : null;
    if (raw) {
      rawEnd = ")" + raw[1] + '"';
      state = "raw";
      clean += " ".repeat(raw[0].length);
      commentsOnly += raw[0];
      i += raw[0].length - 1;
      continue;
    }
    if (c === '"' || c === "'") {
      state = "string";
      quote = c;
      clean += " ";
      commentsOnly += c;
      continue;
    }
    clean += c;
    commentsOnly += c;
  }
  return { clean, commentsOnly, state };
}
function children(node) {
  let out = [];
  for (let c = node.firstChild; c; c = c.nextSibling) out.push(c);
  return out;
}
function find(node, name) {
  if (node.name === name) return node;
  for (let c = node.firstChild; c; c = c.nextSibling) {
    const found = find(c, name);
    if (found) return found;
  }
  return null;
}
function declaratorName(node) {
  if (["Identifier", "FieldIdentifier"].includes(node.name)) return node;
  if (
    [
      "InitDeclarator",
      "ArrayDeclarator",
      "PointerDeclarator",
      "ReferenceDeclarator",
      "FunctionDeclarator",
      "ParenthesizedDeclarator",
    ].includes(node.name)
  )
    return (
      node.firstChild &&
      declaratorName(
        children(node).find(
          (n) => !["*", "&", "&&", "(", ")", "const"].includes(n.name),
        ) ?? node.firstChild,
      )
    );
  return null;
}
export function analyze(code) {
  const lex = lexical(code);
  const includes = new Set(
    Array.from(
      lex.commentsOnly.matchAll(/^\s*#\s*include\s*[<"]([^>"\n]+)[>"]/gm),
      (m) => m[1],
    ),
  );
  let balance = 0;
  for (const c of lex.clean) {
    if (c === "{") balance++;
    else if (c === "}") balance = Math.max(0, balance - 1);
  }
  const tree = parser.parse(code + "\n" + "}".repeat(balance));
  const symbols = [];
  const text = (n) => code.slice(n.from, n.to);
  function visit(node, scope = { from: 0, to: code.length + 1 }, owner = null) {
    if (
      ["CompoundStatement", "ForStatement", "FieldDeclarationList"].includes(
        node.name,
      )
    )
      scope = {
        from: node.from,
        to: Math.max(
          node.to,
          node.to >= code.length ? code.length + 1 : node.to,
        ),
      };
    if (node.name === "FunctionDefinition") {
      const dec = children(node).find((n) => n.name === "FunctionDeclarator");
      if (dec) addFunction(dec, scope);
      owner = {
        from: node.from,
        to: Math.max(
          node.to,
          code.length <= node.to ? code.length + 1 : node.to,
        ),
      };
    }
    if (
      node.name === "Declaration" ||
      (node.name === "ParameterDeclaration" &&
        owner &&
        node.parent?.parent?.parent?.name === "FunctionDefinition")
    ) {
      const typeNodes = children(node).filter((n) =>
        [
          "PrimitiveType",
          "TypeIdentifier",
          "SizedTypeSpecifier",
          "TemplateType",
          "auto",
        ].includes(n.name),
      );
      const type = typeNodes.map(text).join(" ");
      for (const dec of children(node)) {
        if (dec.name === "FunctionDeclarator") {
          addFunction(dec, scope);
          continue;
        }
        const id = declaratorName(dec);
        if (id && type) {
          symbols.push({
            name: text(id),
            type,
            kind: "variable",
            from: id.from,
            scope:
              node.name === "ParameterDeclaration" ? (owner ?? scope) : scope,
          });
        }
      }
    }
    if (
      ["StructSpecifier", "ClassSpecifier", "EnumSpecifier"].includes(node.name)
    ) {
      const id = children(node).find((n) => n.name === "TypeIdentifier");
      if (id)
        symbols.push({
          name: text(id),
          kind: "type",
          type: text(id),
          from: id.from,
          scope,
        });
    }
    for (const c of children(node)) visit(c, scope, owner);
  }
  function addFunction(dec, scope) {
    const id = declaratorName(dec);
    if (!id) return;
    const params = find(dec, "ParameterList");
    const args = params
      ? children(params)
          .filter((n) => n.name === "ParameterDeclaration")
          .map((n, i) => {
            const d = children(n).map(declaratorName).find(Boolean);
            return d ? text(d) : "arg" + (i + 1);
          })
      : [];
    // (void) represents no arguments.
    symbols.push({
      name: text(id),
      kind: "function",
      args: params && text(params) === "(void)" ? [] : args,
      from: id.from,
      scope,
    });
  }
  visit(tree.topNode);
  for (const m of lex.clean.matchAll(/^\s*#\s*define\s+([A-Za-z_]\w*)/gm))
    symbols.push({
      name: m[1],
      kind: "constant",
      from: m.index,
      scope: { from: 0, to: code.length + 1 },
    });
  return { includes, symbols, lex, tree };
}
export function visibleSymbols(analysis, offset) {
  const names = new Map();
  for (const s of analysis.symbols
    .filter(
      (s) =>
        s.scope.from <= offset &&
        offset <= s.scope.to &&
        (s.kind === "function" || s.from < offset),
    )
    .sort((a, b) => a.scope.from - b.scope.from))
    names.set(s.name, s);
  return [...names.values()];
}
