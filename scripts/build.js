import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

fs.mkdirSync(distDir, { recursive: true });

const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learning Plan Kanban</title>
    <style>
      body { font-family: sans-serif; margin: 2rem; line-height: 1.6; }
      h1 { margin-bottom: 0.5rem; }
      code { background: #f5f5f5; padding: 0.25rem 0.4rem; border-radius: 4px; }
      .meta { color: #555; font-size: 0.95rem; }
      .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
      ul { padding-left: 1.2rem; }
    </style>
  </head>
  <body>
    <h1>Learning Plan Kanban</h1>
    <p class="meta">CI/CD セットアップの検証用プレースホルダーです。アプリ実装が追加されるまで GitHub Pages ではこのページを表示します。</p>
    <div class="card">
      <h2>デプロイの確認方法</h2>
      <ul>
        <li><code>npm run build</code> で dist/index.html を生成</li>
        <li>Actions の CI/CD ワークフローが成功すると GitHub Pages に自動公開</li>
      </ul>
      <p>詳細は <code>doc/github.md</code> を参照してください。</p>
    </div>
  </body>
</html>
`;

fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");
console.log(`dist/index.html を生成しました (${distDir})`);
