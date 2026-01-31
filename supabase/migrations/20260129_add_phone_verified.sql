-- Add phone_verified column to users table
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

-- Create function to sync phone_verified with auth.users.phone_confirmed_at
CREATE OR REPLACE FUNCTION sync_phone_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET phone_verified = (NEW.phone_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync on auth.users changes
CREATE TRIGGER sync_phone_verified_trigger
  AFTER INSERT OR UPDATE OF phone_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_phone_verified();

-- Populate existing users
UPDATE users
SET phone_verified = (auth.users.phone_confirmed_at IS NOT NULL)
FROM auth.users
WHERE users.id = auth.users.id;
