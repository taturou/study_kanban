import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspace = process.cwd();

test("ci/workflow は main ブランチで lint/test/build と Pages デプロイを行う", () => {
  const workflowPath = path.join(workspace, ".github", "workflows", "ci.yml");
  assert.ok(fs.existsSync(workflowPath), "ci.yml が存在すること");

  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[?\s*main/);
  assert.match(workflow, /pull_request:\s*[\s\S]*branches:\s*\[?\s*main/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /deploy-pages/);
  assert.match(workflow, /needs:\s*\[?\s*ci/);
  assert.match(workflow, /permissions:[\s\S]*pages:\s*write/);
});

test("gh 設定スクリプトは branch protection, merge 設定, Pages 設定を gh api で適用する", () => {
  const scriptPath = path.join(workspace, "scripts", "gh-setup.sh");
  assert.ok(fs.existsSync(scriptPath), "gh-setup.sh が存在すること");

  const script = fs.readFileSync(scriptPath, "utf8");
  assert.ok(script.startsWith("#!/usr/bin/env bash"), "shebang を持つこと");
  assert.match(script, /gh api [\s\S]*branches\/main\/protection/);
  assert.match(script, /gh api [\s\S]*repos[^\n]*\n[\s\S]*allow_(squash_merge|merge_commit)/);
  assert.match(script, /gh api [\s\S]*pages/);
});

test("GitHub Pages 手順ドキュメントが gh スクリプト利用を案内する", () => {
  const docPath = path.join(workspace, "doc", "github.md");
  assert.ok(fs.existsSync(docPath), "doc/github.md が存在すること");

  const content = fs.readFileSync(docPath, "utf8");
  assert.match(content, /GitHub Pages/);
  assert.ok(
    content.includes("gh-setup.sh"),
    "gh-setup.sh の利用手順が記載されていること",
  );
  assert.match(content, /手順/);
});
