import { useState, useEffect, useCallback, useRef } from 'react';
import {
  playSarvamTts,
  stopAudio,
  subscribeToTtsState,
  isSpeakingNow,
} from '../services/sarvamTts';

export interface UseTtsReturn {
  speak: (text: string) => Promise<boolean>;
  stop: () => void;
  isSpeaking: boolean;
}

/**
 * React Hook for Sarvam AI Bulbul v3 Text-to-Speech (TTS)
 * Reactively tracks audio playback state for UI speaker indicators
 */
export const useTts = (): UseTtsReturn => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(() => isSpeakingNow());
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Subscribe to centralized TTS state changes
    const unsubscribe = subscribeToTtsState((speaking) => {
      if (isMountedRef.current) {
        setIsSpeaking(speaking);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const speak = useCallback(async (text: string): Promise<boolean> => {
    if (!text || !text.trim()) return false;
    return await playSarvamTts(text);
  }, []);

  const stop = useCallback((): void => {
    stopAudio();
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
  };
};

export default useTts;
