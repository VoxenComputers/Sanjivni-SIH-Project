import React from 'react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { X, UserPlus, ShieldCheck, User } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, setMode } = useApp();

  if (!isOpen) return null;

  const mockAccounts = [
    {
      id: 'patient-bhaben',
      name: 'Bhaben Baruah (Koka)',
      email: 'bhaben.baruah@assamcare.in',
      role: 'Patient Profile',
      mode: 'patient' as const,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      tag: 'Koka • Beltola, Guwahati',
    },
    {
      id: 'caregiver-priya',
      name: 'Dr. Priya Baruah',
      email: 'dr.priya@dispurhospital.org',
      role: 'Primary Caregiver / Doctor',
      mode: 'caregiver' as const,
      avatar: 'https://images.unsplash.com/photo-1594824813589-989679c6d4ba?w=150&auto=format&fit=crop&q=80',
      tag: 'Cardiologist • Dispur Hospital',
    },
  ];

  const handleSelectAccount = (account: typeof mockAccounts[0]) => {
    soundFx.playClickSound();
    setMode(account.mode);
    loginWithGoogle({
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-auth-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border-3 border-stone-200 dark:border-stone-700 shadow-2xl p-6 sm:p-7 relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClickSound();
            onClose();
          }}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-white dark:bg-stone-800 rounded-2xl border-2 border-stone-200 dark:border-stone-700 shadow-sm">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <h3 id="google-auth-title" className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Sign in with Google
          </h3>
          <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-300 mt-1">
            Choose an authorized account to continue to <span className="text-brand-green-dark dark:text-emerald-400 font-extrabold">SANJIVNI</span>
          </p>
        </div>

        {/* Account List */}
        <div className="space-y-3 mb-6">
          {mockAccounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleSelectAccount(acc)}
              className="w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-700 hover:border-brand-green dark:hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/80 hover:bg-emerald-50/50 dark:hover:bg-stone-800 transition-all flex items-center justify-between gap-3 shadow-sm hover:shadow-duo-green cursor-pointer active:translate-y-0.5 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={acc.avatar}
                  alt={acc.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-stone-300 dark:border-stone-600 group-hover:border-brand-green"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-stone-900 dark:text-white truncate group-hover:text-brand-green-dark dark:group-hover:text-emerald-400">
                      {acc.name}
                    </p>
                    {acc.mode === 'caregiver' ? (
                      <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400 truncate">{acc.email}</p>
                  <span className="inline-block text-[11px] font-extrabold text-stone-600 dark:text-stone-300 mt-0.5">
                    {acc.tag}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {/* Quick Demo Option */}
          <button
            type="button"
            onClick={() => handleSelectAccount(mockAccounts[0])}
            className="w-full p-3 rounded-2xl border-2 border-dashed border-brand-green bg-brand-green-light/40 hover:bg-brand-green-light dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-brand-green-dark dark:text-emerald-300 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Fast Hackathon Demo Login (Instant Access)</span>
          </button>
        </div>

        {/* Security / Privacy notice */}
        <p className="text-center text-[11px] font-bold text-stone-400 leading-relaxed">
          To continue, Google will share your name, email address, and profile picture with SANJIVNI. See our{' '}
          <span className="text-stone-600 dark:text-stone-300 underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};
