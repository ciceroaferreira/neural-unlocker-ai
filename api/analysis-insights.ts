import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerGeminiClient } from './_lib/geminiServer';
import { validateMethod, validateBody, handleError } from './_lib/validation';
import { GEMINI_MODELS } from '../constants/config';
import { SYSTEM_PROMPT } from '../constants/prompts';

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
      model: GEMINI_MODELS.ANALYSIS_TEXT,
      contents: `Analise as seguintes camadas de consciência: "${userInputs}". Resposta curta e poética.`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    return res.status(200).json({ insights: response.text || '' });
  } catch (error) {
    handleError(res, error, 'Analysis Insights');
  }
}
