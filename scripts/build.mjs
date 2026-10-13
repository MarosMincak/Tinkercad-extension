import { build } from "esbuild";
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("extension", "dist", { recursive: true });
await build({
  entryPoints: {
    editor: "src/editor.js",
    "settings-bridge": "src/settings-bridge.js",
  },
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome111",
  minify: true,
  legalComments: "eof",
  loader: { ".css": "text" },
});
// Wrap the small extension popup's top-level await in a bundled async IIFE.
const popup = await build({
  entryPoints: ["src/popup.js"],
  bundle: true,
  format: "esm",
  target: "chrome111",
  minify: true,
  write: false,
});
await writeFile(
  "dist/popup.js",
  `(async()=>{${popup.outputFiles[0].text}\n})().catch(()=>{document.getElementById('status').textContent='Could not load settings. Reopen this popup.';});`,
);
const notices = [];
for (const name of [
  "@lezer/cpp",
  "@lezer/common",
  "@lezer/lr",
  "@lezer/highlight",
])
  notices.push(
    `## ${name}\n\n${await readFile(`node_modules/${name}/LICENSE`, "utf8")}`,
  );
await writeFile("dist/THIRD_PARTY_NOTICES.txt", notices.join("\n\n"));
console.log("Built dist/ — load this folder as an unpacked Chrome extension.");
