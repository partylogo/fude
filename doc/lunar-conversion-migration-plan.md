# 農曆轉換系統升級計劃

## 🎯 目標
從硬編碼的農曆轉換規則升級到可擴展、可靠的農曆轉換系統

## 📋 現狀分析

### 當前問題
- ❌ 硬編碼轉換規則，只支持少數幾個日期
- ❌ 無法處理任意農曆日期
- ❌ 沒有閏月的完整支持
- ❌ 無法擴展到未來年份

### 現有硬編碼規則
```javascript
const lunarToSolarMap = {
  '3-23': ['2025-04-20'], // 媽祖聖誕
  '1-1': ['2025-01-29'],  // 農曆新年
  '1-15': ['2025-02-12'], // 元宵節
  '3-15': ['2025-04-12'], // 財神爺生日
  '8-12': ['2025-09-06'], // 神明生日測試
};
```

## 🏗️ 新系統架構

### 多層級轉換策略
1. **資料庫快取**（最快）- 優先查詢已轉換的結果
2. **官方 API**（最準確）- 台灣中央氣象局農民曆 API
3. **農曆算法**（可靠）- 本地計算，支持大範圍年份
4. **第三方 API**（備用）- 香港天文台、萬年曆等
5. **預定義規則**（降級）- 保留現有硬編碼作為最後手段

### 資料庫結構
- `lunar_conversion_cache` - 轉換結果快取
- `lunar_conversion_errors` - 錯誤追蹤
- `lunar_festivals` - 農曆節日主檔

## 📅 分階段遷移計劃

### Phase 1: 基礎設施準備（立即執行）
- [x] 創建 `AdvancedLunarCalendarService`
- [x] 創建資料庫 migration
- [ ] 執行資料庫 migration
- [ ] 設定環境變數（API keys）

### Phase 2: API 整合（1-2 週）
- [ ] 串接中央氣象局 API
- [ ] 實作農曆算法庫（推薦：lunar-js）
- [ ] 串接備用第三方 API
- [ ] 完整測試各種轉換來源

### Phase 3: 漸進式部署（1 週）
- [ ] 在現有系統中整合新服務
- [ ] A/B 測試比較結果準確性
- [ ] 監控轉換成功率和效能

### Phase 4: 完全遷移（1 週）
- [ ] 替換所有硬編碼調用
- [ ] 移除舊的 `lunarCalendarService.js`
- [ ] 建立自動快取預載機制

## 🚀 立即可執行的步驟

### 1. 執行資料庫 Migration
```bash
# 如果使用 Supabase
supabase db push

# 或者手動執行 SQL
psql -f supabase/migrations/20250109000000_create_lunar_conversion_cache.sql
```

### 2. 安裝必要的套件
```bash
# 農曆算法庫（選擇其中一個）
npm install lunar-javascript
# 或
npm install chinese-lunar-calendar
# 或
npm install solarlunar
```

### 3. 設定環境變數
```bash
# .env 或 .env.local
CWB_API_KEY=your_cwb_api_key_here
ENABLE_LUNAR_CACHE=true
LUNAR_CACHE_EXPIRY_DAYS=30
```

## 📊 監控和維護

### 關鍵指標
- 轉換成功率（各來源）
- 平均回應時間
- 快取命中率
- 錯誤發生頻率

### 自動化任務
- 每日清理過期快取
- 每週預載下個月常用日期
- 每月檢查 API 配額使用情況

## 🧪 測試策略

### 準確性測試
```bash
# 測試常用節日轉換
node scripts/test-lunar-conversion.js --date=2025-1-1  # 春節
node scripts/test-lunar-conversion.js --date=2025-8-15 # 中秋節

# 測試閏月處理
node scripts/test-lunar-conversion.js --date=2025-6-1 --leap=true

# 測試邊界情況
node scripts/test-lunar-conversion.js --year=2030-12-30
```

### 效能測試
- 批量轉換 1000 個日期的速度
- 併發請求處理能力
- 快取效果測試

## 💰 成本考量

### API 調用成本
- 中央氣象局：通常免費，有頻率限制
- 第三方 API：可能有調用費用
- 建議設定每日/每月調用上限

### 儲存成本
- 每筆快取記錄約 100 bytes
- 10,000 筆快取約 1MB
- 對於大多數應用來說成本可忽略

## 📚 推薦的農曆算法庫

### 1. lunar-javascript
- 純 JavaScript 實作
- 支援 1900-2100 年範圍
- 準確度高，廣泛使用

### 2. chinese-lunar-calendar
- 完整的中國農曆實作
- 支援節氣、生肖等
- 適合複雜應用

### 3. solarlunar
- 輕量級庫
- 簡單易用
- 適合基礎轉換需求

## ⚠️ 注意事項

### 時區處理
- 統一使用台灣時區（Asia/Taipei）
- 注意跨年邊界情況

### 閏月邏輯
- 確保正確處理閏月年份
- 提供靈活的閏月行為配置

### 向後相容性
- 保持現有 API 介面不變
- 漸進式升級，避免破壞性變更

## 🎉 預期效果

### 短期效果（1 個月內）
- 支持任意農曆日期轉換
- 消除硬編碼依賴
- 提高系統可靠性

### 長期效果（3-6 個月）
- 支持未來 10-20 年的日期轉換
- 自動化維護，減少人工干預
- 為更多農曆功能打下基礎（如：節氣、生肖等）

---

## 📞 下一步行動

1. **立即執行**：執行資料庫 migration
2. **本週內**：選擇並安裝農曆算法庫
3. **下週**：開始整合第一個轉換來源
4. **兩週後**：完成基礎轉換功能測試

這個升級計劃將徹底解決硬編碼問題，為你的民俗通知 app 提供長期可靠的農曆轉換能力！