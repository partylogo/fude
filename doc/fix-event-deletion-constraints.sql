-- 修復事件刪除外鍵約束問題
-- 執行此腳本來解決事件刪除時的外鍵約束違反問題

-- 1. 檢查當前的外鍵約束狀況
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name='event_occurrences' OR ccu.table_name='events');

-- 2. 檢查是否存在問題的外鍵約束
DO $$
DECLARE
    constraint_exists BOOLEAN := FALSE;
BEGIN
    -- 檢查是否存在 fk_event_rule_version 約束
    SELECT EXISTS(
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_event_rule_version' 
          AND table_name = 'event_occurrences'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Found problematic foreign key constraint: fk_event_rule_version';
        
        -- 3. 刪除問題約束並重新創建為 CASCADE
        ALTER TABLE event_occurrences 
        DROP CONSTRAINT IF EXISTS fk_event_rule_version;
        
        RAISE NOTICE 'Dropped constraint fk_event_rule_version';
        
        -- 4. 重新創建帶 CASCADE 的外鍵約束
        ALTER TABLE event_occurrences
        ADD CONSTRAINT fk_event_rule_version 
        FOREIGN KEY (event_id, rule_version) 
        REFERENCES events(id, rule_version) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Recreated constraint with CASCADE delete';
    ELSE
        RAISE NOTICE 'No problematic constraint found, checking other constraints...';
    END IF;
END $$;

-- 5. 確保所有相關的外鍵都支持 CASCADE
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- 查找所有指向 events 表的外鍵約束
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'events'
          AND tc.table_name = 'event_occurrences'
    LOOP
        RAISE NOTICE 'Processing constraint: % on table: %', constraint_record.constraint_name, constraint_record.table_name;
        
        -- 檢查是否是 event_id 的簡單外鍵
        IF EXISTS(
            SELECT 1 FROM information_schema.key_column_usage 
            WHERE constraint_name = constraint_record.constraint_name 
              AND column_name = 'event_id'
              AND table_name = 'event_occurrences'
        ) AND constraint_record.constraint_name != 'fk_event_rule_version' THEN
            
            -- 刪除並重新創建簡單的 event_id 外鍵約束
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                         constraint_record.table_name, constraint_record.constraint_name);
            
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE', 
                         constraint_record.table_name, constraint_record.constraint_name);
            
            RAISE NOTICE 'Updated constraint: %', constraint_record.constraint_name;
        END IF;
    END LOOP;
END $$;

-- 6. 清理孤兒記錄（沒有對應事件的 occurrences）
DELETE FROM event_occurrences 
WHERE event_id NOT IN (SELECT id FROM events);

-- 7. 獲取清理結果
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    GET DIAGNOSTICS orphan_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % orphaned occurrence records', orphan_count;
END $$;

-- 8. 驗證修復結果
SELECT 
  'Events count' as info,
  COUNT(*) as count 
FROM events
UNION ALL
SELECT 
  'Occurrences count' as info,
  COUNT(*) as count 
FROM event_occurrences;

-- 9. 顯示最終的外鍵約束狀態
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'event_occurrences'
  AND ccu.table_name = 'events';

SELECT 'Event deletion constraint fix completed!' AS status;