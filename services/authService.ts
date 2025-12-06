import { supabase } from '../lib/supabase';
import { User } from '../types';

// Helper simplificado para ler variáveis de ambiente do Vite
const getEnv = (key: string): string => {
  // @ts-ignore
  const envVar = import.meta.env[key];
  return envVar || '';
};

export const authService = {
  upgradeToPro: async (): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado para fazer upgrade.");

    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', user.id);

    if (error) {
      console.error("Erro no Supabase ao tentar fazer upgrade:", error);
      throw new Error(`Falha ao atualizar o plano: ${error.message}`);
    }
    
    const updatedUser = await authService.getCurrentUser();
    if (!updatedUser) {
      throw new Error("Falha ao buscar perfil atualizado após o upgrade.");
    }
    return updatedUser;
  },
  
  activateProPlan: async (licenseKey: string): Promise<User> => {
      const serverKey = getEnv('VITE_LICENSE_KEY');
      
      if (!serverKey) {
        console.error("VITE_LICENSE_KEY não está configurada no ambiente.");
        throw new Error("A chave de licença do sistema não está configurada. Contate o suporte.");
      }

      const normalizedInput = licenseKey.trim().toUpperCase();
      const normalizedServerKey = serverKey.trim().toUpperCase();
      
      if (normalizedInput === normalizedServerKey) {
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

    if (sessionError || !session) {
      if (sessionError) console.error("Erro ao obter sessão:", sessionError.message);
      return null;
    }

    const { user: authUser } = session;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      if (profileError) console.error("Erro ao buscar perfil do usuário:", profileError.message);
      
      // Fallback CRÍTICO: Se o perfil não for encontrado, retorna um usuário padrão
      // para evitar que o aplicativo trave.
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.email?.split('@')[0] || 'Trader',
        plan: 'free',
      };
    }

    // Combina os dados de autenticação e do perfil para um objeto de usuário completo
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profile.name || authUser.email?.split('@')[0] || 'Trader',
      plan: profile.plan || 'free',
    };
  }
};