-- Create base tables for Version 1.1 Phase 2A
-- 基礎資料表：events, groups, group_items

-- Events table - 事件資料表
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('festival', 'deity', 'custom')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  lunar_month INTEGER CHECK (lunar_month >= 1 AND lunar_month <= 12),
  lunar_day INTEGER CHECK (lunar_day >= 1 AND lunar_day <= 30),
  is_leap_month BOOLEAN DEFAULT FALSE,
  solar_date DATE[] NOT NULL, -- 一年可能有多個對應日期
  cover_url TEXT,
  deity_role TEXT, -- 神明職掌（Version 2.2 使用）
  worship_notes TEXT, -- 祭拜注意事項（Version 2.2 使用）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table - 群組資料表
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  video_url TEXT, -- 推薦影片連結
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group items table - 群組事件關聯表
CREATE TABLE group_items (
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_solar_date ON events USING GIN(solar_date);
CREATE INDEX idx_events_lunar_date ON events(lunar_month, lunar_day);
CREATE INDEX idx_groups_enabled ON groups(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_group_items_group_id ON group_items(group_id);
CREATE INDEX idx_group_items_event_id ON group_items(event_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at 
  BEFORE UPDATE ON groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data (matching our mock data)
INSERT INTO events (id, type, title, description, solar_date, lunar_month, lunar_day) VALUES
(1, 'deity', '媽祖聖誕', '海上女神媽祖的誕辰', ARRAY['2025-04-20']::DATE[], 3, 23),
(2, 'festival', '清明節', '祭祖掃墓的重要節日', ARRAY['2025-04-05']::DATE[], 3, 5);

INSERT INTO groups (id, name, description, enabled, video_url) VALUES
(1, '簡少年老師 2025 拜拜推薦', '簡少年老師精選2025年最重要的拜拜時機，涵蓋開運、求財、祈福等各種需求', true, 'https://www.youtube.com/watch?v=example123'),
(2, '基礎民俗節慶', '台灣傳統民俗節慶基本清單，適合初學者', true, null);

INSERT INTO group_items (group_id, event_id) VALUES
(1, 1), -- 簡少年老師推薦：媽祖聖誕
(1, 2), -- 簡少年老師推薦：清明節
(2, 2); -- 基礎民俗節慶：清明節

-- Reset sequences to continue from inserted data
SELECT setval('events_id_seq', 2);
SELECT setval('groups_id_seq', 2);

-- Add comments for documentation
COMMENT ON TABLE events IS '民俗事件資料表';
COMMENT ON TABLE groups IS '群組資料表';
COMMENT ON TABLE group_items IS '群組事件關聯表';
COMMENT ON COLUMN events.solar_date IS '國曆日期陣列，一個農曆日期可能對應多個國曆日期';
COMMENT ON COLUMN events.lunar_month IS '農曆月份 (1-12)';
COMMENT ON COLUMN events.lunar_day IS '農曆日期 (1-30)';
COMMENT ON COLUMN events.is_leap_month IS '是否為閏月';
