-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO FIX RLS

-- 1. Fix Profiles RLS so users can read and write their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create a trigger to automatically create a profile for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    new.id, 
    CASE WHEN new.email = 'superadmin@gmail.com' THEN 'super_admin' ELSE 'school_admin' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Just in case you've already registered:
INSERT INTO public.profiles (id, role)
SELECT id, CASE WHEN email = 'superadmin@gmail.com' THEN 'super_admin' ELSE 'school_admin' END 
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
