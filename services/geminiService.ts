import { supabase } from '../lib/supabase';
import { AnalysisResult, AnalysisSignal } from "../types";

export const analyzeChart = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  const analysisPromise = supabase.functions.invoke('analyze-chart', {
    body: { image: base64Image, mimeType },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("A análise está demorando mais que o esperado. O servidor pode estar sobrecarregado. Tente novamente em alguns instantes.")), 25000) // 25 segundos
  );

  try {
    const result: any = await Promise.race([analysisPromise, timeoutPromise]);

    const { data, error } = result;

    if (error) {
      // Erro de rede ou a função retornou um status não-2xx (ex: 500)
      let errorMessage = error.message || "Ocorreu um erro de comunicação com o servidor.";
      
      // Tenta extrair a mensagem de erro específica do corpo da resposta da função
      if (error.context && typeof error.context.responseText === 'string') {
        try {
          const errorData = JSON.parse(error.context.responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // A resposta de erro não era um JSON, usamos a mensagem genérica.
          console.error("A resposta de erro da Edge Function não era um JSON válido:", error.context.responseText);
        }
      }
      throw new Error(errorMessage);
    }

    if (data && data.error) {
      // A função retornou 2xx, mas com um objeto de erro no corpo
      throw new Error(data.error);
    }
    
    if (!data) {
        throw new Error("A resposta do servidor estava vazia. Tente novamente.");
    }

    // A função retornou 2xx e dados, agora verificamos se é um erro de validação da IA
    if (data.reasoning && data.reasoning.includes("ERRO:")) {
        throw new Error(data.reasoning);
    }

    return {
        signal: data.signal as AnalysisSignal,
        pattern: data.pattern || "N/A",
        trend: data.trend || "N/A",
        riskReward: "1:2", 
        reasoning: data.reasoning,
        supportLevels: data.supportLevels || [],
        resistanceLevels: data.resistanceLevels || [],
        confidence: data.confidence || 0.9,
        timestamp: new Date().toISOString()
    };

  } catch (err: any) {
    console.error("Erro na análise do gráfico:", err);
    throw new Error(err.message || "Um erro desconhecido ocorreu durante a análise.");
  }
};