import React, { useState } from 'react';
import { FamilyMember, useApp } from '../../../context/AppContext';
import { speechSynth } from '../../../utils/speech';
import { soundFx } from '../../../utils/audio';
import { Volume2, VolumeX, Sparkles, Loader2 } from 'lucide-react';

interface FamilyCardProps {
  member: FamilyMember;
  isFirst?: boolean;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ member, isFirst }) => {
  const { language, t } = useApp();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePlayVoice = () => {
    if (isPlaying || isLoading) {
      speechSynth.stop();
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    soundFx.playClickSound();
    setIsLoading(true);
    const spokenText = member.quote || member.voiceMessage || 'Pranam! Remember that our family is always with you. Keep smiling!';
    speechSynth.speak(
      spokenText,
      () => {
        setIsLoading(false);
        setIsPlaying(true);
      },
      () => {
        setIsLoading(false);
        setIsPlaying(false);
      },
      language
    );
  };

  // Dedicated SVG avatars or real uploaded photos from Supabase Storage
  const renderAvatar = () => {
    if (member.avatarUrl) {
      return (
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 border-emerald-500 overflow-hidden flex-shrink-0 shadow-sm bg-stone-100 dark:bg-stone-800">
          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
        </div>
      );
    }

    return (
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 border-stone-300 dark:border-stone-600 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-sm"
        style={{ backgroundColor: member.avatarColor + '20' }}
      >
        <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24">
          {/* Head */}
          <circle cx="50" cy="46" r="30" fill="#FED7AA" stroke="#78350F" strokeWidth="2.5" />

          {/* Hair based on member */}
          {member.id === 'rahul' ? (
            <path
              d="M 24 38 Q 30 18 50 18 Q 70 18 76 38 Q 65 24 50 25 Q 35 24 24 38 Z"
              fill="#374151"
            />
          ) : member.id === 'priya' ? (
            <>
              <circle cx="50" cy="18" r="10" fill="#1F2937" />
              <path
                d="M 20 45 Q 26 22 50 22 Q 74 22 80 45 Q 65 30 50 30 Q 35 30 20 45 Z"
                fill="#1F2937"
              />
            </>
          ) : member.id === 'bikash' ? (
            <>
              <path
                d="M 22 40 Q 30 20 50 20 Q 72 20 78 40 Q 64 26 50 27 Q 34 26 22 40 Z"
                fill="#4B5563"
              />
              <rect x="32" y="42" width="14" height="10" rx="3" fill="none" stroke="#1F2937" strokeWidth="2" />
              <rect x="54" y="42" width="14" height="10" rx="3" fill="none" stroke="#1F2937" strokeWidth="2" />
              <line x1="46" y1="47" x2="54" y2="47" stroke="#1F2937" strokeWidth="2" />
            </>
          ) : member.id === 'ananya' ? (
            <>
              <circle cx="20" cy="35" r="7" fill="#EC4899" />
              <circle cx="80" cy="35" r="7" fill="#EC4899" />
              <path
                d="M 22 42 Q 28 20 50 20 Q 72 20 78 42 Q 65 28 50 28 Q 35 28 22 42 Z"
                fill="#1F2937"
              />
            </>
          ) : (
            <path
              d="M 24 38 Q 30 18 50 18 Q 70 18 76 38 Q 65 24 50 25 Q 35 24 24 38 Z"
              fill="#374151"
            />
          )}

          {/* Eyes with friendly sparkle */}
          <circle cx="40" cy="46" r="3.5" fill="#1F2937" />
          <circle cx="60" cy="46" r="3.5" fill="#1F2937" />
          <circle cx="41.5" cy="44.5" r="1.2" fill="#FFFFFF" />
          <circle cx="61.5" cy="44.5" r="1.2" fill="#FFFFFF" />

          {/* Warm smile */}
          <path
            d="M 40 56 Q 50 64 60 56"
            fill="none"
            stroke="#9A3412"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Rosy cheeks */}
          <circle cx="34" cy="53" r="4" fill="#F87171" opacity="0.6" />
          <circle cx="66" cy="53" r="4" fill="#F87171" opacity="0.6" />

          {/* Torso / Clothes */}
          <path
            d="M 22 92 C 22 74 36 68 50 68 C 64 68 78 74 78 92 Z"
            fill={member.avatarColor}
            stroke="#374151"
            strokeWidth="2"
          />
        </svg>

        {/* Small live audio indicator badge */}
        {isPlaying && (
          <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-brand-green text-white animate-pulse">
            <Volume2 className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <article
      className="duo-card p-4 sm:p-5 flex flex-col justify-between hover:border-stone-400 dark:hover:border-stone-500 transition-all shadow-sm"
      aria-label={`Family member profile: ${member.name}`}
    >
      <div>
        {/* Top: Custom SVG Avatar and Relationship Details */}
        <div className="flex items-center gap-3.5 mb-3.5">
          {renderAvatar()}

          <div className="flex-1 min-w-0">
            {/* Relation badge in clear, bold text */}
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider mb-0.5"
              style={{
                backgroundColor: member.avatarColor + '25',
                color: member.avatarColor === '#F59E0B' ? '#B45309' : member.avatarColor,
                border: `1.5px solid ${member.avatarColor}`,
              }}
            >
              {member.localRelation}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-tight truncate">
              {member.name}
            </h3>

            <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 mt-0.5">
              {member.age ? `Age ${member.age} • ` : ''}{member.description || member.funFact || 'Loves spending time together with the family.'}
            </p>
          </div>
        </div>

        {/* Message bubble preview */}
        <div className="bg-stone-50 dark:bg-stone-800/80 border-2 border-stone-200 dark:border-stone-700 rounded-xl p-3 mb-3.5 relative">
          <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-100 italic leading-snug">
            "{member.quote || member.voiceMessage || 'Pranam! Remember that our family is always with you. Keep smiling!'}"
          </p>
        </div>
      </div>

      {/* Easily tappable Audio Button */}
      <button
        id={isFirst ? 'tour-voice-btn' : undefined}
        onClick={handlePlayVoice}
        className={`w-full duo-btn min-h-[48px] text-base font-black ${
          isPlaying
            ? 'duo-btn-amber animate-pulse'
            : isLoading
            ? 'duo-btn-green opacity-90'
            : 'duo-btn-green'
        }`}
        aria-label={`Listen to voice message from ${member.name}`}
      >
        {isPlaying ? (
          <>
            <VolumeX className="w-5 h-5 text-white flex-shrink-0" />
            <span>{t('speakingTapStop')}</span>
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="w-5 h-5 text-white animate-spin flex-shrink-0" />
            <span>{t('loadingAudio') || 'Loading Voice...'}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-white flex-shrink-0" />
            <span>{t('playVoiceNote')}</span>
            <Sparkles className="w-4 h-4 text-yellow-300 hidden sm:inline-block" />
          </>
        )}
      </button>
    </article>
  );
};
