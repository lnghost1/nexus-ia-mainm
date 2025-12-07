import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from 'npm:@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, mimeType } = await req.json()
    const apiKey = Deno.env.get('VITE_API_KEY')
    if (!apiKey) {
      throw new Error('A chave de API do Gemini (VITE_API_KEY) não foi configurada como um segredo na Supabase.')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const systemInstruction = `
    Você é o NexusTrade AI, um analista financeiro sênior especializado em Price Action, Análise Técnica Institucional e Smart Money Concepts.
    SEUS OBJETIVOS:
    1. Validar se a imagem é um gráfico financeiro legítimo.
    2. Identificar padrões gráficos de alta probabilidade.
    3. Fornecer um veredito claro (COMPRA/VENDA) baseado em lógica técnica.
    REGRAS DE VALIDAÇÃO:
    - Se a imagem NÃO for um gráfico financeiro (ex: foto de pessoa, paisagem, objeto, meme), retorne signal="NEUTRAL" e reasoning="ERRO: A imagem não é um gráfico de trading válido.".
    `
    const prompt = `
    Analise este gráfico. Forneça:
    - Sinal (BUY, SELL, NEUTRAL, HOLD)
    - Padrão Técnico (ex: Bandeira, OCO, Martelo, Pivô)
    - Tendência (Alta, Baixa, Lateral)
    - Explicação técnica detalhada (reasoning) em português, citando gatilhos de entrada.
    - Níveis de Suporte e Resistência.
    - Confiança da análise (confidence) de 0 a 1.
    Responda estritamente em JSON.
    `

    const imagePart = {
      inlineData: {
        data: image,
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const response = result.response
    const analysis = JSON.parse(response.text())

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na função analyze-chart:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})