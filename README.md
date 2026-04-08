# Travel Planner MVP

這是旅遊規劃工具的第一版最小可用原型（MVP），目前已從單一行程頁，長成可累積的多行程展示站。

## 目前內容

- `index.html`：首頁列表頁
- `tokyo-2026-05.html`：東京正式行程頁
- `beijing-2026-06.html`：北京正式行程頁
- `trip-tokyo-draft.json`：東京資料底稿
- `trip-beijing-draft.json`：北京資料底稿
- `NEW-TRIP-SOP.md`：新增行程 SOP
- `NAMING-RULES.md`：命名規則
- `generate-trip-page.js`：由 trip draft 生成 HTML 頁
- `generate-index.js`：由 trip draft 生成首頁列表

## 現在的工作流

1. 用問答方式收旅遊需求
2. 先出第一版行程安排
3. 整理成 `trip-<city>-draft.json`
4. 用生成器產出 `<city>-YYYY-MM.html`
5. 重跑首頁生成器更新 `index.html`
6. commit / push 到 GitHub Pages

## 生成指令

### 1) 生成單一行程頁

```bash
node generate-trip-page.js trip-<city>-draft.json <city>-YYYY-MM.html
```

例如：

```bash
node generate-trip-page.js trip-beijing-draft.json beijing-2026-06.html
```

### 2) 重新生成首頁

```bash
node generate-index.js
```

## 最小上版流程

```bash
git add index.html trip-<city>-draft.json <city>-YYYY-MM.html
git commit -m "Add new trip page"
git push
```

## 原則

目前先求：

- 穩
- 清楚
- 可維護
- 可延續

先把資料流與頁面流程做穩，再慢慢補自動化與功能。

