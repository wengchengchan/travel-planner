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

function renderPills(items = [], className = 'tag') {
  if (!items.length) return '';
  return items.map(item => `<span class="${className}">${escapeHtml(item)}</span>`).join('');
}

function buildCard(trip, index) {
  const tags = (trip.style || []).slice(0, 3);
  const meta = `${trip.dateStart} ～ ${trip.dateEnd}｜${trip.travelers} 人｜${trip.budget}預算`;
  const summary = trip.summary || `${trip.destination} 行程，重點是 ${tags.join('、') || '旅程安排'}。`;
  const prep = trip.prep || {};
  const hasBooking = (prep.booking || []).length > 0;
  const hasTickets = (prep.tickets || []).length > 0;
  const hasReminders = (prep.reminders || []).length > 0;
  const noteBadges = [];

  if (hasBooking) noteBadges.push('需預約');
  if (hasTickets) noteBadges.push('有票券');
  if (hasReminders) noteBadges.push('有提醒');

  return `
        <a class="card" href="${escapeHtml(trip.page)}">
          <div class="card-top">
            <div class="eyebrow">Trip ${String(index + 1).padStart(2, '0')}</div>
            <div class="status-row">${renderPills(noteBadges.slice(0, 3), 'status-pill')}</div>
          </div>
          <h2>${escapeHtml(trip.title)}</h2>
          <div class="meta">${escapeHtml(meta)}</div>
          <p class="desc">${escapeHtml(summary)}</p>
          <div class="tags">
            ${renderPills(tags, 'tag')}
          </div>
          <div class="card-footer">
            <span class="footer-label">${escapeHtml(trip.destination)}</span>
            <span class="footer-link">查看行程 →</span>
          </div>
        </a>`;
}

function buildHtml(trips) {
  const tripCount = `${trips.length} 個行程`;
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
      --brand-deep: #1d4ed8;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius: 20px;
      --status-bg: #eff6ff;
      --status-text: #1d4ed8;
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
    .hero-meta { margin-top: 12px; font-size: 13px; opacity: .95; }
    .section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
    .section-title { font-size: 20px; margin: 0; }
    .section-meta { color: var(--muted); font-size: 13px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .card {
      display: block; text-decoration: none; color: inherit; background: var(--card);
      border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
    .eyebrow { font-size: 12px; font-weight: 700; color: var(--brand); }
    .status-row { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
    .status-pill, .tag {
      display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px;
      font-size: 12px; font-weight: 600;
    }
    .status-pill { background: var(--status-bg); color: var(--status-text); }
    .card h2 { margin: 0 0 8px; font-size: 22px; line-height: 1.3; }
    .meta { font-size: 14px; color: var(--muted); margin-bottom: 10px; }
    .desc { font-size: 14px; color: var(--muted); margin: 0 0 14px; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .tag { background: var(--brand-soft); color: var(--brand); }
    .card-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
    .footer-label { font-size: 13px; color: var(--muted); }
    .footer-link { font-size: 13px; font-weight: 700; color: var(--brand-deep); }
    @media (max-width: 720px) {
      .hero h1 { font-size: 26px; }
      .section-head { flex-direction: column; align-items: flex-start; }
      .card-top { flex-direction: column; }
      .status-row { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Travel Planner</h1>
      <p>把每一趟旅程整理成可展示、可延續、可後續再優化的頁面。首頁由資料自動整理，減少手工維護成本，也讓每個行程的實用資訊更容易一眼看懂。</p>
      <div class="hero-meta">目前已整理 ${escapeHtml(tripCount)}，依日期排序顯示。</div>
    </section>

    <section>
      <div class="section-head">
        <h2 class="section-title">目前行程</h2>
        <div class="section-meta">由 trip draft 自動生成首頁列表</div>
      </div>
      <div class="grid">${trips.map(buildCard).join('')}
      </div>
    </section>
  </div>
</body>
</html>`;
}

function slugifyDestination(destination = '', fallback = 'trip') {
  const map = {
    '東京': 'tokyo',
    '日本東京': 'tokyo',
    '北京': 'beijing',
    '台北': 'taipei',
    '大阪': 'osaka',
    '京都': 'kyoto',
    '首爾': 'seoul',
    '釜山': 'busan'
  };

  const raw = String(destination || '').trim();
  if (map[raw]) return map[raw];

  const ascii = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return ascii || fallback;
}

function main() {
  const dir = process.cwd();
  const files = fs.readdirSync(dir);
  const jsonFiles = files.filter(name => /^trip-.*-draft\.json$/.test(name)).sort();

  const trips = jsonFiles.map(file => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const data = JSON.parse(raw);
    const city = slugifyDestination(data.destination, 'trip');
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
