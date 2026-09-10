-- ==============================================================================
-- SANJIVNI Supabase Database Schema & Storage Configuration
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('patient', 'caregiver')),
    username TEXT,
    date_of_birth DATE,
    phone_number TEXT,
    connection_code VARCHAR(6) UNIQUE,
    is_paired BOOLEAN DEFAULT FALSE,
    caregiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    linked_patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    relationship_to_patient TEXT,
    avatar_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure phone_number column exists if profiles already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_connection_code ON public.profiles(connection_code);
CREATE INDEX IF NOT EXISTS idx_profiles_caregiver_id ON public.profiles(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_patient_id ON public.profiles(linked_patient_id);

-- 3. Family Members Table (Reminiscence Vault)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    local_relation TEXT,
    avatar_url TEXT,
    avatar_color TEXT DEFAULT '#10B981',
    voice_message TEXT,
    fun_fact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_patient_id ON public.family_members(patient_id);

-- 4. Daily Routine Tasks Table
CREATE TABLE IF NOT EXISTS public.routine_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    time_str TEXT NOT NULL,
    time_of_day TEXT DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
    category TEXT DEFAULT 'medication' CHECK (category IN ('medication', 'hydration', 'exercise', 'food', 'game')),
    type TEXT DEFAULT 'medicine',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_tasks_patient_id ON public.routine_tasks(patient_id);

-- 5. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read for connection code" ON public.profiles;
CREATE POLICY "Public profiles read for connection code"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Caregiver can update linked patient" ON public.profiles;
CREATE POLICY "Caregiver can update linked patient"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = caregiver_id 
        OR auth.uid() = id 
        OR (role = 'patient' AND caregiver_id IS NULL)
    )
    WITH CHECK (
        auth.uid() = caregiver_id 
        OR auth.uid() = id 
        OR (role = 'patient' AND caregiver_id IS NULL)
    );

-- Family Members Policies
DROP POLICY IF EXISTS "Family members viewable by patient and caregiver" ON public.family_members;
CREATE POLICY "Family members viewable by patient and caregiver"
    ON public.family_members FOR SELECT
    USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND linked_patient_id = public.family_members.patient_id
        )
    );

DROP POLICY IF EXISTS "Caregivers and patients can manage family members" ON public.family_members;
CREATE POLICY "Caregivers and patients can manage family members"
    ON public.family_members FOR ALL
    USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND linked_patient_id = public.family_members.patient_id
        )
    );

-- Routine Tasks Policies
DROP POLICY IF EXISTS "Routine tasks viewable by patient and caregiver" ON public.routine_tasks;
CREATE POLICY "Routine tasks viewable by patient and caregiver"
    ON public.routine_tasks FOR SELECT
    USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND linked_patient_id = public.routine_tasks.patient_id
        )
    );

DROP POLICY IF EXISTS "Routine tasks manageable by patient and caregiver" ON public.routine_tasks;
CREATE POLICY "Routine tasks manageable by patient and caregiver"
    ON public.routine_tasks FOR ALL
    USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND linked_patient_id = public.routine_tasks.patient_id
        )
    );

-- 6. Storage Bucket Configuration for 'media'
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies for 'media'
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated Users Upload Media" ON storage.objects;
CREATE POLICY "Authenticated Users Upload Media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Users Update Media" ON storage.objects;
CREATE POLICY "Authenticated Users Update Media"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- ==============================================================================
-- 7. Secure RPC Function for True Account Deletion (Auth Users Cascade)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Retrieve ID of currently authenticated caller
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (cascades to public.profiles, family_members, routine_tasks)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ==============================================================================
-- 8. Atomic Stored Function to Link Caregiver and Patient by Connection Code
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.link_patient_with_code(
  p_connection_code TEXT,
  p_caregiver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_patient RECORD;
  v_clean_code TEXT;
BEGIN
  v_clean_code := TRIM(p_connection_code);

  -- 1. Find patient with matching 6-digit connection code
  SELECT * INTO v_patient
  FROM public.profiles
  WHERE role = 'patient'
    AND connection_code = v_clean_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid 6-digit connection code. Please verify the code displayed on the patient screen.'
    );
  END IF;

  -- 2. Link patient to caregiver
  UPDATE public.profiles
  SET 
    caregiver_id = p_caregiver_id,
    is_paired = true,
    updated_at = NOW()
  WHERE id = v_patient.id;

  -- 3. Upsert caregiver profile
  INSERT INTO public.profiles (id, role, linked_patient_id, is_paired, updated_at)
  VALUES (p_caregiver_id, 'caregiver', v_patient.id, true, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    linked_patient_id = v_patient.id,
    is_paired = true,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', v_patient.id,
    'patient_name', COALESCE(v_patient.username, 'Patient')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_patient_with_code(TEXT, UUID) TO authenticated, anon;

