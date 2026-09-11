import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const geminiApiKey =
    env.VITE_GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    env.NEXT_PUBLIC_GEMINI_API_KEY ||
    '';

  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xbwivmotxmoopjgbkell.supabase.co';

  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const sarvamApiKey =
    env.VITE_SARVAM_API_KEY ||
    env.SARVAM_API_KEY ||
    '';

  return {
    plugins: [react()],
    define: {
      // Bridges environment variables on Vercel even if user omitted the 'VITE_' prefix in the dashboard
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_SARVAM_API_KEY': JSON.stringify(sarvamApiKey),
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
