// Tipos simples para evitar loop infinito do Vite
// TODO: Gerar tipos corretos com: npx supabase gen types typescript --project-id rnpgtwughapxxvvckepd

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          perfil: 'admin' | 'morador'
          unidade?: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          perfil?: 'admin' | 'morador'
          unidade?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          perfil?: 'admin' | 'morador'
          unidade?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      visitantes: {
        Row: {
          id: string
          nome: string
          cpf: string
          unidade: string
          morador_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          unidade: string
          morador_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          unidade?: string
          morador_id?: string
          status?: string
          created_at?: string
        }
      }
      links_convite: {
        Row: {
          id: string
          token: string
          morador_id: string
          nome_visitante: string
          expirado: boolean
          usado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          morador_id: string
          nome_visitante: string
          expirado?: boolean
          usado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          morador_id?: string
          nome_visitante?: string
          expirado?: boolean
          usado?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
