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
    const { licenseKey } = await req.json()
    const serverKey = Deno.env.get('VITE_LICENSE_KEY')

    if (!serverKey) {
      throw new Error('A chave de licença do sistema (VITE_LICENSE_KEY) não foi configurada como um segredo na Supabase.')
    }

    if (licenseKey.trim().toUpperCase() !== serverKey.trim().toUpperCase()) {
      throw new Error('Chave de licença inválida.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseAdmin.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado.')
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ success: true, message: 'Plano PRO ativado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na função activate-pro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})