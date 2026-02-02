import { useState, useEffect, useRef } from 'react';
import { NEURAL_STATUS_MESSAGES } from '@/constants/neuralStatus';

export function useNeuralStatus(isActive: boolean): string {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setIdx(prev => (prev + 1) % NEURAL_STATUS_MESSAGES.length);
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  return NEURAL_STATUS_MESSAGES[idx];
}
