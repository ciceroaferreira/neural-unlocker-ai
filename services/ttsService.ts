import { Modality } from '@google/genai';
import { getGeminiClient } from './geminiClient';
import { decode, decodeAudioData } from './audioUtils';
import { GEMINI_MODELS, AUDIO_CONFIG } from '@/constants/config';
import { getSharedAudioContext, initAudioContext } from './audioContextManager';

export interface TTSResult {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
}

export async function generateTTSAudio(
  text: string,
  prosodyInstructions: string
): Promise<TTSResult> {
  const ai = getGeminiClient();
  const ttsPrompt = `INSTRUÇÃO DE PROSÓDIA: ${prosodyInstructions}
CONTEÚDO: ${text}`;

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
    throw new Error('No audio data returned from TTS');
  }

  // Use shared AudioContext if available (initialized on user gesture)
  // Fall back to creating a new one if not available
  let ctx = getSharedAudioContext();
  if (!ctx || ctx.state === 'closed') {
    ctx = await initAudioContext();
  }

  // Ensure context is running (mobile may have suspended it)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const buffer = await decodeAudioData(
    decode(base64Audio),
    ctx,
    AUDIO_CONFIG.OUTPUT_SAMPLE_RATE,
    AUDIO_CONFIG.CHANNELS
  );

  return { audioBuffer: buffer, audioContext: ctx };
}
