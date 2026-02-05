import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Modality } from '@google/genai';
import { getServerGeminiClient } from './_lib/geminiServer';
import { validateMethod, validateBody, handleError } from './_lib/validation';
import { GEMINI_MODELS, AUDIO_CONFIG } from '../constants/config';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(req, res, 'POST')) return;
  if (!validateBody(req, res, ['text', 'prosodyInstructions'])) return;

  const { text, prosodyInstructions } = req.body;

  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text exceeds maximum length of 5000 characters' });
  }

  try {
    const ai = getServerGeminiClient();
    const ttsPrompt = `INSTRUÇÃO DE PROSÓDIA: ${prosodyInstructions}\nCONTEÚDO: ${text}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.TTS,
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: AUDIO_CONFIG.TTS_VOICE },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio data returned from TTS model' });
    }

    return res.status(200).json({ audio: base64Audio });
  } catch (error) {
    handleError(res, error, 'TTS');
  }
}
