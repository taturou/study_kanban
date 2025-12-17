import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { renderAppShell } from "../src/main.js";

const workspace = process.cwd();

test("dev スクリプトでローカルサーバを起動できる", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(workspace, "package.json"), "utf8"));
  assert.equal(pkg.scripts.dev, "node scripts/dev-server.js");
});

test("public/index.html が存在し、app ルートと main.js を読み込む", () => {
  const htmlPath = path.join(workspace, "public", "index.html");
  assert.ok(fs.existsSync(htmlPath));
  const html = fs.readFileSync(htmlPath, "utf8");
  assert.match(html, /id="app"/);
  assert.ok(html.includes('src="/src/main.js"'));
});

test("main.js に AppShell と Kanban スケルトンのプレースホルダーがある", () => {
  const mainPath = path.join(workspace, "src", "main.js");
  assert.ok(fs.existsSync(mainPath));
  const content = fs.readFileSync(mainPath, "utf8");
  assert.match(content, /AppShell/);
  assert.match(content, /Kanban/);
});

test("main.js は KanbanBoard のプレースホルダーを初期レンダリングする", async () => {
  const container = { innerHTML: "" };
  const appended = [];
  const mockDocument = {
    querySelector: (sel) => (sel === "#app" ? container : null),
    createElement: (tag) => ({ tagName: tag, rel: "", href: "", setAttribute() {}, textContent: "", innerHTML: "", id: "" }),
    head: { appendChild: (node) => appended.push(node) },
  };
  renderAppShell(mockDocument);
  assert.match(container.innerHTML, /kanban-board/);
  assert.match(container.innerHTML, /data-testid="placeholder-card"/);
  assert.ok(appended.length > 0);
});

test("dev サーバスクリプトが存在し、ポート 5173 で公開する設定を持つ", () => {
  const serverPath = path.join(workspace, "scripts", "dev-server.js");
  assert.ok(fs.existsSync(serverPath));
  const content = fs.readFileSync(serverPath, "utf8");
  assert.match(content, /5173/);
});
