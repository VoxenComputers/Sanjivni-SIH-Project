import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { MemoryMatchGame } from './MemoryMatchGame';
import { MatchTheOrderGame } from './MatchTheOrderGame';
import { GuessThePictureGame } from './GuessThePictureGame';
import { SpacedRetrievalGame } from './SpacedRetrievalGame';
import { Mascot } from '../../common/Mascot';
import { SpeechButton } from '../../common/SpeechButton';
import { speechSynth } from '../../../utils/speech';
import { soundFx } from '../../../utils/audio';
import { BrainCircuit, Flame, Trophy, Play, Layers, Eye, Sparkles, HelpCircle } from 'lucide-react';

export const GamesHub: React.FC = () => {
  const { streak, totalStars, mmseScore, gameHistory, t, selectedRegion, language } = useApp();
  const [activeGame, setActiveGame] = useState<'none' | 'memory-match' | 'match-order' | 'guess-picture' | 'spaced-retrieval'>('none');

  // Page Visibility API: Stop audio and terminate active game state immediately on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        speechSynth.stop();
        soundFx.stopAll();
        setActiveGame('none');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (activeGame === 'memory-match') {
    return <MemoryMatchGame onBack={() => setActiveGame('none')} />;
  }

  if (activeGame === 'match-order') {
    return <MatchTheOrderGame onBack={() => setActiveGame('none')} />;
  }

  if (activeGame === 'guess-picture') {
    return <GuessThePictureGame onBack={() => setActiveGame('none')} />;
  }

  if (activeGame === 'spaced-retrieval') {
    return <SpacedRetrievalGame onBack={() => setActiveGame('none')} />;
  }

  return (
    <div className="space-y-5" id="games-hub-container">
      {/* Compact Unified Streak & Mascot Header Banner */}
      <div className="duo-card bg-amber-50/80 dark:bg-amber-950/30 border-3 border-amber-300 dark:border-amber-800 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Streak & Points */}
          <div className="flex items-center gap-3.5 sm:gap-4 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-white border-b-4 border-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm p-2.5">
              <Flame className="w-9 h-9 fill-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight leading-none">
                  {streak} {t('streak')}
                </h2>
                <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  {totalStars} {t('memoryPoints')}
                </span>
                <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-700">
                  MMSE: {(mmseScore ?? 25.8).toFixed(1)}/30
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 capitalize">
                  {selectedRegion ? selectedRegion.replace('-', ' ') : 'Assam'}
                </span>
              </div>
              <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mt-1">
                {t('gamesMascotGreeting')}
              </p>
            </div>
          </div>

          {/* Right: Rongmon Mascot Greeting */}
          <div className="flex items-center gap-2 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 w-full md:w-auto max-w-md">
            <Mascot
              message={t('gamesMascotGreeting')}
              mood="happy"
              size="small"
            />
          </div>
        </div>
      </div>

      {/* 4 North-East Localized Game Cards (Targeted by Spotlight Tour) */}
      <div id="brain-games-cards" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Game 1: Memory Match Pairs (Visual Recall & Card Flip) */}
        <div className="duo-card p-5 flex flex-col justify-between hover:border-emerald-500 transition-all border-3 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <SpeechButton 
                text={`${t('memoryMatchTitle') || 'Memory Match Pairs'}. ${t('memoryMatchDesc') || 'Find matching cultural cards from your region to exercise focus and recall.'}`} 
                size="sm" 
              />
            </div>

            <div className="mb-2">
              <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300 dark:border-emerald-700">
                {t('visualRecall') || 'Visual Recall & Focus'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight mb-2">
              {t('memoryMatchTitle') || 'Memory Match Pairs'}
            </h3>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
              {t('memoryMatchDesc') || 'Find matching cultural cards from your region to exercise spatial and short-term memory.'}
            </p>
          </div>

          <button
            onClick={() => setActiveGame('memory-match')}
            className="w-full duo-btn duo-btn-green text-base font-black min-h-[56px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{t('playGame')}</span>
          </button>
        </div>

        {/* Game 2: Match the Order (Sequence Recall) */}
        <div className="duo-card p-5 flex flex-col justify-between hover:border-amber-500 transition-all border-3 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-2 border-amber-500 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <SpeechButton 
                text={`${t('matchOrderTitle')}. ${t('matchOrderDesc')}`} 
                size="sm" 
              />
            </div>

            <div className="mb-2">
              <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300 dark:border-amber-700">
                {t('sequenceMemory')}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight mb-2">
              {t('matchOrderTitle')}
            </h3>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
              {t('matchOrderDesc')}
            </p>
          </div>

          <button
            onClick={() => setActiveGame('match-order')}
            className="w-full duo-btn duo-btn-amber text-base font-black min-h-[56px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{t('playGame')}</span>
          </button>
        </div>

        {/* Game 3: Guess the Picture (Visual Identification) */}
        <div className="duo-card p-5 flex flex-col justify-between hover:border-blue-500 transition-all border-3 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-2 border-blue-500 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <SpeechButton 
                text={`${t('guessPictureTitle')}. ${t('guessPictureDesc')}`} 
                size="sm" 
              />
            </div>

            <div className="mb-2">
              <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-300 dark:border-blue-700">
                {t('recognitionVoice')}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight mb-2">
              {t('guessPictureTitle')}
            </h3>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
              {t('guessPictureDesc')}
            </p>
          </div>

          <button
            onClick={() => setActiveGame('guess-picture')}
            className="w-full duo-btn bg-blue-600 text-white border-b-4 border-blue-800 hover:bg-blue-700 active:border-b-0 active:translate-y-1 text-base font-black min-h-[56px] flex items-center justify-center gap-2 rounded-2xl transition-all shadow-sm cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{t('playGame')}</span>
          </button>
        </div>

        {/* Game 4: Family Trivia (Renamed & Localized) */}
        <div className="duo-card p-5 flex flex-col justify-between hover:border-rose-500 transition-all border-3 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-2 border-rose-500 flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <SpeechButton 
                text={`${language === 'hi' ? 'पारिवारिक प्रश्नोत्तरी (Family Trivia)' : (t('familyTriviaTitle') || 'Family Trivia')}. ${language === 'hi' ? 'अपने प्रियजनों और पुरानी यादों को पहचानें' : (t('familyTriviaDesc') || 'Remember your loved ones and cherished memories')}.`} 
                size="sm" 
              />
            </div>

            <div className="mb-2">
              <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-300 dark:border-rose-700">
                {language === 'hi' ? 'पारिवारिक यादें' : 'Family Memories'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight mb-2">
              {language === 'hi' ? 'पारिवारिक प्रश्नोत्तरी (Family Trivia)' : (t('familyTriviaTitle') || 'Family Trivia')}
            </h3>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
              {language === 'hi' ? 'अपने प्रियजनों और पुरानी यादों को पहचानें' : (t('familyTriviaDesc') || 'Remember your loved ones and cherished memories')}
            </p>
          </div>

          <button
            onClick={() => setActiveGame('spaced-retrieval')}
            className="w-full duo-btn bg-rose-600 text-white border-b-4 border-rose-800 hover:bg-rose-700 active:border-b-0 active:translate-y-1 text-base font-black min-h-[56px] flex items-center justify-center gap-2 rounded-2xl transition-all shadow-sm cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{t('playGame')}</span>
          </button>
        </div>
      </div>

      {/* Recent Game Activity */}
      {gameHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="text-xl font-black text-stone-900 dark:text-white">
              {t('recentPractice')}
            </h4>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full border border-stone-300 dark:border-stone-700">
              <Trophy className="w-4 h-4 text-amber-500" />
              {gameHistory.length} {t('sessions')}
            </span>
          </div>
          <div className="divide-y-2 divide-stone-100 dark:divide-stone-800">
            {gameHistory.slice(0, 4).map((record) => (
              <div key={record.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base sm:text-lg font-black text-stone-900 dark:text-white">{record.game}</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                    {record.date} {record.moves ? `• ${record.moves} ${t('moves')}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-sm px-3.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                    +{record.score} XP ({record.accuracy}% Acc)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
