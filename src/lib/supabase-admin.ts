import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/secureLogger';

// Cliente Supabase com Service Role Key para operações administrativas
// Bypassa Row Level Security (RLS)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rnpgtwughapxxvvckepd.supabase.co";

// Tentar múltiplas variáveis para service key
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 
                          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.2t6m1iUk_TRXtbEACh-P6dKJWRqyeLBe1OrUZemFd90";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzM1MzksImV4cCI6MjA3MDYwOTUzOX0.rlPAA5La3_xBKchaSXs8JZZ1IhjCkfBmzTwylLe25eE";

console.log('🔧 Criando supabaseAdmin:');
console.log('- URL:', supabaseUrl);
console.log('- Service key disponível:', !!supabaseServiceKey);
console.log('- Service key começa com:', supabaseServiceKey?.substring(0, 20) + '...');

// SEMPRE usar a service key (com fallback hardcoded)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Log adicional
console.log('✅ supabaseAdmin criado com service key');