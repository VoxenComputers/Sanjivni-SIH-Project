import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { getLocaleCode, getLocalizedDayName } from '../../../utils/i18n';
import { SpeechButton } from '../../common/SpeechButton';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudFog,
  CloudLightning,
  Clock,
  MapPin,
  RefreshCw,
  Navigation,
  CheckCircle2,
  Droplets,
  Wind,
} from 'lucide-react';

export const DailySnapshot: React.FC = () => {
  const {
    t,
    language,
    locationData,
    weatherData,
    isLocationLoading,
    requestLocationAccess,
    refreshLocationAndWeather,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [dayName, setDayName] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const locale = getLocaleCode(language);

      // Prioritize exact dictionary translation for 100% language fidelity
      setDayName(getLocalizedDayName(now, language));

      try {
        setCurrentDate(
          new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(now)
        );
        setCurrentTime(
          new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).format(now)
        );
      } catch {
        setCurrentDate(
          now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        );
        setCurrentTime(
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        );
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  // Dynamic TTS Narration incorporating real detected location, live weather & current time
  const spokenMessage = `${t('todayOrientation')}: ${dayName}, ${currentDate}. ${t('currentTime')}: ${currentTime}. ${t('currentLocation')}: ${locationData.displayName}. ${t('weather')}: ${weatherData.temperature} degrees Celsius, ${weatherData.condition}. ${t('orientationReassurance')}`;

  // Helper for choosing dynamic weather icons
  const renderWeatherIcon = () => {
    switch (weatherData.iconType) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-amber-500 animate-spin-slow" />;
      case 'partly-cloudy':
        return <CloudSun className="w-6 h-6 text-amber-500" />;
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-sky-500" />;
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'foggy':
        return <CloudFog className="w-6 h-6 text-stone-400" />;
      case 'stormy':
        return <CloudLightning className="w-6 h-6 text-purple-500" />;
      default:
        return <Sun className="w-6 h-6 text-amber-500" />;
    }
  };

  return (
    <section
      id="daily-snapshot-card"
      aria-label="Daily Orientation Snapshot"
      className="bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all"
    >
      {/* Top Location Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-black text-sm sm:text-base min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-300 dark:border-emerald-800">
            <MapPin className="w-4 h-4" />
          </div>

          <span className="truncate" title={locationData.displayName}>
            {locationData.displayName}
          </span>

          {/* GPS Live Status Chip */}
          {locationData.isLiveGps ? (
            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>{t('gpsActive') || 'Live GPS'}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={requestLocationAccess}
              disabled={isLocationLoading}
              className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              <span>{t('enableLocation') || 'Enable GPS'}</span>
            </button>
          )}

          {/* Quick Refresh Weather Button */}
          <button
            type="button"
            onClick={refreshLocationAndWeather}
            disabled={isLocationLoading}
            title={t('refreshLocation') || 'Refresh Location & Weather'}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocationLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Listen Aloud Chunky SpeechButton */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <span className="text-xs font-black text-stone-500 dark:text-stone-400 hidden sm:inline-block">
            {t('readAloud')}:
          </span>
          <SpeechButton text={spokenMessage} size="md" />
        </div>
      </div>

      {/* Location Permission Prompt Banner (shown if GPS not yet granted) */}
      {!locationData.isLiveGps && (
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-dashed border-emerald-400 dark:border-emerald-700 rounded-2xl p-3 sm:p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 border-2 border-emerald-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-white leading-snug">
                {t('enableLocation') || 'Enable Live Location Access'}
              </p>
              <p className="text-[11px] sm:text-xs font-bold text-stone-600 dark:text-stone-300 mt-0.5">
                {t('allowLocationDesc') || 'Grant GPS access for live local weather, city orientation & safety geofencing.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestLocationAccess}
            disabled={isLocationLoading}
            className="duo-btn duo-btn-green py-2 px-4 text-xs sm:text-sm font-black flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto justify-center cursor-pointer active:scale-95 shadow-sm"
          >
            {isLocationLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('locationDetecting') || 'Detecting...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('grantLocationAccess') || 'Allow Location'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Orientation Grid: Day, Date, Clock, and Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Day & Date formatted with native Intl.DateTimeFormat in the active language */}
        <div>
          <span className="inline-block bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-amber-300 dark:border-amber-700">
            {t('todayOrientation')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight leading-none mb-1 capitalize">
            {dayName}
          </h2>
          <p className="text-base sm:text-lg font-extrabold text-stone-600 dark:text-stone-300">
            {currentDate}
          </p>
        </div>

        {/* Time and Weather Split Card */}
        <div className="bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
          {/* 12-Hour Clock */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0 shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('currentTime')}</p>
              <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight truncate">
                {currentTime || '08:30 AM'}
              </p>
            </div>
          </div>

          {/* Regional Weather Display */}
          <div className="flex items-center gap-3 border-l-2 border-stone-200 dark:border-stone-700 pl-3 sm:pl-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              {renderWeatherIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('weather')}</p>
                {weatherData.humidity !== undefined && (
                  <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-stone-400 gap-0.5">
                    <Droplets className="w-2.5 h-2.5 text-blue-400" />
                    {weatherData.humidity}%
                  </span>
                )}
              </div>
              <p className="text-base sm:text-xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                {weatherData.temperature}°C
              </p>
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300 truncate max-w-[140px]" title={weatherData.condition}>
                {weatherData.condition}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gentle reassurance message */}
      <div className="mt-4 pt-3.5 border-t-2 border-stone-100 dark:border-stone-800 flex items-center gap-3 text-stone-700 dark:text-stone-300 font-bold text-base sm:text-lg">
        <span className="text-2xl flex-shrink-0">🌱</span>
        <p className="leading-relaxed">
          {t('orientationReassurance')}
        </p>
      </div>
    </section>
  );
};
