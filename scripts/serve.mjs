import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve("."),
  types = {
    ".js": "text/javascript",
    ".html": "text/html",
    ".css": "text/css",
    ".png": "image/png",
    ".json": "application/json",
  };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost"),
      path =
        url.pathname === "/things/demo/editel"
          ? "demo/index.html"
          : decodeURIComponent(url.pathname).slice(1) || "demo/index.html";
    const file = resolve(root, path);
    if (
      !file.startsWith(root + "/") ||
      path.startsWith(".git") ||
      path.includes("/.")
    ) {
      res.writeHead(403).end();
      return;
    }
    if (!(await stat(file)).isFile()) throw Error("Missing");
    res.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "text/plain",
      "Cache-Control": "no-store",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("Local test editor: http://127.0.0.1:4173/things/demo/editel"),
);
