import { supabase } from '../lib/supabase';
import { HistoryItem } from '../types';
import { authService } from './authService';

export const historyService = {
  getHistory: async (): Promise<HistoryItem[]> => {
    const user = await authService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }

    // Adicionado para garantir que não quebre se não houver dados
    if (!data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      imageUrl: item.image_url,
      result: item.result
    }));
  },

  addToHistory: async (item: HistoryItem) => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        image_url: item.imageUrl,
        result: item.result
      });
      
    if (error) {
      console.error("Erro ao salvar no histórico:", error);
    }
  },
};