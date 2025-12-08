import { supabase } from '../lib/supabase';
import { HistoryItem } from '../types';

export const historyService = {
  getHistory: async (userId: string): Promise<HistoryItem[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      imageUrl: item.image_url,
      result: item.result
    }));
  },

  addToHistory: async (item: HistoryItem, userId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        image_url: item.imageUrl,
        result: item.result
      });
      
    if (error) {
      console.error("Erro ao salvar no histórico:", error);
    }
  },
};