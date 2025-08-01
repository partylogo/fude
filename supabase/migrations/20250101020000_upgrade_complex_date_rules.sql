-- Upgrade to Complex Date Rules System (admin-date-rule.md)
-- Version 1.1 Phase 2A: Enterprise-grade date rule management

-- ==============================================================================
-- Phase 1: Create solar_term_types reference table
-- ==============================================================================

CREATE TABLE solar_term_types (
  name VARCHAR(10) PRIMARY KEY,
  display_order INTEGER NOT NULL,
  season VARCHAR(10) NOT NULL,
  description TEXT
);

-- Insert 24 solar terms data
INSERT INTO solar_term_types (name, display_order, season) VALUES
  ('立春', 1, '春'), ('雨水', 2, '春'), ('驚蟄', 3, '春'), ('春分', 4, '春'),
  ('清明', 5, '春'), ('穀雨', 6, '春'), ('立夏', 7, '夏'), ('小滿', 8, '夏'),
  ('芒種', 9, '夏'), ('夏至', 10, '夏'), ('小暑', 11, '夏'), ('大暑', 12, '夏'),
  ('立秋', 13, '秋'), ('處暑', 14, '秋'), ('白露', 15, '秋'), ('秋分', 16, '秋'),
  ('寒露', 17, '秋'), ('霜降', 18, '秋'), ('立冬', 19, '冬'), ('小雪', 20, '冬'),
  ('大雪', 21, '冬'), ('冬至', 22, '冬'), ('小寒', 23, '冬'), ('大寒', 24, '冬');

-- ==============================================================================
-- Phase 2: Upgrade events table with complex rule support
-- ==============================================================================

-- Add new event type for solar terms
ALTER TABLE events ADD CONSTRAINT chk_events_type_new 
  CHECK (type IN ('festival', 'deity', 'custom', 'solar_term'));

-- Drop old constraint first
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;

-- Add new columns for complex date rules
ALTER TABLE events ADD COLUMN is_lunar BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN leap_behavior VARCHAR(20) DEFAULT 'never_leap';
ALTER TABLE events ADD COLUMN solar_month INTEGER;
ALTER TABLE events ADD COLUMN solar_day INTEGER;
ALTER TABLE events ADD COLUMN one_time_date DATE;
ALTER TABLE events ADD COLUMN solar_term_name VARCHAR(10);
ALTER TABLE events ADD COLUMN rule_version INTEGER DEFAULT 1;
ALTER TABLE events ADD COLUMN generated_until INTEGER;

-- Add constraints and foreign keys
ALTER TABLE events ADD CONSTRAINT chk_leap_behavior 
  CHECK (leap_behavior IN ('never_leap', 'always_leap', 'both'));

ALTER TABLE events ADD CONSTRAINT chk_solar_month 
  CHECK (solar_month IS NULL OR (solar_month >= 1 AND solar_month <= 12));

ALTER TABLE events ADD CONSTRAINT chk_solar_day 
  CHECK (solar_day IS NULL OR (solar_day >= 1 AND solar_day <= 31));

ALTER TABLE events ADD CONSTRAINT fk_solar_term_name 
  FOREIGN KEY (solar_term_name) REFERENCES solar_term_types(name);

-- Add unique constraint for rule versioning
ALTER TABLE events ADD CONSTRAINT uk_event_rule_version 
  UNIQUE (id, rule_version);

-- ==============================================================================
-- Phase 3: Create event_occurrences table (pre-generated dates)
-- ==============================================================================

CREATE TABLE event_occurrences (
  event_id INTEGER NOT NULL,
  occurrence_date DATE NOT NULL,
  year INTEGER NOT NULL,
  is_leap_month BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  rule_version INTEGER NOT NULL,
  PRIMARY KEY (event_id, occurrence_date)
);

-- Add foreign key constraint with rule version
ALTER TABLE event_occurrences ADD CONSTRAINT fk_event_rule_version 
  FOREIGN KEY (event_id, rule_version) 
  REFERENCES events(id, rule_version);

-- Create indexes for performance
CREATE INDEX idx_occurrences_date_range ON event_occurrences (occurrence_date, event_id);
CREATE INDEX idx_occurrences_year ON event_occurrences (year, event_id);

-- ==============================================================================
-- Phase 4: Create generation_errors table (structured error logging)
-- ==============================================================================

CREATE TABLE generation_errors (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  error_type VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  context_data JSONB,
  retryable BOOLEAN DEFAULT TRUE,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes for error management
CREATE INDEX idx_errors_event_time ON generation_errors (event_id, occurred_at DESC);
CREATE INDEX idx_errors_unresolved ON generation_errors (occurred_at) WHERE resolved_at IS NULL;

-- ==============================================================================
-- Phase 5: Create solar_terms table (authoritative solar term data)
-- ==============================================================================

CREATE TABLE solar_terms (
  year INTEGER NOT NULL,
  term_name VARCHAR(10) NOT NULL,
  occurrence_date DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'central_weather_bureau',
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (year, term_name)
);

-- Add foreign key constraint
ALTER TABLE solar_terms ADD CONSTRAINT fk_solar_term_name 
  FOREIGN KEY (term_name) REFERENCES solar_term_types(name);

-- Create indexes
CREATE INDEX idx_solar_terms_date ON solar_terms (occurrence_date);
CREATE INDEX idx_solar_terms_year ON solar_terms (year);

-- ==============================================================================
-- Phase 6: Create system_maintenance table (automated job tracking)
-- ==============================================================================

CREATE TABLE system_maintenance (
  id SERIAL PRIMARY KEY,
  maintenance_type VARCHAR(50) NOT NULL,
  target_year INTEGER NOT NULL,
  events_processed INTEGER DEFAULT 0,
  occurrences_created INTEGER DEFAULT 0,
  occurrences_deleted INTEGER DEFAULT 0,
  solar_terms_processed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  error_message TEXT
);

-- Create indexes for maintenance monitoring
CREATE INDEX idx_maintenance_type_date ON system_maintenance (maintenance_type, started_at DESC);
CREATE INDEX idx_maintenance_status ON system_maintenance (status, started_at DESC);

-- ==============================================================================
-- Phase 7: Create system_extension_status view (admin monitoring)
-- ==============================================================================

CREATE VIEW system_extension_status AS
SELECT 
  MIN(generated_until) as min_extended_year,
  MAX(generated_until) as max_extended_year,
  COUNT(*) as total_events,
  COUNT(CASE WHEN generated_until < EXTRACT(YEAR FROM NOW()) + 5 THEN 1 END) as events_need_extension,
  EXTRACT(YEAR FROM NOW()) + 5 as target_extension_year
FROM events 
WHERE generated_until IS NOT NULL;

-- ==============================================================================
-- Phase 8: Update existing data to new schema
-- ==============================================================================

-- Update existing events to use new schema
UPDATE events SET
  is_lunar = CASE 
    WHEN lunar_month IS NOT NULL AND lunar_day IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END,
  leap_behavior = 'never_leap',
  rule_version = 1,
  generated_until = NULL
WHERE id IN (1, 2);

-- For event id=2 (清明節), set it as solar_term type
UPDATE events SET
  type = 'solar_term',
  solar_term_name = '清明',
  is_lunar = FALSE,
  lunar_month = NULL,
  lunar_day = NULL
WHERE id = 2;

-- ==============================================================================
-- Phase 9: Add updated indexes for new schema
-- ==============================================================================

-- New indexes for complex rule queries
CREATE INDEX idx_events_is_lunar ON events(is_lunar) WHERE is_lunar = TRUE;
CREATE INDEX idx_events_solar_term ON events(solar_term_name) WHERE solar_term_name IS NOT NULL;
CREATE INDEX idx_events_rule_version ON events(rule_version);
CREATE INDEX idx_events_generated_until ON events(generated_until);

-- ==============================================================================
-- Phase 10: Add comments for documentation
-- ==============================================================================

COMMENT ON TABLE solar_term_types IS '24節氣參照表';
COMMENT ON TABLE event_occurrences IS '預生成事件日期表（5年預載）';
COMMENT ON TABLE generation_errors IS '日期生成錯誤記錄表';
COMMENT ON TABLE solar_terms IS '中央氣象局節氣資料表';
COMMENT ON TABLE system_maintenance IS '系統自動維護記錄表';
COMMENT ON VIEW system_extension_status IS '系統延伸狀態監控檢視';

COMMENT ON COLUMN events.is_lunar IS '是否為農曆事件';
COMMENT ON COLUMN events.leap_behavior IS '閏月處理策略：never_leap/always_leap/both';
COMMENT ON COLUMN events.solar_term_name IS '節氣名稱（節氣事件專用）';
COMMENT ON COLUMN events.rule_version IS '規則版本號，修改規則時遞增';
COMMENT ON COLUMN events.generated_until IS '已預生成到哪一年';