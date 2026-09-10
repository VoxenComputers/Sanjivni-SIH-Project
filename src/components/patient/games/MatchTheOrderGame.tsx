import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../../utils/audio';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { getGameAssetUrl } from '../../../utils/assetManager';
import { SpeechButton } from '../../common/SpeechButton';
import { Mascot } from '../../common/Mascot';
import { ArrowLeft, RotateCcw, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

interface MatchTheOrderGameProps {
  onBack: () => void;
}

interface OrderItem {
  id: string;
  name: string;
  stateName: string;
  imageUrl: string;
}

const REGION_ASSETS: Record<string, string[]> = {
  'arunachal-pradesh': ['arunachal-tawang.jpg', 'arunachal-hornbill.jpg', 'arunachal-sela-pass.jpg', 'arunachal-ziro-valley.jpg'],
  'manipur': ['manipur-loktak.jpg', 'manipur-sangai.jpg', 'manipur-kangla.jpg', 'manipur-raas-leela.jpg'],
  'meghalaya': ['meghalaya-root-bridge.jpg', 'meghalaya-nohkalikai.jpg', 'meghalaya-dawki.jpg', 'meghalaya-mawlynnong.jpg'],
  'assam': [
    'assam-bihu-dhol.jpg',
    'assam-kamakhya.jpg',
    'assam-majuli.jpg',
    'assam-muga-silk.jpg',
    'assam-rhino.jpg',
    'assam-tea.jpg',
  ] 
};

// Cultural display labels
const CULTURAL_LABELS: Record<string, string> = {
  'meghalaya-root-bridge.jpg': 'Living Root Bridge',
  'meghalaya-nohkalikai.jpg': 'Nohkalikai Falls',
  'meghalaya-dawki.jpg': 'Dawki Umngot River',
  'meghalaya-mawlynnong.jpg': 'Mawlynnong Village',
  'arunachal-tawang.jpg': 'Tawang Monastery',
  'arunachal-hornbill.jpg': 'Great Indian Hornbill',
  'arunachal-sela-pass.jpg': 'Sela Pass & Lake',
  'arunachal-ziro-valley.jpg': 'Ziro Valley Pine Hills',
  'manipur-loktak.jpg': 'Loktak Lake & Phumdis',
  'manipur-sangai.jpg': 'Sangai Deer',
  'manipur-kangla.jpg': 'Kangla Fort',
  'manipur-raas-leela.jpg': 'Raas Leela Dance',
  'assam-bihu-dhol.jpg': 'Bihu Dhol',
  'assam-kamakhya.jpg': 'Kamakhya Temple',
  'assam-majuli.jpg': 'Majuli River Island',
  'assam-muga-silk.jpg': 'Assam Muga Silk',
  'assam-rhino.jpg': 'One-Horned Rhino',
  'assam-tea.jpg': 'Assam Tea Garden',
};

export const MatchTheOrderGame: React.FC<MatchTheOrderGameProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { recordGameCompletion, t, selectedRegion } = useApp();

  // Robust region sanitization
  const rawRegion = user?.user_metadata?.region || (user as any)?.region || selectedRegion || 'assam';
  const normalized = String(rawRegion).toLowerCase().trim().replace(/\s+/g, '-');
  const safeRegion = normalized === 'arunachal' ? 'arunachal-pradesh' : (REGION_ASSETS[normalized] ? normalized : 'assam');

  // Levels: Level 1 (3 items), Level 2 (4 items), Level 3 (4 items shuffled)
  const [level, setLevel] = useState<number>(1);
  const [pool, setPool] = useState<OrderItem[]>([]);
  const [sequence, setSequence] = useState<OrderItem[]>([]);
  const [activeFlashIndex, setActiveFlashIndex] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(false);
  const [playerInput, setPlayerInput] = useState<OrderItem[]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'showing' | 'input' | 'success' | 'failed'>('idle');

  const flashIntervalRef = useRef<any>(null);
  const flashTimeoutRef = useRef<any>(null);

  const clearFlashTimers = () => {
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
      flashIntervalRef.current = null;
    }
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearFlashTimers();
    };
  }, []);

  // Visibility change handling: stop flash timers & speech
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearFlashTimers();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        soundFx.stopAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Populate pool dynamically from REGION_ASSETS[safeRegion] via getGameAssetUrl
  useEffect(() => {
    const files = REGION_ASSETS[safeRegion] || REGION_ASSETS['assam'];
    const formattedState = safeRegion.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const generatedPool: OrderItem[] = files.map((fileName, index) => {
      const cleanLabel = CULTURAL_LABELS[fileName] || (() => {
        const fallback = fileName
          .replace(/\.[^/.]+$/, '')
          .replace(/^[a-z]+-([a-z]+-)?/i, '')
          .replace(/-/g, ' ')
          .trim();
        return (!fallback || /^\d+$/.test(fallback))
          ? `Heritage ${index + 1}`
          : fallback.replace(/\b\w/g, (c) => c.toUpperCase());
      })();

      return {
        id: `${safeRegion}-${fileName}`,
        name: cleanLabel,
        stateName: formattedState,
        imageUrl: getGameAssetUrl('match-the-order', safeRegion, fileName),
      };
    });

    setPool(generatedPool);
  }, [safeRegion]);

  // Start new round once pool is initialized or level/region changes
  useEffect(() => {
    if (pool.length > 0) {
      startNewRound(1, pool);
    }
  }, [pool]);

  const startNewRound = (customLevel = level, itemsPool = pool) => {
    clearFlashTimers();
    soundFx.playClickSound();

    if (itemsPool.length === 0) return;

    const targetCount = customLevel === 1 ? Math.min(3, itemsPool.length) : Math.min(4, itemsPool.length);
    const shuffled = [...itemsPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, targetCount);

    setSequence(selected);
    setPlayerInput([]);
    setGameStatus('showing');
    setIsShowingSequence(true);
    playFlashSequence(selected);
  };

  const playFlashSequence = (seq: OrderItem[]) => {
    clearFlashTimers();
    let index = 0;
    setActiveFlashIndex(null);

    flashIntervalRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        clearFlashTimers();
        return;
      }
      if (index < seq.length) {
        soundFx.playCardFlipSound();
        setActiveFlashIndex(index);
        index++;
      } else {
        clearFlashTimers();
        flashTimeoutRef.current = setTimeout(() => {
          setActiveFlashIndex(null);
          setIsShowingSequence(false);
          setGameStatus('input');
          soundFx.playClickSound();
        }, 800);
      }
    }, 1100);
  };

  const handleItemTap = (item: OrderItem) => {
    if (isShowingSequence || gameStatus !== 'input') return;

    soundFx.playClickSound();
    const updated = [...playerInput, item];
    setPlayerInput(updated);

    const currentStep = updated.length - 1;
    if (sequence[currentStep]?.id !== item.id) {
      // Mistake
      setGameStatus('failed');
      return;
    }

    // If reached end of sequence
    if (updated.length === sequence.length) {
      setGameStatus('success');
      soundFx.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      recordGameCompletion(`Match Order (${safeRegion} - L${level})`, 100 * level, sequence.length, 30, 100);
    }
  };

  const handleNextLevel = () => {
    soundFx.playClickSound();
    if (level < 3) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      startNewRound(nextLevel, pool);
    } else {
      setLevel(1);
      startNewRound(1, pool);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* Header Bar */}
      <div className="duo-card p-4 sm:p-5 bg-white dark:bg-stone-900 flex items-center justify-between gap-3 shadow-sm border-2 border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundFx.playClickSound();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-stone-300 dark:border-stone-700 hover:border-emerald-700 bg-stone-50 dark:bg-stone-800 font-black text-xs sm:text-sm text-stone-700 dark:text-stone-200 active:scale-95 transition-all cursor-pointer"
            title="Back to games hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('returnToApp')}</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-none">
                {t('matchOrderTitle')}
              </h2>
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                {t('level')} {level} {t('of')} 3
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400 mt-0.5 capitalize">
              {safeRegion.replace('-', ' ')} • {t('matchOrderDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <SpeechButton
            text={`${t('matchOrderTitle')}.`}
            size="sm"
          />
          <button
            type="button"
            onClick={() => startNewRound(level, pool)}
            className="p-2.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:border-stone-400 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-all cursor-pointer"
            title="Replay sequence"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sequence Flash Stage */}
      <div className="duo-card p-6 bg-amber-50/60 dark:bg-amber-950/20 border-3 border-amber-200 dark:border-amber-800 text-center space-y-4">
        <div className="flex items-center justify-center max-w-md mx-auto">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
            {isShowingSequence ? t('watchCarefully') : gameStatus === 'input' ? t('yourTurn') : t('roundStatus')}
          </span>
        </div>

        {/* Display Sequence Target Slots */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap min-h-[140px]">
          {sequence.map((item, idx) => {
            const isFlashed = activeFlashIndex === idx;
            const isFilled = playerInput.length > idx;
            const filledItem = playerInput[idx];

            return (
              <div
                key={idx}
                className={`relative w-24 h-32 sm:w-28 sm:h-36 rounded-2xl border-3 flex flex-col items-center justify-between p-1.5 transition-all duration-300 ${
                  isFlashed
                    ? 'border-amber-500 ring-4 ring-amber-300 scale-110 shadow-xl bg-white dark:bg-stone-800'
                    : isFilled
                    ? 'border-emerald-600 bg-white dark:bg-stone-800 shadow-sm'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-100/80 dark:bg-stone-900/60 border-dashed'
                }`}
              >
                <span className="text-[10px] font-black uppercase text-stone-400 dark:text-stone-400">
                  {t('step')} {idx + 1}
                </span>

                {isShowingSequence ? (
                  isFlashed ? (
                    <div className="w-full h-full flex flex-col items-center justify-between animate-in zoom-in-75">
                      <div className="w-full aspect-square rounded-xl overflow-hidden shadow-xs border border-stone-200 dark:border-stone-700 relative bg-stone-100 dark:bg-stone-800">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="object-cover w-full h-full rounded-xl"
                          onError={(e) => {
                            console.error('Failed to load image:', e.currentTarget.src);
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/vite.svg';
                          }}
                        />
                      </div>
                      <p className="text-[11px] font-black text-stone-900 dark:text-stone-100 truncate w-full px-0.5">
                        {item.name}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full flex-1 flex items-center justify-center">
                      <span className="text-2xl font-black text-stone-300 dark:text-stone-600">?</span>
                    </div>
                  )
                ) : isFilled ? (
                  <div className="w-full h-full flex flex-col items-center justify-between">
                    <div className="w-full aspect-square rounded-xl overflow-hidden shadow-xs border border-stone-200 dark:border-stone-700 relative bg-stone-100 dark:bg-stone-800">
                      <img
                        src={filledItem.imageUrl}
                        alt={filledItem.name}
                        className="object-cover w-full h-full rounded-xl"
                        onError={(e) => {
                          console.error('Failed to load image:', e.currentTarget.src);
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/vite.svg';
                        }}
                      />
                    </div>
                    <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 truncate w-full px-0.5">
                      {filledItem.name}
                    </p>
                  </div>
                ) : (
                  <div className="w-full flex-1 flex items-center justify-center">
                    <span className="text-2xl font-black text-stone-300 dark:text-stone-600">{idx + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-black text-stone-800 dark:text-stone-100">
            {t('tapOrderPrompt')}
          </h3>
          {gameStatus === 'input' && (
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
              {playerInput.length} / {sequence.length}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pool.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isShowingSequence || gameStatus !== 'input'}
              onClick={() => handleItemTap(item)}
              className="duo-card p-3 bg-white dark:bg-stone-900 flex flex-col items-center justify-between gap-2 border-3 border-stone-200 dark:border-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500 active:translate-y-0.5 disabled:opacity-60 transition-all cursor-pointer select-none"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="object-cover w-full h-full rounded-xl"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Failed to load image:', e.currentTarget.src);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/vite.svg';
                  }}
                />
              </div>
              <div className="text-center w-full">
                <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 truncate">{item.name}</p>
                <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 truncate">{item.stateName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback & Round Results */}
      {gameStatus === 'success' && (
        <div className="duo-card p-5 bg-emerald-50 dark:bg-stone-900 border-3 border-emerald-400 dark:border-emerald-600 text-center space-y-3 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-stone-900 dark:text-white">{t('correct')}</h3>
          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
            {t('roundComplete')}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleNextLevel}
              className="duo-btn duo-btn-green py-2.5 px-5 font-black text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{level < 3 ? `${t('nextLevel')} (${level + 1})` : `${t('playAgain')} (${t('level')} 1)`}</span>
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'failed' && (
        <div className="duo-card p-5 bg-rose-50 dark:bg-stone-900 border-3 border-rose-400 dark:border-rose-600 text-center space-y-3 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-stone-900 dark:text-white">{t('wrong')}</h3>
          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
            {t('wrong')}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startNewRound(level, pool)}
              className="duo-btn duo-btn-amber py-2.5 px-5 font-black text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('retryLevel')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mascot Cheer */}
      <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-3xl p-4 sm:p-5 shadow-sm">
        <Mascot
          message={
            gameStatus === 'success'
              ? t('roundComplete')
              : gameStatus === 'failed'
              ? t('wrong')
              : t('tapOrderPrompt')
          }
          mood={gameStatus === 'success' ? 'celebrating' : gameStatus === 'failed' ? 'gentle' : 'happy'}
          size="medium"
        />
      </div>
    </div>
  );
};
