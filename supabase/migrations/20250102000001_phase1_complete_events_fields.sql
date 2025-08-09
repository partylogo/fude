-- Phase 1: 補齊 events 表欄位，確保完全對齊計劃規格
-- 修正遺漏和不一致的欄位定義

-- Step 1: 確保 is_leap_month 欄位存在（可能在某些情況下遺漏）
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_leap_month BOOLEAN DEFAULT FALSE;

-- Step 2: 修正 solar_term_name 欄位長度（計劃要求 varchar(24)，原本是 varchar(10)）
ALTER TABLE events ALTER COLUMN solar_term_name TYPE VARCHAR(24);

-- Step 3: 確保所有必要欄位都存在（防禦性加入，IF NOT EXISTS）
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_lunar BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS leap_behavior VARCHAR(20) DEFAULT 'never_leap';
ALTER TABLE events ADD COLUMN IF NOT EXISTS solar_month INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS solar_day INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS one_time_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rule_version INTEGER DEFAULT 1;

-- Step 4: 確保約束存在且正確
-- 重新創建類型約束（確保支援四種類型）
DO $$
BEGIN
  -- 刪除舊約束
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_type_check') THEN
    ALTER TABLE events DROP CONSTRAINT events_type_check;
  END IF;
  
  -- 創建新約束
  ALTER TABLE events ADD CONSTRAINT events_type_check 
    CHECK (type IN ('deity', 'festival', 'custom', 'solar_term'));
END $$;

-- 確保閏月處理約束存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leap_behavior') THEN
    ALTER TABLE events ADD CONSTRAINT chk_leap_behavior 
      CHECK (leap_behavior IN ('never_leap', 'always_leap', 'both'));
  END IF;
END $$;

-- 確保月份約束存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_solar_month') THEN
    ALTER TABLE events ADD CONSTRAINT chk_solar_month 
      CHECK (solar_month IS NULL OR (solar_month >= 1 AND solar_month <= 12));
  END IF;
END $$;

-- 確保日期約束存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_solar_day') THEN
    ALTER TABLE events ADD CONSTRAINT chk_solar_day 
      CHECK (solar_day IS NULL OR (solar_day >= 1 AND solar_day <= 31));
  END IF;
END $$;

-- 確保農曆月份約束存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lunar_month') THEN
    ALTER TABLE events ADD CONSTRAINT chk_lunar_month 
      CHECK (lunar_month IS NULL OR (lunar_month >= 1 AND lunar_month <= 12));
  END IF;
END $$;

-- 確保農曆日期約束存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lunar_day') THEN
    ALTER TABLE events ADD CONSTRAINT chk_lunar_day 
      CHECK (lunar_day IS NULL OR (lunar_day >= 1 AND lunar_day <= 30));
  END IF;
END $$;

-- Step 5: 確保唯一約束存在（支援 occurrences 外鍵）
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_id_rule_version_unique 
  ON events(id, rule_version);

-- Step 6: 更新現有記錄的預設值
UPDATE events SET rule_version = 1 WHERE rule_version IS NULL;
UPDATE events SET is_leap_month = FALSE WHERE is_leap_month IS NULL;
UPDATE events SET leap_behavior = 'never_leap' WHERE leap_behavior IS NULL;
UPDATE events SET is_lunar = FALSE WHERE is_lunar IS NULL;

-- Step 7: 驗證所有欄位都正確創建
DO $$
DECLARE
  missing_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- 檢查必要欄位
  FOR field_name IN SELECT unnest(ARRAY[
    'title', 'type', 'description', 'is_lunar', 'lunar_month', 'lunar_day', 
    'is_leap_month', 'leap_behavior', 'solar_month', 'solar_day', 
    'one_time_date', 'solar_term_name', 'solar_date', 'rule_version',
    'created_at', 'updated_at'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = field_name
    ) THEN
      missing_fields := array_append(missing_fields, field_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_fields, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing fields in events table: %', array_to_string(missing_fields, ', ');
  END IF;
  
  RAISE NOTICE '✅ Phase 1 欄位補齊完成：所有必要欄位已存在並正確約束';
END $$;