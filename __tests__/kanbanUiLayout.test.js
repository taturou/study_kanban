import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

const workspace = process.cwd();

test("レイアウト用 CSS 変数と主要クラスが含まれる", () => {
  const cssPath = path.join(workspace, "src", "styles", "kanban.css");
  const css = fs.readFileSync(cssPath, "utf8");
  assert.match(css, /--lpk-status-col-min-width: 200px/);
  assert.match(css, /--lpk-appbar-height:/);
  assert.match(css, /\.kanban-board__container/);
  assert.match(css, /\.kanban-card/);
});
