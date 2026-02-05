import { decode, decodeAudioData } from './audioUtils';
import { AUDIO_CONFIG } from '@/constants/config';
import { getSharedAudioContext, initAudioContext } from './audioContextManager';
import { fetchWithRetry } from './fetchWithRetry';

export interface TTSResult {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
}

export async function generateTTSAudio(
  text: string,
  prosodyInstructions: string
): Promise<TTSResult> {
  const response = await fetchWithRetry(
    '/api/tts',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prosodyInstructions }),
    },
    { maxRetries: 2, baseDelayMs: 500 }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `TTS API error: ${response.status}`);
  }

  const { audio: base64Audio } = await response.json();
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
