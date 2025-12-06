import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisSignal } from "../types";

// Helper seguro para pegar a chave API do ambiente
const getApiKey = () => {
  // @ts-ignore
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey) {
    console.error("Chave de API do Google Gemini não configurada.");
    throw new Error("Chave de API do Google Gemini não configurada.");
  }
  return apiKey;
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeChart = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  
  const apiKey = getApiKey();

  const ai = new GoogleGenAI({ apiKey });

  // Instrução de Sistema: Define a persona e regras rígidas
  const systemInstruction = `
    Você é o NexusTrade AI, um analista financeiro sênior especializado em Price Action, Análise Técnica Institucional e Smart Money Concepts.
    
    SEUS OBJETIVOS:
    1. Validar se a imagem é um gráfico financeiro legítimo.
    2. Identificar padrões gráficos de alta probabilidade.
    3. Fornecer um veredito claro (COMPRA/VENDA) baseado em lógica técnica.

    REGRAS DE VALIDAÇÃO:
    - Se a imagem NÃO for um gráfico financeiro (ex: foto de pessoa, paisagem, objeto, meme), retorne signal="NEUTRAL" e reasoning="ERRO: A imagem não é um gráfico de trading válido.".
  `;

  // Prompt do Usuário: O pedido específico
  const prompt = `
    Analise este gráfico. Forneça:
    - Sinal (BUY, SELL, NEUTRAL, HOLD)
    - Padrão Técnico (ex: Bandeira, OCO, Martelo, Pivô)
    - Tendência (Alta, Baixa, Lateral)
    - Explicação técnica detalhada (reasoning) em português, citando gatilhos de entrada.
    - Níveis de Suporte e Resistência.
    
    Responda estritamente em JSON conforme o schema.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
        parts: [
            { inlineData: { mimeType: mimeType, data: base64Image } },
            { text: prompt }
        ]
        },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    signal: { type: Type.STRING, enum: ["BUY", "SELL", "NEUTRAL", "HOLD"] },
                    pattern: { type: Type.STRING },
                    trend: { type: Type.STRING },
                    riskReward: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    supportLevels: { type: Type.ARRAY, items: { type: Type.STRING } },
                    resistanceLevels: { type: Type.ARRAY, items: { type: Type.STRING } },
                    confidence: { type: Type.NUMBER },
                },
                required: ["signal", "pattern", "trend", "reasoning"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA.");

    const json = JSON.parse(text);

    // Tratamento de erro visual na UI se não for gráfico
    if (json.reasoning && json.reasoning.includes("ERRO:")) {
        throw new Error(json.reasoning);
    }

    return {
        signal: json.signal as AnalysisSignal,
        pattern: json.pattern || "N/A",
        trend: json.trend || "N/A",
        riskReward: "1:2", 
        reasoning: json.reasoning,
        supportLevels: json.supportLevels || [],
        resistanceLevels: json.resistanceLevels || [],
        confidence: json.confidence || 0.9,
        timestamp: new Date().toISOString()
    };
  } catch (error: any) {
      if (error.message && error.message.includes("ERRO:")) {
          throw error;
      }
      console.error("Erro API:", error);
      throw new Error("Não foi possível analisar. Tente novamente em instantes.");
  }
};