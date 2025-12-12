import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
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
    };
  }

};