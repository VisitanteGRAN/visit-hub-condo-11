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
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
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
      
      // BYPASS TEMPORÁRIO: Simular login para testar sistema
      const testCredentials = {
        'admin@condominio.com.br': { senha: 'Admin@123456', nome: 'Administrador', perfil: 'admin', unidade: 'Administração' },
        'morador@condominio.com.br': { senha: 'Morador@123456', nome: 'Morador Teste', perfil: 'morador', unidade: 'Apto 101' }
      };
      
      const testUser = testCredentials[email as keyof typeof testCredentials];
      
      if (testUser && password === testUser.senha) {
        console.log('🎯 BYPASS: Login simulado para:', email);
        
        // Criar usuário simulado com UUID válido
        const mockUser = {
          id: email === 'admin@condominio.com.br' ? 
            '00000000-0000-0000-0000-000000000001' : 
            '00000000-0000-0000-0000-000000000002',
          email,
          name: testUser.nome,
          role: testUser.perfil as UserRole,
          unidade: testUser.unidade,
          ativo: true
        };
        
        setUser(mockUser);
        console.log('✅ BYPASS: Usuário logado:', mockUser);
        return true;
      }
      
      // Tentar login real no Supabase se não for credencial de teste
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
        
        // 2. Criar perfil na tabela usuarios
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email: email,
            senha_hash: '', // Não precisamos da senha hash aqui, pois está no Auth
            nome: nome,
            perfil: role,
            unidade: unidade,
            ativo: true
          });

        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError);
          // Não vamos falhar aqui, pois o usuário já foi criado no Auth
        }

        // 3. Fazer login automático
        await loadUserProfile(data.user);
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