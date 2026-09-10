import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../../utils/i18n';
import { OFFICIAL_NER_REGIONS } from '../../utils/nerData';
import { soundFx } from '../../utils/audio';
import { 
  ChevronDown, 
  ShieldCheck, 
  User, 
  Globe, 
  Compass, 
  Sparkles, 
  Check,
  Sun,
  Moon,
  Monitor,
  Settings
} from 'lucide-react';

export const ProfileDropdown: React.FC = () => {
  const { 
    user, 
    mode, 
    setMode, 
    language, 
    setLanguage, 
    theme,
    setTheme,
    selectedRegion, 
    startSpotlightTour, 
    setIsPinModalOpen,
    setIsProfileSettingsOpen,
    t 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLanguagePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const currentRegionObj = OFFICIAL_NER_REGIONS.find((r) => r.id === selectedRegion) || OFFICIAL_NER_REGIONS[1];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Chunky Accessible Trigger Button */}
      <button
        id="profile-dropdown-btn"
        type="button"
        onClick={() => {
          soundFx.playClickSound();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-2xl border-3 border-stone-300 dark:border-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500 bg-white dark:bg-stone-900 shadow-sm active:translate-y-0.5 transition-all cursor-pointer select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User Profile & Settings Menu"
      >
        <div className="relative">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt="User profile"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-emerald-500 bg-stone-100 dark:bg-stone-800 object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full"></span>
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-black text-stone-900 dark:text-stone-100 leading-none truncate max-w-[90px]">
            {user?.name || 'Koka Bhaben'}
          </p>
          <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 leading-none truncate block mt-0.5 max-w-[110px]">
            {currentRegionObj.name}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 rounded-3xl shadow-2xl p-2.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 divide-y-2 divide-stone-100 dark:divide-stone-800">
          {/* User Bio Header */}
          <div className="p-2 pb-3">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt="User profile"
                className="w-12 h-12 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-stone-100 dark:bg-stone-800 object-cover shadow-xs"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-black text-stone-900 dark:text-stone-100 truncate">
                  {user?.name || 'Bhaben Baruah'}
                </h4>
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 truncate">
                  {user?.email || 'bhaben@assamcare.in'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    {currentRegionObj.name} ({currentRegionObj.nativeScript})
                  </span>
                  <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-stone-300 dark:border-stone-700">
                    {currentLangObj.nativeLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Items */}
          <div className="py-2 space-y-1">
            {/* 1. Caregiver Portal / Patient Mode (Secured by PIN Lock) */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setIsOpen(false);
                if (mode === 'patient') {
                  setIsPinModalOpen(true);
                } else {
                  setMode('patient');
                }
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {mode === 'patient' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <span>{mode === 'patient' ? t('caregiverPortal') : t('patientMode')}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {mode === 'patient' ? 'PIN Lock' : 'Active'}
              </span>
            </button>

            {/* 2. Profile Settings (Opens dedicated Settings Modal) */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setIsOpen(false);
                setIsProfileSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
                <span>Profile Settings</span>
              </div>
              <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                Region • Pairing
              </span>
            </button>

            {/* 3. Language Settings Switcher */}
            <div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickSound();
                  setShowLanguagePicker(!showLanguagePicker);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center border border-blue-300 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span>{t('languageSettings')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-stone-600 dark:text-stone-400">{currentLangObj.nativeLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${showLanguagePicker ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Nested Language Options */}
              {showLanguagePicker && (
                <div className="mt-1.5 p-1 bg-stone-50 dark:bg-stone-800/90 rounded-2xl border-2 border-stone-200 dark:border-stone-700 grid grid-cols-2 gap-1 animate-in fade-in-50">
                  {SUPPORTED_LANGUAGES.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        soundFx.playClickSound();
                        setLanguage(opt.code);
                        setShowLanguagePicker(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center justify-between transition-all ${
                        language === opt.code
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700'
                      }`}
                    >
                      <span className="truncate">{opt.nativeLabel}</span>
                      {language === opt.code && <Check className="w-3 h-3 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Theme / Display Toggle (Cycles: Light -> Dark -> System) */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                if (theme === 'light') setTheme('dark');
                else if (theme === 'dark') setTheme('system');
                else setTheme('light');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer group"
              title="Toggle theme: Light, Dark, or System default"
              aria-label={`Current theme: ${theme}. Click to switch.`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-stone-700 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-300 dark:border-stone-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4 text-amber-600" />
                  ) : theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Monitor className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <span>{t('themeDisplay')}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                theme === 'light'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  : theme === 'dark'
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200'
                  : 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300'
              }`}>
                {theme === 'light' ? t('themeLight') : theme === 'dark' ? t('themeDark') : t('themeSystem')}
              </span>
            </button>

            {/* 5. Replay Guided Tour */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setIsOpen(false);
                startSpotlightTour();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-amber-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-stone-700 text-purple-800 dark:text-purple-300 flex items-center justify-center border border-purple-300 dark:border-stone-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Compass className="w-4 h-4" />
                </div>
                <span>{t('replayTour')}</span>
              </div>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
