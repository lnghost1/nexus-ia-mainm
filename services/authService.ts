import { supabase } from '../lib/supabase';
import { User } from '../types';

export const isAdvancedPermissionsUser = (email: string) => {
  return String(email || '').trim().toLowerCase() === 'andreluisscheeren14.a@gmail.com';
};

// Helper para ler variáveis de ambiente de forma segura (Vite/Vercel)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return String(import.meta.env[key]).trim();
    }
  } catch (e) {}

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return String(process.env[key]).trim();
    }
  } catch (e) {}
  
  return '';
};

// --- MOCK SERVICE (Fallback LocalStorage) ---
// (mock auth removido para produção)

// --- REAL SERVICE ---

const isSupabaseConfigured = () => {
  const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
  
  // Verificação rígida: só retorna true se NÃO for placeholder
  return !!url && !!key && !url.includes('placeholder') && !key.includes('placeholder');
};

const requireSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    requireSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Falha ao autenticar.');
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name || 'Trader',
      plan: (data.user.app_metadata as any)?.plan || data.user.user_metadata?.plan || 'free'
    };
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    requireSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          plan: 'free'
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Falha ao criar conta.');
    return {
      id: data.user.id,
      email: data.user.email || '',
      name,
      plan: 'free'
    };
  },

  upgradeToPro: async (): Promise<User> => {
    throw new Error('A ativação do plano PRO deve ser feita via chave (Checkout).');
  },
  
  // VALIDAÇÃO DA CHAVE DE LICENÇA
  activateProPlan: async (licenseKey: string): Promise<User> => {
    requireSupabase();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Sessão expirada. Faça login novamente.');

    const res = await fetch('/api/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ licenseKey })
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = json?.error ? String(json.error) : `Erro HTTP ${res.status}`;
      throw new Error(message);
    }

    // Recarrega usuário atualizado
    return authService.getCurrentUser().then((u) => {
      if (!u) throw new Error('Falha ao atualizar sessão.');
      return u;
    });
  },

  logout: async () => {
    requireSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<User | null> => {
    requireSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name || 'Trader',
      plan: (data.user.app_metadata as any)?.plan || data.user.user_metadata?.plan || 'free'
    };
  }
};
