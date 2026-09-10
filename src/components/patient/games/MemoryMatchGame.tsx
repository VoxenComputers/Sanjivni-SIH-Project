import React, { useState, useEffect } from 'react';
import { NER_MEMORY_ITEMS, NERMemoryItem } from '../../../utils/nerData';
import { useApp } from '../../../context/AppContext';
import { soundFx } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, Sparkles, ArrowLeft } from 'lucide-react';
import { Mascot } from '../../common/Mascot';

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
  const { recordGameCompletion } = useApp();
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Initialize and shuffle 6 pairs (12 cards)
  const initializeGame = () => {
    soundFx.playClickSound();
    const pairs: CardState[] = [];
    NER_MEMORY_ITEMS.forEach((item) => {
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
  }, []);

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

          if (nextMatches === NER_MEMORY_ITEMS.length) {
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

    recordGameCompletion(
      'Memory Match (NER)',
      100,
      moves + 1,
      timerSeconds,
      Math.round((NER_MEMORY_ITEMS.length / (moves + 1)) * 100)
    );
  };

  // Dedicated SVG Icons for the 6 NER items
  const renderItemArtwork = (item: NERMemoryItem) => {
    switch (item.id) {
      case 'bihu_dhol':
        return (
          <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16">
            {/* Drum Body */}
            <ellipse cx="32" cy="18" rx="20" ry="8" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
            <path d="M 12 18 L 16 46 Q 32 54 48 46 L 52 18" fill="#D97706" stroke="#B45309" strokeWidth="2.5" />
            <ellipse cx="32" cy="46" rx="16" ry="6" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            {/* Red Gamosa accent */}
            <path d="M 18 26 L 46 26" stroke="#DC2626" strokeWidth="3" />
            <path d="M 22 36 L 42 36" stroke="#DC2626" strokeWidth="3" />
          </svg>
        );
      case 'kaziranga_rhino':
        return (
          <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16">
            <ellipse cx="34" cy="36" rx="20" ry="14" fill="#9CA3AF" stroke="#374151" strokeWidth="2.5" />
            <circle cx="18" cy="30" r="10" fill="#9CA3AF" stroke="#374151" strokeWidth="2.5" />
            <path d="M 10 26 Q 4 18 10 22 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <circle cx="16" cy="28" r="2" fill="#1F2937" />
            <line x1="22" y1="48" x2="22" y2="58" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
            <line x1="42" y1="48" x2="42" y2="58" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
      case 'hornbill_bird':
        return (
          <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16">
            <circle cx="34" cy="30" r="14" fill="#1F2937" stroke="#111827" strokeWidth="2" />
            {/* Massive Yellow/Red Casque Bill */}
            <path d="M 24 24 Q 4 16 12 34 L 26 32 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <path d="M 20 20 Q 8 16 14 26 Z" fill="#DC2626" />
            <circle cx="30" cy="26" r="2.5" fill="#DC2626" />
            <path d="M 38 40 Q 48 54 36 60 Q 32 50 36 42 Z" fill="#F3F4F6" stroke="#374151" strokeWidth="2" />
          </svg>
        );
      case 'muga_silk':
        return (
          <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16">
            <rect x="14" y="14" width="36" height="36" rx="8" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2.5" />
            {/* Traditional Kingkhap pattern */}
            <polygon points="32,20 40,32 32,44 24,32" fill="#EA580C" />
            <circle cx="32" cy="32" r="3" fill="#FEF08A" />
            <path d="M 18 20 L 46 44 M 46 20 L 18 44" stroke="#CA8A04" strokeWidth="1.5" strokeDasharray="3,3" />
          </svg>
        );
      case 'assam_tea':
        return (
          <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16">
            <path d="M 32 52 Q 32 32 16 22 Q 30 18 32 40 Z" fill="#22C55E" stroke="#15803D" strokeWidth="2.5" />
            <path d="M 32 52 Q 32 30 48 18 Q 36 16 32 38 Z" fill="#16A34A" stroke="#15803D" strokeWidth="2.5" />
            <path d="M 32 38 Q 32 12 32 8" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'loktak_lake':
        return (
          <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16">
            <rect x="8" y="12" width="48" height="40" rx="10" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
            {/* Circular Floating Phumdis */}
            <circle cx="24" cy="32" r="10" fill="#4ADE80" stroke="#15803D" strokeWidth="2" />
            <circle cx="42" cy="26" r="7" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
            <path d="M 12 44 Q 24 40 36 44 T 52 44" stroke="#0284C7" strokeWidth="2" fill="none" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-white hover:bg-stone-100 font-extrabold text-stone-700 shadow-duo-neutral active:translate-y-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Games</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Moves</span>
            <span className="text-xl sm:text-2xl font-black text-brand-dark">{moves}</span>
          </div>
          <div className="text-right border-l-2 border-stone-200 pl-4">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Time</span>
            <span className="text-xl sm:text-2xl font-black text-brand-dark">{timerSeconds}s</span>
          </div>
          <button
            onClick={initializeGame}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-extrabold shadow-duo-neutral active:translate-y-1"
            title="Restart game"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Encouragement Mascot or Victory Panel */}
      {isWon ? (
        <div className="duo-card border-brand-green border-b-6 border-b-brand-green-dark bg-green-50 p-6 sm:p-8 text-center animate-tactile-bounce">
          <div className="w-16 h-16 rounded-3xl bg-brand-green text-white flex items-center justify-center mx-auto mb-3 shadow-duo-green">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-brand-dark mb-2">
            Fantastic Job, Koka! (অসাধাৰণ!)
          </h3>
          <p className="text-lg sm:text-xl font-bold text-stone-700 max-w-lg mx-auto mb-6">
            You matched all North Eastern cultural heritage cards in {moves} moves and {timerSeconds} seconds!
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={initializeGame}
              className="duo-btn duo-btn-green text-lg px-8 py-3.5"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Play Again!</span>
            </button>
            <button
              onClick={onBack}
              className="duo-btn duo-btn-white text-lg px-8 py-3.5"
            >
              <span>Back to Games Hub</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4">
          <Mascot
            message="Tap two cards to find their match! Remember where each Assam item is hidden."
            mood="happy"
            size="small"
          />
          <div className="text-right flex-shrink-0">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Pairs Matched</span>
            <span className="text-2xl sm:text-3xl font-black text-brand-amber-dark">
              {matchesFound} / {NER_MEMORY_ITEMS.length}
            </span>
          </div>
        </div>
      )}

      {/* The 12-Card Grid (4 cols on desktop, 3 on mobile) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
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
                    ? 'border-brand-green bg-green-50 shadow-duo-green'
                    : isRevealed
                    ? 'border-brand-amber bg-white shadow-duo-amber'
                    : 'border-stone-300 bg-white shadow-duo-neutral hover:border-brand-green'
                }`}
              >
                {/* Back Face (When Hidden) */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-2 rounded-2xl sm:rounded-3xl bg-[#FAF8F5]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-green-light border-2 border-brand-green flex items-center justify-center text-brand-green-dark">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-stone-600 mt-2 text-center leading-none">
                    মন-স্মৃতি
                  </span>
                </div>

                {/* Front Face (When Flipped) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-between p-2 sm:p-3 rounded-2xl sm:rounded-3xl bg-white text-center">
                  <div className="flex-1 flex items-center justify-center">
                    {renderItemArtwork(card.item)}
                  </div>
                  <div className="w-full">
                    <p className="text-xs sm:text-sm font-black text-brand-dark leading-tight line-clamp-1">
                      {card.item.name}
                    </p>
                    <p className="text-[10px] sm:text-xs font-extrabold text-stone-500 line-clamp-1">
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
