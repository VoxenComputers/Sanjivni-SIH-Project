import React, { useState } from 'react';
import { speechSynth } from '../../utils/speech';
import { soundFx } from '../../utils/audio';
import { useApp } from '../../context/AppContext';
import { Volume2, VolumeX } from 'lucide-react';

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
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClickSound();

    if (isSpeaking) {
      speechSynth.stop();
      setIsSpeaking(false);
      return;
    }

    speechSynth.speak(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      language
    );
  };

  const sizeClasses = {
    sm: 'w-10 h-10 min-h-[44px] min-w-[44px] text-xs',
    md: 'w-12 h-12 min-h-[48px] min-w-[48px] text-sm',
    lg: 'w-14 h-14 min-h-[56px] min-w-[56px] text-base',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      aria-label={isSpeaking ? `Stop reading aloud: ${text}` : `Read aloud: ${text}`}
      title={isSpeaking ? 'Stop reading aloud' : 'Listen aloud (Text-to-Speech)'}
      className={`relative inline-flex items-center justify-center gap-2 rounded-2xl font-black transition-all select-none cursor-pointer flex-shrink-0 ${
        isSpeaking
          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-2 border-amber-500 shadow-duo-amber scale-105'
          : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 shadow-sm active:translate-y-0.5'
      } ${sizeClasses[size]} ${className}`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className={`${iconSizes[size]} text-amber-700 animate-pulse`} />
          {label && <span className="font-extrabold">{label}</span>}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </>
      ) : (
        <>
          <Volume2 className={`${iconSizes[size]} text-emerald-700`} />
          {label && <span className="font-extrabold">{label}</span>}
        </>
      )}
    </button>
  );
};
