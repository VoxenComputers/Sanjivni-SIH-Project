import React, { useState, useMemo } from 'react';
import { SPHERICAL_TRIVIA_QUESTIONS, TriviaQuestion, getRegionQuestions, NERStateId } from '../../../utils/nerData';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { normalizeRegionId } from '../../../utils/assetManager';
import { soundFx } from '../../../utils/audio';
import { speechSynth } from '../../../utils/speech';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';
import { Mascot } from '../../common/Mascot';

interface SpacedRetrievalGameProps {
  onBack: () => void;
}

export const SpacedRetrievalGame: React.FC<SpacedRetrievalGameProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { recordGameCompletion, selectedRegion } = useApp();

  const rawRegion = user?.user_metadata?.region || (user as any)?.region || selectedRegion || 'assam';
  const safeRegion = normalizeRegionId(rawRegion);
  const stateKey = (safeRegion === 'arunachal-pradesh' ? 'arunachal' : safeRegion) as NERStateId;
  const formattedStateName = safeRegion.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const questions: TriviaQuestion[] = useMemo(() => {
    const regional = getRegionQuestions(stateKey);
    const converted: TriviaQuestion[] = regional.map((q) => ({
      id: q.id,
      question: `Which cultural landmark from ${q.stateName} is described here?`,
      subtext: q.description,
      photoUrl: q.imageUrl,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: `${q.name}: ${q.funFact}`,
      audioPrompt: `${q.name}. ${q.description}. ${q.funFact}`,
    }));
    return [...SPHERICAL_TRIVIA_QUESTIONS, ...converted];
  }, [stateKey]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentQ: TriviaQuestion = questions[currentIndex] || questions[0];

  const handleSpeakQuestion = () => {
    if (!currentQ) return;
    soundFx.playClickSound();
    speechSynth.speak(
      `${currentQ.question} ${currentQ.subtext}`
    );
  };

  const handleSelectOption = (option: string) => {
    if (isAnswerChecked) return;
    soundFx.playClickSound();
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || isAnswerChecked || !currentQ) return;
    setIsAnswerChecked(true);

    const isCorrect = selectedOption === currentQ.correctAnswer;
    if (isCorrect) {
      soundFx.playSuccessChime();
      setScore((s) => s + 20);
      speechSynth.speak(currentQ.audioPrompt);
    } else {
      soundFx.playClickSound();
      speechSynth.speak(
        `That was close Koka! The right answer is ${currentQ.correctAnswer}. ${currentQ.explanation}`
      );
    }
  };

  const handleNext = () => {
    soundFx.playClickSound();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      // Complete quiz!
      setIsCompleted(true);
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#15803D', '#F59E0B', '#10B981'],
        });
      } catch (e) {
        // ignore
      }

      recordGameCompletion(
        `Spaced Retrieval (${formattedStateName})`,
        score + (selectedOption === currentQ?.correctAnswer ? 20 : 0),
        questions.length,
        60,
        100
      );
    }
  };

  const handleRestart = () => {
    soundFx.playClickSound();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-white hover:bg-stone-100 font-extrabold text-stone-700 shadow-duo-neutral active:translate-y-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Games</span>
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="flex justify-between text-xs font-black text-stone-600 mb-1">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{score} Pts</span>
          </div>
          <div className="w-full h-3.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
            <div
              className="h-full bg-brand-green transition-all duration-300 rounded-full"
              style={{
                width: `${((currentIndex + (isAnswerChecked ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSpeakQuestion}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-2 border-green-300 bg-brand-green-light text-brand-green-dark font-black shadow-duo-neutral active:translate-y-1"
          title="Read question out loud"
        >
          <Volume2 className="w-5 h-5" />
          <span className="hidden sm:inline">Read Aloud</span>
        </button>
      </div>

      {isCompleted ? (
        /* Victory Completion Card */
        <div className="duo-card border-brand-green border-b-6 border-b-brand-green-dark bg-green-50 p-6 sm:p-8 text-center animate-tactile-bounce max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-brand-green text-white flex items-center justify-center mx-auto mb-3 shadow-duo-green">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-brand-dark mb-2">
            Wonderful Memory, Koka!
          </h3>
          <p className="text-lg sm:text-xl font-bold text-stone-700 mb-6">
            You completed today’s family and {formattedStateName} cultural trivia with a fantastic score of {score} points!
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleRestart}
              className="duo-btn duo-btn-green text-lg px-8 py-3.5"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Practice Again</span>
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
        /* Trivia Question Container */
        <div className="duo-card p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          {/* Question Prompt */}
          <div>
            <span className="inline-block bg-brand-green-light text-brand-green-dark font-black text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-green-300">
              Personalized Memory Trivia • {formattedStateName}
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-dark tracking-tight leading-snug">
              {currentQ.question}
            </h3>
            <p className="text-base sm:text-lg font-bold text-stone-600 mt-1">
              {currentQ.subtext}
            </p>
          </div>

          {/* Massive Multiple Choice Buttons (min 64px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {currentQ.options.map((option: string) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let btnStyle = 'duo-btn-white';
              if (isAnswerChecked) {
                if (isCorrect) {
                  btnStyle = 'duo-btn-green border-green-700 bg-green-600 text-white';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'duo-btn-crimson border-red-700 bg-red-600 text-white';
                }
              } else if (isSelected) {
                btnStyle = 'duo-btn-amber border-amber-600 bg-amber-500 text-white';
              }

              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswerChecked}
                  className={`duo-btn min-h-[64px] sm:min-h-[72px] text-lg sm:text-xl font-black text-left px-5 py-3 justify-between ${btnStyle}`}
                >
                  <span className="leading-snug">{option}</span>
                  {isAnswerChecked && isCorrect && (
                    <CheckCircle2 className="w-7 h-7 text-white flex-shrink-0 ml-2" />
                  )}
                  {isAnswerChecked && isSelected && !isCorrect && (
                    <XCircle className="w-7 h-7 text-white flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Action Bar */}
          <div className="pt-4 border-t-2 border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {isAnswerChecked ? (
              <>
                <div className="text-left">
                  <p className="text-base sm:text-lg font-black text-brand-dark">
                    {selectedOption === currentQ.correctAnswer
                      ? '🎉 Correct! ' + currentQ.explanation
                      : '💡 Remember: ' + currentQ.explanation}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="duo-btn duo-btn-green min-h-[58px] text-xl px-8 py-3 w-full sm:w-auto flex-shrink-0"
                >
                  <span>Continue</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-sm sm:text-base font-bold text-stone-500">
                  Select your answer above, then tap Check!
                </p>
                <button
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption}
                  className="duo-btn duo-btn-green min-h-[58px] text-xl px-8 py-3 w-full sm:w-auto flex-shrink-0 disabled:opacity-50"
                >
                  <span>Check Answer</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mascot cheer */}
      {!isCompleted && (
        <div className="max-w-2xl mx-auto bg-stone-100 border-2 border-stone-300 rounded-3xl p-4">
          <Mascot
            message={`Take your time Koka. Remembering family and ${formattedStateName} brings peaceful joy to the heart.`}
            mood="gentle"
            size="small"
          />
        </div>
      )}
    </div>
  );
};
