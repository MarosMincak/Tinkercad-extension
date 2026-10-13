import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ["storage"]);
assert(!manifest.host_permissions);
for (const script of manifest.content_scripts) {
  assert.deepEqual(script.matches, ["https://www.tinkercad.com/*"]);
  for (const f of script.js) assert((await stat("dist/" + f)).size > 0);
}
for (const f of Object.values(manifest.icons)) {
  const bytes = await readFile("dist/" + f);
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
}
for (const f of await readdir("dist"))
  if (f.endsWith(".js")) {
    const js = await readFile("dist/" + f, "utf8");
    assert(
      !/\beval\s*\(|new Function\s*\(|\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(
        js,
      ),
      `${f}: unexpected execution or networking primitive`,
    );
  }
assert(
  (await readFile("dist/editor.js")).length < 400000,
  "Keep the editor bundle below 400 KB",
);
console.log("Manifest, icons, bundle budget, and offline-code checks passed.");
