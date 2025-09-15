import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/secureLogger';

// Cliente Supabase com Service Role Key para operações administrativas
// Bypassa Row Level Security (RLS)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rnpgtwughapxxvvckepd.supabase.co";
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzM1MzksImV4cCI6MjA3MDYwOTUzOX0.rlPAA5La3_xBKchaSXs8JZZ1IhjCkfBmzTwylLe25eE";

if (!supabaseServiceKey) {
  logger.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não configurado. Usando anon key como fallback.');
}

// Usar service key se disponível, senão usar anon key como fallback
const keyToUse = supabaseServiceKey || supabaseAnonKey;

export const supabaseAdmin = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});