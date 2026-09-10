import React, { useState } from 'react';
import { soundFx } from '../../utils/audio';
import { Lock, Delete, X, ShieldAlert, Sparkles } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    soundFx.playClickSound();
    if (hasError) {
      setHasError(false);
      setErrorMessage('');
    }

    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);

      // Evaluate automatically when 4th digit entered
      if (newPin.length === 4) {
        if (newPin === '1234') {
          soundFx.playSuccessChime();
          setTimeout(() => {
            setPin('');
            onSuccess();
          }, 200);
        } else {
          soundFx.playClickSound();
          setHasError(true);
          setErrorMessage('Incorrect PIN. Please try again (Demo PIN: 1234)');
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    soundFx.playClickSound();
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    soundFx.playClickSound();
    setPin('');
    setHasError(false);
    setErrorMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-stone-900 border-4 border-stone-200 dark:border-stone-700 rounded-3xl p-6 sm:p-7 shadow-2xl animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClickSound();
            setPin('');
            onClose();
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cancel and return to patient view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-black">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Caregiver Security Check</span>
          </div>

          <h3 id="pin-modal-title" className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Enter 4-Digit Security PIN
          </h3>
          <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
            Protects patient from accidental navigation into caregiver clinical settings
          </p>
        </div>

        {/* 4 Masked Digit Dots */}
        <div className="flex items-center justify-center gap-4 my-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-5 h-5 rounded-full border-3 transition-all duration-200 ${
                  hasError
                    ? 'border-rose-500 bg-rose-500 animate-shake'
                    : isFilled
                    ? 'border-emerald-600 bg-emerald-600 scale-110 shadow-sm'
                    : 'border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800'
                }`}
              />
            );
          })}
        </div>

        {/* Error message or demo hint */}
        <div className="h-6 text-center">
          {hasError ? (
            <p className="text-xs font-black text-rose-600 dark:text-rose-400 animate-shake">
              {errorMessage}
            </p>
          ) : (
            <span className="text-[11px] font-extrabold text-stone-400 dark:text-stone-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Default Demo PIN: <strong className="text-stone-700 dark:text-stone-200 font-mono">1234</strong></span>
            </span>
          )}
        </div>

        {/* Chunky Duolingo Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="duo-btn duo-btn-white dark:bg-stone-800 dark:border-stone-700 dark:text-white py-3.5 text-xl font-black rounded-2xl min-h-[56px] shadow-sm hover:border-emerald-500 active:scale-95 transition-all cursor-pointer select-none"
            >
              {d}
            </button>
          ))}

          {/* Clear Key */}
          <button
            type="button"
            onClick={handleClear}
            className="duo-btn duo-btn-white dark:bg-stone-800 dark:border-stone-700 text-stone-500 dark:text-stone-400 py-3.5 text-xs font-black rounded-2xl min-h-[56px] shadow-sm active:scale-95 transition-all cursor-pointer select-none"
            title="Clear"
          >
            Clear
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="duo-btn duo-btn-white dark:bg-stone-800 dark:border-stone-700 dark:text-white py-3.5 text-xl font-black rounded-2xl min-h-[56px] shadow-sm hover:border-emerald-500 active:scale-95 transition-all cursor-pointer select-none"
          >
            0
          </button>

          {/* Backspace / Delete */}
          <button
            type="button"
            onClick={handleDelete}
            className="duo-btn duo-btn-white dark:bg-stone-800 dark:border-stone-700 text-stone-600 dark:text-stone-300 py-3.5 flex items-center justify-center rounded-2xl min-h-[56px] shadow-sm active:scale-95 transition-all cursor-pointer select-none"
            title="Delete"
            aria-label="Delete last digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
