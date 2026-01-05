import { supabase } from '../lib/supabase';
import { HistoryItem } from '../types';
import { authService } from './authService';

const MOCK_HISTORY_KEY = 'nexus_history';

const safeRandomUUID = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch (e) {}

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

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
        if (all.length > 10) all.pop();
        try {
          localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(all));
        } catch (e) {
          // QuotaExceededError (muito comum no mobile): reduz drasticamente e tenta de novo.
          try {
            const trimmed = all.slice(0, 3).map((it: any) => ({ ...it, imageUrl: '' }));
            localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(trimmed));
          } catch (e2) {
            try { localStorage.removeItem(MOCK_HISTORY_KEY); } catch (e3) {}
          }
        }
    } catch (e) {
        console.error("Erro ao salvar no localStorage", e);
    }
  }
};

const createLocalThumbnailDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 320;
        const w = img.width || 1;
        const h = img.height || 1;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve('');
          return;
        }

        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (e) {
        try { URL.revokeObjectURL(url); } catch (e) {}
        resolve('');
      }
    };
    img.onerror = () => {
      try { URL.revokeObjectURL(url); } catch (e) {}
      resolve('');
    };
    img.src = url;
  });
};

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

const BUCKET = 'analysis-images';

const getFileExtension = (file: File) => {
  const name = (file.name || '').trim();
  const parts = name.split('.');
  if (parts.length >= 2) return parts[parts.length - 1].toLowerCase();

  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
};

const createSignedImageUrl = async (path: string) => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
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
            .select('id, image_path, result, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
             const items = await Promise.all(
               data.map(async (item: any) => {
                 const imageUrl = item.image_path ? await createSignedImageUrl(item.image_path) : '';
                 return {
                   id: item.id,
                   imageUrl,
                   result: item.result
                 } as HistoryItem;
               })
             );
             return items;
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
    if (!user) return;
    mockHistory.add(user.id, item);
  },

  addAnalysis: async (file: File, result: HistoryItem['result']): Promise<void> => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
    const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

    if (!isSupabaseConfigured) {
      const thumb = await createLocalThumbnailDataUrl(file);
      const localItem: HistoryItem = {
        id: safeRandomUUID(),
        imageUrl: thumb,
        result
      };
      mockHistory.add(user.id, localItem);
      return;
    }

    try {
      const ext = getFileExtension(file);
      const fileName = `${safeRandomUUID()}.${ext}`;
      const path = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          image_path: path,
          image_mime: file.type,
          result
        });

      if (insertError) throw insertError;
    } catch (e) {
      console.warn("Falha ao salvar no Supabase, salvando localmente.");
      const thumb = await createLocalThumbnailDataUrl(file);
      const localItem: HistoryItem = {
        id: safeRandomUUID(),
        imageUrl: thumb,
        result
      };
      mockHistory.add(user.id, localItem);
    }
  },

  clearHistory: async () => {
     // Implementar limpeza se necessário
  }
};