/**
 * Sarvam AI Text-to-Speech (TTS) Service
 * Model: bulbul:v3
 * Speaker: shubh
 * Target Language: hi-IN (Hindi / Hinglish support)
 * Pace: 1.0
 * Sample Rate: 22050
 * API Endpoint: https://api.sarvam.ai/text-to-speech
 */

const SARVAM_API_ENDPOINT = 'https://api.sarvam.ai/text-to-speech';

// In-memory cache mapping `${targetLang}:${speaker}:${cleanText}` to base64 audio data
const audioCache = new Map<string, string>();

// Global active Audio element to ensure previous speech instances are stopped immediately
let currentAudioInstance: HTMLAudioElement | null = null;
let currentRequestId = 0;
let isBrowserSpeaking = false;

// Event listeners for reactive state tracking across hooks and components
const stateListeners = new Set<(isSpeaking: boolean) => void>();

export interface SarvamTtsOptions {
  speaker?: string;
  model?: string;
  targetLanguageCode?: string;
  pace?: number;
  pitch?: number;
  loudness?: number;
  speechSampleRate?: number;
  enablePreprocessing?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Notifies all subscribers of TTS speaking state changes
 */
const notifyStateChange = (speaking: boolean): void => {
  stateListeners.forEach((listener) => {
    try {
      listener(speaking);
    } catch (e) {
      console.warn('[SarvamTTS] Listener notification error:', e);
    }
  });
};

/**
 * Subscribes to TTS speaking state changes
 * Returns an unsubscribe callback
 */
export const subscribeToTtsState = (listener: (isSpeaking: boolean) => void): (() => void) => {
  stateListeners.add(listener);
  // Emit current state immediately to the new subscriber
  listener(isSpeakingNow());
  return () => {
    stateListeners.delete(listener);
  };
};

/**
 * Checks whether audio is actively playing (either Sarvam audio or browser fallback)
 */
export const isSpeakingNow = (): boolean => {
  const isAudioElementPlaying = !!(
    currentAudioInstance &&
    !currentAudioInstance.paused &&
    !currentAudioInstance.ended &&
    currentAudioInstance.currentTime > 0
  );
  const isWebSpeechPlaying =
    isBrowserSpeaking ||
    (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);

  return isAudioElementPlaying || isWebSpeechPlaying;
};

// Backward-compatible alias
export const isSarvamSpeaking = isSpeakingNow;

/**
 * Text Normalization:
 * - Strip markdown syntax (**, *, #, _, bullet points, links)
 * - Remove emojis and non-pronounceable symbols
 * - Trim text and enforce Sarvam safety limit (up to 3500 chars in v3; truncate safely at sentence boundary)
 */
export const normalizeTtsText = (rawText: string, maxLength: number = 3500): string => {
  if (!rawText) return '';

  let cleaned = rawText
    // Strip markdown links: [link text](url) -> link text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip markdown images: ![alt](url) -> empty
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Strip bold & italics: **text**, *text*, __text__, _text_
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/[*_]/g, '')
    // Strip strikethrough: ~~text~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Strip headings (# Heading, ## Heading)
    .replace(/^#{1,6}\s+/gm, '')
    // Strip bullet points, numbered lists, blockquotes
    .replace(/^[\s]*[-*+•]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    // Strip code blocks and inline backticks
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // Strip raw URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Strip Unicode emojis and special pictograms
    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Remove non-pronounceable symbols like ⚠️, ⏰, ⭐, etc.
    .replace(/[⚠️🚨⏰🔔💡✨🎉❤️💊🩺📞🚨]/g, '')
    // Collapse consecutive whitespaces and newlines
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce Sarvam safety limit (3500 characters)
  if (cleaned.length > maxLength) {
    const sub = cleaned.slice(0, maxLength);
    // Find the last sentence end marker before the limit
    const lastBoundary = Math.max(
      sub.lastIndexOf('.'),
      sub.lastIndexOf('।'), // Hindi Purna Viram
      sub.lastIndexOf('!'),
      sub.lastIndexOf('?'),
      sub.lastIndexOf(';')
    );

    if (lastBoundary > maxLength * 0.5) {
      cleaned = sub.slice(0, lastBoundary + 1).trim();
    } else {
      const lastSpace = sub.lastIndexOf(' ');
      cleaned = (lastSpace > 0 ? sub.slice(0, lastSpace) : sub).trim() + '.';
    }
  }

  return cleaned;
};

/**
 * Maps app languages dynamically to valid Sarvam BCP-47 language codes
 */
export const mapToSarvamLanguageCode = (appLang: string = 'hi-IN'): string => {
  const code = appLang.toLowerCase().trim();
  switch (code) {
    case 'hi':
    case 'hi-in':
      return 'hi-IN';
    case 'en':
    case 'en-in':
      return 'en-IN';
    case 'bn':
    case 'bn-in':
      return 'bn-IN';
    case 'as':
    case 'as-in':
      return 'bn-IN'; // Sarvam maps Assamese speech cleanly to Indic-Eastern
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
    case 'od':
    case 'od-in':
      return 'od-IN';
    default:
      return 'hi-IN';
  }
};

/**
 * Cleanly stops and resets any currently playing Sarvam audio or browser synthesis
 */
export const stopSpeech = (): void => {
  currentRequestId++;

  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
      currentAudioInstance.src = '';
      currentAudioInstance.onplay = null;
      currentAudioInstance.onended = null;
      currentAudioInstance.onerror = null;
    } catch {
      // ignore
    }
    currentAudioInstance = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  isBrowserSpeaking = false;
  notifyStateChange(false);
};

// Backward-compatible alias
export const stopSarvamSpeech = stopSpeech;

/**
 * Browser SpeechSynthesis fallback implementation
 */
const speakWithBrowserFallback = (
  cleanText: string,
  targetLang: string = 'hi-IN',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    notifyStateChange(false);
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = targetLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.split('-')[0].toLowerCase())) ||
      voices.find((v) => /hindi|india/i.test(v.name));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      isBrowserSpeaking = true;
      notifyStateChange(true);
      onStart?.();
    };

    utterance.onend = () => {
      isBrowserSpeaking = false;
      notifyStateChange(false);
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[SarvamTTS] Browser synthesis fallback interrupted or error:', e);
      isBrowserSpeaking = false;
      notifyStateChange(false);
      onError?.(e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[SarvamTTS] Browser fallback failed:', err);
    isBrowserSpeaking = false;
    notifyStateChange(false);
    onError?.(err);
    onEnd?.();
  }
};

/**
 * Synthesizes speech from text using Sarvam AI API
 * Model: "bulbul:v3"
 * Speaker: "shubh"
 * Target Language: "hi-IN"
 * Returns base64 encoded audio string
 */
export const synthesizeSarvamSpeech = async (
  text: string,
  langCode: string = 'hi-IN',
  options: SarvamTtsOptions = {}
): Promise<string> => {
  const cleanText = normalizeTtsText(text);
  if (!cleanText) {
    throw new Error('Normalized text is empty');
  }

  const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
  if (!apiKey || apiKey === 'your-sarvam-api-key' || apiKey.trim() === '') {
    throw new Error('Sarvam API key is not configured in environment (VITE_SARVAM_API_KEY)');
  }

  const targetLanguage = options.targetLanguageCode || mapToSarvamLanguageCode(langCode);
  const speaker = options.speaker || 'shubh';
  const model = options.model || 'bulbul:v3';
  const pace = options.pace ?? 1.0;
  const sampleRate = options.speechSampleRate ?? 22050;

  // In-Memory Audio Cache lookup
  const cacheKey = `${targetLanguage}:${speaker}:${model}:${pace}:${cleanText}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const payload = {
    inputs: [cleanText],
    target_language_code: targetLanguage,
    speaker: speaker,
    model: model,
    pace: pace,
    speech_sample_rate: sampleRate,
    pitch: options.pitch ?? 0,
    loudness: options.loudness ?? 1.5,
    enable_preprocessing: options.enablePreprocessing ?? true,
  };

  const response = await fetch(SARVAM_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Sarvam TTS failed with status ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.audios || !data.audios[0]) {
    throw new Error('Sarvam TTS API returned empty audio data');
  }

  const base64Audio = data.audios[0];
  audioCache.set(cacheKey, base64Audio);
  return base64Audio;
};

/**
 * Standardized Speak Method:
 * 1. Stops any currently playing audio immediately.
 * 2. Cleans & normalizes dynamic text.
 * 3. Plays Sarvam AI audio with "shubh" voice and "bulbul:v3" model.
 * 4. Falls back gracefully to browser SpeechSynthesis on error or missing API key without breaking the UI.
 */
export const speakText = async (
  text: string,
  options: SarvamTtsOptions = {}
): Promise<void> => {
  const cleanText = normalizeTtsText(text);
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  // Prevent overlapping audio: stop any currently playing audio immediately
  stopSpeech();
  const requestId = ++currentRequestId;

  const targetLang = options.targetLanguageCode || 'hi-IN';

  try {
    const base64Audio = await synthesizeSarvamSpeech(cleanText, targetLang, options);

    // If request was aborted/superseded while synthesizing, do not play
    if (requestId !== currentRequestId) {
      return;
    }

    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    currentAudioInstance = audio;

    audio.onplay = () => {
      if (requestId === currentRequestId) {
        notifyStateChange(true);
        options.onStart?.();
      }
    };

    audio.onended = () => {
      if (currentAudioInstance === audio) {
        currentAudioInstance = null;
      }
      if (requestId === currentRequestId) {
        notifyStateChange(false);
        options.onEnd?.();
      }
    };

    audio.onerror = (e) => {
      if (currentAudioInstance === audio) {
        currentAudioInstance = null;
      }
      if (requestId === currentRequestId) {
        console.warn('[SarvamTTS] Audio playback error, switching to browser fallback:', e);
        speakWithBrowserFallback(cleanText, targetLang, options.onStart, options.onEnd, options.onError);
      }
    };

    await audio.play();
  } catch (err: any) {
    if (requestId === currentRequestId) {
      console.warn('[SarvamTTS] Sarvam request unfulfilled, gracefully falling back to browser speech:', err?.message || err);
      speakWithBrowserFallback(cleanText, targetLang, options.onStart, options.onEnd, options.onError);
    }
  }
};

// Backward-compatible play method returning HTMLAudioElement or null
export const playSarvamSpeech = async (
  text: string,
  langCode: string = 'hi-IN',
  options: SarvamTtsOptions = {}
): Promise<HTMLAudioElement | null> => {
  await speakText(text, { ...options, targetLanguageCode: options.targetLanguageCode || langCode });
  return currentAudioInstance;
};
