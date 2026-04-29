-- ============================================================
-- Math Workout — COMPLETE DATABASE SETUP
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- Step 1: Clean slate — drop old tables and triggers
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.access_windows CASCADE;
DROP TABLE IF EXISTS public.timer_presets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- Step 2: Create simplified users table (name + email only)
-- Password is managed by Supabase Auth — NOT stored here
-- ============================================================
CREATE TABLE public.users (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name  text NOT NULL DEFAULT '',
  email      text,
  is_admin   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_admin_update_any"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- ============================================================
-- Step 3: Auto-create user row when someone signs up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Step 4: Workout sessions table
-- ============================================================
CREATE TABLE public.workout_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score               integer NOT NULL DEFAULT 0,
  total_questions     integer NOT NULL DEFAULT 20,
  time_taken_seconds  integer NOT NULL DEFAULT 0,
  completed_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_insert_own"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_select_authenticated"
  ON public.workout_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Step 5: Access windows table (admin-controlled schedule)
-- ============================================================
CREATE TABLE public.access_windows (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  start_time time NOT NULL,
  end_time   time NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "windows_select_authenticated"
  ON public.access_windows FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "windows_admin_all"
  ON public.access_windows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- ============================================================
-- Step 6: Timer presets table (admin-controlled duration)
-- ============================================================
CREATE TABLE public.timer_presets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label            text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 300,
  is_active        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timer_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presets_select_authenticated"
  ON public.timer_presets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "presets_admin_all"
  ON public.timer_presets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- Default 5-minute preset
INSERT INTO public.timer_presets (label, duration_seconds, is_active)
VALUES ('Default (5 min)', 300, true);

-- ============================================================
-- Step 7: Create Kiel's account
-- Email: kielesta.gc@gmail.com | Password: kielesta123
-- ============================================================
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'kielesta.gc@gmail.com';

  -- Only insert if not already created
  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'kielesta.gc@gmail.com',
      crypt('kielesta123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Kiel"}',
      NOW(),
      NOW(),
      '', '', '', ''
    )
    RETURNING id INTO new_user_id;
  END IF;

  -- Set as admin
  UPDATE public.users
  SET is_admin = true, full_name = 'Kiel'
  WHERE id = new_user_id;

END $$;

-- ============================================================
-- Verify everything was created correctly
-- ============================================================
SELECT
  u.full_name,
  u.email,
  u.is_admin,
  u.created_at
FROM public.users u
WHERE u.email = 'kielesta.gc@gmail.com';
