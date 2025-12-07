import { supabase } from '../lib/supabase';
import { AnalysisResult, AnalysisSignal } from "../types";

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
  const { data, error } = await supabase.functions.invoke('analyze-chart', {
    body: { image: base64Image, mimeType },
  });

  if (error) {
    console.error("Erro ao invocar a Edge Function 'analyze-chart':", error);
    throw new Error(error.message || "Falha na análise. Tente novamente.");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Tratamento de erro visual na UI se não for gráfico
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
};