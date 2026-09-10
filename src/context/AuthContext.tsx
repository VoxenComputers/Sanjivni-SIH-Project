import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getAuthRedirectUrl } from '../lib/supabase';

export interface AppUserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  appUser: AppUserProfile | null;
  isLoggedIn: boolean;
  isDemoUser: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithDemo: (demoUser?: { name?: string; email?: string; avatar?: string }) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [demoUser, setDemoUserState] = useState<AppUserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smriti_demo_session') || localStorage.getItem('smriti_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse cached session', e);
      }
    }
    return null;
  });

  // Extract consolidated user profile for application UI
  const appUser = useMemo<AppUserProfile | null>(() => {
    if (user) {
      const meta = user.user_metadata || {};
      const name = 
        meta.full_name || 
        meta.name || 
        (user.email ? user.email.split('@')[0] : 'SANJIVNI User');
      const avatar = 
        meta.avatar_url || 
        meta.picture || 
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
      return {
        id: user.id,
        email: user.email || '',
        name,
        avatar,
      };
    }
    if (demoUser) {
      return demoUser;
    }
    return null;
  }, [user, demoUser]);

  const isLoggedIn = !!appUser;
  const isDemoUser = !user && !!demoUser;

  // Initialize and listen to Supabase auth events
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[Supabase Auth] Session fetch error:', sessionError.message);
        }

        if (isMounted) {
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
            setDemoUserState(null); // Supabase session takes precedence
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Supabase Auth] Initialization exception:', err);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to onAuthStateChange for OAuth hash and session lifecycle events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          setDemoUserState(null);
          setError(null);

          // Clean URL hash/search if returning from OAuth redirect
          if (
            typeof window !== 'undefined' && 
            (window.location.hash.includes('access_token') || window.location.search.includes('code='))
          ) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setDemoUserState(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const redirectTo = getAuthRedirectUrl();
      console.log('[Supabase Auth] Initiating Google OAuth with redirect URL:', redirectTo);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      console.error('[Supabase OAuth Error]', err);
      setError(
        err?.message || 
        'Could not initiate Google sign-in. Please verify your Supabase Google provider settings or use the Quick Demo Login.'
      );
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      if (session) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Supabase Auth] Sign out error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setDemoUserState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('smriti_session');
        localStorage.removeItem('smriti_demo_session');
        localStorage.removeItem('smriti_user_role');
        localStorage.removeItem('smriti_is_paired');
      }
      setLoading(false);
    }
  };

  // Hackathon Safety Fallback: 1-click offline demo bypass
  const signInWithDemo = (demoData?: { name?: string; email?: string; avatar?: string }) => {
    const profile: AppUserProfile = {
      id: 'demo-bhaben-baruah',
      name: demoData?.name || 'Bhaben Baruah (Koka)',
      email: demoData?.email || 'bhaben.baruah@assamcare.in',
      avatar: demoData?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    };
    setDemoUserState(profile);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_demo_session', JSON.stringify(profile));
      localStorage.setItem('smriti_session', JSON.stringify(profile));
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    session,
    loading,
    appUser,
    isLoggedIn,
    isDemoUser,
    error,
    signInWithGoogle,
    signOut,
    signInWithDemo,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
