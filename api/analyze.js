import { GoogleGenAI, Type } from "@google/genai";

const rateState = new Map();

const getClientIp = (req) => {
  const fwd = String(req.headers?.['x-forwarded-for'] || '').trim();
  if (fwd) return fwd.split(',')[0].trim();
  return String(req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown');
};

const rateLimit = (key, limit, windowMs) => {
  const now = Date.now();
  const existing = rateState.get(key);
  if (!existing || now - existing.start > windowMs) {
    const next = { start: now, count: 1 };
    rateState.set(key, next);
    return { ok: true, remaining: limit - 1, resetInMs: windowMs };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return { ok: existing.count <= limit, remaining, resetInMs: Math.max(0, windowMs - (now - existing.start)) };
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Rate limit (melhor esforço) por IP para evitar abuso/custos.
  const ip = getClientIp(req);
  const rl = rateLimit(`analyze:${ip}`, 10, 60 * 1000);
  if (!rl.ok) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }));
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const authHeader = String(req.headers?.authorization || "").trim();
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Não autenticado." }));
    return;
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceRoleKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Supabase service role não configurado no servidor." }));
    return;
  }

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "GEMINI_API_KEY não configurada no servidor." }));
    return;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Token inválido." }));
      return;
    }

    const u = userData.user;
    const plan = String(u.app_metadata?.plan || u.user_metadata?.plan || 'free');
    if (plan !== 'pro') {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Acesso negado. Plano PRO necessário." }));
      return;
    }

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "JSON inválido no corpo da requisição." }));
      return;
    }

    const base64Image = body?.base64Image;
    const mimeType = body?.mimeType;

    if (!base64Image || !mimeType) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Parâmetros inválidos: base64Image e mimeType são obrigatórios." }));
      return;
    }

    const allowedMime = new Set(["image/png", "image/jpeg", "image/webp"]);
    if (!allowedMime.has(String(mimeType))) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "mimeType inválido. Envie PNG/JPG/WEBP." }));
      return;
    }

    const b64 = String(base64Image);
    // Base64 válido (bem restritivo) + limite para evitar abuso/estouro de memória em serverless.
    if (!/^[A-Za-z0-9+/=\s]+$/.test(b64)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "base64Image inválido." }));
      return;
    }

    const normalized = b64.replace(/\s+/g, "");
    const MAX_BASE64_CHARS = 10 * 1024 * 1024; // ~7.5MB binário (aprox)
    if (normalized.length > MAX_BASE64_CHARS) {
      res.statusCode = 413;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Imagem muito grande para análise. Envie um print menor." }));
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
    Você é o NexusTrade AI, um analista financeiro sênior especializado em Price Action, Análise Técnica Institucional e Smart Money Concepts.
    
    SEUS OBJETIVOS:
    1. Validar se a imagem é um gráfico financeiro legítimo.
    2. Identificar padrões gráficos de alta probabilidade.
    3. Fornecer um veredito claro (COMPRA/VENDA) baseado em lógica técnica.

    REGRAS DE VALIDAÇÃO (OBRIGATÓRIAS):
    - Se a imagem NÃO for um gráfico financeiro (ex: foto de pessoa, paisagem, objeto, meme), retorne signal="NEUTRAL" e reasoning="ERRO: A imagem não é um gráfico de trading válido.".
    - Você DEVE analisar SOMENTE prints de gráfico da corretora/broker TrionBroker (plataforma TrionBroker / trionbroker.io / interface com texto "TrionBroker").
    - Se a imagem for de outra corretora/plataforma (ex: IQ Option, Quotex, Binomo, Olymp Trade, MetaTrader/TradingView, Binance etc) OU se não for possível confirmar que é TrionBroker, retorne signal="NEUTRAL" e reasoning="ERRO: Este gráfico não é da TrionBroker. Envie um print do gráfico dentro da plataforma TrionBroker para eu analisar.".
  `;

    const prompt = `
    Primeiro, confirme visualmente se este print é da corretora TrionBroker.
    - Se NÃO for TrionBroker, ou se houver dúvida, retorne imediatamente signal="NEUTRAL" e reasoning começando com "ERRO:" conforme as regras.
    - Você DEVE preencher o campo booleano isPolarium: true somente se for claramente TrionBroker; caso contrário false.

    Se for TrionBroker, analise este gráfico e forneça:
    - Sinal (BUY, SELL, NEUTRAL, HOLD)
    - Padrão Técnico (ex: Bandeira, OCO, Martelo, Pivô)
    - Tendência (Alta, Baixa, Lateral)
    - Explicação técnica detalhada (reasoning) em português, citando gatilhos de entrada.
    - Níveis de Suporte e Resistência.

    Responda estritamente em JSON conforme o schema.
  `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: String(mimeType), data: String(base64Image) } },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPolarium: { type: Type.BOOLEAN },
            signal: { type: Type.STRING, enum: ["BUY", "SELL", "NEUTRAL", "HOLD"] },
            pattern: { type: Type.STRING },
            trend: { type: Type.STRING },
            riskReward: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            supportLevels: { type: Type.ARRAY, items: { type: Type.STRING } },
            resistanceLevels: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
          },
          required: ["isPolarium", "signal", "pattern", "trend", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Resposta vazia da IA." }));
      return;
    }

    const json = JSON.parse(text);

    if (json?.isPolarium !== true) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          isPolarium: false,
          signal: "NEUTRAL",
          pattern: "N/A",
          trend: "N/A",
          riskReward: "N/A",
          reasoning:
            "ERRO: Gráfico não identificado. Cadastre-se agora na corretora TrionBroker e continue operando normalmente, link para cadastro abaixo: https://trionbroker.io/partner/12742",
          supportLevels: [],
          resistanceLevels: [],
          confidence: 0,
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(json));
  } catch (err) {
    const message = err?.message ? String(err.message) : "Erro inesperado";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: message }));
  }
}
