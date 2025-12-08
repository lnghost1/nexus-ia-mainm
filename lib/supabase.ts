import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não foram encontradas.");
  console.error("Verifique suas Variáveis de Ambiente no painel da Vercel.");
  throw new Error("Configuração do Supabase incompleta. O deploy irá falhar até que as variáveis sejam corrigidas na Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);