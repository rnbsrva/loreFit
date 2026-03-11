ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

DO $$
BEGIN
  IF COALESCE(current_setting('app.admin_email', true), '') <> '' THEN
    UPDATE users
    SET role = 'admin'
    WHERE email = current_setting('app.admin_email', true);
  END IF;
END;
$$;