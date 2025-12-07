import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  activateProPlan: async (licenseKey: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('activate-pro', {
      body: { licenseKey },
    });

    if (error) {
      // Tenta extrair a mensagem de erro específica da função
      if (error.context && typeof error.context.responseText === 'string') {
        try {
          const errorData = JSON.parse(error.context.responseText);
          throw new Error(errorData.error || 'Erro desconhecido ao ativar a chave.');
        } catch (e) {
          // Fallback para a mensagem de erro genérica
          throw new Error(error.message || 'Falha ao ativar o plano PRO.');
        }
      }
      throw new Error(error.message || 'Falha ao ativar o plano PRO.');
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is ok
      console.error("Erro ao buscar perfil:", error);
      return null;
    }

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profile?.name || authUser.email?.split('@')[0] || 'Trader',
      plan: profile?.plan || 'free', // <-- CORREÇÃO DE SEGURANÇA APLICADA
    };
  }
};