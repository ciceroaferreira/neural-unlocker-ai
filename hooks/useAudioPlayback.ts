import { useState, useRef, useCallback } from 'react';
import { generateTTSAudio, TTSResult } from '@/services/ttsService';
import { getProfileInstructions } from '@/constants/prompts';
import { getSharedAudioContext, initAudioContext } from '@/services/audioContextManager';

export const QUESTION_PROSODY = `Use tom calmo, acolhedor e profundo. Fale com extrema calma e empatia.
Você é uma guia espiritual e neurocientista lendo uma pergunta para o paciente.
Faça pausas naturais. Velocidade reduzida (0.85x). Ressonância calorosa.`;

export function useAudioPlayback(vocalWarmth: number) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<number | null>(null);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch (e) {}
      currentAudioSource.current = null;
    }
    // Don't close the shared AudioContext - it's reused for all audio
    setPlayingId(null);
    setIsSpeakingQuestion(false);
  }, []);

  const playVoice = useCallback(
    async (text: string, id: number) => {
      if (playingId === id) {
        stopCurrentAudio();
        return;
      }
      stopCurrentAudio();
      setLoadingAudioId(id);

      try {
        const prosody = getProfileInstructions(vocalWarmth);
        const { audioBuffer, audioContext } = await generateTTSAudio(text, prosody);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        currentAudioSource.current = source;
        setPlayingId(id);
        setLoadingAudioId(null);

        source.onended = () => {
          setPlayingId(prev => (prev === id ? null : prev));
          // Don't close shared AudioContext - it's reused
          if (currentAudioSource.current === source) {
            currentAudioSource.current = null;
          }
        };
        source.start(0);
      } catch (e) {
        setLoadingAudioId(null);
        throw e;
      }
    },
    [playingId, stopCurrentAudio, vocalWarmth]
  );

  const playQuestion = useCallback(
    async (text: string, onEnded?: () => void, onAudioReady?: (buffer: AudioBuffer) => void) => {
      stopCurrentAudio();
      setIsSpeakingQuestion(true);

      try {
        const { audioBuffer, audioContext } = await generateTTSAudio(text, QUESTION_PROSODY);

        // Notify caller of the audio buffer (for recording)
        onAudioReady?.(audioBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        currentAudioSource.current = source;

        source.onended = () => {
          setIsSpeakingQuestion(false);
          // Don't close shared AudioContext - it's reused
          currentAudioSource.current = null;
          onEnded?.();
        };
        source.start(0);
      } catch (e) {
        setIsSpeakingQuestion(false);
        throw e;
      }
    },
    [stopCurrentAudio]
  );

  /**
   * Play a question from a pre-cached TTSResult (instant, no API call)
   */
  const playQuestionFromBuffer = useCallback(
    async (cached: TTSResult, onEnded?: () => void, onAudioReady?: (buffer: AudioBuffer) => void) => {
      stopCurrentAudio();
      setIsSpeakingQuestion(true);

      try {
        const { audioBuffer, audioContext } = cached;

        // Ensure context is running
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        onAudioReady?.(audioBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        currentAudioSource.current = source;

        source.onended = () => {
          setIsSpeakingQuestion(false);
          currentAudioSource.current = null;
          onEnded?.();
        };
        source.start(0);
      } catch (e) {
        setIsSpeakingQuestion(false);
        throw e;
      }
    },
    [stopCurrentAudio]
  );

  const playIntroAudio = useCallback(
    async (
      text: string,
      onVolumeUpdate: (vol: number) => void,
      onEnded: () => void,
      onStarted?: () => void
    ) => {
      const { audioBuffer, audioContext } = await generateTTSAudio(text, QUESTION_PROSODY);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      let animating = true;

      const updateVolume = () => {
        if (!animating) return;
        analyzer.getByteFrequencyData(dataArray);
        onVolumeUpdate(dataArray.reduce((a, b) => a + b) / dataArray.length / 128);
        requestAnimationFrame(updateVolume);
      };

      source.onended = () => {
        animating = false;
        onVolumeUpdate(0);
        onEnded();
        // Don't close shared AudioContext - it's reused
      };

      // Start playback and notify
      source.start(0);
      updateVolume();
      onStarted?.();
    },
    []
  );

  return {
    playingId,
    loadingAudioId,
    isSpeakingQuestion,
    playVoice,
    playQuestion,
    playQuestionFromBuffer,
    playIntroAudio,
    stopCurrentAudio,
  };
}
