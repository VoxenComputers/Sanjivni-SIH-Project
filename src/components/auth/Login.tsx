import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audio';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../utils/i18n';
import { GoogleAuthModal } from './GoogleAuthModal';
import {
  HeartHandshake,
  Globe,
  BookOpen,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { language, setLanguage, t, setUserManualOpen } = useApp();
  const { signInWithGoogle, signInWithDemo, loading: authLoading, error: authError, clearError } = useAuth();
  const [isInitiatingGoogle, setIsInitiatingGoogle] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSignInGoogle = async () => {
    soundFx.playClickSound();
    setIsInitiatingGoogle(true);
    await signInWithGoogle();
    setIsInitiatingGoogle(false);
  };

  const handleQuickDemo = () => {
    soundFx.playClickSound();
    signInWithDemo({
      name: 'Bhaben Baruah (Koka)',
      email: 'bhaben.baruah@assamcare.in',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FAF8F5] dark:bg-[#1C1917] text-stone-900 dark:text-stone-100 flex flex-col justify-between selection:bg-brand-green-light selection:text-brand-green-dark">
      {/* 4 NER Vector Heritage Background Doodles (Clean Green-Tinted SVGs) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40 dark:opacity-20">
        {/* Landmark 1: Kamakhya Temple (Assam) - Top Left */}
        <div className="absolute -top-6 -left-6 w-80 h-80 text-emerald-800/20 dark:text-emerald-400/20 transform -rotate-6">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* Kalasha & Spire */}
            <path d="M100 20 L100 35 M95 35 L105 35 M100 35 C85 55, 80 80, 80 110 L120 110 C120 80, 115 55, 100 35 Z" strokeLinecap="round" />
            {/* Beehive Ridges */}
            <path d="M85 60 Q100 70 115 60 M82 78 Q100 90 118 78 M80 95 Q100 108 120 95" />
            {/* Temple Mandapa Base & Arches */}
            <rect x="65" y="110" width="70" height="50" rx="4" />
            <path d="M88 160 C88 140, 112 140, 112 160 Z" fill="currentColor" fillOpacity="0.1" />
            <path d="M50 160 L150 160 M40 170 L160 170" strokeWidth="2" />
            <text x="100" y="185" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="1">
              KAMAKHYA • ASSAM
            </text>
          </svg>
        </div>

        {/* Landmark 2: Tawang Monastery (Arunachal Pradesh) - Top Right */}
        <div className="absolute top-8 -right-8 w-84 h-84 text-emerald-800/20 transform rotate-6">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* Multitiered Tibetan Monastery Roofs */}
            <path d="M60 40 L140 40 L130 55 L70 55 Z M50 60 L150 60 L140 78 L60 78 Z" strokeLinejoin="round" />
            <path d="M40 85 L160 85 L150 110 L50 110 Z" strokeLinejoin="round" />
            {/* Fortress Walls & Monastic Windows */}
            <rect x="55" y="110" width="90" height="48" rx="2" />
            <rect x="70" y="118" width="12" height="12" rx="1" />
            <rect x="94" y="118" width="12" height="12" rx="1" />
            <rect x="118" y="118" width="12" height="12" rx="1" />
            <path d="M92 158 C92 142, 108 142, 108 158 Z" fill="currentColor" fillOpacity="0.1" />
            {/* Mountain Peaks in Backdrop */}
            <path d="M10 160 L50 100 L90 160 M120 160 L160 90 L195 160" strokeDasharray="3 3" opacity="0.6" />
            <text x="100" y="185" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="1">
              TAWANG • ARUNACHAL
            </text>
          </svg>
        </div>

        {/* Landmark 3: Loktak Lake & Phumdis (Manipur) - Bottom Left */}
        <div className="absolute -bottom-10 -left-6 w-84 h-84 text-emerald-800/20">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* Water Waves */}
            <path d="M20 70 Q50 60 80 70 T140 70 T180 70" />
            <path d="M10 110 Q50 100 90 110 T170 110" />
            <path d="M30 150 Q70 140 110 150 T190 150" />
            {/* Circular Floating Phumdi Islands */}
            <ellipse cx="75" cy="85" rx="35" ry="16" fill="currentColor" fillOpacity="0.1" />
            <ellipse cx="75" cy="85" rx="22" ry="9" strokeDasharray="2 2" />
            <ellipse cx="140" cy="125" rx="42" ry="18" fill="currentColor" fillOpacity="0.1" />
            <ellipse cx="140" cy="125" rx="26" ry="10" strokeDasharray="2 2" />
            {/* Fisherman Boat & Oar */}
            <path d="M110 82 Q125 90 140 82 Z" fill="currentColor" fillOpacity="0.15" />
            <line x1="120" y1="75" x2="132" y2="88" strokeWidth="1.5" />
            <text x="100" y="185" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="1">
              LOKTAK LAKE • MANIPUR
            </text>
          </svg>
        </div>

        {/* Landmark 4: Ujjayanta Palace (Tripura) - Bottom Right */}
        <div className="absolute -bottom-8 -right-8 w-88 h-88 text-emerald-800/20">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* Central Grand Dome */}
            <path d="M85 70 C85 45, 115 45, 115 70 Z" fill="currentColor" fillOpacity="0.1" />
            <line x1="100" y1="38" x2="100" y2="48" strokeWidth="2" />
            {/* Symmetrical Palace Wings & Domes */}
            <path d="M45 80 C45 65, 65 65, 65 80 Z" />
            <path d="M135 80 C135 65, 155 65, 155 80 Z" />
            {/* Neoclassical Pillars & Frontage */}
            <rect x="30" y="80" width="140" height="60" rx="2" />
            <line x1="50" y1="90" x2="50" y2="135" strokeWidth="2" />
            <line x1="75" y1="90" x2="75" y2="135" strokeWidth="2" />
            <line x1="100" y1="90" x2="100" y2="135" strokeWidth="2" />
            <line x1="125" y1="90" x2="125" y2="135" strokeWidth="2" />
            <line x1="150" y1="90" x2="150" y2="135" strokeWidth="2" />
            {/* Mughal Garden Reflection Pools */}
            <path d="M20 150 L180 150 M10 160 L190 160" strokeWidth="1.5" />
            <text x="100" y="185" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="1">
              UJJAYANTA PALACE • TRIPURA
            </text>
          </svg>
        </div>
      </div>

      {/* Top Navigation Bar: Language Selector & User Manual */}
      <header className="relative z-20 px-4 sm:px-8 py-4 flex items-center justify-between gap-3 max-w-6xl mx-auto w-full">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-green border-2 border-brand-green-dark flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-brand-dark dark:text-white leading-none">
                SANJIVNI
              </span>
              <span className="bg-brand-green-light dark:bg-emerald-950/60 text-brand-green-dark dark:text-emerald-300 font-extrabold text-[11px] px-2 py-0.5 rounded-full border border-green-300 dark:border-emerald-700">
                मन-स्मृति
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 hidden sm:block">
              SIH26003 • North East Dementia Assistance
            </p>
          </div>
        </div>

        {/* Right Controls: 6-Language Dropdown & User Manual Guide */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Visual User Manual Guide Button */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClickSound();
              setUserManualOpen(true);
            }}
            className="duo-btn duo-btn-white py-2 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 border-2 border-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-white shadow-sm hover:border-brand-green active:translate-y-0.5 transition-all cursor-pointer"
            title="Open Visual User Manual"
          >
            <BookOpen className="w-4 h-4 text-brand-green" />
            <span className="hidden sm:inline">{t('howToUse')}</span>
          </button>

          {/* Prominent 6-Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-2 bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 hover:border-brand-green rounded-2xl px-3 py-2 text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer active:translate-y-0.5"
              aria-haspopup="true"
              aria-expanded={isLangDropdownOpen}
              aria-label="Select Regional Language"
            >
              <Globe className="w-4 h-4 text-brand-green" />
              <span className="text-stone-800 dark:text-white">{currentLangObj.nativeLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-500 dark:text-stone-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Language Menu */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 rounded-3xl p-2 shadow-2xl z-50 animate-slide-up">
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-[11px] font-black text-stone-400 dark:text-stone-400 uppercase tracking-wider">
                    {t('selectLanguage')} (6 NER Languages)
                  </p>
                </div>
                <div className="space-y-1 mt-1.5 max-h-72 overflow-y-auto">
                  {SUPPORTED_LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLanguage(item.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        language === item.code
                          ? 'bg-brand-green text-white shadow-duo-green'
                          : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.flagIcon}</span>
                        <div>
                          <p className="leading-tight">{item.nativeLabel}</p>
                          <p className={`text-[10px] font-bold ${language === item.code ? 'text-green-100' : 'text-stone-400'}`}>
                            {item.label} • {item.region}
                          </p>
                        </div>
                      </div>
                      {language === item.code && <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Centered Authentication Card & Cultural Heritage Banner */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center justify-center flex-1">
        {/* Central Duolingo-style Authentication Card */}
        <div className="w-full max-w-md duo-card p-6 sm:p-9 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-3 border-stone-200 dark:border-stone-700 shadow-xl animate-slide-up relative">
          
          {/* Mascot Rhino Rongmon Badge */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3.5 rounded-3xl bg-brand-green border-3 border-brand-green-dark flex items-center justify-center text-white shadow-duo-green transform transition-transform hover:scale-105">
              <HeartHandshake className="w-8 h-8" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-extrabold text-[11px] mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
              <span>SIH26003 • North East India</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
              {t('welcomeBack')}
            </h1>
            <p className="text-stone-500 dark:text-stone-300 font-bold text-xs sm:text-sm mt-1.5 leading-relaxed">
              {t('welcomeSubtitle')}
            </p>
          </div>

          {/* Authentication Actions */}
          {/* Authentication Actions */}
          <div className="space-y-3.5">
            {/* Graceful Authentication Error Alert */}
            {authError && (
              <div 
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start justify-between gap-2 animate-fade-in"
                role="alert"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="break-words leading-relaxed">{authError}</span>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer p-0.5 flex-shrink-0"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Primary Action: Continue with Google (Live OAuth via Supabase) */}
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isInitiatingGoogle || authLoading}
              className="duo-btn duo-btn-white w-full py-3.5 sm:py-4 px-4 flex items-center justify-center gap-3 text-sm sm:text-base font-black text-stone-800 dark:text-white border-2 border-stone-300 dark:border-stone-700 dark:bg-stone-800 hover:border-brand-green active:translate-y-0.5 transition-all shadow-duo-neutral cursor-pointer min-h-[56px] disabled:opacity-75 disabled:cursor-not-allowed"
              aria-label="Continue with Google Authentication"
            >
              {isInitiatingGoogle || authLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-brand-green flex-shrink-0" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google G SVG */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span>{t('continueGoogle')}</span>
                </>
              )}
            </button>

            {/* Fast 1-Tap Hackathon Demo Login (Emergency Offline Bypass) */}
            <button
              type="button"
              onClick={handleQuickDemo}
              className="duo-btn duo-btn-green w-full py-3.5 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[52px]"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{t('quickDemo')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Terms disclaimer & Emergency Mock Account Switcher */}
            <div className="text-center pt-1">
              <p className="text-[11px] font-bold text-stone-400 leading-relaxed">
                By continuing, you agree to the{' '}
                <span className="text-stone-600 dark:text-stone-300 underline cursor-pointer hover:text-brand-green">Terms</span> and{' '}
                <span className="text-stone-600 dark:text-stone-300 underline cursor-pointer hover:text-brand-green">Privacy Policy</span>.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickSound();
                  setIsAuthModalOpen(true);
                }}
                className="text-[10px] font-bold text-stone-400 hover:text-brand-green dark:hover:text-emerald-400 underline cursor-pointer mt-1"
              >
                Mock Account Switcher (For Judges / Offline Evaluation)
              </button>
            </div>
          </div>

          {/* Quick Cultural Landmark Highlights Indicator */}
          <div className="mt-6 pt-4 border-t-2 border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-extrabold text-stone-500 dark:text-stone-400">
            <span>Assam • Arunachal • Manipur • Tripura</span>
            <span className="text-brand-green font-black">6 Languages</span>
          </div>
        </div>
      </main>

      {/* Footer Heritage strip */}
      <footer className="relative z-10 px-4 py-3 text-center text-xs font-extrabold text-stone-500 dark:text-stone-400">
        <p>SANJIVNI Cognitive Health • Designed for Elderly Care in North East India</p>
      </footer>

      {/* Interactive Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
