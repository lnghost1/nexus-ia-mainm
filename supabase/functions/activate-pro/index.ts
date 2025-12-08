import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Obter segredos necessários e falhar cedo se não estiverem definidos
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serverLicenseKey = Deno.env.get('VITE_LICENSE_KEY');

    if (!supabaseUrl || !serviceRoleKey || !serverLicenseKey) {
      console.error('Variáveis de ambiente ausentes na Edge Function da Supabase.');
      throw new Error('Configuração do servidor incompleta. Contate o suporte.');
    }

    // 2. Obter corpo da requisição
    const { licenseKey } = await req.json();
    if (!licenseKey) {
      throw new Error('Chave de licença não fornecida.');
    }

    // 3. Validar chave de licença
    if (licenseKey.trim().toUpperCase() !== serverLicenseKey.trim().toUpperCase()) {
      throw new Error('Chave de licença inválida.');
    }

    // 4. Obter usuário a partir do JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização ausente.');
    }
    const jwt = authHeader.replace('Bearer ', '');

    // 5. Criar cliente Admin (agora sabemos que as variáveis existem)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Erro de validação do JWT:', userError?.message);
      throw new Error('Sessão de usuário inválida ou expirada. Tente fazer login novamente.');
    }

    // 6. Atualizar perfil do usuário
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError.message);
      throw new Error('Não foi possível atualizar o perfil do usuário.');
    }

    // 7. Retornar sucesso
    return new Response(JSON.stringify({ success: true, message: 'Plano PRO ativado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na função activate-pro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})