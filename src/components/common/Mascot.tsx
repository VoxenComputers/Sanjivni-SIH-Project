import React from 'react';

interface MascotProps {
  message?: string;
  mood?: 'happy' | 'celebrating' | 'gentle' | 'thinking';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  message = 'Nomoskar Koka! You are doing wonderful today!',
  mood = 'happy',
  size = 'medium',
  className = '',
}) => {
  const sizeMap = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24 sm:w-28 sm:h-28',
    large: 'w-32 h-32 sm:w-40 sm:h-40',
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Rongmon The Assam Rhino Mascot Vector */}
      <div className={`relative flex-shrink-0 ${sizeMap[size]}`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-md transition-transform hover:scale-105 duration-200"
          aria-label="Rongmon the cheerful rhino mascot"
        >
          {/* Body */}
          <circle cx="60" cy="65" r="46" fill="#86EFAC" stroke="#15803D" strokeWidth="4" />

          {/* Ears */}
          <circle cx="34" cy="30" r="12" fill="#86EFAC" stroke="#15803D" strokeWidth="4" />
          <circle cx="34" cy="30" r="6" fill="#BBF7D0" />
          <circle cx="86" cy="30" r="12" fill="#86EFAC" stroke="#15803D" strokeWidth="4" />
          <circle cx="86" cy="30" r="6" fill="#BBF7D0" />

          {/* Snout */}
          <ellipse cx="60" cy="74" rx="26" ry="20" fill="#BBF7D0" stroke="#15803D" strokeWidth="3" />

          {/* Rhino Little Horn */}
          <path
            d="M 52 64 Q 60 40 68 64 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Eyes based on mood */}
          {mood === 'happy' || mood === 'celebrating' ? (
            <>
              {/* Joyful arched eyes */}
              <path d="M 44 54 Q 49 46 54 54" fill="none" stroke="#1C1917" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 66 54 Q 71 46 76 54" fill="none" stroke="#1C1917" strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Gentle round eyes */}
              <circle cx="48" cy="52" r="4.5" fill="#1C1917" />
              <circle cx="72" cy="52" r="4.5" fill="#1C1917" />
              <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
              <circle cx="74" cy="50" r="1.5" fill="#FFFFFF" />
            </>
          )}

          {/* Nostrils */}
          <circle cx="53" cy="76" r="2.5" fill="#15803D" />
          <circle cx="67" cy="76" r="2.5" fill="#15803D" />

          {/* Friendly Smile */}
          <path
            d="M 50 82 Q 60 90 70 82"
            fill="none"
            stroke="#15803D"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Cheerful Blushing Cheeks */}
          <circle cx="36" cy="68" r="6" fill="#FCA5A5" opacity="0.6" />
          <circle cx="84" cy="68" r="6" fill="#FCA5A5" opacity="0.6" />

          {/* Traditional Assamese Gamosa red scarf edge */}
          <path
            d="M 38 98 Q 60 108 82 98"
            fill="none"
            stroke="#DC2626"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 42 100 L 78 100"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="4,3"
          />
        </svg>

        {/* Small badge */}
        <div className="absolute -bottom-1 -right-1 bg-brand-green text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-brand-green-dark">
          ৰংমন
        </div>
      </div>

      {/* Speech Bubble */}
      {message && (
        <div className="relative bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-3xl p-4 shadow-sm max-w-sm">
          <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-stone-300 dark:border-r-stone-700 border-b-[8px] border-b-transparent" />
          <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-r-[8px] border-r-white dark:border-r-stone-800 border-b-[7px] border-b-transparent" />
          <p className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 leading-snug">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};
