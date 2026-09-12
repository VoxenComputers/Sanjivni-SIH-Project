-- ==============================================================================
-- Migration: Fix Foreign Key Constraints for Flexible Patient IDs in SANJIVNI
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Drop strict auth.users foreign key constraint on family_members
-- This allows patient_id to reference both registered Supabase user IDs and
-- custom/demo patient UUIDs created by caregivers.
ALTER TABLE public.family_members 
    DROP CONSTRAINT IF EXISTS family_members_patient_id_fkey;

-- 2. Drop strict auth.users foreign key constraint on patient_tasks
ALTER TABLE public.patient_tasks 
    DROP CONSTRAINT IF EXISTS patient_tasks_patient_id_fkey;

-- 3. Drop strict auth.users foreign key constraint on routine_tasks (if exists)
ALTER TABLE public.routine_tasks 
    DROP CONSTRAINT IF EXISTS routine_tasks_patient_id_fkey;

-- 4. Re-verify indices for high performance lookups
CREATE INDEX IF NOT EXISTS idx_family_members_patient_id ON public.family_members(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tasks_patient_id ON public.patient_tasks(patient_id);
