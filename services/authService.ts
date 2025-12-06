import { supabase } from '../lib/supabase';
import { User } from '../types';

// Helper simplificado para ler variáveis de ambiente do Vite
const getEnv = (key: string): string => {
  // @ts-ignore
  const envVar = import.meta.env[key];
  return envVar || '';
};

export const authService = {
  // A função de upgrade não é mais estritamente necessária, mas mantida para integridade
  upgradeToPro: async (): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado para fazer upgrade.");

    await supabase.from('profiles').update({ plan: 'pro' }).eq('id', user.id);
    
    const updatedUser = await authService.getCurrentUser();
    if (!updatedUser) throw new Error("Falha ao buscar perfil atualizado.");
    return updatedUser;
  },
  
  activateProPlan: async (licenseKey: string): Promise<User> => {
      const serverKey = getEnv('VITE_LICENSE_KEY');
      
      if (!serverKey) {
        throw new Error("A chave de licença do sistema não está configurada.");
      }

      if (licenseKey.trim().toUpperCase() === serverKey.trim().toUpperCase()) {
          return authService.upgradeToPro();
      } else {
          throw new Error(`Chave inválida.`);
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

    const { user: authUser } = session;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Lógica simplificada: Retorna um objeto de usuário completo,
    // forçando o plano 'pro' para garantir acesso total e evitar travamentos.
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profile?.name || authUser.email?.split('@')[0] || 'Trader',
      plan: 'pro', // <-- MUDANÇA PRINCIPAL: Acesso PRO garantido para todos.
    };
  }
};