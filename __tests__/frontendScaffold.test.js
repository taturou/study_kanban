import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

const workspace = process.cwd();

test("dev スクリプトが Vite を起動する", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(workspace, "package.json"), "utf8"));
  assert.equal(pkg.scripts.dev, "vite");
});

test("index.html が存在し、root と main.tsx を読み込む", () => {
  const htmlPath = path.join(workspace, "index.html");
  assert.ok(fs.existsSync(htmlPath));
  const html = fs.readFileSync(htmlPath, "utf8");
  assert.match(html, /id="root"/);
  assert.ok(html.includes('src="/src/main.tsx"'));
});
