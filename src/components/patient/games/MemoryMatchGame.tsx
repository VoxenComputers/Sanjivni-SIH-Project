import React, { useState, useEffect } from 'react';
import { getRegionItems, NERMemoryItem, NERStateId } from '../../../utils/nerData';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { getGameAssetUrl, normalizeRegionId, getFallbackGameAssetUrl } from '../../../utils/assetManager';
import { soundFx } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, Sparkles, ArrowLeft } from 'lucide-react';
import { Mascot } from '../../common/Mascot';
import { SpeechButton } from '../../common/SpeechButton';

interface CardState {
  instanceId: string;
  item: NERMemoryItem;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  onBack: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { recordGameCompletion, selectedRegion, language, t } = useApp();

  const rawRegion = user?.user_metadata?.region || (user as any)?.region || selectedRegion || 'assam';
  const safeRegion = normalizeRegionId(rawRegion);
  const stateKey = (safeRegion === 'arunachal-pradesh' ? 'arunachal' : safeRegion) as NERStateId;
  const formattedStateName = safeRegion.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Initialize and shuffle pairs for selected region (up to 6 pairs / 12 cards)
  const initializeGame = () => {
    soundFx.playClickSound();
    const regionItems = getRegionItems(stateKey, language);
    const selectedItems = regionItems.slice(0, 6);
    const pairs: CardState[] = [];
    selectedItems.forEach((item) => {
      pairs.push({
        instanceId: `${item.id}-1`,
        item,
        isFlipped: false,
        isMatched: false,
      });
      pairs.push({
        instanceId: `${item.id}-2`,
        item,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Fisher-Yates shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    setCards(pairs);
    setFlippedIndices([]);
    setMoves(0);
    setMatchesFound(0);
    setIsWon(false);
    setTimerSeconds(0);
    setIsActive(true);
  };

  useEffect(() => {
    initializeGame();
  }, [safeRegion, selectedRegion, language]);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isWon) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isWon]);

  // Card click handler
  const handleCardClick = (index: number) => {
    if (!isActive || isWon) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length === 2) return; // wait for check

    soundFx.playCardFlipSound();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.item.id === secondCard.item.id) {
        // MATCH!
        setTimeout(() => {
          soundFx.playMatchSound();
          const matchedCards = [...cards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);

          const nextMatches = matchesFound + 1;
          setMatchesFound(nextMatches);

          const totalPairs = Math.floor(cards.length / 2);
          if (nextMatches === totalPairs && totalPairs > 0) {
            // GAME WON!
            handleVictory();
          }
        }, 500);
      } else {
        // NO MATCH -> flip back after short delay
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  const handleVictory = () => {
    setIsWon(true);
    setIsActive(false);
    soundFx.playSuccessChime();

    // Canvas Confetti Celebration
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#15803D', '#F59E0B', '#10B981', '#F43F5E', '#3B82F6'],
      });
    } catch (e) {
      // ignore
    }

    const totalPairs = Math.floor(cards.length / 2);
    recordGameCompletion(
      `Memory Match (${formattedStateName})`,
      100,
      moves + 1,
      timerSeconds,
      Math.round((totalPairs / (moves + 1)) * 100)
    );
  };

  // Render cultural item artwork with Supabase CDN image and graceful fallback
  const renderItemArtwork = (item: NERMemoryItem) => {
    const fileName = item.imageUrl ? item.imageUrl.split('/').pop() || '' : '';
    const assetUrl = fileName ? getGameAssetUrl('picture-match', safeRegion, fileName) : item.imageUrl;

    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex items-center justify-center bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-inner">
        <img
          src={assetUrl}
          alt={item.name}
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            console.error('Failed to load memory card image:', e.currentTarget.src);
            e.currentTarget.onerror = null;
            if (item.imageUrl && e.currentTarget.src !== item.imageUrl) {
              e.currentTarget.src = item.imageUrl;
            } else {
              e.currentTarget.src = getFallbackGameAssetUrl('picture-match');
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 font-extrabold text-stone-700 dark:text-stone-200 shadow-duo-neutral active:translate-y-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Games</span>
          </button>
          <SpeechButton
            text={`Memory Match Pairs for ${formattedStateName}. ${t('memoryMatchDesc') || 'Find matching cultural cards from your region to exercise focus and recall.'}`}
            size="md"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">Moves</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">{moves}</span>
          </div>
          <div className="text-right border-l-2 border-stone-200 dark:border-stone-700 pl-3 sm:pl-4">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">Time</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">{timerSeconds}s</span>
          </div>
          <button
            onClick={initializeGame}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-extrabold shadow-duo-neutral active:translate-y-1 transition-colors cursor-pointer"
            title="Restart game"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Encouragement Mascot or Victory Panel */}
      {isWon ? (
        <div className="duo-card border-emerald-500 border-b-6 border-b-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-6 sm:p-8 text-center animate-tactile-bounce">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-duo-green">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white mb-2">
            Fantastic Job, Koka!
          </h3>
          <p className="text-lg sm:text-xl font-bold text-stone-700 dark:text-stone-300 max-w-lg mx-auto mb-6">
            You matched all {formattedStateName} cultural heritage cards in {moves} moves and {timerSeconds} seconds!
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={initializeGame}
              className="duo-btn duo-btn-green text-lg px-8 py-3.5 cursor-pointer"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Play Again!</span>
            </button>
            <button
              onClick={onBack}
              className="duo-btn duo-btn-white text-lg px-8 py-3.5 cursor-pointer"
            >
              <span>Back to Games Hub</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4">
          <Mascot
            message={`Tap two cards to find their match! Remember where each ${formattedStateName} item is hidden.`}
            mood="happy"
            size="small"
          />
          <div className="text-right flex-shrink-0">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Pairs Matched</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100">
              {matchesFound} / {Math.floor(cards.length / 2)}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Card Grid (4 cols for 8-12 cards on desktop, 3 cols on mobile) */}
      <div className={`grid gap-3 sm:gap-4 max-w-3xl mx-auto ${
        cards.length <= 8 ? 'grid-cols-2 sm:grid-cols-4 max-w-2xl' : 'grid-cols-3 sm:grid-cols-4'
      }`}>
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.instanceId}
              onClick={() => handleCardClick(idx)}
              className="aspect-square perspective-1000 cursor-pointer select-none"
              role="button"
              tabIndex={0}
              aria-label={isRevealed ? `${card.item.name}` : `Card ${idx + 1}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(idx);
                }
              }}
            >
              <div
                className={`relative w-full h-full rounded-2xl sm:rounded-3xl border-3 sm:border-4 transition-transform duration-300 transform-style-preserve-3d flex items-center justify-center ${
                  isRevealed ? 'rotate-y-180' : ''
                } ${
                  card.isMatched
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-duo-green'
                    : isRevealed
                    ? 'border-amber-500 bg-white dark:bg-stone-800 shadow-duo-amber'
                    : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-duo-neutral hover:border-emerald-500'
                }`}
              >
                {/* Back Face (When Hidden) */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-2 rounded-2xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1C1917]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-stone-600 dark:text-stone-300 mt-2 text-center leading-none">
                    SANJIVNI
                  </span>
                </div>

                {/* Front Face (When Flipped) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-between p-2 sm:p-3 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-800 text-center">
                  <div className="flex-1 flex items-center justify-center">
                    {renderItemArtwork(card.item)}
                  </div>
                  <div className="w-full">
                    <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-white leading-tight line-clamp-1">
                      {card.item.name}
                    </p>
                    <p className="text-[10px] sm:text-xs font-extrabold text-stone-500 dark:text-stone-400 line-clamp-1">
                      {card.item.localName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
