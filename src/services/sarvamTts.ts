/**
 * Sarvam AI Bulbul v3 Text-to-Speech (TTS) Service
 * Strictly uses Sarvam REST API (bulbul:v3, speaker: shubh)
 * Native browser speech synthesis is completely purged.
 */

let currentAudio: HTMLAudioElement | null = null;
let activeRequestId = 0;
const audioCache = new Map<string, string>();

// Reactive state listeners for UI components
const stateListeners = new Set<(isSpeaking: boolean) => void>();

const notifyListeners = (speaking: boolean): void => {
  stateListeners.forEach((fn) => {
    try {
      fn(speaking);
    } catch (e) {
      console.warn('[Sarvam TTS] Listener error:', e);
    }
  });
};

export const subscribeToTtsState = (listener: (isSpeaking: boolean) => void): (() => void) => {
  stateListeners.add(listener);
  listener(isSpeakingNow());
  return () => {
    stateListeners.delete(listener);
  };
};

export const isSpeakingNow = (): boolean => {
  return !!(
    currentAudio &&
    !currentAudio.paused &&
    !currentAudio.ended &&
    currentAudio.currentTime > 0
  );
};

export const stopAudio = (): void => {
  activeRequestId++;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
      currentAudio.onplay = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  notifyListeners(false);
};

/**
 * Clean text: strip markdown syntax, links, emojis, and symbols
 */
export const cleanTextForSpeech = (rawText: string): string => {
  if (!rawText) return '';

  return rawText
    // Markdown links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Markdown images: ![alt](url) -> empty
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Markdown formatting characters
    .replace(/[*#_`~>[\]()]/g, '')
    // Unicode emojis and pictographic symbols
    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Common special symbols
    .replace(/[⚠️🚨⏰🔔💡✨🎉❤️💊🩺📞🚨]/g, '')
    // Collapse consecutive whitespaces
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2400);
};

export const playSarvamTts = async (rawText: string): Promise<boolean> => {
  // Stop any active playing audio immediately
  stopAudio();
  const reqId = ++activeRequestId;

  const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
  if (!apiKey || apiKey === 'your-sarvam-api-key' || apiKey.trim() === '') {
    console.error('[Sarvam TTS] Missing VITE_SARVAM_API_KEY in environment');
    return false;
  }

  // Strip Markdown, emojis, and symbols
  const cleanText = cleanTextForSpeech(rawText);
  if (!cleanText) return false;

  // Check cache first to save credits
  if (audioCache.has(cleanText)) {
    const base64 = audioCache.get(cleanText)!;
    if (reqId === activeRequestId) {
      return playBase64Audio(base64, reqId);
    }
    return false;
  }

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey.trim()
      },
      body: JSON.stringify({
        text: cleanText,
        language_code: 'hi-IN',
        model: 'bulbul:v3',
        speaker: 'shubh'
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[Sarvam TTS] API Error ${response.status}:`, errBody);
      return false;
    }

    const data = await response.json();
    if (!data.audios || !data.audios[0]) {
      console.error('[Sarvam TTS] No audio returned in response:', data);
      return false;
    }

    const base64Audio = data.audios[0];
    audioCache.set(cleanText, base64Audio);

    if (reqId === activeRequestId) {
      return playBase64Audio(base64Audio, reqId);
    }
    return false;
  } catch (error) {
    console.error('[Sarvam TTS] Network/Playback failed:', error);
    return false;
  }
};

const playBase64Audio = async (base64Audio: string, reqId: number): Promise<boolean> => {
  try {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    currentAudio = audio;

    audio.onplay = () => {
      if (reqId === activeRequestId) {
        notifyListeners(true);
      }
    };

    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (reqId === activeRequestId) {
        notifyListeners(false);
      }
    };

    audio.onerror = (e) => {
      console.error('[Sarvam TTS] Audio element playback error:', e);
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (reqId === activeRequestId) {
        notifyListeners(false);
      }
    };

    await audio.play();
    return true;
  } catch (err) {
    console.error('[Sarvam TTS] Audio play() promise error:', err);
    notifyListeners(false);
    return false;
  }
};

// Aliases for seamless drop-in compatibility across the application
export const speak = async (text: string): Promise<boolean> => {
  return playSarvamTts(text);
};

export const stop = (): void => {
  stopAudio();
};

export const speakText = speak;
export const stopSpeech = stopAudio;
export const stopSarvamSpeech = stopAudio;
export const isSarvamSpeaking = isSpeakingNow;
export const stripTextArtifacts = cleanTextForSpeech;
export const normalizeTtsText = cleanTextForSpeech;
export const playSarvamSpeech = async (text: string): Promise<boolean> => {
  return playSarvamTts(text);
};
