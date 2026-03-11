ALTER TABLE products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'equipment';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
ADD CONSTRAINT products_category_check
CHECK (category IN ('equipment', 'nutrition'));

ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_stock_quantity_check;

ALTER TABLE products
ADD CONSTRAINT products_stock_quantity_check
CHECK (stock_quantity >= 0);

UPDATE products
SET
  category = CASE
    WHEN name ILIKE '%бутылка%' THEN 'nutrition'
    ELSE 'equipment'
  END,
  stock_quantity = CASE
    WHEN name ILIKE '%коврик%' THEN 24
    WHEN name ILIKE '%эспандер%' THEN 18
    WHEN name ILIKE '%бутылка%' THEN 30
    WHEN name ILIKE '%перчатк%' THEN 12
    ELSE 10
  END,
  image_urls = CASE
    WHEN name ILIKE '%коврик%' THEN ARRAY['https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=80']::TEXT[]
    WHEN name ILIKE '%эспандер%' THEN ARRAY['https://images.unsplash.com/photo-1571019613540-996a241c2b00?auto=format&fit=crop&w=1200&q=80']::TEXT[]
    WHEN name ILIKE '%бутылка%' THEN ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80']::TEXT[]
    WHEN name ILIKE '%перчатк%' THEN ARRAY['https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80']::TEXT[]
    ELSE ARRAY['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80']::TEXT[]
  END
WHERE COALESCE(array_length(image_urls, 1), 0) = 0;

INSERT INTO products (name, category, description, price_kzt, stock_quantity, image_urls, is_active)
VALUES
  (
    'Протеин Whey Core 900 г',
    'nutrition',
    'Сывороточный протеин для восстановления и роста мышц после тренировок.',
    16500,
    20,
    ARRAY['https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1200&q=80']::TEXT[],
    TRUE
  ),
  (
    'BCAA Amino Complex',
    'nutrition',
    'Комплекс аминокислот для поддержки выносливости и восстановления.',
    12800,
    16,
    ARRAY['https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?auto=format&fit=crop&w=1200&q=80']::TEXT[],
    TRUE
  )
ON CONFLICT (name) DO NOTHING;