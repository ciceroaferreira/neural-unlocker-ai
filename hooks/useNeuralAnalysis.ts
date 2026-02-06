import { useState, useCallback } from 'react';
import { NeuralAnalysis, AnalysisResult } from '@/types/analysis';
import { QuestionResponse } from '@/types/questionFlow';
import { runFullAnalysis } from '@/services/analysisService';

export function useNeuralAnalysis(onError: (error: any, context: string) => void) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NeuralAnalysis[] | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [totalBloqueios, setTotalBloqueios] = useState<number | null>(null);

  const runAnalysis = useCallback(
    async (questionResponses: QuestionResponse[]): Promise<AnalysisResult | null> => {
      if (questionResponses.length === 0) return null;
      setIsAnalyzing(true);

      try {
        const result = await runFullAnalysis(questionResponses);
        setAiInsights(result.insights);
        setAnalysis(result.blocks);
        setTotalBloqueios(result.totalBloqueiosEncontrados);
        return result;
      } catch (e) {
        onError(e, 'Neural Mapping');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onError]
  );

  const reset = useCallback(() => {
    setAnalysis(null);
    setAiInsights(null);
    setTotalBloqueios(null);
  }, []);

  return { isAnalyzing, analysis, aiInsights, totalBloqueios, runAnalysis, reset };
}
