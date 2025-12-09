import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  activateProPlan: async (licenseKey: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('activate-pro', {
      body: { licenseKey },
    });
    if (error) {
      throw new Error(error.message || "Falha ao ativar o plano PRO.");
    }
    if (data.error) {
      let errorMessage = "Falha ao ativar o plano PRO. Tente novamente."; // Mensagem padrão
      
      // Tenta extrair a mensagem de erro específica da função
      if (data.error.context && typeof data.error.context.responseText === 'string') {
        try {
          const errorData = JSON.parse(data.error.context.responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error("A resposta da Edge Function não era um JSON válido:", data.error.context.responseText);
        }
      } else {
        errorMessage = data.error.message;
      }
      
      throw new Error(errorMessage);
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
  // Recupera sessão atual
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Erro ao obter sessão:", sessionError);
    return null;
  }

  if (!session) return null;

  const authUser = session.user;
  if (!authUser) return null;

  // Busca o profile no banco
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // Caso o erro não seja "no rows found"
  if (profileError && profileError.code !== 'PGRST116') {
    console.error("Erro ao buscar perfil:", profileError);
    return null;
  }

  // Retorna o objeto User consolidado
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name:
      profile?.name ||
      authUser.email?.split('@')[0] ||
      'Trader',

    // ✔ Segurança: nunca confiamos no lado do frontend
    // ✔ Se o profile não existir, assume free
    plan: profile?.plan ?? 'free',
  };
}

};