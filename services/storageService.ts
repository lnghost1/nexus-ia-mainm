import { supabase } from '../lib/supabase';

export const storageService = {
  uploadImage: async (file: File, userId: string): Promise<string> => {
    if (!file || !userId) {
      throw new Error('Arquivo ou ID de usuário ausente para o upload.');
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('charts')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload da imagem:', uploadError);
      throw new Error('Não foi possível salvar a imagem do gráfico.');
    }

    const { data } = supabase.storage
      .from('charts')
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    return data.publicUrl;
  },
};