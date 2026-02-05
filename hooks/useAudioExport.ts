import { useCallback } from 'react';
import { float32ToInt16 } from '@/services/audioUtils';
import { AUDIO_CONFIG } from '@/constants/config';
import { AudioSegment } from './useSessionAudio';

// Standard output sample rate for WAV export
const EXPORT_SAMPLE_RATE = 24000;

// Silence duration between segments (0.5 seconds)
const SILENCE_SAMPLES = Math.floor(EXPORT_SAMPLE_RATE * 0.5);

function writeWavHeader(
  dataLength: number,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): ArrayBuffer {
  const headerSize = 44;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(headerSize);
  const view = new DataView(buffer);

  // "RIFF"
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  // File size - 8
  view.setUint32(4, 36 + dataLength, true);
  // "WAVE"
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
  // "fmt "
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 = PCM)
  view.setUint16(20, 1, true);
  // NumChannels
  view.setUint16(22, numChannels, true);
  // SampleRate
  view.setUint32(24, sampleRate, true);
  // ByteRate
  view.setUint32(28, byteRate, true);
  // BlockAlign
  view.setUint16(32, blockAlign, true);
  // BitsPerSample
  view.setUint16(34, bitsPerSample, true);
  // "data"
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  // Subchunk2Size
  view.setUint32(40, dataLength, true);

  return buffer;
}

/**
 * Simple linear interpolation resampling
 */
function resampleToRate(input: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    output[i] = input[srcIndexFloor] * (1 - fraction) + input[srcIndexCeil] * fraction;
  }

  return output;
}

/**
 * Create silence buffer
 */
function createSilence(samples: number): Float32Array {
  return new Float32Array(samples);
}

export function useAudioExport(getSegments: () => AudioSegment[]) {
  const getWavBlob = useCallback((): Blob | null => {
    const segments = getSegments();
    if (segments.length === 0) return null;

    // Sort segments by question index and type (question before response)
    const sortedSegments = [...segments].sort((a, b) => {
      if (a.questionIndex !== b.questionIndex) {
        return a.questionIndex - b.questionIndex;
      }
      // Question comes before response
      return a.type === 'question' ? -1 : 1;
    });

    // Resample all segments to export sample rate and combine with silence
    const allBuffers: Float32Array[] = [];
    let prevType: 'question' | 'response' | null = null;

    for (const segment of sortedSegments) {
      // Add silence between segments (but not before first segment)
      if (prevType !== null) {
        // Add longer silence after response (1 second before next question)
        const silenceDuration = prevType === 'response' ? SILENCE_SAMPLES * 2 : SILENCE_SAMPLES;
        allBuffers.push(createSilence(silenceDuration));
      }

      // Resample to export rate
      const resampled = resampleToRate(segment.buffer, segment.sampleRate, EXPORT_SAMPLE_RATE);
      allBuffers.push(resampled);
      prevType = segment.type;
    }

    // Concatenate all buffers
    const totalLength = allBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of allBuffers) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    console.log(`[AudioExport] Combined ${sortedSegments.length} segments, total ${totalLength} samples at ${EXPORT_SAMPLE_RATE}Hz`);

    // Convert to Int16 PCM
    const pcm16 = float32ToInt16(combined);
    const pcmBytes = new Uint8Array(pcm16.buffer);

    // Write WAV header
    const header = writeWavHeader(
      pcmBytes.byteLength,
      EXPORT_SAMPLE_RATE,
      AUDIO_CONFIG.CHANNELS,
      16
    );

    return new Blob([header, pcmBytes], { type: 'audio/wav' });
  }, [getSegments]);

  const downloadWAV = useCallback(() => {
    const blob = getWavBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-unlocker-session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getWavBlob]);

  return { getWavBlob, downloadWAV };
}
