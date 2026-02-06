/**
 * Shared AudioContext manager for mobile compatibility.
 * Mobile browsers require AudioContext to be created/resumed in direct response
 * to a user gesture. This manager ensures we create it once on user interaction
 * and reuse it for all audio operations.
 *
 * IMPORTANT: iOS Safari ignores the sampleRate option and uses the hardware's
 * native sample rate (usually 48000 Hz). We let it use the native rate and
 * handle resampling in the audio decoding.
 */

let sharedContext: AudioContext | null = null;
let initPromise: Promise<AudioContext> | null = null;

export function getSharedAudioContext(): AudioContext | null {
  return sharedContext;
}

/**
 * Initialize or resume the shared AudioContext.
 * MUST be called directly from a user gesture (click/tap handler).
 *
 * NOTE: We don't specify a sampleRate to let iOS use its native rate.
 * The audio will be resampled when creating AudioBuffers.
 *
 * Uses Promise-based lock to prevent race condition where multiple
 * concurrent calls could create multiple AudioContext instances.
 */
export async function initAudioContext(): Promise<AudioContext> {
  // Race condition guard: reuse pending init promise
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (!sharedContext) {
      // Don't specify sampleRate - let the device use its native rate
      // iOS Safari will ignore sampleRate anyway and use 48000 Hz
      sharedContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext created with sample rate:', sharedContext.sampleRate);
    }

    // Mobile browsers may suspend the context - resume it
    if (sharedContext.state === 'suspended') {
      await sharedContext.resume();
      console.log('AudioContext resumed, state:', sharedContext.state);
    }

    return sharedContext;
  })();

  try {
    return await initPromise;
  } finally {
    // Clear promise after resolution to allow retry on failure
    initPromise = null;
  }
}

/**
 * Check if AudioContext is ready to play audio
 */
export function isAudioContextReady(): boolean {
  return sharedContext !== null && sharedContext.state === 'running';
}

/**
 * Close the shared AudioContext (cleanup on unmount)
 */
export function closeAudioContext(): void {
  if (sharedContext) {
    sharedContext.close().catch(() => {});
    sharedContext = null;
  }
}
// Build trigger 1770129432
