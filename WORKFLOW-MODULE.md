# Travel Planner Workflow Module

## 模組定位

這不是單一頁面專案，而是一套可重複使用的旅遊規劃工作流模組。

目標：
- 使用者一句話觸發
- 自動進入問答收集
- 收成第一版行程
- 視需要落成 JSON / HTML / 首頁更新

---

## 模組輸入

使用者以自然語言提出旅遊規劃需求，例如：
- 幫我規劃旅遊
- 幫我排北京 3 天 2 夜
- 我想去東京，幫我做行程

---

## 模組輸出

依需求深度不同，可輸出四層：

### Level 1：對話版行程
- 自然語言 Day 1 ~ Day N 安排

### Level 2：資料底稿
- `trip-<city>-draft.json`

### Level 3：正式頁面
- `<city>-YYYY-MM.html`

### Level 4：展示站更新
- `index.html` 首頁列表同步更新

---

## 標準流程

### Step 1：判斷是否命中旅遊規劃意圖
若使用者目標是「實際安排旅遊行程」，就進入本模組。

### Step 2：問答收資料
優先收：
- 地點
- 幾天幾夜
- 幾個人
- 重點景點
- 風格
- 不想要什麼
- 出門時間
- 行程密度
- 回程日
- 預算
- 想吃什麼
- 住宿區域

### Step 3：先出第一版行程
用自然語言先給一版安排，不急著立刻寫檔。

### Step 4：使用者確認方向
若方向大致對，再進入資料化與頁面化。

### Step 5：落成 trip draft
整理成 `trip-<city>-draft.json`。

### Step 6：生成頁面
用：
```bash
node generate-trip-page.js trip-<city>-draft.json <city>-YYYY-MM.html
```

### Step 7：更新首頁
用：
```bash
node generate-index.js
```

### Step 8：需要時再 commit / push
repo 寫入與上版屬第二層動作，建議一句確認後再做。

---

## 決策原則

### 預設自動做
- 問答收集
- 第一版行程安排
- trip draft 整理
- HTML 草稿生成
- 首頁草稿更新

### 預設不自動做
- 刪檔
- 覆蓋既有正式頁
- commit
- push

---

## 模組依賴檔案

- `TRIGGER-SPEC.md`
- `NEW-TRIP-SOP.md`
- `NAMING-RULES.md`
- `generate-trip-page.js`
- `generate-index.js`

---

## 一句話總結

當使用者說「幫我規劃旅遊」，就不是單次聊天，而是啟動一條可延續的旅遊規劃工作流。
