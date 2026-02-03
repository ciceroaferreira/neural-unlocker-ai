
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Simple linear interpolation resampling
 * Converts audio from sourceSampleRate to targetSampleRate
 */
function resampleAudio(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
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

    // Linear interpolation between samples
    output[i] = input[srcIndexFloor] * (1 - fraction) + input[srcIndexCeil] * fraction;
  }

  return output;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sourceSampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const sourceFrameCount = dataInt16.length / numChannels;

  // Convert Int16 to Float32 first
  const sourceData = new Float32Array(sourceFrameCount);
  for (let i = 0; i < sourceFrameCount; i++) {
    sourceData[i] = dataInt16[i * numChannels] / 32768.0;
  }

  // Get the AudioContext's actual sample rate (iOS uses native rate, usually 48000)
  const targetSampleRate = ctx.sampleRate;

  // Resample if needed (e.g., from 24000 Hz to 48000 Hz on iOS)
  const resampledData = resampleAudio(sourceData, sourceSampleRate, targetSampleRate);
  const targetFrameCount = resampledData.length;

  console.log(`Audio resampling: ${sourceSampleRate}Hz -> ${targetSampleRate}Hz (${sourceFrameCount} -> ${targetFrameCount} frames)`);

  // Create buffer at the AudioContext's native sample rate
  const buffer = ctx.createBuffer(numChannels, targetFrameCount, targetSampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < targetFrameCount; i++) {
      channelData[i] = resampledData[i];
    }
  }

  return buffer;
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function float32ToInt16(data: Float32Array): Int16Array {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
  }
  return int16;
}
