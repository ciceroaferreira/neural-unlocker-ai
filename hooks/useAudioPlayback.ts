import { useState, useRef, useCallback } from 'react';
import { generateTTSAudio } from '@/services/ttsService';
import { getProfileInstructions } from '@/constants/prompts';

export function useAudioPlayback(vocalWarmth: number) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<number | null>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const currentCtxRef = useRef<AudioContext | null>(null);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch (e) {}
      currentAudioSource.current = null;
    }
    if (currentCtxRef.current) {
      currentCtxRef.current.close().catch(() => {});
      currentCtxRef.current = null;
    }
    setPlayingId(null);
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
        currentCtxRef.current = audioContext;
        setPlayingId(id);
        setLoadingAudioId(null);

        source.onended = () => {
          setPlayingId(prev => (prev === id ? null : prev));
          audioContext.close().catch(() => {});
          if (currentAudioSource.current === source) {
            currentAudioSource.current = null;
            currentCtxRef.current = null;
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

  const playIntroAudio = useCallback(
    async (
      text: string,
      onVolumeUpdate: (vol: number) => void,
      onEnded: () => void
    ) => {
      const prosody = 'Use tom calmo, acolhedor e profundo. Fale com extrema calma.';
      const { audioBuffer, audioContext } = await generateTTSAudio(text, prosody);

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
      updateVolume();

      source.onended = () => {
        animating = false;
        onVolumeUpdate(0);
        onEnded();
        audioContext.close().catch(() => {});
      };
      source.start(0);
    },
    []
  );

  return {
    playingId,
    loadingAudioId,
    playVoice,
    playIntroAudio,
    stopCurrentAudio,
  };
}
