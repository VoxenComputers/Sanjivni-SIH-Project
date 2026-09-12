import React, { useState, useEffect } from 'react';
import { useTts } from '../../hooks/useTts';
import { soundFx } from '../../utils/audio';
import { useApp } from '../../context/AppContext';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SpeechButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  text,
  label,
  size = 'md',
  className = '',
}) => {
  const { language } = useApp();
  const { speak, stop, isSpeaking: isGlobalSpeaking } = useTts();
  const [isCurrentSpeaking, setIsCurrentSpeaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If global audio stopped or was superseded, reset this button's active state
  useEffect(() => {
    if (!isGlobalSpeaking) {
      setIsCurrentSpeaking(false);
      setIsLoading(false);
    }
  }, [isGlobalSpeaking]);

  const handleToggleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClickSound();

    if (isCurrentSpeaking || isLoading) {
      stop();
      setIsCurrentSpeaking(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsCurrentSpeaking(true);
    try {
      const success = await speak(text);
      setIsLoading(false);
      if (!success) {
        setIsCurrentSpeaking(false);
      }
    } catch {
      setIsLoading(false);
      setIsCurrentSpeaking(false);
    }
  };


  const hasLabel = Boolean(label);

  const labelSizeClasses = {
    sm: 'h-8 px-2.5 py-1 text-xs rounded-full min-w-0 w-auto gap-1.5',
    md: 'h-9 px-3.5 py-1.5 text-xs sm:text-sm rounded-full min-w-0 w-auto gap-2',
    lg: 'h-11 px-4 py-2 text-sm sm:text-base rounded-full min-w-0 w-auto gap-2.5',
  };

  const iconOnlySizeClasses = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-10 h-10 rounded-2xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  };

  const iconSizes = {
    sm: hasLabel ? 'w-3.5 h-3.5' : 'w-4 h-4',
    md: hasLabel ? 'w-4 h-4' : 'w-5 h-5',
    lg: hasLabel ? 'w-5 h-5' : 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      aria-label={
        isLoading
          ? `Loading audio: ${text}`
          : isCurrentSpeaking
          ? `Stop reading aloud: ${text}`
          : `Read aloud: ${text}`
      }
      title={
        isLoading
          ? 'Loading audio...'
          : isCurrentSpeaking
          ? 'Stop reading aloud'
          : 'Listen aloud (Text-to-Speech)'
      }
      className={`relative inline-flex items-center justify-center font-bold transition-all select-none cursor-pointer flex-shrink-0 whitespace-nowrap ${
        isCurrentSpeaking
          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-500 shadow-xs scale-[1.02]'
          : isLoading
          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600 shadow-xs'
          : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs active:scale-95'
      } ${hasLabel ? labelSizeClasses[size] : iconOnlySizeClasses[size]} ${className}`}
    >
      {isCurrentSpeaking ? (
        <>
          <VolumeX className={`${iconSizes[size]} text-amber-700 dark:text-amber-300 animate-pulse`} />
          {label && <span className="font-extrabold truncate">{label}</span>}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </>
      ) : isLoading ? (
        <>
          <Loader2 className={`${iconSizes[size]} text-emerald-700 dark:text-emerald-300 animate-spin`} />
          {label && <span className="font-extrabold truncate">{label}</span>}
        </>
      ) : (
        <>
          <Volume2 className={`${iconSizes[size]} text-emerald-700 dark:text-emerald-400`} />
          {label && <span className="font-extrabold truncate">{label}</span>}
        </>
      )}
    </button>
  );
};
