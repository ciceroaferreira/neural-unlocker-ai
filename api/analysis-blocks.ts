import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Type } from '@google/genai';
import { getServerGeminiClient } from './_lib/geminiServer';
import { validateMethod, validateBody, handleError } from './_lib/validation';
import { GEMINI_MODELS } from '../constants/config';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(req, res, 'POST')) return;
  if (!validateBody(req, res, ['userInputs'])) return;

  const { userInputs } = req.body;

  if (userInputs.length > 50000) {
    return res.status(400).json({ error: 'Input exceeds maximum length' });
  }

  try {
    const ai = getServerGeminiClient();

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

    const blocks = JSON.parse(response.text || '[]');
    return res.status(200).json({ blocks });
  } catch (error) {
    handleError(res, error, 'Analysis Blocks');
  }
}
