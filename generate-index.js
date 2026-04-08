const fs = require('fs');
const path = require('path');

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCard(trip, index) {
  const tags = (trip.style || []).slice(0, 3);
  const meta = `${trip.dateStart} ～ ${trip.dateEnd}｜${trip.travelers} 人｜${trip.budget}預算`;
  const summary = trip.summary || `${trip.destination} 行程，重點是 ${tags.join('、') || '旅程安排'}。`;

  return `
        <a class="card" href="${escapeHtml(trip.page)}">
          <div class="eyebrow">Trip ${String(index + 1).padStart(2, '0')}</div>
          <h2>${escapeHtml(trip.title)}</h2>
          <div class="meta">${escapeHtml(meta)}</div>
          <p class="desc">${escapeHtml(summary)}</p>
          <div class="tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </a>`;
}

function buildHtml(trips) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Travel Planner</title>
  <meta name="description" content="旅遊規劃展示站：收錄不同日期與城市的行程頁面。" />
  <style>
    :root {
      --bg: #f4f7fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --brand: #2563eb;
      --brand-soft: #eaf2ff;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius: 20px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top right, #dbeafe 0, transparent 22%),
        radial-gradient(circle at top left, #fde68a 0, transparent 18%),
        var(--bg);
      line-height: 1.6;
    }
    .wrap { max-width: 960px; margin: 0 auto; padding: 20px 16px 40px; }
    .hero {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6 60%, #60a5fa);
      color: #fff; border-radius: 24px; padding: 28px 22px; box-shadow: var(--shadow); margin-bottom: 20px;
    }
    .hero h1 { margin: 0 0 10px; font-size: 30px; line-height: 1.2; }
    .hero p { margin: 0; font-size: 15px; opacity: .97; }
    .section-title { font-size: 20px; margin: 0 0 14px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .card {
      display: block; text-decoration: none; color: inherit; background: var(--card);
      border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12); }
    .eyebrow { font-size: 12px; font-weight: 700; color: var(--brand); margin-bottom: 8px; }
    .card h2 { margin: 0 0 8px; font-size: 22px; line-height: 1.3; }
    .meta { font-size: 14px; color: var(--muted); margin-bottom: 10px; }
    .desc { font-size: 14px; color: var(--muted); margin: 0 0 14px; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px;
      font-size: 12px; font-weight: 600; background: var(--brand-soft); color: var(--brand);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Travel Planner</h1>
      <p>把每一趟旅程整理成可展示、可延續、可後續再優化的頁面。首頁由資料自動整理，減少手工維護成本。</p>
    </section>

    <section>
      <h2 class="section-title">目前行程</h2>
      <div class="grid">${trips.map(buildCard).join('')}
      </div>
    </section>
  </div>
</body>
</html>`;
}

function main() {
  const dir = process.cwd();
  const files = fs.readdirSync(dir);
  const jsonFiles = files.filter(name => /^trip-.*-draft\.json$/.test(name)).sort();

  const trips = jsonFiles.map(file => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const data = JSON.parse(raw);
    const city = String(data.destination || '').toLowerCase().replace(/\s+/g, '-');
    const ym = String(data.dateStart || '').slice(0, 7);
    return {
      ...data,
      page: `${city}-${ym}.html`
    };
  }).sort((a, b) => String(a.dateStart).localeCompare(String(b.dateStart)));

  fs.writeFileSync(path.join(dir, 'index.html'), buildHtml(trips), 'utf8');
  console.log(`Generated index.html from ${trips.length} trip draft(s).`);
}

main();
