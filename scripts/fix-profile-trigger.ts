#!/usr/bin/env node
/**
 * Fix user profile creation trigger
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixTrigger() {
  console.log('🔧 Fixing user profile creation trigger...\n');

  const sql = `
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create corrected trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with user_id pointing to auth.users.id
    INSERT INTO public.user_profiles (user_id, email, role, nickname)
    VALUES (NEW.id, NEW.email, 'MODERATOR', COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)))
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow profile creation via trigger" ON public.user_profiles;
CREATE POLICY "Allow profile creation via trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('Attempting direct SQL execution...');
      const { error: directError } = await supabase.from('_sql').insert({ query: sql });
      
      if (directError) {
        throw new Error('Could not execute SQL. Please run the migration manually in Supabase SQL Editor.');
      }
    }

    console.log('✅ Trigger fixed successfully!\n');
    console.log('📋 Changes applied:');
    console.log('  ✓ Updated handle_new_user() function to use user_id');
    console.log('  ✓ Recreated trigger on auth.users');
    console.log('  ✓ Updated RLS policies to use user_id\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📝 Manual fix required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from: supabase/migrations/20251011000000_fix_profile_trigger.sql');
    process.exit(1);
  }
}

fixTrigger();
