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

    // Apenas atualiza o plano. O banco de dados deve cuidar do `updated_at` se houver um trigger.
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', user.id);

    if (error) {
      console.error("Erro no Supabase ao tentar fazer upgrade:", error);
      throw new Error(`Falha ao atualizar o plano: ${error.message}`);
    }
    
    // Retorna os dados atualizados do usuário para atualizar o estado da aplicação
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

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
        console.error("Erro ao buscar perfil:", profileError);
    }

    return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || 'Trader',
        plan: profile?.plan || 'free'
    };
  }
};