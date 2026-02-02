import { Modality, LiveServerMessage } from '@google/genai';
import { getGeminiClient } from './geminiClient';
import { GEMINI_MODELS } from '@/constants/config';
import { TRANSCRIPTION_INSTRUCTION } from '@/constants/prompts';

export interface TranscriptionCallbacks {
  onTranscription: (text: string) => void;
  onOpen: () => void;
  onError: (error: any) => void;
  onClose: () => void;
}

export interface LiveSession {
  sendAudio: (base64Data: string) => void;
  close: () => void;
}

export async function createLiveTranscriptionSession(
  callbacks: TranscriptionCallbacks
): Promise<LiveSession> {
  const ai = getGeminiClient();

  const session = await ai.live.connect({
    model: GEMINI_MODELS.LIVE_AUDIO,
    callbacks: {
      onopen: () => callbacks.onOpen(),
      onmessage: async (m: LiveServerMessage) => {
        if (m.serverContent?.inputTranscription?.text) {
          callbacks.onTranscription(m.serverContent.inputTranscription.text);
        }
      },
      onerror: (e: any) => callbacks.onError(e),
      onclose: () => callbacks.onClose(),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: TRANSCRIPTION_INSTRUCTION,
      inputAudioTranscription: {},
    },
  });

  return {
    sendAudio: (base64Data: string) => {
      try {
        session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' },
        });
      } catch (err) {
        // Silently ignore send errors on closed sessions
      }
    },
    close: () => {
      try {
        session.close();
      } catch (err) {}
    },
  };
}
