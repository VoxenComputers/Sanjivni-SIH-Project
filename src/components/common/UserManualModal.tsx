import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { SpeechButton } from './SpeechButton';
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookHeart,
  CalendarCheck2,
  Gamepad2,
  ShieldCheck,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export const UserManualModal: React.FC = () => {
  const { isUserManualOpen, setUserManualOpen, t } = useApp();
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  if (!isUserManualOpen) return null;

  const slides = [
    {
      id: 'family',
      title: '1. Family Memory Vault',
      subtitle: 'Hear voice messages from loved ones anytime',
      description:
        'Tap the large green "Play Voice Note" button to hear warm, reassuring audio recordings from your grandson Rahul, daughter Priya, and family. It brings comfort and stimulates biographical memory.',
      icon: BookHeart,
      themeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeText: 'Family & Identity',
      tips: [
        'Each card shows the person’s relation clearly (e.g. Grandson, Daughter).',
        'You can tap as many times as you like during the day.',
      ],
    },
    {
      id: 'routine',
      title: '2. Daily Routine & Medicine',
      subtitle: 'Clear, tap-to-complete daily reminders',
      description:
        'Your daily tasks for morning, afternoon, and evening are arranged chronologically. Tap the chunky box when you complete an activity (like taking your blood pressure tablet or drinking warm water).',
      icon: CalendarCheck2,
      themeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeText: 'Daily Health & Tasks',
      tips: [
        'The app can read each medicine instruction aloud with the speaker button.',
        'Your smartphone will send a device notification chime when a task is due.',
      ],
    },
    {
      id: 'games',
      title: '3. Cognitive Brain Games',
      subtitle: 'Friendly, culturally localized memory exercises',
      description:
        'Strengthen your neuroplasticity with 3 engaging North Eastern memory games: Picture Matching, Match the Order, and Guess the Picture. Earn XP stars and maintain your memory streak with mascot Rongmon!',
      icon: Gamepad2,
      themeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      badgeText: 'Brain Training & Fun',
      tips: [
        'Features authentic icons: Bihu Dhol, Kaziranga Rhino, and Great Hornbill.',
        'Always positive and encouraging—no penalties for taking your time!',
      ],
    },
    {
      id: 'safety',
      title: '4. Caregiver Portal & Safety',
      subtitle: 'GPS Safe Zone monitoring and 1-tap SOS',
      description:
        'Your caregiver has access to a dedicated dashboard that tracks daily adherence, cognitive trend stability (MMSE), and real-time safe zone geofencing around your home to prevent wandering disorientation.',
      icon: ShieldCheck,
      themeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      badgeText: 'Safety & Peace of Mind',
      tips: [
        'An automatic siren and alert will trigger if you exit your Beltola safe boundary.',
        'Caregivers can chat with the AI assistant for instant updates.',
      ],
    },
  ];

  const current = slides[currentSlide];
  const IconComponent = current.icon;

  const handleNext = () => {
    soundFx.playClickSound();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setUserManualOpen(false);
      setCurrentSlide(0);
    }
  };

  const handlePrev = () => {
    soundFx.playClickSound();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    soundFx.playClickSound();
    setUserManualOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-title"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border-3 border-stone-200 dark:border-stone-700 shadow-2xl p-6 sm:p-8 relative flex flex-col justify-between animate-slide-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brand-green-light dark:bg-emerald-950 text-brand-green-dark dark:text-emerald-300 flex items-center justify-center font-black text-sm border border-green-300 dark:border-emerald-800">
              {currentSlide + 1}/{slides.length}
            </span>
            <h2 id="manual-title" className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
              {t('userManual')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Read Aloud button for the slide */}
            <SpeechButton
              text={`${current.title}. ${current.subtitle}. ${current.description}`}
              size="sm"
            />

            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close user manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="py-6 sm:py-8 space-y-5">
          {/* Visual Graphic Banner */}
          <div className={`w-full p-6 sm:p-8 rounded-3xl border-2 flex flex-col items-center justify-center text-center shadow-inner ${current.themeColor}`}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/90 border-3 border-current flex items-center justify-center shadow-sm mb-3">
              <IconComponent className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="px-3 py-1 rounded-full bg-white/90 font-black text-xs uppercase tracking-wider border border-current shadow-xs">
              {current.badgeText}
            </span>
          </div>

          {/* Text Instructions */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight mb-1">
              {current.title}
            </h3>
            <p className="text-sm sm:text-base font-extrabold text-brand-green-dark dark:text-emerald-400 mb-3">
              {current.subtitle}
            </p>
            <p className="text-base sm:text-lg font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Quick elderly tips list */}
          <div className="bg-stone-50 dark:bg-stone-800/60 border-2 border-stone-200 dark:border-stone-700 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Elder-Friendly Guidance</span>
            </p>
            {current.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm font-extrabold text-stone-700 dark:text-stone-200">
                <CheckCircle className="w-4 h-4 text-brand-green dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="pt-4 border-t-2 border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`duo-btn duo-btn-white dark:bg-stone-800 dark:border-stone-700 dark:text-white py-3 px-4 text-xs sm:text-sm font-black flex items-center gap-1.5 min-h-[50px] ${
              currentSlide === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundFx.playClickSound();
                  setCurrentSlide(idx);
                }}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'bg-brand-green w-8 sm:w-9 border border-brand-green-dark'
                    : 'bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next / Finish Button */}
          <button
            type="button"
            onClick={handleNext}
            className="duo-btn duo-btn-green py-3 px-5 text-xs sm:text-sm font-black flex items-center gap-1.5 min-h-[50px] cursor-pointer"
          >
            <span>{currentSlide === slides.length - 1 ? 'Start Using' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
