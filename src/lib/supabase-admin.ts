import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com Service Role Key para operações administrativas
// Bypassa Row Level Security (RLS)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não configurado. Usando anon key.');
}

// Usar service key se disponível, senão usar anon key como fallback
const keyToUse = supabaseServiceKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseAdmin = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});