下面是最新、可落地上線的最終計劃（合併我們前幾輪的討論，刪掉表面修，全面對齊前端四種事件表單與雲端 DB）。先列要做什麼與成功標準，再列執行順序與驗收方式。先確認，不動手。
目標
真實寫入 Supabase，拒絕「假成功」。
前後端欄位完全對齊你提供的四種表單：節氣、民俗節慶、自訂事件、神明節日。
准備切換到 SSOT（occurrences）避免 solar_date 表面資料。
一、移除/停用的表面修正
關閉寫入 fallback：POST/PUT/DELETE 遇 Supabase 錯誤即回 4xx/5xx，不再寫 in‑memory。
產線讀 fallback 預設關閉（必要時 dev 可開）。
新增後 redirect（EventCreate redirect=list）：完成穩定後移除還原 UX。
日期顯示降級/暫填策略視為過渡（之後改為 next_occurrence_date）。
二、DB schema 一次到位（允許 migration）
表：events（全部欄位允許 null，行為由後端驗證約束）
基本：id serial PK, title text, type text check in ('deity','festival','custom','solar_term'), description text
農曆：is_lunar boolean, lunar_month int, lunar_day int, is_leap_month boolean default false, leap_behavior text check in ('never_leap','always_leap','both')
國曆：solar_month int, solar_day int
一次性：one_time_date date
節氣：solar_term_name varchar(24)
相容：solar_date date[]（過渡保留）
規則版本：rule_version int default 1（為 occurrences 外鍵準備）
時間：created_at timestamptz default now(), updated_at timestamptz default now()
索引：UNIQUE(id, rule_version) 支援 occurrences 表外鍵
三、API 契約（對齊前端四種表單）
節氣（solar_term）
前端送：title, type='solar_term', description, solar_term_name
後端驗證：只允許上面這些；DB 寫入同欄位；solar_date 留 null（待 occurrences）
自訂（custom）
前端送：title, type='custom', description, one_time_date
後端：可暫時將 solar_date=[one_time_date] 作相容輸出；DB 寫入 one_time_date（和相容欄）
民俗節慶（festival）
前端送：title, type='festival', description, solar_month, solar_day
後端：當前可先推導今年 YYYY-MM-DD 入 solar_date（相容）；DB 寫 solar_month/solar_day
神明（deity）
前端送：title, type='deity', description, lunar_month, lunar_day, is_leap_month, leap_behavior
後端：不 mock 轉換；solar_date 留空；DB 寫入上述欄位
GET list/one：維持 solar_date 為 string|null 的相容輸出；同時準備 v2 提供 next_occurrence_date
四、後端行為強化
嚴格模式（產線）：ENFORCE_DB_WRITES=true、READ_FALLBACK=false
事件 repository 寫入白名單（短期防呆）：
```javascript
// eventRepository.js - dbPayloadFromEventData 函數強化
const DB_ALLOWED_FIELDS = [
  'title', 'type', 'description', 'is_lunar', 'lunar_month', 'lunar_day', 
  'is_leap_month', 'leap_behavior', 'solar_month', 'solar_day', 
  'one_time_date', 'solar_term_name', 'solar_date', 'rule_version'
];
function dbPayloadFromEventData(data) {
  const payload = {};
  DB_ALLOWED_FIELDS.forEach(field => {
    if (data[field] !== undefined) payload[field] = data[field];
  });
  if (payload.solar_date && !Array.isArray(payload.solar_date)) {
    payload.solar_date = [payload.solar_date];
  }
  return payload;
}
```
錯誤可觀測：保留 X-Data-Source 標頭；錯誤回 {status, message, details}
資料遷移策略：啟動時檢查 in-memory 和 Supabase 差異，提供同步選項
五、SSOT 導入（與 @admin-date-rule.md 對齊）
- event_occurrences 結構（完全對齊）：
  - 欄位：`event_id`, `occurrence_date`, `year`, `is_leap_month`, `generated_at`, `rule_version`
  - 主鍵：`PRIMARY KEY (event_id, occurrence_date)`
  - 關聯：`FOREIGN KEY (event_id, rule_version) REFERENCES events(id, rule_version)`（events 需具 `UNIQUE(id, rule_version)`）
- 生成策略（標準化）：
  - `EXTEND_YEARS=5`（非 N=1），統一生成當年到當年+5 年的 occurrences
  - 建立/更新事件時即時生成；每日 Cron 巡檢補齊；缺失時 API fallback 即時計算並背景補生成（依 @admin-date-rule.md）
- 分段落地（不破壞規格，只分批交付）：
  - Phase 1：先支援 `festival`、`custom`；使用固定規則立即生成 5 年
  - Phase 1.5：支援 `solar_term`，依 `solar_terms(year, term_name, occurrence_date)` 匯入資料生成
  - Phase 2：支援 `deity`（農曆 + 閏月策略 both/always_leap/never_leap）
- 讀取 API：
  - v1 維持相容（`solar_date` 字串/首筆）；
  - v2 提供 `next_occurrence_date` 與規則欄位（推薦前端切換）
- 節氣資料：
  - 依 @admin-date-rule.md 匯入近 3–5 年 `solar_terms(year, term_name, occurrence_date)`，缺失自動補充；資料來源為中央氣象局
六、緊急修正（Day 0.25 - 立即執行）
修正 events 表類型約束（加入 solar_term）：
```sql
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check 
CHECK (type IN ('festival', 'deity', 'custom', 'solar_term'));
```
修正前端表單欄位清理邏輯：deity 切換時應清理 is_leap_month
```javascript
// SmartEventForm.jsx 124行修正：
else if (next === 'deity') clear(['solar_month', 'solar_day', 'one_time_date', 'solar_term_name']);
// 改為：
else if (next === 'deity') clear(['solar_month', 'solar_day', 'one_time_date', 'solar_term_name', 'is_leap_month']);
```
嚴格模式環境變數處理：
```javascript
// eventRepository.js 加入：
const ENFORCE_DB_WRITES = process.env.ENFORCE_DB_WRITES === 'true';
const READ_FALLBACK = process.env.READ_FALLBACK !== 'false';

constructor() {
  this.supabase = getSupabaseClient();
  if (!this.supabase && ENFORCE_DB_WRITES) {
    throw new Error('Database connection required in strict mode');
  }
  // 在 create/update/delete 方法中：
  if (error && !READ_FALLBACK) {
    throw new Error(`Supabase operation failed: ${error.message}`);
  }
}
```
資料遷移檢查機制：
```javascript
// 新增：database/migrationChecker.js
async function checkDataConsistency() {
  const memoryEvents = global.__eventsStore || [];
  const { data: dbEvents } = await supabase.from('events').select('*');
  const conflicts = memoryEvents.filter(mem => 
    !dbEvents.find(db => db.id === mem.id && db.title === mem.title)
  );
  return { needsMigration: conflicts.length > 0, conflicts };
}
```
七、測試與驗收（全部對真 DB）
四類型最小 CRUD：POST→GET→PUT→GET→DELETE 全部 2xx，且 X-Data-Source=supabase
Admin 錯誤訊息能顯示 Supabase details（不被遮蓋）
之後 occurrences 就緒後：列表/詳情優先顯示 next_occurrence_date（或節氣名稱）；不依賴 solar_date
八、執行順序（開發日程估算）
Day 0.25：緊急修正（類型約束、表單邏輯、嚴格模式框架）
Day 0.5：加入嚴格模式開關；repository 寫入白名單；錯誤結構化輸出（只程式）
Day 0.5：補齊 events 欄位 migration（安全 ALTER IF NOT EXISTS）
Day 0.5：四類型 CRUD smoke 測對真 DB，抓具體錯誤並修正
Day 1.0：occurrences（festival/custom）＋ v1 相容輸出
Day 0.5：Admin 顯示對齊（優先 next_occurrence_date 或節氣名稱）
可選 Day 1–2：節氣匯入（近 3 年）＋農曆轉換來源接入
九、成功標準與驗收
**Phase 0.25 驗收**：
- [ ] solar_term 類型可創建且約束生效
- [ ] 前端四種表單切換時欄位正確清理
- [ ] 嚴格模式環境變數 ENFORCE_DB_WRITES=true 時拒絕 fallback
- [ ] Admin 系統監控面板顯示正確的資料來源

**Phase 1 驗收**：
- [ ] 任何建立/編輯/刪除請求，X-Data-Source 都是 supabase，DB 可見資料
- [ ] 四類型 CRUD 穩定 2xx，無記憶體假成功
- [ ] 白名單機制生效：送出非法欄位時 400 錯誤
- [ ] 錯誤訊息結構化：{status, message, details} 格式

**Phase 2 驗收**：
- [ ] event_occurrences 表正常創建並生成 festival/custom 類型 5 年資料
- [ ] v1 API 維持 solar_date 相容輸出
- [ ] Admin 列表優先顯示 next_occurrence_date

**最終驗收**：
- [ ] 事件日期由規則 → occurrences 生成，v1 相容輸出不破壞
- [ ] 四類型（deity/festival/custom/solar_term）完整支援
- [ ] 農曆事件閏月策略正確運作

**📋 執行確認**：
確認後，依此最終計劃開始實作，並把進度更新到 doc/tech-doc.md。