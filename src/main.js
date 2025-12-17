const app = document.querySelector("#app");

function renderAppShell() {
  app.innerHTML = `
    <header style="padding: 12px 16px; background:#1f2933; color:#fff; display:flex; align-items:center; gap:12px;">
      <span style="font-weight:700;">LPK AppShell</span>
      <nav style="display:flex; gap:8px; font-size:14px;">
        <span>Kanban</span>
        <span>Dashboard</span>
        <span>Calendar</span>
      </nav>
    </header>
    <main style="padding:16px;">
      <section style="padding:12px; border:1px solid #d8e2ec; border-radius:8px; background:#fff;">
        <h1 style="margin:0 0 8px;">Kanban Skeleton</h1>
        <p style="margin:0;">ここにカンバンビューを段階的に実装します。</p>
      </section>
    </main>
  `;
}

renderAppShell();
