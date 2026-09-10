import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../../utils/audio';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { getGameAssetUrl, REGION_ASSETS, normalizeRegionId, getFallbackGameAssetUrl } from '../../../utils/assetManager';
import { SpeechButton } from '../../common/SpeechButton';
import { Mascot } from '../../common/Mascot';
import { ArrowLeft, RotateCcw, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface PictureMatchingGameProps {
  onBack: () => void;
}

interface CardItem {
  uid: string;
  itemId: string;
  name: string;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const PictureMatchingGame: React.FC<PictureMatchingGameProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { recordGameCompletion, t, selectedRegion } = useApp();

  // Robust region sanitization supporting all 8 North-Eastern states
  const rawRegion = user?.user_metadata?.region || (user as any)?.region || selectedRegion || 'assam';
  const safeRegion = normalizeRegionId(rawRegion);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Initialize and shuffle 6 photographic cards (3 pairs) tailored to safeRegion
  const initializeGame = () => {
    soundFx.playClickSound();

    const regionPool = REGION_ASSETS[safeRegion] || REGION_ASSETS['assam'];
    // Select 3 distinct images from the active region's array
    const selectedFiles = regionPool.slice(0, 3);

    const duplicated: CardItem[] = [];

    selectedFiles.forEach((fileName, index) => {
      const dynamicUrl = getGameAssetUrl('picture-match', safeRegion, fileName);
      
      const cleanLabel = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/^[a-z]+-([a-z]+-)?/i, '')
        .replace(/-/g, ' ')
        .trim();
      const displayName = (!cleanLabel || /^\d+$/.test(cleanLabel))
        ? `Heritage ${index + 1}`
        : cleanLabel.replace(/\b\w/g, (c) => c.toUpperCase());

      // First card of pair
      duplicated.push({
        uid: `${fileName}-1`,
        itemId: fileName,
        name: displayName,
        imageUrl: dynamicUrl,
        isFlipped: false,
        isMatched: false,
      });

      // Second card of pair
      duplicated.push({
        uid: `${fileName}-2`,
        itemId: fileName,
        name: displayName,
        imageUrl: dynamicUrl,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    const shuffled = [...duplicated].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setFlippedUids([]);
    setMoves(0);
    setIsWon(false);
    setStartTime(Date.now());
    setElapsedSeconds(0);
  };

  useEffect(() => {
    initializeGame();
  }, [safeRegion]);

  // Elapsed timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isWon]);

  const handleCardClick = (card: CardItem) => {
    if (card.isFlipped || card.isMatched || flippedUids.length >= 2 || isWon) {
      return;
    }

    soundFx.playCardFlipSound();

    const newFlipped = [...flippedUids, card.uid];
    setFlippedUids(newFlipped);

    // Flip card visually
    setCards((prev) =>
      prev.map((c) => (c.uid === card.uid ? { ...c, isFlipped: true } : c))
    );

    // If 2 cards flipped, evaluate match
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstUid, secondUid] = newFlipped;
      const firstCard = cards.find((c) => c.uid === firstUid);
      const secondCard = card;

      if (firstCard && secondCard && firstCard.itemId === secondCard.itemId) {
        // MATCH!
        setTimeout(() => {
          soundFx.playSuccessChime();
          setCards((prev) =>
            prev.map((c) =>
              c.itemId === firstCard.itemId ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          setFlippedUids([]);

          // Check if all cards matched
          const remainingUnmatched = cards.filter(
            (c) => c.itemId !== firstCard.itemId && !c.isMatched
          ).length;

          if (remainingUnmatched === 0) {
            handleVictory();
          }
        }, 400);
      } else {
        // MISMATCH
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uid === firstUid || c.uid === secondUid ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedUids([]);
        }, 900);
      }
    }
  };

  const handleVictory = () => {
    setIsWon(true);
    soundFx.playSuccessChime();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    recordGameCompletion(`Picture Match (${safeRegion})`, 120, moves + 1, elapsedSeconds, 95);
  };

  const matchedPairsCount = cards.filter((c) => c.isMatched).length / 2;
  const totalPairs = cards.length / 2;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-2xl p-3 sm:px-4 sm:py-3 shadow-sm">
        <button
          onClick={() => {
            soundFx.playClickSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-stone-300 dark:border-stone-700 hover:border-emerald-700 bg-stone-50 dark:bg-stone-800 font-black text-xs sm:text-sm text-stone-700 dark:text-stone-200 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('returnToApp')}</span>
        </button>

        {/* Game Title & Speech */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
            {t('pictureMatchTitle')}
          </h2>
          <SpeechButton
            text={`${t('pictureMatchTitle')}.`}
            size="sm"
          />
        </div>

        {/* Reset Round */}
        <button
          onClick={initializeGame}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200 active:scale-95 transition-all cursor-pointer"
          title="Restart Game"
        >
          <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span className="hidden sm:inline">{t('playAgain')}</span>
        </button>
      </div>

      {/* Progress & Stat Pill Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl p-2 sm:p-3">
          <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase block">
            {t('matchedPairs')}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
            {matchedPairsCount} / {totalPairs}
          </span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-2 sm:p-3">
          <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase block">
            {t('moves')}
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100">{moves}</span>
        </div>

        <div className="bg-stone-100 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-2xl p-2 sm:p-3">
          <span className="text-[11px] font-black text-stone-600 dark:text-stone-300 uppercase block">
            {t('time')}
          </span>
          <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
            {Math.floor(elapsedSeconds / 60)}:
            {(elapsedSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Dynamic Cultural Card Grid (6 cards total: 3 pairs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-2xl mx-auto">
        {cards.map((card) => {
          return (
            <button
              key={card.uid}
              onClick={() => handleCardClick(card)}
              disabled={card.isMatched || card.isFlipped}
              className={`relative min-h-[160px] sm:min-h-[190px] rounded-2xl border-3 transition-all transform duration-300 flex flex-col items-center justify-between p-2 focus:outline-none select-none cursor-pointer ${
                card.isMatched
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 scale-95 opacity-90 shadow-none'
                  : card.isFlipped
                  ? 'border-emerald-500 bg-white dark:bg-stone-900 shadow-lg -translate-y-1'
                  : 'border-emerald-900 bg-emerald-700 shadow-md hover:border-emerald-600 hover:-translate-y-1 active:translate-y-0.5'
              }`}
              aria-label={card.isFlipped ? card.name : 'Hidden card'}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
                  {/* Strict Aspect-Square Photographic Container */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-xs relative bg-stone-100 dark:bg-stone-800">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="object-cover w-full h-full rounded-xl"
                      loading="lazy"
                      onError={(e) => {
                        console.warn('Image failed to load, falling back to default:', e.currentTarget.src);
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackGameAssetUrl('picture-match');
                      }}
                    />
                    {card.isMatched && (
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Clean Photographic Label */}
                  <div className="w-full text-center px-1 pb-0.5">
                    <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 truncate leading-tight">
                      {card.name}
                    </p>
                    <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 truncate capitalize">
                      {safeRegion.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              ) : (
                /* Card Back (Patterned Duolingo-style Chunky Back) */
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border-2 border-emerald-600 flex items-center justify-center text-emerald-200 mb-1">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black text-emerald-100 tracking-wider uppercase">
                    SANJIVNI
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Victory Celebration Card */}
      {isWon && (
        <div className="duo-card p-6 bg-amber-50 dark:bg-stone-900 border-3 border-amber-400 dark:border-amber-600 text-center space-y-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg border-2 border-amber-700 animate-bounce">
            <Award className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              {t('roundComplete')}
            </h3>
            <p className="text-base font-bold text-stone-700 dark:text-stone-300 mt-1">
              {t('roundComplete')}!
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={initializeGame}
              className="duo-btn duo-btn-green py-3 px-6 text-base font-black flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{t('playAgain')}</span>
            </button>
            <button
              onClick={onBack}
              className="duo-btn duo-btn-amber py-3 px-6 text-base font-black flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('returnToApp')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mascot Cheer */}
      <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-3xl p-4 sm:p-5 shadow-sm">
        <Mascot
          message={
            isWon
              ? t('roundComplete')
              : t('gamesMascotGreeting')
          }
          mood={isWon ? 'celebrating' : 'gentle'}
          size="medium"
        />
      </div>
    </div>
  );
};
