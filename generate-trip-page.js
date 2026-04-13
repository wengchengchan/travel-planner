/**
 * generate-trip-page.js v2
 * 把 trip-*-draft.json 轉換成美觀的 HTML 旅程頁。
 * 優化：固定日程導覽列、列印樣式、進度指示、返回頂部、更好的手機體驗。
 *
 * Usage:
 *   node generate-trip-page.js trip-tokyo-draft.json
 *   node generate-trip-page.js trip-tokyo-draft.json tokyo-2026-05.html
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

function renderPills(items = [], className = 'pill') {
  if (!items.length) return '';
  return `<div class="pill-row">${items.map(i => `<span class="${className}">${escapeHtml(i)}</span>`).join('')}</div>`;
}

function itemClass(type = '') {
  return String(type).includes('meal') ? 'item meal' : 'item';
}

function buildMapUrl(item) {
  if (item.mapUrl) return item.mapUrl;
  if (item.lat && item.lng)
    return `https://www.google.com/maps?q=${encodeURIComponent(`${item.lat},${item.lng}`)}`;
  if (item.mapQuery)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`;
  return '';
}

function buildTripMapUrl(data) {
  const queries = [];
  (data.days || []).forEach(day =>
    (day.items || []).forEach(item => { if (item.mapQuery) queries.push(item.mapQuery); })
  );
  const unique = [...new Set(queries)].slice(0, 6);
  if (!unique.length) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unique.join(' '))}`;
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

// ─── Components ───────────────────────────────────────────────────────────────

function renderFoodStrategy(item) {
  const s = item.foodStrategy;
  if (!s) return '';
  const preferred = s.preferredTypes || [];
  const avoid = s.avoid || [];
  const tips = s.tips || [];
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
        <ul class="note-list">${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>
      </div>`;
}

function renderItemMeta(item) {
  const meta = [];
  if (item.area) meta.push(`區域：${item.area}`);
  if (item.transport) meta.push(`交通：${item.transport}`);
  if (!meta.length) return '';
  return `<div class="item-meta">${meta.map(l => `<span>${escapeHtml(l)}</span>`).join('')}</div>`;
}

function renderMapLink(item) {
  const url = buildMapUrl(item);
  if (!url) return '';
  return `<div class="map-link-row"><a class="map-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">查看地圖 ↗</a></div>`;
}

function renderTripMapCard(data, mapPoints) {
  const mapUrl = buildTripMapUrl(data);
  if (!mapUrl) return '';
  const dayCount = (data.days || []).length;
  const allAreas = [...new Set(mapPoints.map(p => p.area).filter(Boolean))].slice(0, 8);
  const allTitles = [...new Set(mapPoints.map(p => p.title).filter(Boolean))].slice(0, 8);
  return `
  <section class="card trip-map-card">
    <div class="trip-map-head">
      <div>
        <h2>旅程總覽</h2>
        <p>先掌握整趟主要區域與景點，再決定每天怎麼走。</p>
        <div class="chips">
          <span class="chip">${escapeHtml(data.destination)}</span>
          <span class="chip">${dayCount} 天行程</span>
        </div>
      </div>
      <a class="trip-map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noreferrer">開啟整趟地圖 ↗</a>
    </div>
    <div class="day-panels" style="margin-top:14px">
      <div class="subcard">
        <div class="subcard-title">主要區域</div>
        ${allAreas.length ? renderPills(allAreas, 'pill neutral') : '<p class="empty">依每日安排為主。</p>'}
      </div>
      <div class="subcard">
        <div class="subcard-title">重點景點</div>
        ${allTitles.length ? renderPills(allTitles, 'pill neutral') : '<p class="empty">以每日內容為主。</p>'}
      </div>
      <div class="subcard">
        <div class="subcard-title">使用方式</div>
        <ul class="note-list compact">
          <li>先看每日小地圖掌握動線</li>
          <li>跨天移動用整趟地圖</li>
          <li>點景點連結直接導航</li>
        </ul>
      </div>
    </div>
    <div class="trip-map-legend">
      <span class="legend-item"><span class="legend-dot" style="background:#2563eb"></span>Day 1</span>
      <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Day 2</span>
      <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Day 3</span>
      <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Day 4</span>
      <span class="legend-item"><span class="legend-dot" style="background:#8b5cf6"></span>Day 5+</span>
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
    <div class="card prep-card">
      <h2>出發前要先做</h2>
      <p class="prep-intro">提前處理，避免出發前臨時補救。</p>
      ${booking.length ? `<div class="subcard-label">已預約 / 要確認</div><ul class="note-list prep-list">${booking.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p class="empty">目前無特別預約需求。</p>'}
      ${tickets.length ? `<div class="subcard-label">票券 / 入場</div><ul class="note-list prep-list">${tickets.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="card prep-card">
      <h2>當天注意事項</h2>
      <p class="prep-intro">影響行程順暢度的提醒，現場對照用。</p>
      ${reminders.length ? `<ul class="note-list prep-list">${reminders.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p class="empty">目前無額外提醒。</p>'}
    </div>
  </section>`;
}

function renderDayMapCard(day, dayIndex) {
  const first = (day.items || []).find(i => buildMapUrl(i));
  if (!first) return '';
  const url = buildMapUrl(first);
  const label = first.mapQuery || first.title || '今日地圖';
  const pts = (day.items || []).filter(i => typeof i.lat === 'number');
  const areas = [...new Set(pts.map(p => p.area).filter(Boolean))].slice(0, 4);
  const titles = [...new Set(pts.map(p => p.title).filter(Boolean))].slice(0, 4);
  return `
      <div class="day-map-card">
        <div class="day-map-head">
          <div>
            <div class="subcard-title">今日地圖</div>
            <p class="map-card-text">以 ${escapeHtml(label)} 為起點查看今日動線。</p>
          </div>
          <a class="map-card-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">開啟今日地圖 ↗</a>
        </div>
        <div class="day-map-summary">
          <div class="subcard">
            <div class="subcard-title">今日區域</div>
            ${areas.length ? renderPills(areas, 'pill neutral') : '<p class="empty">以今日動線為主。</p>'}
          </div>
          <div class="subcard">
            <div class="subcard-title">主要地點</div>
            ${titles.length ? renderPills(titles, 'pill neutral') : '<p class="empty">見下方行程。</p>'}
          </div>
        </div>
      </div>`;
}

function renderDaySummary(day, dayIndex) {
  const transports = [...new Set((day.items || []).map(i => i.transport).filter(Boolean))];
  const areas = [...new Set((day.items || []).map(i => i.area).filter(Boolean))];
  const notePool = [];
  (day.items || []).forEach(i => (i.notes || []).forEach(n => notePool.push(n)));
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
          ${notes.length ? `<ul class="note-list compact">${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : '<p class="empty">保持彈性即可。</p>'}
        </div>
      </div>`;
}

function renderDay(day, index) {
  const mmdd = day.date ? day.date.slice(5).replace('-', '/') : '';
  const dayId = `day-${index + 1}`;
  return `
    <article class="day" id="${dayId}">
      <div class="day-header">
        <div>
          <h2 class="day-title">Day ${index + 1}｜${escapeHtml(day.theme || '')}</h2>
          <div class="day-sub">${escapeHtml(mmdd)}・行程安排</div>
        </div>
        <span class="badge">Day ${index + 1}</span>
      </div>
      ${renderDaySummary(day, index)}
      <div class="timeline">
${(day.items || []).map(item => `        <div class="${itemClass(item.type)}" data-map-key="${escapeHtml(`${index + 1}-${item.timeStart || ''}-${item.title || ''}`)}">
          <div class="time">${escapeHtml(item.timeStart || '')}${item.timeEnd ? `–${escapeHtml(item.timeEnd)}` : ''}</div>
          <div class="item-title">${escapeHtml(item.title || '')}</div>
          ${renderItemMeta(item)}
          <p class="desc">${escapeHtml(item.description || '')}</p>
          ${renderMapLink(item)}${renderFoodStrategy(item)}${renderItemNotes(item)}
        </div>`).join('\n')}
      </div>
    </article>`;
}

// ─── Day Nav ──────────────────────────────────────────────────────────────────

function renderDayNav(data) {
  const days = data.days || [];
  if (days.length <= 1) return '';
  const links = days.map((day, i) => {
    const mmdd = day.date ? day.date.slice(5).replace('-', '/') : `Day ${i + 1}`;
    return `<a class="daynav-link" href="#day-${i + 1}" aria-label="跳到 Day ${i + 1}">`
      + `<span class="daynav-num">D${i + 1}</span>`
      + `<span class="daynav-date">${escapeHtml(mmdd)}</span>`
      + `</a>`;
  }).join('');
  return `<nav class="daynav" aria-label="日程導覽">${links}</nav>`;
}

// ─── Full HTML ────────────────────────────────────────────────────────────────

function buildHtml(data) {
  const dateMeta = `${data.dateStart} ～ ${data.dateEnd}｜${data.travelers} 人｜${data.budget}預算`;
  const tags = [...(data.style || []), ...(data.notes || []).slice(0, 2)];
  const summary = escapeHtml(
    data.summary || `${data.title}：以 ${data.destination} 為主的旅程安排，依照既有資料整理成可展示頁面。`
  );
  const mapPoints = collectMapPoints(data);
  const mapPointsJson = JSON.stringify(mapPoints).replace(/'/g, '&#39;');
  const genDate = new Date().toISOString().slice(0, 10);

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.title)}</title>
  <meta name="description" content="${summary}" />
  <meta name="generator" content="travel-planner v2" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <style>
    /* ── Design Tokens ── */
    :root {
      --bg: #f4f7fb;
      --card: #fff;
      --text: #1f2937;
      --muted: #6b7280;
      --line: #e5e7eb;
      --brand: #2563eb;
      --brand-soft: #eaf2ff;
      --brand-deep: #1d4ed8;
      --meal: #fff4e8;
      --meal-line: #f59e0b;
      --note-bg: #fff8e7;
      --note-line: #fbbf24;
      --warn-bg: #fff1f2;
      --warn-text: #be123c;
      --good-bg: #ecfdf5;
      --good-text: #047857;
      --tip-bg: #eff6ff;
      --tip-text: #1d4ed8;
      --neutral-bg: #f3f4f6;
      --neutral-text: #374151;
      --shadow: 0 10px 30px rgba(15,23,42,.08);
      --radius: 18px;
      --nav-h: 52px;
    }
    /* ── Reset ── */
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
    /* ── Layout ── */
    .wrap { max-width: 960px; margin: 0 auto; padding: 20px 16px 60px; }
    /* ── Hero ── */
    .hero {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6 60%, #60a5fa);
      color: #fff; border-radius: 24px; padding: 28px 22px;
      box-shadow: var(--shadow); margin-bottom: 18px;
    }
    .hero h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.2; }
    .hero .meta { font-size: 14px; opacity: .95; margin-bottom: 12px; }
    .hero p { margin: 0; font-size: 15px; opacity: .98; }
    .hero .gen-date { font-size: 12px; opacity: .7; margin-top: 10px; }
    /* ── Day Nav ── */
    .daynav {
      position: sticky; top: 0; z-index: 100;
      display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch;
      padding: 8px 0; margin-bottom: 16px;
      background: linear-gradient(to bottom, rgba(244,247,251,.97) 90%, transparent);
      scrollbar-width: none;
    }
    .daynav::-webkit-scrollbar { display: none; }
    .daynav-link {
      display: inline-flex; flex-direction: column; align-items: center;
      text-decoration: none; padding: 6px 12px; border-radius: 12px;
      background: var(--card); box-shadow: var(--shadow);
      border: 1px solid var(--line); white-space: nowrap; flex-shrink: 0;
      transition: background .15s, transform .15s;
    }
    .daynav-link:hover { background: var(--brand-soft); transform: translateY(-1px); }
    .daynav-num { font-size: 12px; font-weight: 800; color: var(--brand); }
    .daynav-date { font-size: 11px; color: var(--muted); }
    /* ── Cards ── */
    .tags, .chips, .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .tags, .chips { margin-top: 14px; }
    .tag, .chip, .pill { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .tag { background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.2); }
    .chip { background: var(--brand-soft); color: var(--brand); }
    .pill.neutral { background: var(--neutral-bg); color: var(--neutral-text); }
    .pill.good { background: var(--good-bg); color: var(--good-text); }
    .pill.warn { background: var(--warn-bg); color: var(--warn-text); }
    .pill.tip { background: var(--tip-bg); color: var(--tip-text); }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin-bottom: 16px; }
    .card { background: var(--card); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
    .card h2, .card h3 { margin: 0 0 10px; font-size: 18px; }
    .card p { margin: 0; color: var(--muted); font-size: 14px; }
    /* ── Trip Map Card ── */
    .trip-map-card { margin-bottom: 16px; background: linear-gradient(135deg,#eef4ff,#f8fbff); border: 1px solid #dbeafe; }
    .trip-map-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .trip-map-link { display: inline-flex; align-items: center; text-decoration: none; white-space: nowrap; padding: 10px 14px; border-radius: 999px; background: var(--brand); color: #fff; font-size: 13px; font-weight: 700; }
    .trip-map-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .legend-item { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.75); font-size: 12px; font-weight: 700; }
    .legend-dot { width: 12px; height: 12px; border-radius: 999px; display: inline-block; }
    /* ── Prep ── */
    .prep-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin-bottom: 16px; }
    .prep-card { background: linear-gradient(135deg,#f8fbff,#fff); border: 1px solid #dbeafe; }
    .prep-intro { margin-bottom: 10px !important; font-size: 13px; }
    .prep-list li { margin-bottom: 5px; }
    /* ── Day ── */
    .days { display: grid; gap: 18px; }
    .day { background: var(--card); border-radius: 22px; padding: 20px; box-shadow: var(--shadow); border: 1px solid rgba(255,255,255,.6); scroll-margin-top: calc(var(--nav-h) + 8px); }
    .day-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .day-title { margin: 0; font-size: 20px; }
    .day-sub { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .badge { background: #eff6ff; color: var(--brand); font-size: 12px; font-weight: 700; border-radius: 999px; padding: 6px 10px; white-space: nowrap; }
    /* ── Day Map Card ── */
    .day-map-card { background: linear-gradient(135deg,#eff6ff,#f8fbff); border: 1px solid #dbeafe; border-radius: 16px; padding: 14px 16px; margin: 12px 0; }
    .day-map-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .map-card-text { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .map-card-link { display: inline-flex; align-items: center; text-decoration: none; white-space: nowrap; padding: 8px 12px; border-radius: 999px; background: var(--brand); color: #fff; font-size: 13px; font-weight: 700; }
    .day-map-summary { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-top: 12px; }
    /* ── Day Panels ── */
    .day-panels { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; margin: 12px 0 16px; }
    .subcard { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
    .subcard-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .subcard-label { font-size: 12px; color: var(--muted); margin: 10px 0 6px; font-weight: 700; }
    .empty { margin: 0; color: var(--muted); font-size: 13px; }
    /* ── Timeline ── */
    .timeline { display: grid; gap: 12px; margin-top: 12px; }
    .item { border-left: 3px solid var(--line); padding: 2px 0 2px 14px; transition: background .2s, box-shadow .2s; }
    .item.meal { border-left-color: var(--meal-line); background: var(--meal); border-radius: 14px; padding: 12px 14px; }
    .item.active-map-target { background: #eef6ff; border-radius: 14px; box-shadow: 0 0 0 2px rgba(37,99,235,.2); padding: 12px 14px; }
    .time { font-size: 13px; font-weight: 700; color: var(--brand); margin-bottom: 4px; }
    .item-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .item-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
    .item-meta span { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: var(--neutral-bg); color: var(--neutral-text); font-size: 12px; font-weight: 600; }
    .desc { color: var(--muted); font-size: 14px; margin: 0; }
    .map-link-row { margin-top: 8px; }
    .map-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--brand); font-size: 13px; font-weight: 700; }
    .map-link:hover { text-decoration: underline; }
    .food-block { margin-top: 10px; background: rgba(255,255,255,.55); }
    .notes-block { margin-top: 10px; background: var(--note-bg); border-color: #fde68a; }
    .note-list { margin: 0; padding-left: 18px; color: var(--muted); font-size: 13px; }
    .note-list.compact { font-size: 13px; }
    /* ── Footer ── */
    .footer-note { margin-top: 18px; background: #f8fafc; border: 1px dashed #cbd5e1; }
    .footer-note ul { margin: 10px 0 0; padding-left: 18px; color: var(--muted); font-size: 14px; }
    /* ── Back to Top ── */
    .back-top {
      position: fixed; bottom: 24px; right: 20px; z-index: 200;
      width: 44px; height: 44px; border-radius: 999px;
      background: var(--brand); color: #fff; border: 0; cursor: pointer;
      font-size: 20px; display: none; align-items: center; justify-content: center;
      box-shadow: 0 6px 18px rgba(37,99,235,.4); transition: transform .15s;
    }
    .back-top:hover { transform: translateY(-2px); }
    .back-top.visible { display: flex; }
    /* ── Responsive ── */
    @media (max-width: 720px) {
      .summary, .prep-grid { grid-template-columns: 1fr; }
      .day-panels { grid-template-columns: 1fr; }
      .day-map-summary { grid-template-columns: 1fr; }
      .trip-map-head { flex-direction: column; align-items: flex-start; }
      .day-map-head, .day-map-card { flex-direction: column; align-items: flex-start; }
      .day-header { flex-direction: column; }
      .hero h1 { font-size: 24px; }
    }
    /* ── Print ── */
    @media print {
      body { background: #fff; font-size: 12pt; }
      .daynav, .back-top, .map-card-link, .trip-map-link { display: none !important; }
      .wrap { padding: 0; max-width: 100%; }
      .hero { border-radius: 0; box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card, .day { box-shadow: none; border: 1px solid #ddd; }
      .day { break-inside: avoid; }
      .item { break-inside: avoid; }
      a[href]::after { content: " (" attr(href) ")"; font-size: 10pt; color: #999; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>${escapeHtml(data.title)}</h1>
      <div class="meta">${escapeHtml(dateMeta)}</div>
      <p>${escapeHtml((data.notes || []).join('、'))}</p>
      <div class="tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="gen-date">由 travel-planner v2 生成・${genDate}</div>
    </section>

    ${renderDayNav(data)}

    <section class="summary">
      <div class="card">
        <h2>旅程摘要</h2>
        <p>${summary}</p>
        <div class="chips">${(data.style || []).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
      <div class="card">
        <h2>安排原則</h2>
        <p>以重點景點與整體節奏優先，避免趕場清單，餐飲以順路穩定為主。</p>
        <div class="chips">
          <span class="chip">重點優先</span>
          <span class="chip">節奏舒適</span>
          <span class="chip">彈性保留</span>
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
        <li>由 JSON 資料自動生成，可人工微調。</li>
        <li>JSON 是原始資料，HTML 是衍生物——修改請從 JSON 開始再重新生成。</li>
        <li>有 prep.booking / tickets / reminders 欄位時，頁面自動顯示行前清單。</li>
        <li>回到首頁：<a href="index.html">Travel Planner 首頁</a></li>
      </ul>
    </section>
  </div>

  <button class="back-top" id="backTop" aria-label="回到頂部" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
  (function () {
    // Back to top
    const btn = document.getElementById('backTop');
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });

    // Leaflet map
    const points = ${mapPointsJson};
    if (!points.length) return;
    const dayColors = ['#2563eb','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

    function createIcon(day) {
      return L.divIcon({
        className: '',
        html: '<div style="width:28px;height:28px;border-radius:50%;background:' + dayColors[(day-1)%dayColors.length] + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border:2px solid rgba(255,255,255,.9);box-shadow:0 3px 8px rgba(0,0,0,.25)">D' + day + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });
    }

    // Active highlight
    function highlightItem(key) {
      document.querySelectorAll('.active-map-target').forEach(el => el.classList.remove('active-map-target'));
      if (!key) return;
      const el = document.querySelector('[data-map-key="' + CSS.escape(key) + '"]');
      if (!el) return;
      el.classList.add('active-map-target');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Try to render a Leaflet map if there's a container
    try {
      const mapEl = document.getElementById('leaflet-map');
      if (mapEl && typeof L !== 'undefined') {
        const map = L.map(mapEl);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        const bounds = [];
        points.forEach(function (p) {
          const m = L.marker([p.lat, p.lng], { icon: createIcon(p.day) }).addTo(map);
          const popup = ['<strong>' + p.title + '</strong>'];
          if (p.timeStart) popup.push(p.timeStart + (p.timeEnd ? '–' + p.timeEnd : ''));
          if (p.area) popup.push('區域：' + p.area);
          popup.push('Day ' + p.day);
          if (p.mapQuery) popup.push('<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.mapQuery) + '" target="_blank">Google Maps ↗</a>');
          m.bindPopup(popup.join('<br>'));
          m.on('click', function () { highlightItem(p.key); });
          bounds.push([p.lat, p.lng]);
        });
        if (bounds.length === 1) map.setView(bounds[0], 14);
        else map.fitBounds(bounds, { padding: [24, 24] });
      }
    } catch (e) {}
  })();
  </script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  '雪梨': 'sydney', '峇里島': 'bali',
  '沖繩': 'okinawa', '沖縄': 'okinawa',
};

function slugifyCity(dest = '') {
  const raw = String(dest).trim();
  if (CITY_SLUG_MAP[raw]) return CITY_SLUG_MAP[raw];
  return raw.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'trip';
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
  const city = slugifyCity(data.destination);
  const ym = String(data.dateStart || '').slice(0, 7);
  const defaultOut = `${city}-${ym}.html`;
  const outputPath = path.resolve(path.dirname(inputPath), process.argv[3] || defaultOut);
  fs.writeFileSync(outputPath, buildHtml(data), 'utf8');
  console.log(`✓ Generated: ${outputPath}`);
}

main();
