# 🚀 Folklore Notification App - 雲端部署流程指南

## 📋 部署概覽

本專案將部署到以下雲端服務：
- **資料庫**: Supabase (PostgreSQL)
- **後端 API**: Vercel 或 Railway
- **React Admin**: Vercel 或 Netlify  
- **iOS App**: 透過 API 連接雲端後端

## 🎯 Phase 2B - 雲端部署準備清單

### 1. 帳號申請與設定 (你需要先做的事)

#### 1.1 Supabase 帳號設定
**你需要做：**
1. 前往 [supabase.com](https://supabase.com) 註冊帳號
2. 創建新專案 (建議命名：`fude-folklore-app`)
3. 選擇地區 (建議：Singapore 或 Tokyo，延遲較低)
4. 等待專案初始化完成

**完成後提供給我：**
```
✅ Supabase Project URL: https://your-project-id.supabase.co
✅ Supabase Service Key (service_role): supabase_service_key_here
✅ Supabase Anon Key: supabase_anon_key_here
```

#### 1.2 部署平台帳號 (選擇其一)

**選項 A: Vercel (推薦)**
- 前往 [vercel.com](https://vercel.com) 用 GitHub 帳號登入
- 連接你的 GitHub repository

**選項 B: Railway**  
- 前往 [railway.app](https://railway.app) 註冊
- 連接 GitHub repository

**你需要告訴我：**
```
✅ 選擇的部署平台：[ ] Vercel  [ ] Railway
✅ GitHub Repository URL: https://github.com/your-username/fude
```

### 2. 資料庫遷移準備

#### 2.1 Schema 檔案檢查
我會幫你確認以下檔案是否完整：
- `supabase/migrations/` - 所有資料庫 schema
- 測試資料匯入腳本

#### 2.2 環境變數準備
**後端需要的環境變數：**
```env
# Supabase 連接
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# 應用設定
NODE_ENV=production
EXTEND_YEARS=5
TZ=Asia/Taipei

# CORS 設定
ALLOWED_ORIGINS=https://your-admin-domain.vercel.app,https://your-api-domain.vercel.app
```

**React Admin 需要的環境變數：**
```env
VITE_API_URL=https://your-api-domain.vercel.app
VITE_APP_TITLE=Folklore Admin
```

### 3. 程式碼調整清單 (我會處理)

#### 3.1 移除開發模式功能
- [ ] 移除本地 JSON 快取機制 (`data/eventsCache.json`)
- [ ] 將 `database/database.js` 換成真實 Supabase 連線
- [ ] 移除 `api/system.js` 中的開發模式 mock 回應
- [ ] 確認所有 `NODE_ENV` 判斷邏輯正確

#### 3.2 Supabase 整合
- [ ] 安裝 `@supabase/supabase-js`
- [ ] 建立 `database/supabase.js` 連線模組
- [ ] 更新所有 repository 檔案使用真實資料庫
- [ ] 測試資料庫連線與查詢

#### 3.3 部署配置檔案
- [ ] 建立 `vercel.json` 或 `railway.toml`
- [ ] 設定 build scripts 和環境變數
- [ ] 配置 CORS 和安全性設定

### 4. 部署步驟流程

#### Phase 1: 資料庫部署
1. **Supabase Schema 部署**
   ```bash
   npx supabase db push
   ```

2. **測試資料匯入** (可選)
   ```bash
   npx supabase db seed
   ```

#### Phase 2: 後端 API 部署
1. **環境變數設定**
2. **部署到 Vercel/Railway**
3. **API 連線測試**

#### Phase 3: React Admin 部署
1. **環境變數設定**
2. **Build 與部署**
3. **功能測試**

#### Phase 4: iOS App 設定
1. **更新 API endpoint**
2. **測試與驗證**

## 🔧 部署後驗證清單

### API 功能測試
- [ ] `GET /api/events` - 事件列表
- [ ] `POST /api/events` - 新增事件  
- [ ] `GET /api/system/extension-status` - 系統狀態
- [ ] `POST /api/system/trigger-maintenance` - 手動維護

### React Admin 功能測試
- [ ] 事件 CRUD 操作
- [ ] 智能表單動態欄位
- [ ] 系統監控面板
- [ ] 日期規則設定

### iOS App 測試
- [ ] API 連線正常
- [ ] 事件資料顯示
- [ ] 通知功能

## 📞 需要你提供的資訊總結

**立即需要：**
1. ✅ Supabase 專案資訊 (URL, Service Key, Anon Key)
2. ✅ 選擇的部署平台 (Vercel 或 Railway)
3. ✅ GitHub Repository 權限 (如果是私有 repo)

**可選提供：**
- 自訂網域名稱 (如果有的話)
- 特殊的安全性需求
- 預期的使用者規模

## 🚨 注意事項

1. **安全性**: Service Key 絕對不要放在前端程式碼
2. **環境變數**: 所有敏感資訊都要設定為環境變數
3. **備份**: 部署前確保本地程式碼已完整備份
4. **測試**: 每個階段部署後都要完整測試

## 📋 接下來的步驟

1. **你先去申請 Supabase 帳號並建立專案**
2. **選擇部署平台並告訉我**
3. **提供必要的金鑰和 URL**
4. **我開始進行程式碼調整和部署配置**

---

💡 **有任何問題隨時問我！部署過程中我會逐步指導你完成每個步驟。**