/**
 * generate-index.js v2
 * 掃描所有 trip-*-draft.json → 生成 index.html 首頁。
 * 優化：客戶端搜尋/篩選、統計橫幅、更好的 RWD。
 *
 * Usage:
 *   cd ~/travel-planner && node generate-index.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CITY_SLUG_MAP = {
  '東京': 'tokyo', '日本東京': 'tokyo',
  '大阪': 'osaka', '京都': 'kyoto',
  '北京': 'beijing', '上海': 'shanghai',
  '台北': 'taipei', '高雄': 'kaohsiung',
  '首爾': 'seoul', '釜山': 'busan',
  '曼谷': 'bangkok', '清邁': 'chiang-mai',
  '新加坡': 'singapore', '香港': 'hong-kong',
  '倫敦': 'london', '巴黎': 'paris',
  '紐約': 'new-york', '洛杉磯': 'los-angeles',
  '雪梨': 'sydney', '墨爾本': 'melbourne',
  '峇里島': 'bali', '河內': 'hanoi', '胡志明': 'ho-chi-minh',
};

function slugifyDestination(dest = '') {
  const raw = String(dest).trim();
  if (CITY_SLUG_MAP[raw]) return CITY_SLUG_MAP[raw];
  return raw.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'trip';
}

// ─── Card Builder ─────────────────────────────────────────────────────────────

function buildCard(trip, index) {
  const tags = (trip.style || []).slice(0, 4);
  const meta = `${trip.dateStart} ～ ${trip.dateEnd}｜${trip.travelers} 人｜${trip.budget}預算`;
  const summary = trip.summary || `${trip.destination} 行程，重點是 ${tags.join('、') || '旅程安排'}。`;
  const prep = trip.prep || {};
  const hasBooking = (prep.booking || []).length > 0;
  const hasTickets = (prep.tickets || []).length > 0;
  const hasReminders = (prep.reminders || []).length > 0;
  const badges = [];
  if (hasBooking) badges.push('需預約');
  if (hasTickets) badges.push('有票券');
  if (hasReminders) badges.push('有提醒');

  const dayCount = (trip.days || []).length;
  const mappedCount = (trip.days || []).reduce((sum, day) =>
    sum + (day.items || []).filter(i => typeof i.lat === 'number').length, 0);
  const prepCount = (prep.booking || []).length + (prep.tickets || []).length + (prep.reminders || []).length;

  const updateLabel = trip.dateEnd ? `最後整理：${trip.dateEnd}` : '最後整理：待補';
  // data attributes for client-side filter
  const tagData = tags.join(',');
  const destData = trip.destination || '';

  return `
      <a class="card" href="${escapeHtml(trip.page)}"
         data-tags="${escapeHtml(tagData)}"
         data-dest="${escapeHtml(destData)}"
         data-title="${escapeHtml(trip.title || '')}">
        <div class="card-top">
          <div>
            <div class="eyebrow">Trip ${String(index + 1).padStart(2, '0')}</div>
            <div class="update-label">${escapeHtml(updateLabel)}</div>
          </div>
          <div class="status-row">${badges.map(b => `<span class="status-pill">${escapeHtml(b)}</span>`).join('')}</div>
        </div>
        <h2>${escapeHtml(trip.title)}</h2>
        <div class="meta">${escapeHtml(meta)}</div>
        <p class="desc">${escapeHtml(summary)}</p>
        <div class="tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        <div class="summary-row">
          <span class="mini-meta">${dayCount} 天</span>
          <span class="mini-meta">${mappedCount} 地圖點</span>
          <span class="mini-meta">${prepCount} 項行前準備</span>
        </div>
        <div class="card-footer">
          <span class="footer-label">${escapeHtml(trip.destination)}</span>
          <span class="footer-link">查看行程 →</span>
        </div>
      </a>`;
}

// ─── Full HTML ────────────────────────────────────────────────────────────────

function buildHtml(trips) {
  const totalDays = trips.reduce((s, t) => s + (t.days || []).length, 0);
  const totalPoints = trips.reduce((s, t) =>
    s + (t.days || []).reduce((ss, d) =>
      ss + (d.items || []).filter(i => typeof i.lat === 'number').length, 0), 0);
  const genDate = new Date().toISOString().slice(0, 10);

  // Collect all unique tags for filter buttons
  const allTags = [...new Set(
    trips.flatMap(t => (t.style || []))
  )].slice(0, 10);

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Travel Planner</title>
  <meta name="description" content="旅遊規劃展示站：收錄不同日期與城市的行程頁面。" />
  <meta name="generator" content="travel-planner v2" />
  <style>
    :root {
      --bg: #f4f7fb;
      --card: #fff;
      --text: #1f2937;
      --muted: #6b7280;
      --brand: #2563eb;
      --brand-soft: #eaf2ff;
      --brand-deep: #1d4ed8;
      --shadow: 0 10px 30px rgba(15,23,42,.08);
      --radius: 20px;
      --status-bg: #eff6ff;
      --status-text: #1d4ed8;
    }
    *, *::before, *::after { box-sizing: border-box; }
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
    .wrap { max-width: 960px; margin: 0 auto; padding: 20px 16px 60px; }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6 60%, #60a5fa);
      color: #fff; border-radius: 24px; padding: 30px 24px;
      box-shadow: var(--shadow); margin-bottom: 20px;
    }
    .hero h1 { margin: 0 0 10px; font-size: 30px; line-height: 1.2; }
    .hero p { margin: 0 0 16px; font-size: 15px; opacity: .97; }
    .hero-stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
    .stat-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.25);
      border-radius: 999px; padding: 6px 14px; font-size: 13px; font-weight: 700;
    }
    .stat-pill .num { font-size: 18px; font-weight: 800; }
    .hero-meta { font-size: 12px; opacity: .65; margin-top: 12px; }

    /* Search + Filter */
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
      margin-bottom: 14px;
    }
    .search-wrap { position: relative; flex: 1; min-width: 180px; }
    .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); width: 16px; }
    .search-input {
      width: 100%; padding: 10px 12px 10px 36px;
      border: 1px solid var(--line, #e5e7eb); border-radius: 12px;
      font-size: 14px; background: var(--card); color: var(--text);
      box-shadow: 0 2px 6px rgba(15,23,42,.05); outline: none;
    }
    .search-input:focus { border-color: var(--brand); }
    .filter-btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter-btn {
      padding: 7px 14px; border-radius: 999px; border: 1px solid var(--line, #e5e7eb);
      background: var(--card); color: var(--muted); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background .15s, color .15s, border-color .15s;
    }
    .filter-btn.active, .filter-btn:hover { background: var(--brand-soft); color: var(--brand); border-color: var(--brand); }

    /* Section */
    .section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
    .section-title { font-size: 20px; margin: 0; }
    .section-meta { color: var(--muted); font-size: 13px; }
    #tripCount { font-weight: 700; color: var(--brand); }

    /* Grid */
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .no-results { grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); font-size: 15px; }

    /* Card */
    .card {
      display: block; text-decoration: none; color: inherit; background: var(--card);
      border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow);
      transition: transform .15s, box-shadow .15s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(15,23,42,.12); }
    .card.hidden { display: none; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
    .eyebrow { font-size: 12px; font-weight: 700; color: var(--brand); }
    .update-label { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .status-row { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
    .status-pill { display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--status-bg); color: var(--status-text); }
    .card h2 { margin: 0 0 6px; font-size: 21px; line-height: 1.3; }
    .meta { font-size: 13px; color: var(--muted); margin-bottom: 10px; }
    .desc { font-size: 14px; color: var(--muted); margin: 0 0 12px; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .tag { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--brand-soft); color: var(--brand); }
    .summary-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .mini-meta { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: #f8fafc; color: var(--muted); font-size: 12px; font-weight: 700; border: 1px solid #e5e7eb; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #e5e7eb; }
    .footer-label { font-size: 13px; color: var(--muted); }
    .footer-link { font-size: 13px; font-weight: 700; color: var(--brand-deep); }

    @media (max-width: 600px) {
      .hero h1 { font-size: 24px; }
      .section-head { flex-direction: column; align-items: flex-start; }
      .card-top { flex-direction: column; }
      .status-row { justify-content: flex-start; }
    }
    @media print {
      .toolbar, .filter-btns { display: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Travel Planner ✈</h1>
      <p>把每一趟旅程整理成可展示、可延續、可後續優化的頁面。首頁由資料自動整理，減少手工維護成本。</p>
      <div class="hero-stats">
        <span class="stat-pill"><span class="num">${trips.length}</span> 個行程</span>
        <span class="stat-pill"><span class="num">${totalDays}</span> 天旅程</span>
        <span class="stat-pill"><span class="num">${totalPoints}</span> 個地圖點</span>
      </div>
      <div class="hero-meta">由 travel-planner v2 生成・${genDate}</div>
    </section>

    <div class="toolbar">
      <div class="search-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
        </svg>
        <input class="search-input" id="searchInput" type="search" placeholder="搜尋城市、行程名稱或風格…" autocomplete="off" />
      </div>
      ${allTags.length ? `<div class="filter-btns">
        <button class="filter-btn active" data-tag="">全部</button>
        ${allTags.map(t => `<button class="filter-btn" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('')}
      </div>` : ''}
    </div>

    <section>
      <div class="section-head">
        <h2 class="section-title">目前行程</h2>
        <div class="section-meta">顯示 <span id="tripCount">${trips.length}</span> 個</div>
      </div>
      <div class="grid" id="tripGrid">
        ${trips.map(buildCard).join('')}
        <div class="no-results" id="noResults" style="display:none">沒有符合的行程</div>
      </div>
    </section>
  </div>

  <script>
  (function () {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('#tripGrid .card');
    const countEl = document.getElementById('tripCount');
    const noResults = document.getElementById('noResults');
    let activeTag = '';

    function applyFilter() {
      const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
      let visible = 0;
      cards.forEach(function (card) {
        const title = (card.dataset.title || '').toLowerCase();
        const dest = (card.dataset.dest || '').toLowerCase();
        const tags = (card.dataset.tags || '').toLowerCase();
        const matchQ = !q || title.includes(q) || dest.includes(q) || tags.includes(q);
        const matchTag = !activeTag || tags.includes(activeTag.toLowerCase());
        if (matchQ && matchTag) { card.classList.remove('hidden'); visible++; }
        else card.classList.add('hidden');
      });
      if (countEl) countEl.textContent = visible;
      if (noResults) noResults.style.display = visible ? 'none' : 'block';
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeTag = btn.dataset.tag || '';
        applyFilter();
      });
    });
  })();
  </script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const dir = process.cwd();
  const jsonFiles = fs.readdirSync(dir)
    .filter(f => /^trip-.*-draft\.json$/.test(f))
    .sort();

  if (!jsonFiles.length) {
    console.warn('⚠ No trip-*-draft.json files found in', dir);
  }

  const trips = jsonFiles.map(function (file) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const data = JSON.parse(raw);
    const city = slugifyDestination(data.destination);
    const ym = String(data.dateStart || '').slice(0, 7);
    return Object.assign({}, data, { page: city + '-' + ym + '.html' });
  }).sort((a, b) => String(a.dateStart).localeCompare(String(b.dateStart)));

  fs.writeFileSync(path.join(dir, 'index.html'), buildHtml(trips), 'utf8');
  console.log('✓ Generated index.html from', trips.length, 'trip draft(s)');
  trips.forEach(function (t) {
    console.log('  •', t.title, '→', t.page);
  });
}

main();
