import { createClient } from '@supabase/supabase-js';

// Project Supabase Configuration (defaults guarantee Vercel & offline deployments never fail with placeholder URL)
const DEFAULT_SUPABASE_URL = 'https://xbwivmotxmoopjgbkell.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2l2bW90eG1vb3BqZ2JrZWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MjU2MjMsImV4cCI6MjEwNDIwMTYyM30.HEFNmIyAXGN20mAKe96fWD15EVB6hAkZ0yZG9aFRn30';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  DEFAULT_SUPABASE_ANON_KEY;

// Configurable Redirect URL with window.location.origin as default fallback
export const getAuthRedirectUrl = (): string => {
  const customRedirect = import.meta.env.VITE_AUTH_REDIRECT_URL;
  if (customRedirect && typeof customRedirect === 'string' && customRedirect.trim().length > 0) {
    return customRedirect.trim();
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

// Export singleton Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'smriti_supabase_auth_token',
    },
  }
);
