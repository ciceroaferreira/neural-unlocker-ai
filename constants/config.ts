export const GEMINI_MODELS = {
  TTS: 'gemini-2.5-flash-preview-tts',
  LIVE_AUDIO: 'gemini-2.5-flash-native-audio-preview-12-2025',
} as const;

export const OPENAI_MODELS = {
  ANALYSIS: 'gpt-4o',
} as const;

export const AUDIO_CONFIG = {
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  BUFFER_SIZE: 4096,
  CHANNELS: 1,
  TTS_VOICE: 'Zephyr',
} as const;
