import { useState, useRef, useCallback } from 'react';
import { createLiveTranscriptionSession, LiveSession } from '@/services/transcriptionService';
import { TranscriptionItem } from '@/types/transcription';

export function useGeminiSession(onError: (error: any, context: string) => void) {
  const [messages, setMessages] = useState<TranscriptionItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef<LiveSession | null>(null);

  const startSession = useCallback(
    async (onOpen: () => void) => {
      const session = await createLiveTranscriptionSession({
        onTranscription: (text: string) => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'user') {
              const copy = [...prev];
              copy[copy.length - 1] = { ...last, text: last.text + ' ' + text };
              return copy;
            }
            return [...prev, { role: 'user', text, timestamp: Date.now() }];
          });
        },
        onOpen: () => {
          setIsConnected(true);
          onOpen();
        },
        onError: (e) => onError(e, 'Live Scan'),
        onClose: () => setIsConnected(false),
      });
      sessionRef.current = session;
      return session;
    },
    [onError]
  );

  const endSession = useCallback(() => {
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
