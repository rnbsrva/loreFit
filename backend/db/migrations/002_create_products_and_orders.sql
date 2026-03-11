CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price_kzt INTEGER NOT NULL CHECK (price_kzt > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery')),
  delivery_address TEXT,
  total_amount_kzt INTEGER NOT NULL CHECK (total_amount_kzt > 0),
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  price_kzt INTEGER NOT NULL CHECK (price_kzt > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO products (name, description, price_kzt)
VALUES
  ('Фитнес-коврик ProGrip', 'Нескользящий коврик для домашних тренировок и йоги.', 12900),
  ('Набор эспандеров 5 в 1', 'Для силовых упражнений, разминки и восстановления.', 8500),
  ('Смарт-бутылка 750 мл', 'Удобная спортивная бутылка для воды с фиксатором крышки.', 6200),
  ('Перчатки для тренинга', 'Поддержка запястья и комфортный хват на тренировках.', 9700)
ON CONFLICT (name) DO NOTHING;