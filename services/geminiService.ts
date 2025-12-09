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
  const analysisPromise = supabase.functions.invoke('analyze-chart', {
    body: { image: base64Image, mimeType },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("A análise está demorando mais que o esperado. O servidor pode estar sobrecarregado. Tente novamente em alguns instantes.")), 25000) // 25 segundos
  );

  try {
    const result: any = await Promise.race([analysisPromise, timeoutPromise]);

    const { data, error } = result;

    // Case 1: The invoke call itself failed (network error, function not found, etc.)
    if (error) {
      throw new Error(error.message || "Ocorreu um erro de comunicação com o servidor.");
    }

    // Case 2: The function executed but returned an error in its response body
    if (data && data.error) {
      throw new Error(data.error);
    }
    
    // Case 3: The function executed but returned no data
    if (!data) {
        throw new Error("A resposta do servidor estava vazia. Tente novamente.");
    }

    // Case 4: The function returned a non-actionable "error" message in the reasoning
    if (data.reasoning && data.reasoning.includes("ERRO:")) {
        throw new Error(data.reasoning);
    }

    // Success case
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
    // This catch block will handle the timeout from timeoutPromise,
    // or any errors thrown from the blocks above.
    console.error("Erro na análise do gráfico:", err);
    throw new Error(err.message || "Um erro desconhecido ocorreu durante a análise.");
  }
};