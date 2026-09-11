/**
 * Speech Synthesis Engine for SANJIVNI
 * Powered 100% by Sarvam AI Bulbul v3 (speaker: shubh).
 * Native browser speech synthesis has been completely purged.
 */

import { playSarvamTts, stopAudio, isSpeakingNow } from '../services/sarvamTts';

class SpeechSynthesizer {
  async speak(text: string, onStart?: () => void, onEnd?: () => void, _lang?: string): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) {
      onEnd?.();
      return;
    }

    onStart?.();
    const success = await playSarvamTts(text);
    if (!success) {
      onEnd?.();
    }
  }

  stop(): void {
    stopAudio();
  }

  isSpeaking(): boolean {
    return isSpeakingNow();
  }
}

export const speechSynth = new SpeechSynthesizer();
