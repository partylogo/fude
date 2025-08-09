-- 創建 Groups 相關表結構
-- 解決群組事件管理載入問題

-- 1. 創建 groups 表
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  video_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 創建 group_items 表（群組與事件的關聯表）
CREATE TABLE IF NOT EXISTS group_items (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 確保同一個事件不會重複添加到同一個群組
  UNIQUE(group_id, event_id)
);

-- 3. 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_groups_enabled ON groups(enabled);
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_group_items_event_id ON group_items(event_id);

-- 4. 創建觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at 
BEFORE UPDATE ON groups 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 插入範例群組資料
INSERT INTO groups (id, name, description, enabled, video_url) VALUES
(1, '簡少年老師 2025 拜拜推薦', '簡少年老師精選2025年最重要的拜拜時機，涵蓋開運、求財、祈福等各種需求', true, 'https://www.youtube.com/watch?v=example123'),
(2, '基礎民俗節慶', '台灣傳統民俗節慶基本清單，適合初學者', true, null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- 6. 插入群組與事件的關聯（根據現有的事件）
-- 首先檢查哪些事件存在
DO $$
DECLARE
    event_count INTEGER;
BEGIN
    -- 檢查是否有事件存在
    SELECT COUNT(*) INTO event_count FROM events;
    
    IF event_count > 0 THEN
        -- 為群組 1 添加事件（如果事件存在的話）
        INSERT INTO group_items (group_id, event_id) 
        SELECT 1, id FROM events 
        WHERE title IN ('媽祖聖誕', '清明節') 
        ON CONFLICT (group_id, event_id) DO NOTHING;
        
        -- 為群組 2 添加事件
        INSERT INTO group_items (group_id, event_id)
        SELECT 2, id FROM events 
        WHERE title IN ('清明節')
        ON CONFLICT (group_id, event_id) DO NOTHING;
        
        RAISE NOTICE 'Added group items based on existing events';
    ELSE
        RAISE NOTICE 'No events found, skipped adding group items';
    END IF;
END $$;

-- 7. 驗證創建結果
SELECT 
  'Groups created' as info,
  COUNT(*) as count 
FROM groups
UNION ALL
SELECT 
  'Group items created' as info,
  COUNT(*) as count 
FROM group_items;

-- 8. 顯示群組和相關事件
SELECT 
  g.id,
  g.name,
  COUNT(gi.event_id) as event_count,
  STRING_AGG(e.title, ', ') as events
FROM groups g
LEFT JOIN group_items gi ON g.id = gi.group_id
LEFT JOIN events e ON gi.event_id = e.id
GROUP BY g.id, g.name
ORDER BY g.id;

SELECT 'Groups tables setup completed!' AS status;