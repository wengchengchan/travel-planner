# New Trip SOP

## 目標

新增一個新行程時，不要每次重想流程，而是照固定步驟完成：
1. 收資料
2. 出行程草稿
3. 出頁面
4. 掛到首頁
5. commit / push

---

## Step 1：先收使用者資料

用問答方式收，不要求使用者自己填 JSON。

### 必收資料
- 地點
- 幾天幾夜
- 幾個人
- 想去的重點景點
- 旅遊風格
- 不想要什麼（例如太早起、太趕、排隊太久）
- 大概幾點出門
- 行程密度（鬆 / 中等 / 滿）
- 最後一天是不是回程日
- 預算
- 想吃什麼
- 住宿區域是否已知

---

## Step 2：先出第一版行程安排

先用自然語言給一版 Day 1 ~ Day N 的安排，讓使用者先判斷方向對不對。

格式重點：
- 每天一句主題
- 為什麼這樣排
- 先不要急著進 HTML

---

## Step 3：整理成資料底稿

把使用者確認過的版本整理成 JSON 草稿。

### 檔名規則
- `trip-<city>-draft.json`

例如：
- `trip-beijing-draft.json`
- `trip-seoul-draft.json`

JSON 至少包含：
- title
- destination
- dateStart
- dateEnd
- travelers
- budget
- style
- notes
- days[]

---

## Step 4：整理成網頁文案（可選）

若要先看內容方向，可先把 JSON 資料轉成可讀的網頁文案稿，不急著直接改 HTML。

### 檔名規則
- `<city>-web-copy.md`

例如：
- `beijing-web-copy.md`

內容至少包含：
- Hero 區標題與摘要
- 旅程摘要
- 安排原則
- Day 1 ~ Day N 文案
- 提醒事項

---

## Step 5：用生成器產出 HTML 草稿

現在可直接用 `generate-trip-page.js`，把 JSON 草稿轉成 HTML 草稿。

### 指令
```bash
node generate-trip-page.js trip-<city>-draft.json <city>-YYYY-MM.html
```

### 範例
```bash
node generate-trip-page.js trip-beijing-draft.json beijing-2026-06.html
```

### 原則
- 先用 JSON 生成 HTML 骨架
- 生成後再視需要人工微調
- 這一步的目標是省掉重複排版工作，不是一次到位完美文案

---

## Step 6：把新頁掛到首頁

更新 `index.html`，新增新的 trip card。

card 至少要有：
- Trip 編號
- 標題
- 日期 / 人數 / 預算
- 一句摘要
- 3 個 tag
- 對應連結

---

---

## Step 7：清理中間產物

如果某些中間檔只是工作過程，可不上版或刪掉。

通常可不上版的：
- `*-web-copy.md`
- `index-*-draft.html`

通常建議保留的：
- 正式 HTML
- `trip-*-draft.json`
- `index.html`

---

## Step 8：commit / push

常見上版檔案：
- `index.html`
- `<city>-YYYY-MM.html`
- `trip-<city>-draft.json`

commit message 範例：
- `Add Beijing itinerary and multi-trip structure`
- `Add Seoul trip page`

---

## 最小原則

- 先收資料，再排草稿
- 先確定方向，再做 JSON
- 先有正式 HTML，再掛首頁
- 不要一開始就把自動化做太重
- 優先保持可理解、可維護、可延續
