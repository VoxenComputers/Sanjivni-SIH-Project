import { GoogleGenAI } from '@google/genai';

/**
 * Centrally retrieves the Gemini API key across all execution environments
 * (Vite localhost, Vercel production build, Vercel Serverless, and browser localStorage override).
 */
export const getGeminiApiKey = (): string => {
  // 1. Browser runtime manual override (allows testing on Vercel immediately without waiting for redeploy)
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('sanjivni_gemini_api_key');
    if (customKey && customKey.trim() !== '' && customKey !== 'your-gemini-api-key') {
      return customKey.trim();
    }
  }

  // 2. Vite import.meta.env (primary production build injection)
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (viteKey && viteKey !== 'your-gemini-api-key' && viteKey.trim() !== '') {
    return viteKey.trim();
  }

  // 3. Fallbacks for alternative Vercel env variable naming (e.g. GEMINI_API_KEY without VITE_)
  const altViteKey = (import.meta.env as any).GEMINI_API_KEY || (import.meta.env as any).NEXT_PUBLIC_GEMINI_API_KEY;
  if (altViteKey && altViteKey !== 'your-gemini-api-key' && altViteKey.trim() !== '') {
    return altViteKey.trim();
  }

  // 4. Node process.env (available during SSR or when defined via vite.config.ts)
  if (typeof process !== 'undefined' && process.env) {
    const procKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (procKey && procKey !== 'your-gemini-api-key' && procKey.trim() !== '') {
      return procKey.trim();
    }
  }

  return '';
};

/**
 * Checks whether a valid Gemini API key is present
 */
export const isGeminiConfigured = (): boolean => {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10 && key !== 'your-gemini-api-key');
};

/**
 * Saves a browser-level manual key override
 */
export const setCustomGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (!key || key.trim() === '') {
      localStorage.removeItem('sanjivni_gemini_api_key');
    } else {
      localStorage.setItem('sanjivni_gemini_api_key', key.trim());
    }
  }
};

/**
 * Supported Gemini models in order of preferred stability
 */
export const GEMINI_MODEL_CASCADE = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * Quick diagnostic ping to verify if the configured Gemini key is active
 */
export const testGeminiConnection = async (
  keyOverride?: string
): Promise<{ success: boolean; model?: string; message: string; latencyMs?: number }> => {
  const apiKey = keyOverride?.trim() || getGeminiApiKey();

  if (!apiKey) {
    return {
      success: false,
      message: 'No Gemini API key found. Please configure VITE_GEMINI_API_KEY in Vercel Environment Variables.',
    };
  }

  const start = performance.now();
  const ai = new GoogleGenAI({ apiKey });

  for (const model of GEMINI_MODEL_CASCADE) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: 'Ping',
        config: { maxOutputTokens: 10 },
      });

      const latencyMs = Math.round(performance.now() - start);
      return {
        success: true,
        model,
        message: `Successfully connected to ${model} in ${latencyMs}ms. Response: "${res.text?.trim()}"`,
        latencyMs,
      };
    } catch (err: any) {
      console.warn(`[Gemini Diagnostics] ${model} ping failed:`, err?.message || err);
      // Continue cascade
    }
  }

  return {
    success: false,
    message: 'Failed to connect to Google Gemini. Please verify your API key and quota in Google AI Studio.',
  };
};
