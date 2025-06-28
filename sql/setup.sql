-- 영수증 테이블 생성
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  store_name TEXT,
  total_amount DECIMAL(10,2),
  receipt_date DATE,
  category TEXT DEFAULT 'misc' CHECK (category IN ('food', 'shopping', 'transport', 'healthcare', 'entertainment', 'misc')),
  description TEXT,
  raw_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'tag',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (name, color, icon) VALUES
  ('food', '#F59E0B', 'utensils'),
  ('shopping', '#3B82F6', 'shopping-cart'),
  ('transport', '#10B981', 'car'),
  ('healthcare', '#EF4444', 'heart'),
  ('entertainment', '#8B5CF6', 'film'),
  ('misc', '#6B7280', 'tag')
ON CONFLICT (name) DO NOTHING;

-- RLS (Row Level Security) 정책 설정
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- receipts 테이블 정책
CREATE POLICY IF NOT EXISTS "Users can view own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own receipts"
  ON receipts FOR DELETE
  USING (auth.uid() = user_id);

-- categories 테이블 정책 (모든 사용자가 읽기 가능)
CREATE POLICY IF NOT EXISTS "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_receipts_user_date ON receipts(user_id, receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_store_name ON receipts(store_name);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_amount ON receipts(total_amount);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 