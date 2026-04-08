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

function renderPills(items = [], className = 'pill') {
  if (!items.length) return '';
  return `<div class="pill-row">${items.map(item => `<span class="${className}">${escapeHtml(item)}</span>`).join('')}</div>`;
}

function itemClass(type = '') {
  return String(type).includes('meal') ? 'item meal' : 'item';
}

function renderFoodStrategy(item) {
  const strategy = item.foodStrategy;
  if (!strategy) return '';

  const preferred = strategy.preferredTypes || [];
  const avoid = strategy.avoid || [];
  const tips = strategy.tips || [];

  return `
            <div class="subcard food-block">
              <div class="subcard-title">用餐策略</div>
              ${preferred.length ? `<div class="subcard-label">優先</div>${renderPills(preferred, 'pill good')}` : ''}
              ${avoid.length ? `<div class="subcard-label">避免</div>${renderPills(avoid, 'pill warn')}` : ''}
              ${tips.length ? `<div class="subcard-label">提醒</div>${renderPills(tips, 'pill tip')}` : ''}
            </div>`;
}

function renderItemNotes(item) {
  const notes = item.notes || [];
  if (!notes.length) return '';
  return `
            <div class="subcard notes-block">
              <div class="subcard-title">注意事項</div>
              <ul class="note-list">
                ${notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}
              </ul>
            </div>`;
}

function buildMapUrl(item) {
  if (item.mapUrl) return item.mapUrl;
  if (item.lat && item.lng) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${item.lat},${item.lng}`)}`;
  }
  if (item.mapQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`;
  }
  return '';
}

function renderItemMeta(item) {
  const meta = [];
  if (item.area) meta.push(`區域：${item.area}`);
  if (item.transport) meta.push(`交通：${item.transport}`);
  if (!meta.length) return '';
  return `<div class="item-meta">${meta.map(line => `<span>${escapeHtml(line)}</span>`).join('')}</div>`;
}

function renderMapLink(item) {
  const mapUrl = buildMapUrl(item);
  if (!mapUrl) return '';
  return `<div class="map-link-row"><a class="map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noreferrer">查看地圖 ↗</a></div>`;
}

function collectMapPoints(data) {
  const points = [];

  (data.days || []).forEach((day, dayIndex) => {
    (day.items || []).forEach(item => {
      if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return;
      points.push({
        day: dayIndex + 1,
        title: item.title || '景點',
        area: item.area || '',
        mapQuery: item.mapQuery || '',
        timeStart: item.timeStart || '',
        timeEnd: item.timeEnd || '',
        type: item.type || '',
        key: `${dayIndex + 1}-${item.timeStart || ''}-${item.title || ''}`,
        lat: item.lat,
        lng: item.lng
      });
    });
  });

  return points;
}

function buildTripMapUrl(data) {
  const queries = [];
  (data.days || []).forEach(day => {
    (day.items || []).forEach(item => {
      if (item.mapQuery) queries.push(item.mapQuery);
    });
  });
  const unique = [...new Set(queries)].slice(0, 6);
  if (!unique.length) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unique.join(' '))}`;
}

function renderTripMapCard(data, mapPoints = []) {
  const mapUrl = buildTripMapUrl(data);
  if (!mapUrl) return '';

  const dayCount = (data.days || []).length;
  const embedBlock = mapPoints.length
    ? `<div class="leaflet-fallback-wrap"><iframe id="trip-map-fallback" class="trip-map-embed" src="${escapeHtml(mapUrl)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div id="trip-leaflet-map" class="leaflet-map leaflet-overlay-hidden"></div></div>`
    : `<iframe class="trip-map-embed" src="${escapeHtml(mapUrl)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;

  return `
    <section class="card trip-map-card">
      <div class="trip-map-head">
        <div>
          <h2>旅程總地圖</h2>
          <p>把這趟旅程的主要地點收成一個總覽入口，方便先看整體區域分布，再決定每天怎麼走。</p>
          <div class="chips">
            <span class="chip">${escapeHtml(data.destination)}</span>
            <span class="chip">${dayCount} 天行程</span>
          </div>
        </div>
        <a class="trip-map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noreferrer">開啟整趟地圖 ↗</a>
      </div>
      <div class="trip-map-embed-wrap">
        ${embedBlock}
      </div>
      <div class="trip-map-legend">
        <span class="legend-item"><span class="legend-dot" style="background:#2563eb"></span>Day 1</span>
        <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Day 2</span>
        <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Day 3</span>
        <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Day 4</span>
        <span class="legend-item"><span class="legend-dot" style="background:#8b5cf6"></span>Day 5</span>
      </div>
    </section>`;
}

function renderChecklistSection(data) {
  const prep = data.prep || {};
  const booking = prep.booking || [];
  const tickets = prep.tickets || [];
  const reminders = prep.reminders || [];

  if (!booking.length && !tickets.length && !reminders.length) return '';

  return `
    <section class="summary prep-grid">
      <div class="card">
        <h2>票券 / 預約</h2>
        ${booking.length ? `<div class="subcard-label">預約</div><ul class="note-list">${booking.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="empty">目前無特別預約需求。</p>'}
        ${tickets.length ? `<div class="subcard-label">票券</div><ul class="note-list">${tickets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="card">
        <h2>行前提醒</h2>
        ${reminders.length ? `<ul class="note-list">${reminders.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="empty">目前無額外提醒。</p>'}
      </div>
    </section>`;
}

function collectDayMapPoints(day, dayIndex) {
  const points = [];
  (day.items || []).forEach(item => {
    if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return;
    points.push({
      day: dayIndex + 1,
      title: item.title || '景點',
      area: item.area || '',
      mapQuery: item.mapQuery || '',
      timeStart: item.timeStart || '',
      timeEnd: item.timeEnd || '',
      key: `${dayIndex + 1}-${item.timeStart || ''}-${item.title || ''}`,
      lat: item.lat,
      lng: item.lng
    });
  });
  return points;
}

function renderDayMapCard(day, dayIndex) {
  const firstMappable = (day.items || []).find(item => buildMapUrl(item));
  if (!firstMappable) return '';

  const mapUrl = buildMapUrl(firstMappable);
  const label = firstMappable.mapQuery || firstMappable.title || '今日地圖';
  const dayMapPoints = collectDayMapPoints(day, dayIndex);
  const dayMapId = `day-leaflet-map-${dayIndex + 1}`;

  return `
        <div class="day-map-card">
          <div class="day-map-head">
            <div>
              <div class="subcard-title">今日地圖</div>
              <p class="map-card-text">以 ${escapeHtml(label)} 為起點查看今天的主要區域與動線。</p>
            </div>
            <a class="map-card-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noreferrer">開啟今日地圖 ↗</a>
          </div>
          ${dayMapPoints.length ? `<div class="leaflet-fallback-wrap"><iframe id="${dayMapId}-fallback" class="trip-map-embed day-map-embed" src="${escapeHtml(mapUrl)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div id="${dayMapId}" class="day-leaflet-map leaflet-overlay-hidden" data-day-map='${escapeHtml(JSON.stringify(dayMapPoints))}'></div></div>` : ''}
        </div>`;
}

function renderDaySummary(day, dayIndex) {
  const transports = [...new Set((day.items || []).map(item => item.transport).filter(Boolean))];
  const areas = [...new Set((day.items || []).map(item => item.area).filter(Boolean))];
  const notePool = [];

  (day.items || []).forEach(item => {
    (item.notes || []).forEach(note => notePool.push(note));
  });

  const notes = [...new Set(notePool)].slice(0, 4);

  return `
        ${renderDayMapCard(day, dayIndex)}
        <div class="day-panels">
          <div class="subcard">
            <div class="subcard-title">今日重點區域</div>
            ${areas.length ? renderPills(areas, 'pill neutral') : '<p class="empty">依當日安排調整。</p>'}
          </div>
          <div class="subcard">
            <div class="subcard-title">今日交通</div>
            ${transports.length ? renderPills(transports, 'pill neutral') : '<p class="empty">以步行為主。</p>'}
          </div>
          <div class="subcard">
            <div class="subcard-title">今日提醒</div>
            ${notes.length ? `<ul class="note-list compact">${notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>` : '<p class="empty">行程保持彈性即可。</p>'}
          </div>
        </div>`;
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
        ${renderDaySummary(day, index)}
        <div class="timeline">
${(day.items || []).map(item => `          <div class="${itemClass(item.type)}" data-map-key="${escapeHtml(`${index + 1}-${item.timeStart || ''}-${item.title || ''}`)}">
            <div class="time">${escapeHtml(item.timeStart || '')}–${escapeHtml(item.timeEnd || '')}</div>
            <div class="item-title">${escapeHtml(item.title || '')}</div>
            ${renderItemMeta(item)}
            <p class="desc">${escapeHtml(item.description || '')}</p>
            ${renderMapLink(item)}${renderFoodStrategy(item)}${renderItemNotes(item)}
          </div>`).join('\n')}
        </div>
      </article>`;
}

function buildHtml(data) {
  const dateMeta = `${data.dateStart} ～ ${data.dateEnd}｜${data.travelers} 人｜${data.budget}預算`;
  const tags = [...(data.style || []), ...(data.notes || []).slice(0, 2)];
  const summary = escapeHtml(data.summary || `${data.title}：以 ${data.destination} 為主的旅程安排，依照既有資料整理成可展示頁面。`);
  const principles = [
    '以重點景點與整體節奏優先',
    '避免把每天塞成趕場清單',
    '餐飲安排以順路、穩定、可執行為主'
  ];
  const mapPoints = collectMapPoints(data);
  const mapPointsJson = escapeHtml(JSON.stringify(mapPoints));

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.title)}</title>
  <meta name="description" content="${summary}" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
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
      --note: #fff8e7;
      --note-line: #fbbf24;
      --warn-bg: #fff1f2;
      --warn-text: #be123c;
      --good-bg: #ecfdf5;
      --good-text: #047857;
      --tip-bg: #eff6ff;
      --tip-text: #1d4ed8;
      --neutral-bg: #f3f4f6;
      --neutral-text: #374151;
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
    .tags, .chips, .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .tags, .chips { margin-top: 14px; }
    .tag, .chip, .pill { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .tag { background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.2); }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
    .card { background: var(--card); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
    .card h2, .card h3 { margin: 0 0 10px; font-size: 18px; }
    .card p { margin: 0; color: var(--muted); font-size: 14px; }
    .chip { background: var(--brand-soft); color: var(--brand); }
    .trip-map-card {
      margin-bottom: 16px;
      background: linear-gradient(135deg, #eef4ff, #f8fbff);
      border: 1px solid #dbeafe;
    }
    .trip-map-head {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .trip-map-link {
      display: inline-flex; align-items: center; text-decoration: none; white-space: nowrap;
      padding: 10px 14px; border-radius: 999px; background: var(--brand); color: #fff; font-size: 13px; font-weight: 700;
    }
    .trip-map-embed-wrap {
      margin-top: 14px; border-radius: 16px; overflow: hidden; border: 1px solid #cfe0ff; background: #fff;
    }
    .trip-map-legend {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
    }
    .legend-item {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px;
      background: rgba(255,255,255,.75); color: var(--text); font-size: 12px; font-weight: 700;
    }
    .legend-dot {
      width: 12px; height: 12px; border-radius: 999px; display: inline-block;
    }
    .leaflet-fallback-wrap {
      position: relative;
    }
    .trip-map-embed {
      width: 100%; height: 320px; border: 0; display: block;
    }
    .day-map-embed {
      height: 220px;
    }
    .leaflet-overlay-hidden {
      display: none;
    }
    .leaflet-overlay-active {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 2;
    }
    .leaflet-map {
      width: 100%; height: 360px;
    }
    .day-leaflet-map {
      width: 100%; height: 220px; margin-top: 12px; border-radius: 14px; overflow: hidden; border: 1px solid #cfe0ff;
    }
    .day-map-head {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
    }
    .day-marker-icon-wrap {
      background: transparent;
      border: 0;
    }
    .day-marker-icon {
      width: 28px; height: 28px; border-radius: 999px; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; box-shadow: 0 4px 10px rgba(15,23,42,.22);
      border: 2px solid rgba(255,255,255,.92);
    }
    .days { display: grid; gap: 18px; }
    .day { background: var(--card); border-radius: 22px; padding: 18px; box-shadow: var(--shadow); border: 1px solid rgba(255,255,255,.6); }
    .day-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .day-title { margin: 0; font-size: 20px; }
    .day-sub { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .badge { background: #eff6ff; color: var(--brand); font-size: 12px; font-weight: 700; border-radius: 999px; padding: 6px 10px; white-space: nowrap; }
    .day-map-card {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      background: linear-gradient(135deg, #eff6ff, #f8fbff); border: 1px solid #dbeafe;
      border-radius: 16px; padding: 14px 16px; margin: 12px 0;
    }
    .map-card-text { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .map-card-link {
      display: inline-flex; align-items: center; text-decoration: none; white-space: nowrap;
      padding: 8px 12px; border-radius: 999px; background: var(--brand); color: #fff; font-size: 13px; font-weight: 700;
    }
    .day-panels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 12px 0 16px; }
    .subcard { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
    .subcard-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
    .subcard-label { font-size: 12px; color: var(--muted); margin: 10px 0 6px; font-weight: 700; }
    .empty { margin: 0; color: var(--muted); font-size: 13px; }
    .timeline { display: grid; gap: 12px; margin-top: 12px; }
    .item { border-left: 3px solid var(--line); padding: 2px 0 2px 14px; transition: background-color .2s ease, box-shadow .2s ease; }
    .item.meal { border-left-color: var(--meal-line); background: var(--meal); border-radius: 14px; padding: 12px 14px; }
    .item.active-map-target { background: #eef6ff; border-radius: 14px; box-shadow: 0 0 0 2px rgba(37,99,235,.18); padding: 12px 14px; }
    .time { font-size: 13px; font-weight: 700; color: var(--brand); margin-bottom: 4px; }
    .item-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .item-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
    .item-meta span { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: var(--neutral-bg); color: var(--neutral-text); font-size: 12px; font-weight: 600; }
    .desc { color: var(--muted); font-size: 14px; margin: 0; }
    .map-link-row { margin-top: 8px; }
    .map-link {
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
      color: var(--brand); font-size: 13px; font-weight: 700;
    }
    .map-link:hover { text-decoration: underline; }
    .food-block { margin-top: 10px; background: rgba(255,255,255,.55); }
    .notes-block { margin-top: 10px; background: var(--note); border-color: #fde68a; }
    .note-list { margin: 0; padding-left: 18px; color: var(--muted); font-size: 13px; }
    .note-list.compact { font-size: 13px; }
    .pill { font-size: 12px; }
    .pill.neutral { background: var(--neutral-bg); color: var(--neutral-text); }
    .pill.good { background: var(--good-bg); color: var(--good-text); }
    .pill.warn { background: var(--warn-bg); color: var(--warn-text); }
    .pill.tip { background: var(--tip-bg); color: var(--tip-text); }
    .footer-note { margin-top: 18px; background: #f8fafc; border: 1px dashed #cbd5e1; }
    .footer-note ul { margin: 10px 0 0; padding-left: 18px; color: var(--muted); font-size: 14px; }
    @media (max-width: 720px) {
      .summary { grid-template-columns: 1fr; }
      .trip-map-head { flex-direction: column; align-items: flex-start; }
      .trip-map-embed { height: 260px; }
      .leaflet-map { height: 280px; }
      .day-leaflet-map { height: 200px; }
      .day-header { flex-direction: column; }
      .day-map-head, .day-map-card { flex-direction: column; align-items: flex-start; }
      .day-panels { grid-template-columns: 1fr; }
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
        <p>這份頁面由結構化資料自動整理成草稿，重點是先把骨架做穩，再把交通、用餐與注意事項補到夠實用。</p>
        <div class="chips">
          ${principles.map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
    </section>

    ${renderTripMapCard(data, mapPoints)}

    ${renderChecklistSection(data)}

    <section class="days">
      ${(data.days || []).map(renderDay).join('\n')}
    </section>

    <section class="card footer-note">
      <h3>提醒</h3>
      <ul>
        <li>這是一份由 JSON 資料產生的 HTML 草稿，可再人工微調。</li>
        <li>目前已把交通、區域、用餐策略、注意事項呈現出來，作為更實用的旅程頁基礎。</li>
        <li>若 JSON 裡有 prep.booking、prep.tickets、prep.reminders，頁面會自動顯示票券 / 預約 / 行前提醒。</li>
      </ul>
    </section>
  </div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    (function () {
      const points = JSON.parse('${mapPointsJson}');
      if (!points.length) return;

      const dayColors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
      const createDayIcon = (day) => L.divIcon({
        className: 'day-marker-icon-wrap',
        html: '<div class="day-marker-icon" style="background:' + dayColors[(day - 1) % dayColors.length] + '">D' + day + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -12]
      });

      const showFallback = (elementId) => {
        const mapEl = document.getElementById(elementId);
        if (mapEl) {
          mapEl.classList.remove('leaflet-overlay-active');
          mapEl.classList.add('leaflet-overlay-hidden');
        }
      };

      const showLeaflet = (elementId) => {
        const mapEl = document.getElementById(elementId);
        if (mapEl) {
          mapEl.classList.remove('leaflet-overlay-hidden');
          mapEl.classList.add('leaflet-overlay-active');
        }
      };

      const renderPointsMap = (elementId, pointsData, zoomIfSingle) => {
        const el = document.getElementById(elementId);
        if (!el || !pointsData.length) return;
        if (typeof L === 'undefined') {
          showFallback(elementId);
          return;
        }

        let map;
        try {
          map = L.map(elementId);
          showLeaflet(elementId);
        } catch (error) {
          showFallback(elementId);
          return;
        }
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const bounds = [];
        pointsData.forEach(point => {
          const marker = L.marker([point.lat, point.lng], { icon: createDayIcon(point.day) }).addTo(map);
          const lines = ['<strong>' + point.title + '</strong>'];
          if (point.timeStart || point.timeEnd) {
            lines.push((point.timeStart || '') + (point.timeEnd ? '–' + point.timeEnd : ''));
          }
          if (point.area) lines.push('區域：' + point.area);
          lines.push('Day ' + point.day);
          if (point.mapQuery) {
            const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(point.mapQuery);
            lines.push('<a href="' + url + '" target="_blank" rel="noreferrer">Google Maps ↗</a>');
          }
          marker.bindPopup(lines.join('<br>'));
          marker.on('click', () => {
            document.querySelectorAll('.active-map-target').forEach(node => node.classList.remove('active-map-target'));
            if (!point.key) return;
            const selector = '[data-map-key="' + CSS.escape(point.key) + '"]';
            const target = document.querySelector(selector);
            if (!target) return;
            target.classList.add('active-map-target');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
          bounds.push([point.lat, point.lng]);
        });

        if (bounds.length === 1) {
          map.setView(bounds[0], zoomIfSingle || 13);
        } else {
          map.fitBounds(bounds, { padding: [24, 24] });
        }
      };

      renderPointsMap('trip-leaflet-map', points, 12);

      document.querySelectorAll('.day-leaflet-map').forEach(el => {
        const raw = el.getAttribute('data-day-map');
        if (!raw) return;
        try {
          const dayPoints = JSON.parse(raw);
          renderPointsMap(el.id, dayPoints, 14);
        } catch (error) {
          showFallback(el.id);
        }
      });
    })();
  </script>
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
