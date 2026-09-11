import { useState, useEffect, useCallback, useRef } from 'react';
import {
  speakText,
  stopSpeech,
  subscribeToTtsState,
  isSpeakingNow,
  SarvamTtsOptions,
} from '../services/sarvamTts';

export interface UseTtsReturn {
  speak: (text: string, options?: SarvamTtsOptions) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

/**
 * Global React Hook for standardized Text-to-Speech (TTS)
 * Powered by Sarvam AI "Shubh" Voice (bulbul:v3)
 * Reactively tracks global speaking state for live UI audio indicators
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

  const speak = useCallback(async (text: string, options?: SarvamTtsOptions): Promise<void> => {
    if (!text || !text.trim()) return;
    await speakText(text, options);
  }, []);

  const stop = useCallback((): void => {
    stopSpeech();
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
  };
};

export default useTts;
