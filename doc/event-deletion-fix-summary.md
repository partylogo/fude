# 事件刪除外鍵約束問題修復

## 🚨 問題描述

當嘗試刪除事件時，出現以下錯誤：

```
ERROR: update or delete on table "events" violates foreign key constraint "fk_event_rule_version" on table "event_occurrences"
DETAIL: Key (id, rule_version)=(12, 1) is still referenced from table "event_occurrences".
```

## 🔍 根本原因

1. **外鍵約束沒有設定 CASCADE 刪除**：當刪除事件時，相關的 `event_occurrences` 記錄沒有自動刪除
2. **刪除順序錯誤**：應用程式先嘗試刪除事件，但相關的 occurrences 記錄仍然存在
3. **資料庫約束設計問題**：外鍵約束過於嚴格，沒有考慮到級聯刪除的需求

## ✅ 修復方案

### 1. 應用程式層面修復

**修改 `database/eventRepository.js`:**
- 在刪除事件前先清理相關的 `event_occurrences` 記錄
- 增加詳細的日誌記錄以便追蹤刪除過程
- 確保錯誤處理不會導致部分刪除

**修改 `api/events.js`:**
- 調整刪除順序：先清理 occurrences，再刪除事件
- 增加更好的錯誤處理和日誌記錄

### 2. 資料庫層面修復

**執行 `doc/fix-event-deletion-constraints.sql`:**
- 修改外鍵約束為 `ON DELETE CASCADE`
- 清理孤兒記錄（沒有對應事件的 occurrences）
- 確保所有相關約束都支持級聯操作

### 3. 預防性改進

- 增加事務支持，確保刪除操作的原子性
- 改善錯誤訊息，提供更明確的故障原因
- 增加刪除前的驗證和確認機制

## 🚀 執行步驟

### 立即修復（已完成）
1. ✅ 更新應用程式代碼
2. ✅ 創建資料庫修復腳本
3. ✅ 改善錯誤處理邏輯

### 資料庫修復（需要執行）
1. **在 Supabase Dashboard 執行:**
   ```sql
   -- 複製 doc/fix-event-deletion-constraints.sql 的內容
   -- 在 SQL Editor 中執行
   ```

2. **驗證修復:**
   ```bash
   # 重新部署應用程式
   git push origin main
   
   # 測試事件刪除功能
   # 在 admin 界面嘗試刪除測試事件
   ```

## 📊 修復效果

### 修復前
- ❌ 刪除事件時出現外鍵約束錯誤
- ❌ 無法刪除有 occurrences 的事件
- ❌ 錯誤訊息不明確

### 修復後
- ✅ 事件刪除時自動清理相關 occurrences
- ✅ 支持級聯刪除，確保資料一致性
- ✅ 詳細的日誌記錄便於問題追蹤
- ✅ 更好的錯誤處理和用戶體驗

## 🔮 長期改進建議

1. **軟刪除機制**: 考慮實施軟刪除（標記為已刪除）而非硬刪除
2. **刪除確認**: 在前端增加刪除確認對話框
3. **批量操作**: 支持批量刪除事件和相關記錄
4. **審計日誌**: 記錄所有刪除操作供審計使用
5. **權限控制**: 根據用戶角色限制刪除權限

## 🧪 測試清單

- [ ] 刪除有 occurrences 的事件
- [ ] 刪除沒有 occurrences 的事件  
- [ ] 驗證相關記錄被正確清理
- [ ] 確認錯誤情況下的回滾機制
- [ ] 測試併發刪除情況

## 📞 技術支援

如果修復後仍有問題：

1. **檢查日誌**: 查看詳細的刪除過程日誌
2. **驗證約束**: 確認資料庫約束已正確更新
3. **重新部署**: 確保最新的代碼已部署
4. **聯繫支援**: 提供具體的錯誤訊息和事件 ID

---

**修復完成時間**: 2025-08-09  
**相關檔案**: `database/eventRepository.js`, `api/events.js`, `doc/fix-event-deletion-constraints.sql`