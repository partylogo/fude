-- 手動執行的 SQL Migration
-- 請在 Supabase Dashboard 的 SQL Editor 中執行此 SQL

-- ================================
-- 農曆轉換系統資料庫結構
-- ================================

-- 1. 農曆轉換快取表
CREATE TABLE IF NOT EXISTS lunar_conversion_cache (
  id SERIAL PRIMARY KEY,
  lunar_year INTEGER NOT NULL,
  lunar_month INTEGER NOT NULL CHECK (lunar_month >= 1 AND lunar_month <= 12),
  lunar_day INTEGER NOT NULL CHECK (lunar_day >= 1 AND lunar_day <= 30),
  is_leap BOOLEAN NOT NULL DEFAULT false,
  solar_dates JSONB NOT NULL, -- 對應的國曆日期陣列 ["2025-09-06", ...]
  source VARCHAR(50) NOT NULL, -- 'cwb_api', 'algorithm', 'third_party', 'predefined'
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 確保同一個農曆日期只有一個記錄
  UNIQUE(lunar_year, lunar_month, lunar_day, is_leap)
);

-- 2. 索引優化
CREATE INDEX IF NOT EXISTS idx_lunar_conversion_cache_lookup 
ON lunar_conversion_cache (lunar_year, lunar_month, lunar_day, is_leap);

CREATE INDEX IF NOT EXISTS idx_lunar_conversion_cache_cached_at 
ON lunar_conversion_cache (cached_at);

CREATE INDEX IF NOT EXISTS idx_lunar_conversion_cache_source 
ON lunar_conversion_cache (source);

-- 3. 農曆轉換錯誤日誌表
CREATE TABLE IF NOT EXISTS lunar_conversion_errors (
  id SERIAL PRIMARY KEY,
  lunar_year INTEGER NOT NULL,
  lunar_month INTEGER NOT NULL,
  lunar_day INTEGER NOT NULL,
  is_leap BOOLEAN NOT NULL DEFAULT false,
  error_source VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lunar_conversion_errors_date 
ON lunar_conversion_errors (lunar_year, lunar_month, lunar_day, is_leap);

CREATE INDEX IF NOT EXISTS idx_lunar_conversion_errors_occurred_at 
ON lunar_conversion_errors (occurred_at);

-- 4. 農曆節日主檔表
CREATE TABLE IF NOT EXISTS lunar_festivals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lunar_month INTEGER NOT NULL CHECK (lunar_month >= 1 AND lunar_month <= 12),
  lunar_day INTEGER NOT NULL CHECK (lunar_day >= 1 AND lunar_day <= 30),
  is_leap BOOLEAN NOT NULL DEFAULT false,
  leap_behavior VARCHAR(20) NOT NULL DEFAULT 'regular', -- 'regular', 'only_leap', 'both', 'never_leap'
  description TEXT,
  category VARCHAR(50), -- '神明生日', '民俗節慶', '二十四節氣'
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(name, lunar_month, lunar_day, is_leap)
);

-- 5. 插入常用農曆節日資料
INSERT INTO lunar_festivals (name, lunar_month, lunar_day, category, description, priority) VALUES
('春節', 1, 1, '民俗節慶', '農曆新年，最重要的傳統節日', 100),
('元宵節', 1, 15, '民俗節慶', '上元節，觀燈祈福的節日', 90),
('媽祖聖誕', 3, 23, '神明生日', '海上女神媽祖的誕辰', 80),
('端午節', 5, 5, '民俗節慶', '龍舟競渡，驅邪避疫', 85),
('中元節', 7, 15, '民俗節慶', '鬼門開，祭拜祖先', 70),
('中秋節', 8, 15, '民俗節慶', '月圓人團圓，家庭團聚的節日', 85),
('重陽節', 9, 9, '民俗節慶', '登高望遠，敬老孝親', 65),
('觀音菩薩聖誕', 2, 19, '神明生日', '觀世音菩薩誕辰，祈求慈悲護佑', 75),
('關聖帝君聖誕', 6, 24, '神明生日', '關公生日，祈求事業順利', 70),
('玉皇大帝聖誕', 1, 9, '神明生日', '天公生日，最重要的神明節日', 95),
('神明生日測試', 8, 12, '神明生日', '測試用的農曆八月十二神明生日', 50)
ON CONFLICT (name, lunar_month, lunar_day, is_leap) DO NOTHING;

-- 6. 建立觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lunar_festivals_updated_at 
BEFORE UPDATE ON lunar_festivals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 預載一些快取資料（可選）
INSERT INTO lunar_conversion_cache (lunar_year, lunar_month, lunar_day, is_leap, solar_dates, source) VALUES
(2025, 1, 1, false, '["2025-01-29"]', 'predefined'),
(2025, 1, 15, false, '["2025-02-12"]', 'predefined'),
(2025, 3, 23, false, '["2025-04-20"]', 'predefined'),
(2025, 3, 15, false, '["2025-04-12"]', 'predefined'),
(2025, 8, 12, false, '["2025-09-06"]', 'predefined'),
(2025, 5, 5, false, '["2025-06-02"]', 'predefined'),
(2025, 7, 15, false, '["2025-08-12"]', 'predefined'),
(2025, 8, 15, false, '["2025-10-06"]', 'predefined'),
(2025, 9, 9, false, '["2025-10-31"]', 'predefined')
ON CONFLICT (lunar_year, lunar_month, lunar_day, is_leap) DO NOTHING;

-- 執行完成提示
SELECT 'Migration completed successfully! ' || 
       'Created tables: lunar_conversion_cache, lunar_conversion_errors, lunar_festivals' as status;