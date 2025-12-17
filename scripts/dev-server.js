import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function serveStatic(req, res) {
  const url = req.url === "/" ? "/public/index.html" : req.url;
  const filePath = path.join(root, url.replace(/^\//, ""));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "text/plain; charset=utf-8" });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);
const port = 5173;

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});
