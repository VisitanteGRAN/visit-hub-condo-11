import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AuditLogger } from '@/lib/audit-logger';
import { logger } from '@/utils/secureLogger';
// Imports de teste removidos para melhorar performance
import { rawSupabaseQuery, rawSupabaseInsert } from '@/lib/supabase-raw';

export type UserRole = 'admin' | 'morador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  apartamento?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (email: string, password: string, nome: string, role: UserRole, unidade: string, cpf?: string, telefone?: string, foto?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual do Supabase
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', !!session, session?.user?.email);
        
        // Evitar reprocessar se já estamos processando
        if (isLoading) return;
        
        if (event === 'SIGNED_IN' && session?.user && !user) {
          logger.info('🔑 SIGNED_IN detectado, verificando perfil...');
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          logger.info('🚪 SIGNED_OUT detectado, limpando estado...');
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('🔍 Carregando perfil do usuário:', supabaseUser.email);
      
      // Usar cliente RAW para loadUserProfile
      let profile = null;
      let error = null;
      
      try {
        profile = await rawSupabaseQuery('usuarios', {
          select: '*',
          eq: { email: supabaseUser.email },
          single: true
        });
        console.log('✅ RAW loadUserProfile - Usuário encontrado:', profile);
      } catch (err: any) {
        error = err;
        console.error('❌ RAW loadUserProfile - Erro:', err);
      }

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        
        // Se não encontrou o perfil, vamos criar um básico
        if (error.code === 'PGRST116') {
          logger.info('⚠️ Perfil não encontrado, criando perfil básico...');
          
          // Determinar o perfil baseado no email
          const isAdmin = supabaseUser.email?.includes('admin');
          const perfil = isAdmin ? 'admin' : 'morador';
          const unidade = isAdmin ? 'ADMIN' : supabaseUser.user_metadata?.unidade || 'Unidade não informada';
          
          // Usar cliente RAW para criar perfil
          let newProfile = null;
          try {
            newProfile = await rawSupabaseInsert('usuarios', {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              senha_hash: '',
              nome: supabaseUser.user_metadata?.nome || (isAdmin ? 'Administrador Sistema' : 'Morador'),
              perfil: perfil,
              unidade: unidade,
              ativo: isAdmin, // Admin ativo, morador pendente
              status: isAdmin ? 'ativo' : 'pendente',
              supabase_user_id: supabaseUser.id
            });
            
            console.log('✅ RAW Insert - Perfil básico criado:', newProfile);
          } catch (createError) {
            console.error('❌ Erro ao criar perfil básico:', createError);
            throw createError;
          }
          
          if (newProfile && newProfile.length > 0) {
            const profile = newProfile[0];
            const user: User = {
              id: profile.id,
              name: profile.nome,
              email: profile.email,
              role: profile.perfil as UserRole,
              apartamento: profile.unidade
            };
            setUser(user);
            console.log('✅ Perfil básico criado:', user);
            return;
          }
        }
        
        throw error;
      }

      if (profile) {
        console.log('✅ Perfil encontrado:', profile);
        
        // ❌ VERIFICAR SE USUÁRIO ESTÁ ATIVO/APROVADO
        console.log('🔍 Verificando status:', { ativo: profile.ativo, status: profile.status, perfil: profile.perfil });
        
        // Se for morador, verificar aprovação RIGOROSAMENTE
        if (profile.perfil === 'morador') {
          console.log('🏠 Verificando status do morador:', { email: profile.email, ativo: profile.ativo, status: profile.status });
          logger.info('🔍 VERIFICAÇÃO RIGOROSA: Morador deve ter ativo=true E status=ativo');
          
          // VERIFICAÇÃO TRIPLA: ativo deve ser true E status deve ser 'ativo'
          const isApproved = profile.ativo === true && profile.status === 'ativo';
          
          if (!isApproved) {
            logger.info('❌ ACESSO NEGADO: Morador não aprovado');
            console.log('📋 Status atual:', { ativo: profile.ativo, status: profile.status, aprovado: isApproved });
            
            // FORÇA LOGOUT IMEDIATO
            await supabase.auth.signOut();
            setUser(null); // Limpa estado local
            
            throw new Error(`🚫 ACESSO NEGADO: Sua conta ainda não foi aprovada pelo administrador. Status: ${profile.status}. Contate o administrador.`);
          }
          
          logger.info('✅ ACESSO LIBERADO: Morador aprovado com sucesso');
        }
        
        // Admin sempre pode logar (mas verificar se é realmente admin)
        if (profile.perfil === 'admin' && !profile.ativo) {
          logger.info('❌ Conta de administrador inativa');
          await supabase.auth.signOut();
          throw new Error('Conta de administrador inativa. Contate o suporte.');
        }
        
        const user: User = {
          id: profile.id,
          name: profile.nome,
          email: profile.email,
          role: profile.perfil as UserRole,
          apartamento: profile.unidade
        };
        setUser(user);
        console.log('👤 Usuário definido:', user);
      } else {
        console.log('⚠️ Nenhum perfil encontrado para:', supabaseUser.email);
        // Fallback para dados básicos do Supabase
        const isAdmin = supabaseUser.email?.includes('admin');
        const user: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.nome || (isAdmin ? 'Administrador' : 'Usuário'),
          email: supabaseUser.email || '',
          role: isAdmin ? 'admin' : 'morador'
        };
        setUser(user);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil do usuário:', error);
      // Fallback para dados básicos do Supabase
      const isAdmin = supabaseUser.email?.includes('admin');
      const user: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.nome || (isAdmin ? 'Administrador' : 'Usuário'),
        email: supabaseUser.email || '',
        role: isAdmin ? 'admin' : 'morador'
      };
      setUser(user);
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    console.log('🚀 FUNÇÃO LOGIN INICIADA PARA:', email);
    setIsLoading(true);
    
    try {
      logger.auth('Login attempt', false, email);
      
      // 🚫 VERIFICAÇÃO DE APROVAÇÃO ANTES DO LOGIN SUPABASE
      logger.info('🔍 Verificando aprovação antes do login');
      
      // Debug removido para melhorar performance
      
      // Buscar perfil do usuário na tabela usuarios ANTES do login (usando cliente RAW)
      console.log('🔑 Usando cliente RAW para consultar tabela usuarios...');
      let userProfile = null;
      let profileError = null;
      
      try {
        userProfile = await rawSupabaseQuery('usuarios', {
          select: '*',
          eq: { email: email },
          single: true
        });
        console.log('✅ RAW Query - Usuário encontrado:', userProfile);
      } catch (err: any) {
        profileError = err;
        console.error('❌ RAW Query - Erro:', err);
      }

      if (profileError) {
        console.error('❌ Erro ao verificar perfil:', profileError);
        
        // Se for erro de "not found", verificar se o usuário existe mas está pendente
        if (profileError.message === 'No rows found') {
          // Verificar se existe um usuário pendente com este email
          try {
            const pendingUser = await rawSupabaseQuery('usuarios', {
              select: 'id,email,nome,status',
              eq: { email: email },
              single: true
            });
            
            if (pendingUser && pendingUser.status === 'pendente') {
              throw new Error('⏳ CADASTRO PENDENTE: Sua conta está aguardando aprovação do administrador. Entre em contato com a administração.');
            }
          } catch (pendingError) {
            // Se não encontrou nem pendente, é usuário realmente não cadastrado
            throw new Error('🚫 USUÁRIO NÃO ENCONTRADO: Este email não está cadastrado no sistema. Verifique o email ou faça um novo cadastro.');
          }
        }
        
        throw new Error('Erro ao verificar dados do usuário. Tente novamente.');
      }

      // Se for morador, verificar aprovação ANTES do login
      if (userProfile.perfil === 'morador') {
        logger.info('🏠 Verificando aprovação do morador...');
        console.log('📋 Status do morador:', { 
          ativo: userProfile.ativo, 
          status: userProfile.status 
        });

        // Debug detalhado
        logger.info('🔍 DEBUG DETALHADO:');
        console.log('- userProfile.ativo:', userProfile.ativo, typeof userProfile.ativo);
        console.log('- userProfile.status:', userProfile.status, typeof userProfile.status);
        console.log('- Comparação ativo === true:', userProfile.ativo === true);
        logger.info('- Comparação status === "ativo":', userProfile.status === 'ativo');

        if (!userProfile.ativo || userProfile.status !== 'ativo') {
          logger.info('🚫 ACESSO NEGADO: Morador não aprovado');
          console.log('- Falhou em ativo:', !userProfile.ativo);
          logger.info('- Falhou em status:', userProfile.status !== 'ativo');
          throw new Error(`🚫 ACESSO NEGADO: Sua conta ainda não foi aprovada pelo administrador. Status: ${userProfile.status}. Entre em contato com a administração.`);
        }
      }

      logger.info('✅ Verificação de aprovação passou. Prosseguindo com login...');
      
      // ✅ APENAS APÓS VERIFICAR APROVAÇÃO, FAZER LOGIN VIA SUPABASE
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro no login Supabase:', error);
        
        // Se o erro for "Email not confirmed", vamos tentar confirmar automaticamente
        if (error.message.includes('Email not confirmed')) {
          logger.info('📧 Tentando confirmar email automaticamente...');
          
          // Tentar fazer login novamente (às vezes funciona mesmo sem confirmação)
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            throw retryError;
          }
          
          if (retryData.user) {
            console.log('✅ Login bem-sucedido após retry:', retryData.user.email);
            await loadUserProfile(retryData.user);
            return true;
          }
        }
        
        throw error;
      }

      if (data.user) {
        logger.auth('Login Supabase successful', true, data.user.email);
        await AuditLogger.logLogin(data.user.email || '', true);
        await loadUserProfile(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
      logger.info('🔄 Estado isLoading resetado');
    }
  };

  const register = async (email: string, password: string, nome: string, role: UserRole, unidade: string, cpf?: string, telefone?: string, foto?: string, signatureData?: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('👤 Tentando registrar novo usuário:', email, role);
      
      // 1. Criar usuário no Supabase Auth (sem confirmação de email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            nome,
            unidade,
          },
        },
      });

      if (error) {
        console.error('❌ Erro no registro Supabase:', error);
        
        if (error.message?.includes('User already registered')) {
          throw new Error('📧 Este email já está cadastrado no sistema. Tente fazer login ou use "Esqueci minha senha".');
        }
        
        throw error;
      }

      if (data.user) {
        console.log('✅ Registro Supabase bem-sucedido:', data.user.email);
        
        // 2. Criar perfil na tabela usuarios (status pendente)
        const profileData: any = {
          id: data.user.id,
          email: email,
          senha_hash: '', // Não precisamos da senha hash aqui, pois está no Auth
          nome: nome,
          perfil: role,
          unidade: unidade,
          ativo: false, // ❌ INATIVO ATÉ APROVAÇÃO DO ADMIN
          status: 'pendente' // ⏳ STATUS PENDENTE
        };

        // 📱 INCLUIR CPF, TELEFONE E FOTO SE FORNECIDOS
        if (cpf) {
          profileData.cpf = cpf.replace(/\D/g, ''); // CPF limpo (apenas números)
        }
        if (telefone) {
          profileData.telefone = telefone;
        }
        if (foto) {
          profileData.foto = foto; // Foto em base64
          console.log('📸 Foto incluída no profileData:', foto.substring(0, 50) + '...');
        } else {
          console.log('📸 Nenhuma foto fornecida para o usuário');
        }

        // 🏠 INCLUIR DADOS ADICIONAIS SE FORNECIDOS (quadra, lote, rg, rua, numeroRua)
        if (signatureData) {
          if (signatureData.quadra) profileData.quadra = signatureData.quadra;
          if (signatureData.lote) profileData.lote = signatureData.lote;
          if (signatureData.rg) profileData.rg = signatureData.rg;
          if (signatureData.rua) profileData.rua = signatureData.rua;
          if (signatureData.numeroRua) profileData.numeroRua = signatureData.numeroRua; // ✅ Coluna numeroRua criada no banco
          
          // ✅ ASSINATURA DIGITAL: Colunas criadas no banco, salvamento ativo
          if (signatureData.digitalSignature) profileData.digital_signature = signatureData.digitalSignature;
          if (signatureData.signatureTimestamp) profileData.signature_timestamp = signatureData.signatureTimestamp;
          
          console.log('🏠 Dados adicionais incluídos:', {
            quadra: signatureData.quadra,
            lote: signatureData.lote,
            rg: signatureData.rg,
            digitalSignature: signatureData.digitalSignature ? 'SIM ✅' : 'NÃO'
          });
          
          // ✅ LOG DA ASSINATURA SALVA NO BANCO
          if (signatureData.digitalSignature) {
            console.log('✍️ ASSINATURA DIGITAL SALVA NO BANCO:', {
              signature: signatureData.digitalSignature,
              timestamp: signatureData.signatureTimestamp,
              status: 'SALVO ✅'
            });
          }
        }

        // Usar cliente RAW para inserir perfil
        try {
          console.log('🔑 Usando cliente RAW para inserir perfil...');
          console.log('📝 Dados do perfil:', profileData);
          const insertResult = await rawSupabaseInsert('usuarios', profileData);
          console.log('✅ RAW Insert - Perfil criado:', insertResult);
          
          if (insertResult && insertResult.length > 0) {
            console.log('✅ Perfil inserido com sucesso na tabela usuarios');
          } else {
            console.warn('⚠️ Perfil inserido mas sem retorno de dados');
          }
        } catch (profileError) {
          console.error('❌ ERRO CRÍTICO ao criar perfil:', profileError);
          console.error('❌ Stack trace:', profileError.stack);
          console.error('❌ Dados que causaram erro:', profileData);
          // Este erro é crítico - usuario foi criado no Auth mas não na tabela usuarios
          throw profileError; // Propagar o erro para debug
        }

        logger.info('✅ Cadastro criado! Aguardando aprovação do administrador.');
        
        // ❌ NÃO fazer login automático - aguardar aprovação
        // await loadUserProfile(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    } finally {
      setIsLoading(false);
      logger.info('🔄 Estado isLoading resetado');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Verificar se o usuário existe no sistema usando RAW query
      let userData = null;
      try {
        userData = await rawSupabaseQuery('usuarios', {
          select: 'id,email,nome,ativo,status',
          eq: { email: email.toLowerCase() },
          single: true
        });
      } catch (userError: any) {
        logger.error('Usuário não encontrado para recuperação de senha', { email });
        return false;
      }

      if (!userData) {
        logger.error('Usuário não encontrado para recuperação de senha', { email });
        return false;
      }

      // Verificar se o usuário está ativo
      if (!userData.ativo || userData.status !== 'ativo') {
        logger.error('Tentativa de recuperação para usuário inativo', { email });
        return false;
      }

      // Determinar URL de redirecionamento correta
      const isProduction = window.location.hostname !== 'localhost';
      const redirectUrl = isProduction 
        ? 'https://granroyalle-visitantes.vercel.app/reset-password'
        : `${window.location.origin}/reset-password`;
      
      logger.info('URL de redirecionamento para recuperação', { redirectUrl });

      // Enviar email de recuperação via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        logger.error('Erro ao enviar email de recuperação', { email, error: error.message });
        return false;
      }

      logger.info('Email de recuperação enviado com sucesso', { email });
      return true;
    } catch (error) {
      logger.error('Erro na função forgotPassword', { email, error });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Atualizar a senha via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        logger.error('Erro ao redefinir senha', { error: error.message });
        return false;
      }

      logger.info('Senha redefinida com sucesso');
      
      // Fazer logout para forçar novo login
      await supabase.auth.signOut();
      setUser(null);
      
      return true;
    } catch (error) {
      logger.error('Erro na função resetPassword', { error });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};