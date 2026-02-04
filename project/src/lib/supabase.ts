import { createClient } from '@supabase/supabase-js';

// Prefer Vite env vars when available, but fall back to baked-in defaults
// so the project can run without a local `.env` file.
const DEFAULT_SUPABASE_URL = 'https://pndjuikpdclmphmltiiv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZGp1aWtwZGNsbXBobWx0aWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjAxNjksImV4cCI6MjA4MzczNjE2OX0.bDif03Dlg4Dz4P0rqvdZV9-VHZ95GTNH9TBzfKAbMps';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
