import { useState, useRef, useCallback, MutableRefObject } from 'react';
import { encode, float32ToInt16 } from '@/services/audioUtils';
import { AUDIO_CONFIG } from '@/constants/config';

export interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  volume: number;
  rawBuffers: MutableRefObject<Float32Array[]>;
  startCapture: () => Promise<{
    onAudioProcess: (callback: (base64: string, rawData: Float32Array) => void) => void;
    stop: () => void;
  }>;
  stopCapture: () => void;
  togglePause: () => void;
}

export function useAudioRecording(): AudioRecordingState {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0);

  const isPausedRef = useRef(false);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rawBuffers = useRef<Float32Array[]>([]);

  const cleanup = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      if (inputAudioCtxRef.current.state !== 'closed') {
        inputAudioCtxRef.current.close().catch(() => {});
      }
      inputAudioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVolume(0);
    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const startCapture = useCallback(async () => {
    cleanup();
    rawBuffers.current = [];

    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE,
    });
    inputAudioCtxRef.current = inputCtx;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    await inputCtx.resume();

    const source = inputCtx.createMediaStreamSource(stream);
    const scriptNode = inputCtx.createScriptProcessor(AUDIO_CONFIG.BUFFER_SIZE, 1, 1);
    scriptProcessorRef.current = scriptNode;

    let audioCallback: ((base64: string, rawData: Float32Array) => void) | null = null;

    scriptNode.onaudioprocess = (e) => {
      if (isPausedRef.current) {
        setVolume(0);
        return;
      }

      const data = e.inputBuffer.getChannelData(0);
      const rawData = new Float32Array(data);

      // Calculate RMS volume
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      setVolume(Math.sqrt(sum / data.length));

      // Accumulate raw buffer for WAV export (keep for backward compatibility)
      rawBuffers.current.push(rawData);

      // Convert and send to callback
      const pcm16 = float32ToInt16(data);
      const base64 = encode(new Uint8Array(pcm16.buffer));
      if (audioCallback) audioCallback(base64, rawData);
    };

    source.connect(scriptNode);
    scriptNode.connect(inputCtx.destination);
    setIsRecording(true);
    setIsPaused(false);
    isPausedRef.current = false;

    return {
      onAudioProcess: (callback: (base64: string, rawData: Float32Array) => void) => {
        audioCallback = callback;
      },
      stop: cleanup,
    };
  }, [cleanup]);

  const stopCapture = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const next = !prev;
      isPausedRef.current = next;
      if (next) setVolume(0);
      return next;
    });
  }, []);

  return {
    isRecording,
    isPaused,
    volume,
    rawBuffers,
    startCapture,
    stopCapture,
    togglePause,
  };
}
