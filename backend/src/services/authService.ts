import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/database';
import { config } from '@/config';
import { Usuario, LoginRequest, LoginResponse, JWTPayload } from '@/types';
import { logger, logAuth } from '@/utils/logger';
import { validarSenhaForte } from '@/utils/validation';

export class AuthService {
  /**
   * Realiza login do usuário
   */
  async login(loginData: LoginRequest, ip: string): Promise<LoginResponse> {
    try {
      const { email, senha } = loginData;

      // Buscar usuário no banco
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, email, senha_hash, nome, perfil, unidade, ativo')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !usuario) {
        logAuth.login('unknown', ip, false);
        throw new Error('Credenciais inválidas');
      }

      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        logAuth.login(usuario.id, ip, false);
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        logAuth.login(usuario.id, ip, false);
        throw new Error('Credenciais inválidas');
      }

      // Gerar token JWT
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil
      };

      const token = jwt.sign(tokenPayload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
      });

      // Log de sucesso
      logAuth.login(usuario.id, ip, true);

      // Atualizar último login (opcional)
      await supabase
        .from('usuarios')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', usuario.id);

      return {
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          perfil: usuario.perfil,
          unidade: usuario.unidade,
          ativo: usuario.ativo,
          created_at: new Date(), // Será preenchido corretamente em uma implementação real
          updated_at: new Date()
        }
      };
    } catch (error) {
      logger.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário (apenas admins)
   */
  async criarUsuario(dadosUsuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>, adminId: string): Promise<Usuario> {
    try {
      // Verificar se quem está criando é admin
      const { data: admin } = await supabase
        .from('usuarios')
        .select('perfil')
        .eq('id', adminId)
        .single();

      if (!admin || admin.perfil !== 'admin') {
        throw new Error('Apenas administradores podem criar usuários');
      }

      // Validar senha forte
      const validacaoSenha = validarSenhaForte(dadosUsuario.senha_hash);
      if (!validacaoSenha.valid) {
        throw new Error(validacaoSenha.message);
      }

      // Verificar se email já existe
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', dadosUsuario.email.toLowerCase())
        .single();

      if (usuarioExistente) {
        throw new Error('Email já está em uso');
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(dadosUsuario.senha_hash, config.bcryptRounds);

      // Criar usuário
      const { data: novoUsuario, error } = await supabase
        .from('usuarios')
        .insert([{
          email: dadosUsuario.email.toLowerCase(),
          senha_hash: senhaHash,
          nome: dadosUsuario.nome,
          perfil: dadosUsuario.perfil,
          unidade: dadosUsuario.unidade,
          ativo: dadosUsuario.ativo
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }

      logger.info('Usuário criado com sucesso', {
        novoUsuarioId: novoUsuario.id,
        adminId,
        perfil: novoUsuario.perfil
      });

      return novoUsuario;
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados do usuário
   */
  async atualizarUsuario(
    usuarioId: string,
    dadosAtualizacao: Partial<Pick<Usuario, 'nome' | 'email' | 'unidade'>>,
    solicitanteId: string
  ): Promise<Usuario> {
    try {
      // Verificar permissões
      const { data: solicitante } = await supabase
        .from('usuarios')
        .select('perfil')
        .eq('id', solicitanteId)
        .single();

      const podeAtualizar = solicitanteId === usuarioId || solicitante?.perfil === 'admin';
      
      if (!podeAtualizar) {
        throw new Error('Sem permissão para atualizar este usuário');
      }

      // Se está atualizando email, verificar se não existe
      if (dadosAtualizacao.email) {
        const { data: emailExistente } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', dadosAtualizacao.email.toLowerCase())
          .neq('id', usuarioId)
          .single();

        if (emailExistente) {
          throw new Error('Email já está em uso');
        }

        dadosAtualizacao.email = dadosAtualizacao.email.toLowerCase();
      }

      // Atualizar usuário
      const { data: usuarioAtualizado, error } = await supabase
        .from('usuarios')
        .update({
          ...dadosAtualizacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', usuarioId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`);
      }

      logger.info('Usuário atualizado', {
        usuarioId,
        solicitanteId,
        campos: Object.keys(dadosAtualizacao)
      });

      return usuarioAtualizado;
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Altera senha do usuário
   */
  async alterarSenha(
    usuarioId: string,
    senhaAtual: string,
    novaSenha: string
  ): Promise<void> {
    try {
      // Buscar usuário atual
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('senha_hash')
        .eq('id', usuarioId)
        .single();

      if (error || !usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const senhaAtualValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
      if (!senhaAtualValida) {
        throw new Error('Senha atual incorreta');
      }

      // Validar nova senha
      const validacaoSenha = validarSenhaForte(novaSenha);
      if (!validacaoSenha.valid) {
        throw new Error(validacaoSenha.message);
      }

      // Hash da nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, config.bcryptRounds);

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          senha_hash: novaSenhaHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', usuarioId);

      if (updateError) {
        throw new Error(`Erro ao alterar senha: ${updateError.message}`);
      }

      logger.info('Senha alterada com sucesso', { usuarioId });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  /**
   * Desativa um usuário
   */
  async desativarUsuario(usuarioId: string, adminId: string): Promise<void> {
    try {
      // Verificar se quem está desativando é admin
      const { data: admin } = await supabase
        .from('usuarios')
        .select('perfil')
        .eq('id', adminId)
        .single();

      if (!admin || admin.perfil !== 'admin') {
        throw new Error('Apenas administradores podem desativar usuários');
      }

      // Não permitir desativar a si mesmo
      if (usuarioId === adminId) {
        throw new Error('Não é possível desativar sua própria conta');
      }

      // Desativar usuário
      const { error } = await supabase
        .from('usuarios')
        .update({
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', usuarioId);

      if (error) {
        throw new Error(`Erro ao desativar usuário: ${error.message}`);
      }

      logger.info('Usuário desativado', { usuarioId, adminId });
    } catch (error) {
      logger.error('Erro ao desativar usuário:', error);
      throw error;
    }
  }

  /**
   * Verifica se um token JWT é válido
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      throw new Error('Erro na verificação do token');
    }
  }

  /**
   * Busca informações do usuário por ID
   */
  async buscarUsuarioPorId(usuarioId: string): Promise<Omit<Usuario, 'senha_hash'> | null> {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, email, nome, perfil, unidade, ativo, created_at, updated_at')
        .eq('id', usuarioId)
        .single();

      if (error || !usuario) {
        return null;
      }

      return usuario;
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  /**
   * Lista todos os usuários (apenas para admins)
   */
  async listarUsuarios(adminId: string, filtros?: {
    perfil?: 'morador' | 'admin';
    ativo?: boolean;
    unidade?: string;
  }): Promise<Omit<Usuario, 'senha_hash'>[]> {
    try {
      // Verificar se é admin
      const { data: admin } = await supabase
        .from('usuarios')
        .select('perfil')
        .eq('id', adminId)
        .single();

      if (!admin || admin.perfil !== 'admin') {
        throw new Error('Apenas administradores podem listar usuários');
      }

      let query = supabase
        .from('usuarios')
        .select('id, email, nome, perfil, unidade, ativo, created_at, updated_at');

      // Aplicar filtros
      if (filtros?.perfil) {
        query = query.eq('perfil', filtros.perfil);
      }
      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }
      if (filtros?.unidade) {
        query = query.eq('unidade', filtros.unidade);
      }

      const { data: usuarios, error } = await query.order('nome');

      if (error) {
        throw new Error(`Erro ao listar usuários: ${error.message}`);
      }

      return usuarios || [];
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      throw error;
    }
  }
}
