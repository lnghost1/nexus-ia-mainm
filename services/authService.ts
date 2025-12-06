import { supabase } from '../lib/supabase';
import { User } from '../types';

// Helper para ler variáveis de ambiente de forma segura (Vite/Vercel)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  
  return '';
};

export const authService = {
  upgradeToPro: async (): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado para fazer upgrade.");

    // Atualiza apenas o plano, ignorando a coluna que está causando o erro de cache.
    const { error } = await supabase
      .from('profiles')
      .update({ 
        plan: 'pro', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (error) throw error;
    
    // Retorna os dados atualizados do usuário
    const updatedUser = await authService.getCurrentUser();
    if (!updatedUser) throw new Error("Falha ao buscar perfil atualizado.");
    return updatedUser;
  },
  
  activateProPlan: async (licenseKey: string): Promise<User> => {
      const serverKey = getEnv('VITE_LICENSE_KEY');
      
      if (!serverKey) {
        throw new Error("A chave de licença do sistema não está configurada. Contate o suporte.");
      }

      const normalizedInput = licenseKey.trim().toUpperCase();
      const normalizedServerKey = serverKey.trim().toUpperCase();
      
      const isValid = normalizedInput === normalizedServerKey;

      if (isValid) {
          return authService.upgradeToPro();
      } else {
          throw new Error(`Chave inválida. Verifique o código enviado ao seu email.`);
      }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Erro ao fazer logout:", error);
        throw new Error(error.message);
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError.message);
      return null;
    }
    
    if (!session) {
      return null;
    }

    const { user } = session;

    // Busca o perfil na tabela 'profiles'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, plan')
      .eq('id', user.id)
      .single();

    // Loga o erro mas não falha completamente, permite o login mesmo se o perfil estiver faltando
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = Nenhuma linha retornada
        console.error("Erro ao buscar perfil do usuário:", profileError.message);
    }

    return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trader',
        plan: profile?.plan || 'free'
    };
  }
};