/**
 * Sarvam AI Text-to-Speech (TTS) Service
 * Model: bulbul:v3 (upgraded from bulbul:v1)
 * API Endpoint: https://api.sarvam.ai/text-to-speech
 */

const SARVAM_API_ENDPOINT = 'https://api.sarvam.ai/text-to-speech';

// In-memory cache mapping `${lang}:${speaker}:${text}` to base64 audio data
const audioCache = new Map<string, string>();

// Global active Audio element to ensure previous speech instances are paused cleanly
let currentAudioInstance: HTMLAudioElement | null = null;
let currentRequestId = 0;

export interface SarvamTtsOptions {
  speaker?: string;
  pitch?: number;
  pace?: number;
  loudness?: number;
  speechSampleRate?: number;
  enablePreprocessing?: boolean;
  model?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Maps app languages dynamically to valid Sarvam BCP-47 language codes
 */
export const mapToSarvamLanguageCode = (appLang: string = 'en'): string => {
  const code = appLang.toLowerCase().trim();
  switch (code) {
    case 'en':
    case 'en-in':
      return 'en-IN';
    case 'hi':
    case 'hi-in':
      return 'hi-IN';
    case 'bn':
    case 'bn-in':
      return 'bn-IN';
    case 'as':
    case 'as-in':
      // Assamese fallback cleanly to Bengali (identical script roots) or Hindi
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
    case 'od':
    case 'od-in':
      return 'od-IN';
    case 'mni':
    case 'mni-in':
    case 'lus':
    case 'lus-in':
      return 'hi-IN';
    default:
      return 'en-IN';
  }
};

/**
 * Synthesizes speech from text using Sarvam AI API
 * Returns base64 encoded audio string
 */
export const synthesizeSarvamSpeech = async (
  text: string,
  langCode: string = 'en',
  options: SarvamTtsOptions = {}
): Promise<string> => {
  const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
  if (!apiKey || apiKey === 'your-sarvam-api-key') {
    throw new Error('Sarvam API key is not configured in environment (VITE_SARVAM_API_KEY)');
  }

  const targetLanguage = mapToSarvamLanguageCode(langCode);

  // Model compatibility: bulbul:v3 is the active model on Sarvam AI
  const model = options.model === 'bulbul:v1' || !options.model ? 'bulbul:v3' : options.model;

  // Speaker compatibility: 'priya' is the natural warm Indian female voice matching Dr. Priya
  let speaker = options.speaker || 'priya';
  if (speaker === 'meera') {
    speaker = 'priya';
  }

  const cacheKey = `${targetLanguage}:${speaker}:${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const payload = {
    inputs: [text.trim()],
    target_language_code: targetLanguage,
    speaker: speaker,
    pitch: options.pitch ?? 0,
    pace: options.pace ?? 0.9,
    loudness: options.loudness ?? 1.5,
    speech_sample_rate: options.speechSampleRate ?? 22050,
    enable_preprocessing: options.enablePreprocessing ?? true,
    model: model,
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
 * Plays speech using Sarvam AI synthesized audio.
 * Manages audio lifecycle, singleton instance resetting, and callbacks.
 */
export const playSarvamSpeech = async (
  text: string,
  langCode: string = 'en',
  options: SarvamTtsOptions = {}
): Promise<HTMLAudioElement | null> => {
  stopSarvamSpeech();
  const requestId = ++currentRequestId;

  const base64Audio = await synthesizeSarvamSpeech(text, langCode, options);

  // If stopped or superseded while synthesizing, abort playback
  if (requestId !== currentRequestId) {
    return null;
  }

  const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
  currentAudioInstance = audio;

  audio.onplay = () => {
    if (requestId === currentRequestId) {
      options.onStart?.();
    }
  };

  audio.onended = () => {
    if (currentAudioInstance === audio) {
      currentAudioInstance = null;
    }
    if (requestId === currentRequestId) {
      options.onEnd?.();
    }
  };

  audio.onerror = (e) => {
    if (currentAudioInstance === audio) {
      currentAudioInstance = null;
    }
    if (requestId === currentRequestId) {
      options.onError?.(e);
      options.onEnd?.();
    }
  };

  try {
    await audio.play();
  } catch (playErr) {
    if (requestId === currentRequestId) {
      options.onError?.(playErr);
      options.onEnd?.();
    }
    throw playErr;
  }

  return audio;
};

/**
 * Cleanly stops and resets any currently playing Sarvam audio
 */
export const stopSarvamSpeech = (): void => {
  currentRequestId++;
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentAudioInstance = null;
  }
};

/**
 * Checks if Sarvam audio is currently playing
 */
export const isSarvamSpeaking = (): boolean => {
  return !!(currentAudioInstance && !currentAudioInstance.paused && !currentAudioInstance.ended);
};
