import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const publicDir = path.join(projectRoot, "public");
const srcDir = path.join(projectRoot, "src");

fs.mkdirSync(distDir, { recursive: true });

// Copy public/index.html and rewrite script path to bundle output
const publicHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
const html = publicHtml.replace('src="/src/main.js"', 'src="./main.js"');

fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");
fs.copyFileSync(path.join(srcDir, "main.js"), path.join(distDir, "main.js"));

console.log(`dist を生成しました (${distDir})`);
