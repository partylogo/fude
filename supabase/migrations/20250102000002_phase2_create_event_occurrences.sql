-- Phase 2: 創建 event_occurrences 表
-- 實現 SSOT (Single Source of Truth) 的預生成日期系統
-- 完全對齊 @admin-date-rule.md 規格設計

-- Step 1: 創建 event_occurrences 表
CREATE TABLE event_occurrences (
  event_id int NOT NULL,
  occurrence_date date NOT NULL,
  year int NOT NULL,
  is_leap_month boolean DEFAULT FALSE,
  generated_at timestamptz DEFAULT NOW(),
  rule_version int NOT NULL DEFAULT 1,
  
  -- 主鍵：防止同事件同日期重複
  PRIMARY KEY (event_id, occurrence_date)
);

-- Step 2: 創建外鍵約束
-- 注意：依賴 events 表的 UNIQUE(id, rule_version) 約束
ALTER TABLE event_occurrences 
ADD CONSTRAINT fk_event_rule_version 
FOREIGN KEY (event_id, rule_version) 
REFERENCES events(id, rule_version);

-- Step 3: 創建索引優化查詢效能
CREATE INDEX idx_occurrences_date_range ON event_occurrences (occurrence_date, event_id);
CREATE INDEX idx_occurrences_year ON event_occurrences (year, event_id);
CREATE INDEX idx_occurrences_event_year ON event_occurrences (event_id, year);
CREATE INDEX idx_occurrences_rule_version ON event_occurrences (rule_version);

-- Step 4: 註解說明
COMMENT ON TABLE event_occurrences IS 'Phase 2: 預生成事件發生日期表，實現 SSOT 系統';
COMMENT ON COLUMN event_occurrences.event_id IS '關聯事件 ID';
COMMENT ON COLUMN event_occurrences.occurrence_date IS '實際國曆發生日期 (yyyy-MM-dd)';
COMMENT ON COLUMN event_occurrences.year IS '西元年份，供快速查詢年度範圍';
COMMENT ON COLUMN event_occurrences.is_leap_month IS '該次是否來自閏月計算';
COMMENT ON COLUMN event_occurrences.generated_at IS 'Occurrence 產生時間';
COMMENT ON COLUMN event_occurrences.rule_version IS '對應的 events.rule_version，確保規則版本一致性';

-- Step 5: 創建觸發器自動設置年份
CREATE OR REPLACE FUNCTION set_occurrence_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.year = EXTRACT(YEAR FROM NEW.occurrence_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_occurrence_year
  BEFORE INSERT OR UPDATE ON event_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION set_occurrence_year();

-- Step 6: 創建清理舊資料的函數（避免無限增長）
CREATE OR REPLACE FUNCTION clean_old_occurrences(keep_years int DEFAULT 10)
RETURNS int AS $$
DECLARE
  cutoff_date date;
  deleted_count int;
BEGIN
  cutoff_date := (CURRENT_DATE - (keep_years || ' years')::interval)::date;
  
  DELETE FROM event_occurrences 
  WHERE occurrence_date < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_old_occurrences IS '清理指定年數前的舊 occurrences（預設保留10年）';

-- Step 7: 驗證表結構創建成功
DO $$
BEGIN
  -- 檢查表是否創建成功
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_occurrences'
  ) THEN
    RAISE EXCEPTION '❌ event_occurrences 表創建失敗';
  END IF;
  
  -- 檢查主鍵約束
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'event_occurrences' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE EXCEPTION '❌ event_occurrences 主鍵約束創建失敗';
  END IF;
  
  -- 檢查外鍵約束
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'event_occurrences' 
    AND constraint_name = 'fk_event_rule_version'
  ) THEN
    RAISE EXCEPTION '❌ event_occurrences 外鍵約束創建失敗';
  END IF;
  
  -- 檢查索引
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'event_occurrences' 
    AND indexname = 'idx_occurrences_date_range'
  ) THEN
    RAISE EXCEPTION '❌ event_occurrences 索引創建失敗';
  END IF;
  
  RAISE NOTICE '✅ Phase 2 event_occurrences 表創建成功';
  RAISE NOTICE '   - 主鍵：(event_id, occurrence_date)';
  RAISE NOTICE '   - 外鍵：events(id, rule_version)';
  RAISE NOTICE '   - 索引：4個效能優化索引';
  RAISE NOTICE '   - 觸發器：自動設置年份';
END $$;