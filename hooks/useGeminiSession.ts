import { useState, useRef, useCallback } from 'react';
import { createLiveTranscriptionSession, LiveSession } from '@/services/transcriptionService';
import { TranscriptionItem } from '@/types/transcription';

/** Maximum character length for a single user message before starting a new entry */
const MAX_MESSAGE_LENGTH = 10_000;

const MAX_RECONNECT_ATTEMPTS = 3;

export function useGeminiSession(onError: (error: any, context: string) => void) {
  const [messages, setMessages] = useState<TranscriptionItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef<LiveSession | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastOnOpenRef = useRef<(() => void) | null>(null);

  const startSession = useCallback(
    async (onOpen: () => void) => {
      lastOnOpenRef.current = onOpen;
      reconnectAttemptsRef.current = 0;

      const session = await createLiveTranscriptionSession({
        onTranscription: (text: string) => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'user' && last.text.length < MAX_MESSAGE_LENGTH) {
              const copy = [...prev];
              copy[copy.length - 1] = { ...last, text: last.text + ' ' + text };
              return copy;
            }
            return [...prev, { role: 'user', text, timestamp: Date.now() }];
          });
        },
        onOpen: () => {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          onOpen();
        },
        onError: (e) => onError(e, 'Live Scan'),
        onClose: () => setIsConnected(false),
        onUnexpectedClose: () => {
          console.warn('[GeminiSession] Unexpected WebSocket close');
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = 1000 * reconnectAttemptsRef.current;
            console.log(`[GeminiSession] Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
            setTimeout(() => {
              if (lastOnOpenRef.current) {
                startSession(lastOnOpenRef.current).catch((err) => {
                  console.error('[GeminiSession] Reconnect failed:', err);
                  onError(err, 'Live Scan Reconnect');
                });
              }
            }, delay);
          } else {
            onError(
              new Error('WebSocket connection lost after maximum reconnect attempts'),
              'Live Scan'
            );
          }
        },
      });
      sessionRef.current = session;
      return session;
    },
    [onError]
  );

  const endSession = useCallback(() => {
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent reconnect after intentional close
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const resetMessages = useCallback(() => setMessages([]), []);

  const addAiMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'ai', text, timestamp: Date.now() }]);
  }, []);

  const addSystemMessage = useCallback((text: string, questionId?: string) => {
    setMessages(prev => [
      ...prev,
      { role: 'system', text, timestamp: Date.now(), questionId },
    ]);
  }, []);

  const getUserInputsSince = useCallback(
    (sinceTimestamp: number): string => {
      return messages
        .filter(m => m.role === 'user' && m.timestamp >= sinceTimestamp)
        .map(m => m.text)
        .join(' ');
    },
    [messages]
  );

  const getAllUserInputs = useCallback((): string => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('; ');
  }, [messages]);

  return {
    messages,
    isConnected,
    sessionRef,
    startSession,
    endSession,
    resetMessages,
    addAiMessage,
    addSystemMessage,
    getUserInputsSince,
    getAllUserInputs,
  };
}
