import { mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
await mkdir("release", { recursive: true });
const name = `tinkercomplete-${version}.zip`;
// -FS removes stale files when rebuilding an existing archive.
execFileSync("zip", ["-q", "-r", "-FS", `../release/${name}`, "."], {
  cwd: "dist",
});
console.log(`Packaged release/${name}`);
