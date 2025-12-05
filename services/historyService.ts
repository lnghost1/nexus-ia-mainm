import { supabase } from '../lib/supabase';
import { HistoryItem } from '../types';
import { authService } from './authService';

const MOCK_HISTORY_KEY = 'nexus_history';

const mockHistory = {
  get: (userId: string): HistoryItem[] => {
    try {
        const all = JSON.parse(localStorage.getItem(MOCK_HISTORY_KEY) || '[]');
        return all.filter((item: any) => item.userId === userId);
    } catch {
        return [];
    }
  },
  add: (userId: string, item: HistoryItem) => {
    try {
        const all = JSON.parse(localStorage.getItem(MOCK_HISTORY_KEY) || '[]');
        // Adiciona userId ao item para filtrar depois
        const itemWithUser = { ...item, userId };
        all.unshift(itemWithUser);
        if (all.length > 20) all.pop();
        localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(all));
    } catch (e) {
        console.error("Erro ao salvar no localStorage", e);
    }
  }
};

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

export const historyService = {
  getHistory: async (): Promise<HistoryItem[]> => {
    const user = await authService.getCurrentUser();
    if (!user) return [];

    const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
    const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

    if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
             return data.map((item: any) => ({
              id: item.id,
              imageUrl: item.image_url,
              result: item.result
            }));
          }
        } catch (e) {
          console.warn("Falha ao buscar do Supabase, usando local.");
        }
    }

    // Fallback Local
    return mockHistory.get(user.id);
  },

  addToHistory: async (item: HistoryItem) => {
    const user = await authService.getCurrentUser();
    if (!user) return; // Não lança erro, apenas ignora se não tiver user

    const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
    const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

    if (isSupabaseConfigured) {
        try {
            const { error } = await supabase
            .from('analyses')
            .insert({
                user_id: user.id,
                image_url: item.imageUrl, // Nota: idealmente salvaria no Storage Bucket
                result: item.result
            });
            
            if (!error) return; 
        } catch (e) {
            console.warn("Falha ao salvar no Supabase, salvando localmente.");
        }
    }

    // Fallback Local
    mockHistory.add(user.id, item);
  },

  clearHistory: async () => {
     // Implementar limpeza se necessário
  }
};