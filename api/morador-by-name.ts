import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { normalizeName } from '../src/utils/normalizeText';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rnpgtwughapxxvvckepd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.2t6m1iUk_TRXtbEACh-P6dKJWRqyeLBe1OrUZemFd90';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API para buscar morador por nome (com normalização)
 * Usado pelo script Python para encontrar moradores no HikCentral
 * 
 * GET /api/morador-by-name?nome=José da Silva
 * 
 * Retorna:
 * - 200: Morador encontrado
 * - 404: Morador não encontrado
 * - 400: Nome não fornecido
 * - 500: Erro interno
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método não permitido',
      message: 'Esta API aceita apenas requisições GET'
    });
  }

  try {
    const { nome } = req.query;

    // Validar parâmetros
    if (!nome || typeof nome !== 'string') {
      return res.status(400).json({
        error: 'Parâmetro inválido',
        message: 'Nome do morador é obrigatório'
      });
    }

    console.log(`🔍 Buscando morador: "${nome}"`);

    // Normalizar nome para busca
    const nomeNormalizado = normalizeName(nome);
    console.log(`🔍 Nome normalizado: "${nomeNormalizado}"`);

    // Buscar morador no banco
    const { data: morador, error } = await supabase
      .from('usuarios')
      .select('id, nome, nome_normalized, email, cpf, telefone, unidade, ativo')
      .eq('perfil', 'morador')
      .eq('ativo', true)
      .eq('nome_normalized', nomeNormalizado)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Tentar busca por nome original como fallback
        console.log('⚠️ Não encontrado por nome normalizado, tentando busca por nome original...');
        
        const { data: moradorFallback, error: errorFallback } = await supabase
          .from('usuarios')
          .select('id, nome, nome_normalized, email, cpf, telefone, unidade, ativo')
          .eq('perfil', 'morador')
          .eq('ativo', true)
          .ilike('nome', `%${nome}%`)
          .single();

        if (errorFallback || !moradorFallback) {
          console.log(`❌ Morador não encontrado: "${nome}"`);
          return res.status(404).json({
            error: 'Morador não encontrado',
            message: `Nenhum morador ativo encontrado com o nome "${nome}"`,
            nome_buscado: nome,
            nome_normalizado: nomeNormalizado
          });
        }

        // Retornar morador encontrado no fallback
        console.log(`✅ Morador encontrado (fallback): ${moradorFallback.nome}`);
        return res.status(200).json({
          success: true,
          morador: {
            id: moradorFallback.id,
            nome: moradorFallback.nome,
            nome_normalized: moradorFallback.nome_normalized || nomeNormalizado,
            email: moradorFallback.email,
            cpf: moradorFallback.cpf,
            telefone: moradorFallback.telefone,
            unidade: moradorFallback.unidade
          },
          busca: {
            nome_original: nome,
            nome_normalizado: nomeNormalizado,
            metodo: 'fallback_nome_original'
          }
        });
      }

      console.error('❌ Erro na busca:', error);
      throw error;
    }

    // Morador encontrado
    console.log(`✅ Morador encontrado: ${morador.nome}`);
    
    return res.status(200).json({
      success: true,
      morador: {
        id: morador.id,
        nome: morador.nome,
        nome_normalized: morador.nome_normalized || nomeNormalizado,
        email: morador.email,
        cpf: morador.cpf,
        telefone: morador.telefone,
        unidade: morador.unidade
      },
      busca: {
        nome_original: nome,
        nome_normalizado: nomeNormalizado,
        metodo: 'nome_normalizado'
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na API:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao buscar morador no banco de dados'
    });
  }
}
