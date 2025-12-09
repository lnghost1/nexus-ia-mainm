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
      throw new Error(error.message || "Ocorreu um erro de comunicação com o servidor.");
    }

    if (data && data.error) {
      throw new Error(data.error);
    }
    
    if (!data) {
        throw new Error("A resposta do servidor estava vazia. Tente novamente.");
    }

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