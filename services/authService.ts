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

    const { data, error } = await supabase.auth.updateUser({
        data: { plan: 'pro' }
    });

    if (error) throw error;
    
    const updatedUser = data.user;
    return {
        id: updatedUser.id,
        email: updatedUser.email || '',
        name: updatedUser.user_metadata.name,
        plan: 'pro'
    };
  },
  
  // VALIDAÇÃO DA CHAVE DE LICENÇA
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { user } = session;
    return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata.name || 'Trader',
        plan: user.user_metadata.plan || 'free'
    };
  }
};