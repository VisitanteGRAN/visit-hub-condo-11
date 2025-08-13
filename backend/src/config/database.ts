import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://rnpgtwughapxxvvckepd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatória');
}

// Cliente Supabase com privilégios de service role para o backend
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente público para operações que não requerem privilégios elevados
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzM1MzksImV4cCI6MjA3MDYwOTUzOX0.rlPAA5La3_xBKchaSXs8JZZ1IhjCkfBmzTwylLe25eE';

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Configurações do banco de dados
export const dbConfig = {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey,
  anonKey: supabaseAnonKey,
  schema: 'public'
};
