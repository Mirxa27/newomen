import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and/or Anon Key are missing. Make sure to create a .env file.");
  // We are not throwing an error here to prevent the app from crashing in the preview
  // before you have a chance to create the .env file.
}

// The '!' asserts that the values are non-null. This is safe because of the check above,
// and the app will fail gracefully if they are missing.
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});