UPDATE orders
SET status = 'new'
WHERE status NOT IN ('new', 'processing', 'paid', 'shipped_or_ready', 'completed', 'cancelled');

ALTER TABLE orders
ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('new', 'processing', 'paid', 'shipped_or_ready', 'completed', 'cancelled'));

CREATE TABLE IF NOT EXISTS program_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_title TEXT NOT NULL,
  amount_kzt INTEGER NOT NULL CHECK (amount_kzt > 0),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'cancelled')),
  program_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);