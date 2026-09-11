// Web Speech Synthesis wrapper for elderly dementia accessibility & multi-lingual speech
// Features BCP-47 locale matching, natural Indian English and regional Indian voices, and acoustic tuning

/**
 * Maps app language codes to standardized BCP-47 locale tags.
 */
export const getBcp47Locale = (langCode: string = 'en'): string => {
  const code = langCode.toLowerCase().trim();
  switch (code) {
    case 'en':
    case 'en-in':
      return 'en-IN';
    case 'hi':
    case 'hi-in':
      return 'hi-IN';
    case 'as':
    case 'as-in':
      return 'as-IN';
    case 'bn':
    case 'bn-in':
      return 'bn-IN';
    case 'gu':
    case 'gu-in':
      return 'gu-IN';
    case 'mr':
    case 'mr-in':
      return 'mr-IN';
    case 'ta':
    case 'ta-in':
      return 'ta-IN';
    case 'te':
    case 'te-in':
      return 'te-IN';
    case 'kn':
    case 'kn-in':
      return 'kn-IN';
    case 'ml':
    case 'ml-in':
      return 'ml-IN';
    case 'pa':
    case 'pa-in':
      return 'pa-IN';
    case 'mni':
    case 'mni-in':
      return 'mni-IN';
    case 'lus':
    case 'lus-in':
      return 'lus-IN';
    default:
      return code.includes('-') ? code : `${code}-IN`;
  }
};

/**
 * Intelligent Voice Selection:
 * Prioritizes natural, Google, Microsoft, and Apple Indian-accent voices.
 */
export const getPreferredVoice = (
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | undefined => {
  if (!voices || voices.length === 0) return undefined;

  const bcpCode = getBcp47Locale(langCode);
  const primaryLang = bcpCode.split('-')[0].toLowerCase();

  // 1. Direct language matches (e.g. "hi-IN", "hi", "as-IN", "bn-IN")
  let langMatches = voices.filter(v => {
    const vLang = v.lang.replace('_', '-').toLowerCase();
    return vLang.startsWith(primaryLang);
  });

  // Fallback for Assamese / Manipuri / Mizo if specific regional voice is not installed on device
  if (langMatches.length === 0) {
    if (primaryLang === 'as') {
      // Assamese fallback to Bengali (same script roots) or Hindi
      langMatches = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('bn'));
      if (langMatches.length === 0) {
        langMatches = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('hi'));
      }
    } else if (primaryLang === 'mni' || primaryLang === 'lus') {
      langMatches = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('hi'));
    }
  }

  // 2. Prefer natural, Google, Microsoft, or Apple Indian accent voices in the matched language
  if (langMatches.length > 0) {
    const preferred = langMatches.find(v =>
      /natural|online|google|neerja|swara|veena|rishi|lekha/i.test(v.name)
    ) || langMatches.find(v => v.lang.toUpperCase().includes('IN')) || langMatches[0];

    if (preferred) return preferred;
  }

  // 3. Fallback to Indian English if target regional voice is not installed on the device
  const indianEnglish = voices.find(v =>
    (v.lang.replace('_', '-').toLowerCase() === 'en-in' || /india/i.test(v.name)) &&
    /natural|online|google|neerja|swara|veena|rishi|lekha/i.test(v.name)
  ) || voices.find(v =>
    v.lang.replace('_', '-').toLowerCase() === 'en-in' || /india/i.test(v.name)
  );

  if (indianEnglish) return indianEnglish;

  // 4. Default fallback to clear English or first available system voice
  return voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
};

import { playSarvamSpeech, stopSarvamSpeech, isSarvamSpeaking } from '../services/sarvamTts';

class SpeechSynthesizer {
  private isAvailable: boolean;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (this.isAvailable) {
      this.initVoiceCache();
    }
  }

  private initVoiceCache(): void {
    const updateVoices = () => {
      const loaded = window.speechSynthesis.getVoices();
      if (loaded && loaded.length > 0) {
        this.voices = loaded;
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  /**
   * Browser SpeechSynthesis fallback implementation
   */
  private speakWithBrowserSynth(text: string, onStart?: () => void, onEnd?: () => void, langCode: string = 'en'): void {
    if (!this.isAvailable) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.pitch = 1.02;

      const availableVoices = this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices();
      const resolvedLang = langCode || (typeof window !== 'undefined' ? localStorage.getItem('smriti_language') || 'en' : 'en');
      const preferredVoice = getPreferredVoice(availableVoices, resolvedLang);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = getBcp47Locale(resolvedLang);
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('[Speech] Browser synthesis playback ended or was interrupted:', e);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[Speech] Browser synthesis error:', err);
      onEnd?.();
    }
  }

  /**
   * Primary Speak Method:
   * Uses Sarvam AI (model: bulbul:v3) for natural Indian voices and regional dialects,
   * falling back cleanly to browser speech synthesis if offline or unconfigured.
   */
  async speak(text: string, onStart?: () => void, onEnd?: () => void, langCode: string = 'en'): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) {
      onEnd?.();
      return;
    }

    // Stop any previous speech playback
    this.stop();

    const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
    const hasSarvamKey = !!apiKey && apiKey !== 'your-sarvam-api-key';

    if (hasSarvamKey) {
      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (!fallbackTriggered) {
          fallbackTriggered = true;
          this.speakWithBrowserSynth(text, onStart, onEnd, langCode);
        }
      };

      try {
        await playSarvamSpeech(text, langCode, {
          onStart,
          onEnd,
          onError: (err) => {
            console.warn('[Speech] Sarvam TTS audio playback notice, falling back to browser synthesis:', err);
            triggerFallback();
          },
        });
        return;
      } catch (err: any) {
        console.warn('[Speech] Sarvam TTS request notice, falling back to browser synthesis:', err?.message || err);
        triggerFallback();
        return;
      }
    }

    // Fallback to browser SpeechSynthesis
    this.speakWithBrowserSynth(text, onStart, onEnd, langCode);
  }

  stop(): void {
    stopSarvamSpeech();
    if (this.isAvailable) {
      window.speechSynthesis.cancel();
    }
  }

  isSpeaking(): boolean {
    return isSarvamSpeaking() || (this.isAvailable ? window.speechSynthesis.speaking : false);
  }
}

export const speechSynth = new SpeechSynthesizer();
