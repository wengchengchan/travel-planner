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

function mealTips(item) {
  const tips = item.foodStrategy?.tips || [];
  if (!tips.length) return '';
  return `
            <div class="tips">
              ${tips.map(t => `<span>${escapeHtml(t)}</span>`).join('')}
            </div>`;
}

function itemClass(type = '') {
  return String(type).includes('meal') ? 'item meal' : 'item';
}

function renderDay(day, index) {
  const mmdd = day.date ? day.date.slice(5).replace('-', '/') : '';
  return `
      <article class="day">
        <div class="day-header">
          <div>
            <h2 class="day-title">Day ${index + 1}｜${escapeHtml(day.theme || '')}</h2>
            <div class="day-sub">${escapeHtml(mmdd)}・行程安排</div>
          </div>
          <span class="badge">Day ${index + 1}</span>
        </div>
        <div class="timeline">
${(day.items || []).map(item => `          <div class="${itemClass(item.type)}">
            <div class="time">${escapeHtml(item.timeStart || '')}–${escapeHtml(item.timeEnd || '')}</div>
            <div class="item-title">${escapeHtml(item.title || '')}</div>
            <p class="desc">${escapeHtml(item.description || '')}</p>${mealTips(item)}
          </div>`).join('\n')}
        </div>
      </article>`;
}

function buildHtml(data) {
  const dateMeta = `${data.dateStart} ～ ${data.dateEnd}｜${data.travelers} 人｜${data.budget}預算`;
  const tags = [...(data.style || []), ...(data.notes || []).slice(0, 2)];
  const summary = `${escapeHtml(data.title)}：以 ${escapeHtml(data.destination)} 為主的旅程安排，依照既有資料整理成可展示頁面。`;
  const principles = [
    '以重點景點與整體節奏優先',
    '避免把每天塞成趕場清單',
    '餐飲安排以順路、穩定、可執行為主'
  ];

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.title)}</title>
  <meta name="description" content="${escapeHtml(summary)}" />
  <style>
    :root {
      --bg: #f4f7fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --line: #e5e7eb;
      --brand: #2563eb;
      --brand-soft: #eaf2ff;
      --meal: #fff4e8;
      --meal-line: #f59e0b;
      --ok: #10b981;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius: 18px;
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
      color: #fff; border-radius: 24px; padding: 26px 20px; box-shadow: var(--shadow); margin-bottom: 18px;
    }
    .hero h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.2; }
    .hero .meta { font-size: 14px; opacity: .95; margin-bottom: 12px; }
    .hero p { margin: 0; font-size: 15px; opacity: .98; }
    .tags, .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .tag, .chip { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .tag { background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.2); }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
    .card { background: var(--card); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
    .card h2, .card h3 { margin: 0 0 10px; font-size: 18px; }
    .card p { margin: 0; color: var(--muted); font-size: 14px; }
    .chip { background: var(--brand-soft); color: var(--brand); }
    .days { display: grid; gap: 18px; }
    .day { background: var(--card); border-radius: 22px; padding: 18px; box-shadow: var(--shadow); border: 1px solid rgba(255,255,255,.6); }
    .day-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .day-title { margin: 0; font-size: 20px; }
    .day-sub { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .badge { background: #eff6ff; color: var(--brand); font-size: 12px; font-weight: 700; border-radius: 999px; padding: 6px 10px; white-space: nowrap; }
    .timeline { display: grid; gap: 12px; margin-top: 12px; }
    .item { border-left: 3px solid var(--line); padding: 2px 0 2px 14px; }
    .item.meal { border-left-color: var(--meal-line); background: var(--meal); border-radius: 14px; padding: 12px 14px; }
    .time { font-size: 13px; font-weight: 700; color: var(--brand); margin-bottom: 4px; }
    .item-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .desc { color: var(--muted); font-size: 14px; margin: 0; }
    .tips { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }
    .tips span { display: inline-block; font-size: 12px; color: #92400e; background: rgba(245, 158, 11, 0.12); padding: 5px 9px; border-radius: 999px; }
    .footer-note { margin-top: 18px; background: #f8fafc; border: 1px dashed #cbd5e1; }
    .footer-note ul { margin: 10px 0 0; padding-left: 18px; color: var(--muted); font-size: 14px; }
    @media (max-width: 720px) {
      .summary { grid-template-columns: 1fr; }
      .day-header { flex-direction: column; }
      .hero h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>${escapeHtml(data.title)}</h1>
      <div class="meta">${escapeHtml(dateMeta)}</div>
      <p>${escapeHtml(data.notes?.join('、') || '')}</p>
      <div class="tags">
        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </section>

    <section class="summary">
      <div class="card">
        <h2>旅程摘要</h2>
        <p>${summary}</p>
        <div class="chips">
          ${(data.style || []).map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
      <div class="card">
        <h2>安排原則</h2>
        <p>這份頁面由結構化資料自動整理成草稿，重點是先把骨架做穩，再視需要補人工修飾。</p>
        <div class="chips">
          ${principles.map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
    </section>

    <section class="days">
      ${(data.days || []).map(renderDay).join('\n')}
    </section>

    <section class="card footer-note">
      <h3>提醒</h3>
      <ul>
        <li>這是一份由 JSON 資料產生的 HTML 草稿，可再人工微調。</li>
        <li>若要做成正式頁，建議再補一句更像產品文案的 hero 摘要。</li>
        <li>之後可再把首頁列表也做成半自動生成。</li>
      </ul>
    </section>
  </div>
</body>
</html>`;
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node generate-trip-page.js <trip-json-file> [output-html-file]');
    process.exit(1);
  }

  const inputPath = path.resolve(input);
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);

  const city = String(data.destination || 'trip').toLowerCase().replace(/\s+/g, '-');
  const ym = String(data.dateStart || '').slice(0, 7);
  const defaultOutput = `${city}-${ym}.html`;
  const output = process.argv[3] || defaultOutput;
  const outputPath = path.resolve(path.dirname(inputPath), output);

  fs.writeFileSync(outputPath, buildHtml(data), 'utf8');
  console.log(`Generated: ${outputPath}`);
}

main();
