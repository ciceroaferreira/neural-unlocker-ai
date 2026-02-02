import { useState, useCallback } from 'react';
import { NeuralAnalysis } from '@/types/analysis';
import { generateInsightText, generateBlockAnalysis } from '@/services/analysisService';

export function useNeuralAnalysis(onError: (error: any, context: string) => void) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NeuralAnalysis[] | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (userInputs: string): Promise<{ insights: string; blocks: NeuralAnalysis[] } | null> => {
      if (!userInputs.trim()) return null;
      setIsAnalyzing(true);

      try {
        const insights = await generateInsightText(userInputs);
        setAiInsights(insights);

        const blocks = await generateBlockAnalysis(userInputs);
        setAnalysis(blocks);

        return { insights, blocks };
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
  }, []);

  return { isAnalyzing, analysis, aiInsights, runAnalysis, reset };
}
