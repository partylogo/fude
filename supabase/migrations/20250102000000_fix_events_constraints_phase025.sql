-- Phase 0.25 緊急修正：修正 events 表約束和欄位
-- 加入 solar_term 類型支援，準備 occurrences 外鍵

-- Step 1: 修正類型約束，加入 solar_term
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check 
CHECK (type IN ('festival', 'deity', 'custom', 'solar_term'));

-- Step 2: 加入 rule_version 欄位（為 occurrences 外鍵準備）
ALTER TABLE events ADD COLUMN IF NOT EXISTS rule_version INTEGER DEFAULT 1;

-- Step 3: 創建 UNIQUE 約束支援 occurrences 外鍵
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_id_rule_version 
ON events(id, rule_version);

-- Step 4: 更新現有記錄的 rule_version（如果為 null）
UPDATE events SET rule_version = 1 WHERE rule_version IS NULL;

-- Step 5: 加入約束註解
COMMENT ON COLUMN events.rule_version IS '規則版本號，用於 event_occurrences 外鍵關聯';
COMMENT ON CONSTRAINT events_type_check ON events IS 'Phase 0.25 修正：支援四種事件類型 deity/festival/custom/solar_term';

-- 驗證修正結果
DO $$ 
BEGIN 
    -- 測試新類型約束
    PERFORM * FROM pg_constraint 
    WHERE conname = 'events_type_check' 
    AND consrc LIKE '%solar_term%';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'solar_term 類型約束修正失敗';
    END IF;
    
    -- 測試 rule_version 欄位
    PERFORM column_name FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'rule_version';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'rule_version 欄位加入失敗';
    END IF;
    
    RAISE NOTICE '✅ Phase 0.25 SQL 修正完成：solar_term 類型和 rule_version 欄位';
END $$;