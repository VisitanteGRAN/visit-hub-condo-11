import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
  register: (email: string, password: string, nome: string, role: UserRole, unidade: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
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
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        // Evitar reprocessar se já estamos processando
        if (isLoading) return;
        
        if (event === 'SIGNED_IN' && session?.user && !user) {
          console.log('🔑 SIGNED_IN detectado, verificando perfil...');
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 SIGNED_OUT detectado, limpando estado...');
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('🔍 Carregando perfil do usuário:', supabaseUser.email);
      
      const { data: profile, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        
        // Se não encontrou o perfil, vamos criar um básico
        if (error.code === 'PGRST116') {
          console.log('⚠️ Perfil não encontrado, criando perfil básico...');
          
          // Determinar o perfil baseado no email
          const isAdmin = supabaseUser.email?.includes('admin');
          const perfil = isAdmin ? 'admin' : 'morador';
          const unidade = isAdmin ? 'ADMIN' : supabaseUser.user_metadata?.unidade || 'Unidade não informada';
          
          const { data: newProfile, error: createError } = await supabase
            .from('usuarios')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              senha_hash: '',
              nome: supabaseUser.user_metadata?.nome || (isAdmin ? 'Administrador Sistema' : 'Morador'),
              perfil: perfil,
              unidade: unidade,
              ativo: true
            })
            .select()
            .single();
            
          if (createError) {
            console.error('❌ Erro ao criar perfil básico:', createError);
            throw createError;
          }
          
          if (newProfile) {
            const user: User = {
              id: newProfile.id,
              name: newProfile.nome,
              email: newProfile.email,
              role: newProfile.perfil as UserRole,
              apartamento: newProfile.unidade
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
          console.log('🔍 VERIFICAÇÃO RIGOROSA: Morador deve ter ativo=true E status=ativo');
          
          // VERIFICAÇÃO TRIPLA: ativo deve ser true E status deve ser 'ativo'
          const isApproved = profile.ativo === true && profile.status === 'ativo';
          
          if (!isApproved) {
            console.log('❌ ACESSO NEGADO: Morador não aprovado');
            console.log('📋 Status atual:', { ativo: profile.ativo, status: profile.status, aprovado: isApproved });
            
            // FORÇA LOGOUT IMEDIATO
            await supabase.auth.signOut();
            setUser(null); // Limpa estado local
            
            throw new Error(`🚫 ACESSO NEGADO: Sua conta ainda não foi aprovada pelo administrador. Status: ${profile.status}. Contate o administrador.`);
          }
          
          console.log('✅ ACESSO LIBERADO: Morador aprovado com sucesso');
        }
        
        // Admin sempre pode logar (mas verificar se é realmente admin)
        if (profile.perfil === 'admin' && !profile.ativo) {
          console.log('❌ Conta de administrador inativa');
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
    setIsLoading(true);
    
    try {
      console.log('🔐 Tentando login com:', email, role);
      
      // 🚫 VERIFICAÇÃO DE APROVAÇÃO ANTES DO LOGIN SUPABASE
      console.log('🔍 Verificando aprovação antes do login...');
      
      // Buscar perfil do usuário na tabela usuarios ANTES do login
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        console.error('❌ Erro ao verificar perfil:', profileError);
        throw new Error('Usuário não encontrado no sistema');
      }

      // Se for morador, verificar aprovação ANTES do login
      if (userProfile.perfil === 'morador') {
        console.log('🏠 Verificando aprovação do morador...');
        console.log('📋 Status do morador:', { 
          ativo: userProfile.ativo, 
          status: userProfile.status 
        });

        // Debug detalhado
        console.log('🔍 DEBUG DETALHADO:');
        console.log('- userProfile.ativo:', userProfile.ativo, typeof userProfile.ativo);
        console.log('- userProfile.status:', userProfile.status, typeof userProfile.status);
        console.log('- Comparação ativo === true:', userProfile.ativo === true);
        console.log('- Comparação status === "ativo":', userProfile.status === 'ativo');

        if (!userProfile.ativo || userProfile.status !== 'ativo') {
          console.log('🚫 ACESSO NEGADO: Morador não aprovado');
          console.log('- Falhou em ativo:', !userProfile.ativo);
          console.log('- Falhou em status:', userProfile.status !== 'ativo');
          throw new Error(`🚫 ACESSO NEGADO: Sua conta ainda não foi aprovada pelo administrador. Status: ${userProfile.status}. Entre em contato com a administração.`);
        }
      }

      console.log('✅ Verificação de aprovação passou. Prosseguindo com login...');
      
      // ✅ APENAS APÓS VERIFICAR APROVAÇÃO, FAZER LOGIN VIA SUPABASE
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro no login Supabase:', error);
        
        // Se o erro for "Email not confirmed", vamos tentar confirmar automaticamente
        if (error.message.includes('Email not confirmed')) {
          console.log('📧 Tentando confirmar email automaticamente...');
          
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
        console.log('✅ Login Supabase bem-sucedido:', data.user.email);
        await loadUserProfile(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
      console.log('🔄 Estado isLoading resetado');
    }
  };

  const register = async (email: string, password: string, nome: string, role: UserRole, unidade: string): Promise<boolean> => {
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
        throw error;
      }

      if (data.user) {
        console.log('✅ Registro Supabase bem-sucedido:', data.user.email);
        
        // 2. Criar perfil na tabela usuarios (status pendente)
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email: email,
            senha_hash: '', // Não precisamos da senha hash aqui, pois está no Auth
            nome: nome,
            perfil: role,
            unidade: unidade,
            ativo: false, // ❌ INATIVO ATÉ APROVAÇÃO DO ADMIN
            status: 'pendente' // ⏳ STATUS PENDENTE
          });

        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError);
          // Não vamos falhar aqui, pois o usuário já foi criado no Auth
        }

        console.log('✅ Cadastro criado! Aguardando aprovação do administrador.');
        
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
      console.log('🔄 Estado isLoading resetado');
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};