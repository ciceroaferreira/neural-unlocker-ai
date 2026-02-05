import { useRef, useCallback } from 'react';
import { AUDIO_CONFIG } from '@/constants/config';

export interface AudioSegment {
  type: 'question' | 'response';
  questionIndex: number;
  buffer: Float32Array;
  sampleRate: number;
}

/**
 * Manages combined session audio - both TTS questions and mic responses
 * Allows exporting a complete WAV with questions + responses in sequence
 */
export function useSessionAudio() {
  const segments = useRef<AudioSegment[]>([]);
  const currentQuestionIndex = useRef<number>(0);
  const isRecordingResponse = useRef<boolean>(false);
  const currentResponseBuffers = useRef<Float32Array[]>([]);

  const clear = useCallback(() => {
    segments.current = [];
    currentQuestionIndex.current = 0;
    isRecordingResponse.current = false;
    currentResponseBuffers.current = [];
  }, []);

  /**
   * Store a question's TTS audio buffer
   */
  const addQuestionAudio = useCallback((audioBuffer: AudioBuffer, questionIndex: number) => {
    // Extract audio data from AudioBuffer
    const channelData = audioBuffer.getChannelData(0);
    const buffer = new Float32Array(channelData);

    segments.current.push({
      type: 'question',
      questionIndex,
      buffer,
      sampleRate: audioBuffer.sampleRate,
    });

    currentQuestionIndex.current = questionIndex;
    console.log(`[SessionAudio] Added question ${questionIndex} audio (${buffer.length} samples at ${audioBuffer.sampleRate}Hz)`);
  }, []);

  /**
   * Start recording response audio for current question
   */
  const startResponse = useCallback((questionIndex: number) => {
    // Finalize any previous response
    if (currentResponseBuffers.current.length > 0) {
      finalizeCurrentResponse();
    }

    currentQuestionIndex.current = questionIndex;
    isRecordingResponse.current = true;
    currentResponseBuffers.current = [];
    console.log(`[SessionAudio] Started recording response for question ${questionIndex}`);
  }, []);

  /**
   * Add a chunk of response audio (called from mic processor)
   */
  const addResponseChunk = useCallback((data: Float32Array) => {
    if (!isRecordingResponse.current) return;
    currentResponseBuffers.current.push(new Float32Array(data));
  }, []);

  /**
   * Finalize current response and add to segments
   */
  const finalizeCurrentResponse = useCallback(() => {
    if (currentResponseBuffers.current.length === 0) return;

    // Concatenate all response chunks
    const totalLength = currentResponseBuffers.current.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of currentResponseBuffers.current) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    segments.current.push({
      type: 'response',
      questionIndex: currentQuestionIndex.current,
      buffer: combined,
      sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE,
    });

    console.log(`[SessionAudio] Finalized response for question ${currentQuestionIndex.current} (${combined.length} samples)`);
    currentResponseBuffers.current = [];
    isRecordingResponse.current = false;
  }, []);

  /**
   * Move to next question (finalizes current response)
   */
  const nextQuestion = useCallback(() => {
    finalizeCurrentResponse();
    currentQuestionIndex.current++;
  }, [finalizeCurrentResponse]);

  /**
   * Get all segments for export
   */
  const getSegments = useCallback((): AudioSegment[] => {
    // Finalize any pending response
    if (currentResponseBuffers.current.length > 0) {
      finalizeCurrentResponse();
    }
    return [...segments.current];
  }, [finalizeCurrentResponse]);

  const hasAudio = segments.current.length > 0 || currentResponseBuffers.current.length > 0;

  return {
    segments,
    hasAudio,
    clear,
    addQuestionAudio,
    startResponse,
    addResponseChunk,
    nextQuestion,
    getSegments,
    finalizeCurrentResponse,
  };
}
