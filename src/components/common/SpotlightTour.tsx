import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { speechSynth } from '../../utils/speech';
import { SpeechButton } from './SpeechButton';
import { ChevronRight, ChevronLeft, Check, X, Compass } from 'lucide-react';

interface TourStepConfig {
  targetSelector: string;
  tab: 'reminisce' | 'games' | 'routine';
  title: string;
  desc: string;
  fallbackPosition: { top: number; left: number };
}

export const SpotlightTour: React.FC = () => {
  const {
    isSpotlightActive,
    spotlightStep,
    nextSpotlightStep,
    prevSpotlightStep,
    closeSpotlightTour,
    patientTab,
    setPatientTab,
    t,
  } = useApp();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Deep Spotlight Onboarding Steps (including Daily Routine, 100% dynamically localized across all 6 languages)
  const tourSteps: TourStepConfig[] = [
    {
      targetSelector: '#main-nav-tabs, #nav-memories-mobile',
      tab: 'reminisce',
      title: t('tourStep1Title'),
      desc: t('tourStep1Desc'),
      fallbackPosition: { top: 75, left: 140 },
    },
    {
      targetSelector: '#daily-snapshot-card',
      tab: 'reminisce',
      title: t('tourStep2Title'),
      desc: t('tourStep2Desc'),
      fallbackPosition: { top: 160, left: 40 },
    },
    {
      targetSelector: '#family-memory-book',
      tab: 'reminisce',
      title: t('tourStep3Title'),
      desc: t('tourStep3Desc'),
      fallbackPosition: { top: 280, left: 40 },
    },
    {
      targetSelector: '#tour-voice-btn',
      tab: 'reminisce',
      title: t('tourStep4Title'),
      desc: t('tourStep4Desc'),
      fallbackPosition: { top: 400, left: 40 },
    },
    {
      targetSelector: '#brain-games-cards',
      tab: 'games',
      title: t('tourStep5Title'),
      desc: t('tourStep5Desc'),
      fallbackPosition: { top: 240, left: 40 },
    },
    {
      targetSelector: '#routine-checklist-container, #nav-routine, #nav-routine-mobile',
      tab: 'routine',
      title: t('tourStep6Title') || 'Daily Routine',
      desc: t('tourStep6Desc') || 'Daily Routine: Here you will find your daily tasks and medicine reminders.',
      fallbackPosition: { top: 200, left: 40 },
    },
  ];

  const currentStep = tourSteps[spotlightStep] || tourSteps[0];

  // Critical Requirement 1: Fix "Tick-Tick" Audio Loop
  // Strict dependency array [spotlightStep, isSpotlightActive] fires strictly ONCE per step index change.
  // Cancels any ongoing Web Speech API or audio playback beforehand.
  useEffect(() => {
    if (!isSpotlightActive) return;

    speechSynth.stop();
    soundFx.playClickSound();
  }, [spotlightStep, isSpotlightActive]);

  // Helper: Query and validate the active target element
  const getTargetElement = useCallback((): HTMLElement | null => {
    const selectors = currentStep.targetSelector.split(',').map((s) => s.trim());
    for (const s of selectors) {
      const el = document.querySelector(s) as HTMLElement | null;
      if (el && el.getBoundingClientRect().width > 0) {
        return el;
      }
    }
    return null;
  }, [currentStep.targetSelector]);

  // Immediate rect measurement for the active target
  const updateRect = useCallback(() => {
    if (!isSpotlightActive) return;
    const el = getTargetElement();
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isSpotlightActive, getTargetElement]);

  // Real-time scroll & resize listeners (using capture to catch all scroll events across window/document/containers)
  useEffect(() => {
    if (!isSpotlightActive) return;

    let ticking = false;
    const handleScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateRect();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isSpotlightActive, updateRect]);

  // Dynamic layout / ResizeObserver tracking (handles font loads, image renders, DOM reflows)
  useEffect(() => {
    if (!isSpotlightActive) return;
    const ro = new ResizeObserver(() => {
      updateRect();
    });
    const root = document.getElementById('root') || document.body;
    ro.observe(root);
    return () => ro.disconnect();
  }, [isSpotlightActive, updateRect]);

  // Step transition: synchronizes tab, scrolls target into view, and continuously tracks position during animation
  useEffect(() => {
    if (!isSpotlightActive) return;

    // Ensure correct tab is active for this step
    if (patientTab !== currentStep.tab) {
      setPatientTab(currentStep.tab);
    }

    setTargetRect(null);

    let cancelTracking: (() => void) | undefined;
    let attempts = 0;
    const maxAttempts = 15;

    const checkAndTrack = () => {
      const el = getTargetElement();
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Continuously update rect frame-by-frame during the browser's smooth scroll animation
        const startTime = performance.now();
        const duration = 800;
        let animId: number;

        const trackLoop = (now: number) => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          if (now - startTime < duration) {
            animId = requestAnimationFrame(trackLoop);
          }
        };

        animId = requestAnimationFrame(trackLoop);
        cancelTracking = () => cancelAnimationFrame(animId);
      } else if (attempts < maxAttempts) {
        attempts++;
        timeoutId = setTimeout(checkAndTrack, 60);
      }
    };

    let timeoutId = setTimeout(checkAndTrack, 80);

    return () => {
      clearTimeout(timeoutId);
      if (cancelTracking) cancelTracking();
    };
  }, [isSpotlightActive, spotlightStep, currentStep.tab, getTargetElement, patientTab, setPatientTab]);

  if (!isSpotlightActive) return null;

  const title = currentStep.title;
  const desc = currentStep.desc;
  const spokenText = `${title}. ${desc}`;

  // Calculate spotlight overlay dimensions
  const padding = 10;
  const isTargetVisible = !!targetRect && targetRect.width > 0 && targetRect.height > 0;

  // Zero-latency top/left ensures instantaneous lock to element during scroll without lagging
  const spotlightStyle: React.CSSProperties = isTargetVisible
    ? {
        position: 'fixed',
        top: `${Math.max(0, targetRect.top - padding)}px`,
        left: `${Math.max(0, targetRect.left - padding)}px`,
        width: `${targetRect.width + padding * 2}px`,
        height: `${targetRect.height + padding * 2}px`,
        borderRadius: '24px',
        boxShadow: '0 0 0 9999px rgba(12, 10, 9, 0.85)',
        border: '4px solid #10B981',
        pointerEvents: 'none',
        zIndex: 60,
        transition: 'width 0.2s ease, height 0.2s ease, border-radius 0.2s ease',
      }
    : {
        display: 'none',
      };

  // Tooltip positioning: Smart place above or below target, horizontally centered and clamped to viewport
  let tooltipTop = 150;
  let tooltipLeft = 20;
  const tooltipApproxHeight = 260;
  const tooltipWidth = typeof window !== 'undefined' ? Math.min(384, window.innerWidth - 32) : 360;

  if (isTargetVisible) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= tooltipApproxHeight + 20) {
      tooltipTop = targetRect.bottom + 16;
    } else if (spaceAbove >= tooltipApproxHeight + 20) {
      tooltipTop = targetRect.top - tooltipApproxHeight - 16;
    } else {
      tooltipTop = spaceBelow >= spaceAbove 
        ? window.innerHeight - tooltipApproxHeight - 20 
        : 20;
    }

    // Clamp top position within safe viewport boundaries
    tooltipTop = Math.max(16, Math.min(window.innerHeight - tooltipApproxHeight - 16, tooltipTop));

    // Center horizontally relative to target element, clamped inside viewport
    const targetCenterX = targetRect.left + targetRect.width / 2;
    tooltipLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, targetCenterX - tooltipWidth / 2));
  } else {
    tooltipTop = currentStep.fallbackPosition.top;
    tooltipLeft = Math.max(16, Math.min((typeof window !== 'undefined' ? window.innerWidth : 800) - tooltipWidth - 16, currentStep.fallbackPosition.left));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto">
      {/* Dark backdrop if element measuring in progress */}
      {!isTargetVisible && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-xs transition-opacity duration-300" />
      )}

      {/* Dynamic Cutout Spotlight with Green Glow Border */}
      {isTargetVisible && (
        <>
          <div style={spotlightStyle} />
          {/* Pulsing ring highlight */}
          <div
            style={{
              position: 'fixed',
              top: `${Math.max(0, targetRect.top - padding - 4)}px`,
              left: `${Math.max(0, targetRect.left - padding - 4)}px`,
              width: `${targetRect.width + padding * 2 + 8}px`,
              height: `${targetRect.height + padding * 2 + 8}px`,
              borderRadius: '28px',
              border: '2px dashed #34D399',
              pointerEvents: 'none',
              zIndex: 61,
              transition: 'width 0.2s ease, height 0.2s ease, border-radius 0.2s ease',
            }}
            className="animate-pulse"
          />
        </>
      )}

      {/* Friendly Tooltip Card with Web Speech Narration & High Contrast Dark Mode */}
      <div
        style={{
          position: 'fixed',
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          zIndex: 70,
          transition: 'top 0.15s cubic-bezier(0.2, 0, 0, 1), left 0.15s cubic-bezier(0.2, 0, 0, 1)',
        }}
        className="w-[calc(100vw-32px)] max-w-sm bg-white dark:bg-stone-900 border-3 border-emerald-600 dark:border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Step Indicator & Skip Button */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-black text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{t('step')} {spotlightStep + 1} {t('of')} {tourSteps.length}</span>
            </span>
            <SpeechButton text={spokenText} size="sm" />
          </div>

          <button
            type="button"
            onClick={closeSpotlightTour}
            className="text-xs font-black text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 flex items-center gap-1 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={t('tourSkip')}
          >
            <span>{t('tourSkip')}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Coach Mark Copy */}
        <div className="space-y-1.5 my-2">
          <h4 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
            {title}
          </h4>
          <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100 dark:border-stone-800 gap-2">
          {spotlightStep > 0 ? (
            <button
              type="button"
              onClick={prevSpotlightStep}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border-2 border-stone-300 dark:border-stone-700 font-black text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('tourPrev')}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={nextSpotlightStep}
            className="duo-btn duo-btn-green py-2 px-4 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>{spotlightStep < tourSteps.length - 1 ? t('tourNext') : t('tourFinish')}</span>
            {spotlightStep < tourSteps.length - 1 ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
