import { useRef, useCallback, MutableRefObject } from 'react';
import { float32ToInt16 } from '@/services/audioUtils';
import { AUDIO_CONFIG } from '@/constants/config';

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

export function useAudioExport(rawBuffers: MutableRefObject<Float32Array[]>) {
  const hasAudio = rawBuffers.current.length > 0;

  const getWavBlob = useCallback((): Blob | null => {
    if (rawBuffers.current.length === 0) return null;

    // Concatenate all buffers
    const totalLength = rawBuffers.current.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of rawBuffers.current) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    // Convert to Int16 PCM
    const pcm16 = float32ToInt16(combined);
    const pcmBytes = new Uint8Array(pcm16.buffer);

    // Write WAV header
    const header = writeWavHeader(
      pcmBytes.byteLength,
      AUDIO_CONFIG.INPUT_SAMPLE_RATE,
      AUDIO_CONFIG.CHANNELS,
      16
    );

    return new Blob([header, pcmBytes], { type: 'audio/wav' });
  }, [rawBuffers]);

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

  const clear = useCallback(() => {
    rawBuffers.current = [];
  }, [rawBuffers]);

  return { hasAudio, getWavBlob, downloadWAV, clear };
}
