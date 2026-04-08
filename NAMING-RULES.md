# Naming Rules

## 目標

讓 `travel-planner` 之後新增行程時，檔名、用途、位置都固定，不要越長越亂。

---

## 1. 首頁

### 檔名
- `index.html`

### 用途
- 作為所有行程的入口列表頁
- 不承載單一行程細節

---

## 2. 正式行程頁

### 檔名規則
- `<city>-YYYY-MM.html`

### 範例
- `tokyo-2026-05.html`
- `beijing-2026-06.html`
- `seoul-2026-10.html`

### 原則
- 一個行程一個正式頁
- 用城市 + 年月辨識
- 盡量不要用 `final`, `new`, `v2` 這種會越來越亂的命名

---

## 3. 資料底稿

### 檔名規則
- `trip-<city>-draft.json`

### 範例
- `trip-tokyo-draft.json`
- `trip-beijing-draft.json`

### 用途
- 存結構化旅程資料
- 作為之後生成頁面或回頭修改的基底

---

## 4. 中間文案稿

### 檔名規則
- `<city>-web-copy.md`

### 範例
- `beijing-web-copy.md`

### 用途
- 網頁文案整理稿
- 可作為中間工作檔

### 原則
- 若只是工作中間產物，可不上版
- 若有長期保留價值，再考慮留著

---

## 5. 草稿 HTML

### 檔名規則
- `index-<city>-draft.html`

### 範例
- `index-beijing-draft.html`

### 用途
- 正式頁產出前的 HTML 草稿

### 原則
- 正式頁完成後通常可刪
- 不建議長期堆很多 draft HTML

---

## 6. SOP / 規則文件

### 建議檔名
- `NEW-TRIP-SOP.md`
- `NAMING-RULES.md`

### 用途
- 保存工作流程與規則
- 幫未來自己快速接回脈絡

---

## 建議 repo 結構

- `index.html` → 首頁列表
- `<city>-YYYY-MM.html` → 正式行程頁
- `trip-<city>-draft.json` → 資料底稿
- `*.md` → SOP / 規則 / 說明文件

---

## 最小原則

- 首頁永遠只做入口
- 正式頁用 `城市 + 年月`
- JSON 底稿保留
- 中間產物少留、少上版
- 不用模糊命名（如 final / new / latest / v2）
