/**
 * Sarvam AI Speech-to-Text (STT) Service
 * Model: saaras:v1
 * API Endpoint: https://api.sarvam.ai/speech-to-text
 */

export interface SarvamSttResponse {
  transcript: string;
  language_code?: string;
}

/**
 * Maps app languages to supported Sarvam STT language codes
 */
export const mapToSarvamSttLanguage = (appLang: string = 'en'): string => {
  const code = appLang.toLowerCase().trim();
  switch (code) {
    case 'hi':
    case 'hi-in':
      return 'hi-IN';
    case 'bn':
    case 'bn-in':
    case 'as':
    case 'as-in':
      return 'bn-IN'; // Sarvam maps Assamese speech cleanly to Indic-Eastern (bn-IN / hi-IN)
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
    case 'en':
    case 'en-in':
    default:
      return 'en-IN';
  }
};

/**
 * Transcribes an audio Blob (WebM or WAV) into text using the Sarvam AI STT API.
 */
export const transcribeAudioWithSarvam = async (
  audioBlob: Blob,
  languageCode: string = 'en-IN'
): Promise<string> => {
  const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
  if (!apiKey || apiKey === 'your-sarvam-api-key' || apiKey.trim() === '') {
    throw new Error('Sarvam API key not configured.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio_recording.webm');
  formData.append('model', 'saaras:v1');
  formData.append('language_code', mapToSarvamSttLanguage(languageCode));

  const response = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam STT HTTP ${response.status}: ${errorText}`);
  }

  const data: SarvamSttResponse = await response.json();
  return data.transcript?.trim() || '';
};
