import { Type } from '@google/genai';
import { getGeminiClient } from './geminiClient';
import { NeuralAnalysis } from '@/types/analysis';
import { GEMINI_MODELS } from '@/constants/config';
import { SYSTEM_PROMPT } from '@/constants/prompts';

export async function generateInsightText(userInputs: string): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.ANALYSIS_TEXT,
    contents: `Analise as seguintes camadas de consciência: "${userInputs}". Resposta curta e poética.`,
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  return response.text || '';
}

export async function generateBlockAnalysis(userInputs: string): Promise<NeuralAnalysis[]> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.ANALYSIS_JSON,
    contents: `Identifique 3 bloqueios em JSON baseado em: "${userInputs}".`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            blockName: { type: Type.STRING },
            intensity: { type: Type.NUMBER },
            description: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['blockName', 'intensity', 'description', 'recommendations'],
        },
      },
    },
  });

  return JSON.parse(response.text || '[]');
}
