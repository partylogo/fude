# 本地測試指南

...（前文省略）...

## iOS ↔ API End-to-End 測試（圖文詳細版）

### A. 安裝與環境設定（只需一次）

| 步驟 | 指令 / 操作 | 說明 |
| ---- | ----------- | ---- |
| 1 | 安裝 Node.js 20+ 與 Xcode 15+ | 從 <https://nodejs.org/> 與 Mac App Store 安裝 |
| 2 | 安裝 pnpm | `npm i -g pnpm` |
| 3 | 安裝 iOS 開發依賴 | 打開 Xcode -> Preferences -> Components，下載 iOS 17 Simulator |
| 4 | 下載專案 | `git clone <repo>`；在 Finder 雙擊資料夾即可打開 |
| 5 | 安裝 JavaScript 套件 | 在「終端機」輸入：<br/>`cd fude`<br/>`pnpm install`<br/>`cd admin && pnpm install && cd ..` |
| 6 | 建立 Xcode 專案檔 | `xcodegen generate`（幾秒鐘即可） |
| 7 | 設定 API 連線 | 用任意編輯器開啟 `Env.xcconfig`，確認：<br/>`API_BASE_URL=http://localhost:3000` |

> 完成以上步驟後即可進入 **日常測試循環**。

### B. 啟動本地服務

1. **啟動後端 API**
   ```bash
   # 在專案根目錄 (fude) 執行
   node server.js
   ```
   ‑ 看到 `Server running on port 3000` 代表成功。
2. **(可選) 啟動後台管理系統**
```bash
   cd admin
   pnpm dev
```
   ‑ 瀏覽器開啟 <http://localhost:5173> 可視覺化 CRUD。

> 建議在「iTerm2 / Terminal」開兩個分割窗：左邊跑後端、右邊跑前端。

### C. 新增測試資料（兩種方式擇一）

| 方式 | 操作 | 備註 |
| ---- | ---- | ---- |
| Curl | 在任一 Terminal 執行：<br/>```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -d '{"title":"本地測試事件","type":"custom","description":"E2E 測試","solar_date":"2025-12-31"}'
``` | 回傳 JSON 出現 `id` 代表成功 |
| React Admin | 打開瀏覽器 `http://localhost:5173` → 登入畫面直接按登入 → 點左側 *Events* → **+ 新增** | 更直觀，資料立即寫入後端 |

### D. 執行 iOS App

1. Finder 雙擊 `fude.xcodeproj` → Xcode 開啟。<br/>
2. 左上方 Scheme 選 `fude`，裝置選 `iPhone 15` 模擬器。
3. 按 `▶︎` Run。Simulator 會啟動並載入 App。
4. 進入首頁（民俗提醒）應看到剛剛新增的 "本地測試事件" 卡片。

### E. 自動化測試

1. **JavaScript Jest 測試**（後端單元 / 整合）
   ```bash
   npm test --silent
   ```
   ‑ 應列出 `104 passed` 代表全部通過。
2. **iOS XCTest**
   ```bash
   xcodebuild test \
     -scheme fude \
     -destination 'platform=iOS Simulator,name=iPhone 15' | xcpretty
   ```
   ‑ 若沒有 `✗` 紅字即表示綠色通過。

### F. 常見問題排查

| 症狀 | 檢查點 |
| ---- | ------ |
| `Network error` | ‑ server.js 是否在 3000 埠口運行？<br/>- `API_BASE_URL` 是否寫成 `https://`（要用 `http://`）？ |
| Simulator 畫面沒有資料 | ‑ 確認 *curl* 或 React Admin 是否成功新增資料。<br/>- `EventViewModel` 是否有印出錯誤訊息於 Xcode Console？ |
| `address already in use` | 3000 埠口被占用：`lsof -i :3000` → `kill -9 <pid>` |
| XCTest 找不到模擬器 | 換成現有的模擬器名稱，例如 `iPhone 14` |

完成以上步驟，即可在本地一次驗證：**資料新增 → API 回傳 → iOS App 顯示** 之完整流程。

