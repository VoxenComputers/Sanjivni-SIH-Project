// Web Speech Synthesis wrapper for elderly dementia accessibility & multi-lingual speech

class SpeechSynthesizer {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void, langCode: string = 'en'): void {
    if (typeof document !== 'undefined' && document.hidden) {
      onEnd?.();
      return;
    }

    if (!this.isAvailable) {
      console.warn('Speech synthesis not supported in this browser.');
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any lingering utterances

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.86; // Soothing, deliberate cadence tailored for elderly comprehension
      utterance.pitch = 1.05; // Warm and friendly tone

      // Select regional voice based on active language
      const voices = window.speechSynthesis.getVoices();
      let preferredVoice: SpeechSynthesisVoice | undefined;

      if (langCode === 'hi') {
        preferredVoice = voices.find(v => v.lang.startsWith('hi'));
      } else if (langCode === 'bn' || langCode === 'as') {
        preferredVoice = voices.find(v => v.lang.startsWith('bn')) || voices.find(v => v.lang.startsWith('hi'));
      } else if (langCode === 'mni' || langCode === 'lus') {
        preferredVoice = voices.find(v => v.lang.includes('IN') || v.lang.startsWith('en-IN'));
      }

      // Default fallback to Indian English or any clear English voice
      if (!preferredVoice) {
        preferredVoice = voices.find(v => 
          v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('India')
        ) || voices.find(v => v.lang.startsWith('en'));
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis playback ended or was interrupted:', e);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Failed to trigger speech synthesis:', e);
      onEnd?.();
    }
  }

  stop(): void {
    if (this.isAvailable) {
      window.speechSynthesis.cancel();
    }
  }

  isSpeaking(): boolean {
    return this.isAvailable ? window.speechSynthesis.speaking : false;
  }
}

export const speechSynth = new SpeechSynthesizer();
