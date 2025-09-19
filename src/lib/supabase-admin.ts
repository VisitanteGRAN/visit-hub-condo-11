import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/secureLogger';

// Cliente Supabase com Service Role Key para operações administrativas
// Bypassa Row Level Security (RLS)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rnpgtwughapxxvvckepd.supabase.co";
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzM1MzksImV4cCI6MjA3MDYwOTUzOX0.rlPAA5La3_xBKchaSXs8JZZ1IhjCkfBmzTwylLe25eE";

if (!supabaseServiceKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não configurado. Usando anon key como fallback.');
  logger.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não configurado. Usando anon key como fallback.');
}

// Usar service key se disponível, senão usar anon key como fallback
const keyToUse = supabaseServiceKey || supabaseAnonKey;

// Debug sem expor chaves sensíveis
console.log('🔧 Criando supabaseAdmin - Service key:', !!supabaseServiceKey);

// CRIAR CLIENTE SEM HEADERS PERSONALIZADOS - DEIXAR O SUPABASE GERENCIAR
export const supabaseAdmin = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Log adicional
console.log('🔧 supabaseAdmin criado. URL:', supabaseUrl);
console.log('🔧 Service key disponível:', !!supabaseServiceKey);