# Travel Planner

旅遊行程規劃展示站。把每一趟旅程的 JSON 資料自動生成成可展示的 HTML 頁面，部署到 GitHub Pages。

## 網站

[wengchengchan.github.io/travel-planner](https://wengchengchan.github.io/travel-planner/)

## 目前行程

| 行程 | 日期 | 頁面 |
|-----|------|------|
| 東京 3 天 2 夜慢走美食行 | 2026-05-10 ～ 2026-05-12 | [tokyo-2026-05.html](./tokyo-2026-05.html) |
| 北京 3 天 2 夜歷史景點美食行 | 2026-06-01 ～ 2026-06-03 | [beijing-2026-06.html](./beijing-2026-06.html) |

## 新增旅程

```bash
# 1. 建立 trip-<city>-draft.json（參考現有 JSON 格式）
# 2. 生成旅程頁
node generate-trip-page.js trip-<city>-draft.json

# 3. 更新首頁
node generate-index.js

# 4. Commit + Push（GitHub Actions 自動部署）
git add -A && git commit -m "feat: add <city> itinerary" && git push
```

## 技術說明

- 純 Node.js，無外部依賴
- 地圖：Google Maps 外部連結 + Leaflet.js（OpenStreetMap）
- 部署：GitHub Actions → GitHub Pages
- 生成器：`generate-trip-page.js`（單一旅程）、`generate-index.js`（首頁）
