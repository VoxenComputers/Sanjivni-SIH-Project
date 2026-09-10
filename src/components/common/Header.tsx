import React from 'react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { ProfileDropdown } from './ProfileDropdown';
import { 
  HeartHandshake, 
  BookHeart, 
  Gamepad2, 
  CalendarCheck2, 
  BookOpen, 
  LogIn,
  MapPin
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    mode, 
    patientTab, 
    setPatientTab, 
    geofence, 
    setCurrentRoute, 
    isLoggedIn, 
    setUserManualOpen,
    locationData,
    weatherData,
    requestLocationAccess,
    isLocationLoading,
    t
  } = useApp();

  const navTabs = [
    { id: 'reminisce' as const, domId: 'nav-memories', label: t('memoriesTab'), icon: BookHeart },
    { id: 'games' as const, domId: 'nav-games', label: t('gamesTab'), icon: Gamepad2 },
    { id: 'routine' as const, domId: 'nav-routine', label: t('routineTab'), icon: CalendarCheck2 },
  ];

  const handleTabClick = (tabId: 'reminisce' | 'games' | 'routine') => {
    soundFx.playClickSound();
    setPatientTab(tabId);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b-2 border-stone-200 dark:border-stone-800 px-3 py-2 sm:px-6 sm:py-3 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-700 border-2 border-emerald-900 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white leading-none">
                SANJIVNI
              </span>
              <span className="hidden sm:inline-flex bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {t('nativeAppName')}
              </span>
            </div>
            <p className="hidden sm:block text-xs font-bold text-stone-600 dark:text-stone-300 truncate mt-0.5">
              {mode === 'patient' ? (
                <>
                  <span>{t('seniorCare')} • </span>{t('patientHonorificName')}
                </>
              ) : (
                <>
                  <span>Caregiver Safety Portal • </span>{t('safetyGps')}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs with Spotlight DOM IDs */}
        {mode === 'patient' && (
          <nav id="main-nav-tabs" className="hidden md:flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/90 p-1.5 rounded-2xl border-2 border-stone-200 dark:border-stone-700" aria-label="Desktop primary navigation">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = patientTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={tab.domId}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Section Controls: Live Weather/Location, User Manual Guide & Chunky Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Live Location & Weather Pill */}
          <button
            type="button"
            onClick={requestLocationAccess}
            disabled={isLocationLoading}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-black hover:bg-emerald-100 transition-colors cursor-pointer select-none"
            title="Click to detect or refresh live GPS location & weather"
          >
            <MapPin className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isLocationLoading ? 'animate-spin' : ''}`} />
            <span className="truncate max-w-[120px]">{locationData.city || 'Guwahati'}</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span>{weatherData.temperature}°C</span>
          </button>

          {/* User Manual Guide Button */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClickSound();
              setUserManualOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer select-none"
            title={t('userManual')}
            aria-label={t('userManual')}
          >
            <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <span className="hidden sm:inline">{t('howToUse')}</span>
          </button>

          {/* User Profile Dropdown (Houses Caregiver Mode, Region Profile, Language Switcher, Tour Replay, and Logout) */}
          {isLoggedIn ? (
            <ProfileDropdown />
          ) : (
            <button
              type="button"
              onClick={() => setCurrentRoute('login')}
              className="duo-btn duo-btn-green py-2 px-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm cursor-pointer flex-shrink-0"
              title="Login/Signup"
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Wandering Warning Strip if Active */}
      {!geofence.isSafe && (
        <div className="mt-2 max-w-6xl mx-auto bg-red-100 border-2 border-red-500 text-red-900 font-extrabold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center justify-between text-xs sm:text-sm animate-pulse">
          <span className="truncate">⚠️ SOS: Patient Wandering Alert Active Outside Beltola Safe Zone!</span>
        </div>
      )}
    </header>
  );
};
