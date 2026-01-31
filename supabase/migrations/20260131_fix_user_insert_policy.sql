-- Fix user registration: Create user record automatically on signup

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;

-- Allow inserts when user matches auth.uid() or during initial signup
CREATE POLICY "Enable insert for authentication"
  ON users FOR INSERT
  WITH CHECK (true);

-- Update policy to be more permissive during signup
DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

-- Create trigger function to auto-create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, campus, phone, is_admin, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'campus', ''),
    NEW.raw_user_meta_data->>'phone',
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

