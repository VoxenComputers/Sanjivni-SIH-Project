import React, { useState, useMemo } from 'react';
import { useApp, FamilyMember } from '../../../context/AppContext';
import { soundFx } from '../../../utils/audio';
import { speechSynth } from '../../../utils/speech';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, Award, RotateCcw, Heart, Users } from 'lucide-react';
import { Mascot } from '../../common/Mascot';

// Bilingual relation mapping for dementia-friendly family recognition
export const RELATION_DICTIONARY: Record<string, { en: string; hi: string }> = {
  daughter: { en: 'Daughter', hi: 'बेटी / पुत्री' },
  son: { en: 'Son', hi: 'बेटा / पुत्र' },
  sister: { en: 'Sister', hi: 'बहन' },
  brother: { en: 'Brother', hi: 'भाई' },
  wife: { en: 'Wife', hi: 'पत्नी' },
  husband: { en: 'Husband', hi: 'पति' },
  grandson: { en: 'Grandson', hi: 'पोता / नाती' },
  granddaughter: { en: 'Granddaughter', hi: 'पोती / नातिन' },
  mother: { en: 'Mother', hi: 'माँ' },
  father: { en: 'Father', hi: 'पिता' },
  friend: { en: 'Friend', hi: 'दोस्त / मित्र' },
  neighbour: { en: 'Neighbour', hi: 'पड़ोसी' },
};

export const getLocalizedRelation = (relation: string, lang: string): string => {
  const normalized = (relation || '').trim().toLowerCase();
  for (const [key, val] of Object.entries(RELATION_DICTIONARY)) {
    if (normalized.includes(key)) {
      return lang === 'hi' ? val.hi : val.en;
    }
  }
  return relation || (lang === 'hi' ? 'परिवार के सदस्य' : 'Family Member');
};

export interface LocalizedQuestionContent {
  question: string;
  subtext: string;
  options: string[];
  explanation: string;
  audioPrompt: string;
}

export interface FamilyTriviaItem {
  id: string;
  memberId?: string;
  memberName?: string;
  avatarUrl?: string;
  avatarColor?: string;
  caption?: string;
  correctOptionIndex: number;
  en: LocalizedQuestionContent;
  hi: LocalizedQuestionContent;
}

// Rich Seed Questions Dictionary (Bilingual English & Hindi)
export const SEED_FAMILY_TRIVIA: FamilyTriviaItem[] = [
  {
    id: 'seed-rahul',
    memberId: 'rahul',
    memberName: 'Rahul',
    avatarColor: '#F59E0B',
    correctOptionIndex: 0,
    en: {
      question: 'Who is this in the photo wearing a cheerful yellow jersey?',
      subtext: 'Look at his bright smile! He plays football every Sunday and visits you.',
      options: ['Rahul (Grandson)', 'Bikash (Son)', 'Priya (Daughter)', 'Neighbour Nilav'],
      explanation: 'Yes! That is your beloved grandson Rahul. He visits you every Sunday!',
      audioPrompt: 'Yes, that is your grandson Rahul. He loves playing football with you.',
    },
    hi: {
      question: 'पीली फुटबॉल जर्सी पहने तस्वीर में यह कौन हैं?',
      subtext: 'उनकी प्यारी मुस्कान देखें! वे हर रविवार फुटबॉल खेलते हैं और आपसे मिलने आते हैं।',
      options: ['राहुल (पोता)', 'बिकाश (बेटा)', 'प्रिया (बेटी)', 'पड़ोसी नीलाव'],
      explanation: 'शाबाश! यह आपके प्यारे पोते राहुल हैं। वे हर रविवार आपसे मिलने आते हैं!',
      audioPrompt: 'हाँ, यह आपके पोते राहुल हैं। वे आपके साथ खेलना बहुत पसंद करते हैं।',
    },
  },
  {
    id: 'seed-priya',
    memberId: 'priya',
    memberName: 'Priya',
    avatarColor: '#10B981',
    correctOptionIndex: 0,
    en: {
      question: 'What is your relationship with Priya?',
      subtext: 'She is a loving schoolteacher who makes your morning tea and manages your health.',
      options: ['Daughter', 'Sister', 'Granddaughter', 'Cousin'],
      explanation: 'Priya is your caring daughter. She prepares your warm tea every morning.',
      audioPrompt: 'Priya is your daughter. She always takes loving care of your health.',
    },
    hi: {
      question: 'प्रिया से आपका क्या रिश्ता है?',
      subtext: 'वह एक अध्यापिका हैं जो हर सुबह आपकी गरमा-गरम चाय बनाती हैं और दवाइयों का ध्यान रखती हैं।',
      options: ['बेटी (पुत्री)', 'बहन', 'पोती (नातिन)', 'चचेरी बहन'],
      explanation: 'प्रिया आपकी सुपुत्री हैं। वे हर सुबह आपके लिए ताज़ा चाय बनाती हैं।',
      audioPrompt: 'प्रिया आपकी बेटी हैं। वे आपकी सेहत का हमेशा पूरा ख्याल रखती हैं।',
    },
  },
  {
    id: 'seed-bikash',
    memberId: 'bikash',
    memberName: 'Bikash',
    avatarColor: '#3B82F6',
    correctOptionIndex: 0,
    en: {
      question: 'Who is this family member who calls you every evening after office?',
      subtext: 'He works at the bank and never forgets to check on your health.',
      options: ['Bikash (Son)', 'Rahul (Grandson)', 'Deben (Brother)', 'Ramesh (Colleague)'],
      explanation: 'Yes! That is your devoted son Bikash. He never misses his evening call!',
      audioPrompt: 'Yes, that is your son Bikash. He always calls you after office.',
    },
    hi: {
      question: 'दफ़्तर के बाद हर शाम आपका हालचाल जानने के लिए कौन फोन करता है?',
      subtext: 'वे बैंक में कार्यरत हैं और कभी भी आपकी दवा और सेहत के बारे में पूछना नहीं भूलते।',
      options: ['बिकाश (बेटा)', 'राहुल (पोता)', 'देबेन (भाई)', 'रमेश (सहकर्मी)'],
      explanation: 'शाबाश! यह आपके सुपुत्र बिकाश हैं। वे कभी भी शाम का फोन करना नहीं भूलते!',
      audioPrompt: 'हाँ, यह आपके बेटे बिकाश हैं। वे रोज़ शाम आपसे बात करना पसंद करते हैं।',
    },
  },
  {
    id: 'seed-ananya',
    memberId: 'ananya',
    memberName: 'Ananya',
    avatarColor: '#EC4899',
    correctOptionIndex: 0,
    en: {
      question: 'Who loves drawing colorful paintings and singing folk songs with you?',
      subtext: 'She brings you her sketchbook with colorful flowers and green hills.',
      options: ['Ananya (Granddaughter)', 'Priya (Daughter)', 'Dr. Baruah', 'Neighbour Meera'],
      explanation: 'Wonderful! That is your sweet granddaughter Ananya.',
      audioPrompt: 'Wonderful! That is your sweet granddaughter Ananya. She loves drawing with you.',
    },
    hi: {
      question: 'आपके साथ सुंदर रंग-बिरंगी चित्रकारी और लोकगीत गाना किसे पसंद है?',
      subtext: 'वह आपके पास फूलों और सुंदर पहाड़ों की चित्रकला वाली कॉपी लेकर आती हैं।',
      options: ['अनन्या (पोती)', 'प्रिया (बेटी)', 'डॉ. बरुआ', 'पड़ोसी मीरा'],
      explanation: 'अद्भुत! यह आपकी प्यारी पोती अनन्या हैं जो आपके साथ चित्रकारी करती हैं।',
      audioPrompt: 'अद्भुत! यह आपकी प्यारी पोती अनन्या हैं। वे आपके साथ चित्रकारी करना पसंद करती हैं।',
    },
  },
  {
    id: 'seed-courtyard',
    correctOptionIndex: 0,
    en: {
      question: 'Where did the entire family gather together for songs and festive sweets?',
      subtext: 'Think of the joyful courtyard filled with laughter, music, and traditional food.',
      options: ['Ancestral Home Courtyard', 'Busy City Market', 'Railway Waiting Hall', 'Office Auditorium'],
      explanation: 'Yes! In your family ancestral home courtyard, surrounded by the warmth of family!',
      audioPrompt: 'Yes, in your family home courtyard surrounded by the love of your family.',
    },
    hi: {
      question: 'त्योहार के दौरान पूरा परिवार गीत-संगीत और मिठाइयों के लिए कहाँ इकट्ठा हुआ था?',
      subtext: 'उस प्यारे आँगन को याद करें जहाँ सब हँसी-खुशी एक साथ बैठे थे।',
      options: ['पारिवारिक घर का आँगन', 'शहर का व्यस्त बाज़ार', 'रेलवे स्टेशन प्रतीक्षालय', 'दफ़्तर का हॉल'],
      explanation: 'हाँ! आपके पारिवारिक पैतृक घर के आँगन में, जहाँ पूरा परिवार प्यार से साथ था!',
      audioPrompt: 'हाँ, आपके पारिवारिक पैतृक घर के आँगन में, जहाँ आपका पूरा परिवार साथ था।',
    },
  },
];

// Helper to render dedicated SVG avatars or photo
const TriviaAvatar: React.FC<{ item: FamilyTriviaItem }> = ({ item }) => {
  if (item.avatarUrl) {
    return (
      <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-4 border-emerald-500/60 shadow-lg bg-stone-100 dark:bg-stone-800 mx-auto flex items-center justify-center">
        <img
          src={item.avatarUrl}
          alt={item.memberName || 'Family photo'}
          className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
        />
      </div>
    );
  }

  // Predefined friendly SVG avatars for Rahul, Priya, Bikash, Ananya
  const color = item.avatarColor || '#10B981';
  return (
    <div
      className="w-36 h-36 sm:w-48 sm:h-48 rounded-3xl border-4 border-emerald-500/60 shadow-lg mx-auto flex items-center justify-center relative overflow-hidden bg-white dark:bg-stone-800"
      style={{ backgroundColor: `${color}18` }}
    >
      <svg viewBox="0 0 100 100" className="w-32 h-32 sm:w-40 sm:h-40">
        {/* Head */}
        <circle cx="50" cy="46" r="30" fill="#FED7AA" stroke="#78350F" strokeWidth="2.5" />

        {/* Custom Hair */}
        {item.memberId === 'rahul' ? (
          <path d="M 24 38 Q 30 18 50 18 Q 70 18 76 38 Q 65 24 50 25 Q 35 24 24 38 Z" fill="#374151" />
        ) : item.memberId === 'priya' ? (
          <>
            <circle cx="50" cy="18" r="10" fill="#1F2937" />
            <path d="M 20 45 Q 26 22 50 22 Q 74 22 80 45 Q 65 30 50 30 Q 35 30 20 45 Z" fill="#1F2937" />
          </>
        ) : item.memberId === 'bikash' ? (
          <>
            <path d="M 22 40 Q 30 20 50 20 Q 72 20 78 40 Q 64 26 50 27 Q 34 26 22 40 Z" fill="#4B5563" />
            <rect x="32" y="42" width="14" height="10" rx="3" fill="none" stroke="#1F2937" strokeWidth="2" />
            <rect x="54" y="42" width="14" height="10" rx="3" fill="none" stroke="#1F2937" strokeWidth="2" />
            <line x1="46" y1="47" x2="54" y2="47" stroke="#1F2937" strokeWidth="2" />
          </>
        ) : item.memberId === 'ananya' ? (
          <>
            <circle cx="20" cy="35" r="7" fill="#EC4899" />
            <circle cx="80" cy="35" r="7" fill="#EC4899" />
            <path d="M 22 42 Q 28 20 50 20 Q 72 20 78 42 Q 65 28 50 28 Q 35 28 22 42 Z" fill="#1F2937" />
          </>
        ) : (
          <path d="M 24 38 Q 30 18 50 18 Q 70 18 76 38 Q 65 24 50 25 Q 35 24 24 38 Z" fill="#374151" />
        )}

        {/* Friendly eyes */}
        <circle cx="40" cy="46" r="3.5" fill="#1F2937" />
        <circle cx="60" cy="46" r="3.5" fill="#1F2937" />
        <circle cx="41.5" cy="44.5" r="1.2" fill="#FFFFFF" />
        <circle cx="61.5" cy="44.5" r="1.2" fill="#FFFFFF" />

        {/* Warm smile */}
        <path d="M 40 56 Q 50 64 60 56" fill="none" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />

        {/* Rosy cheeks */}
        <circle cx="34" cy="53" r="4" fill="#F87171" opacity="0.6" />
        <circle cx="66" cy="53" r="4" fill="#F87171" opacity="0.6" />

        {/* Torso / Clothes */}
        <path d="M 22 92 C 22 74 36 68 50 68 C 64 68 78 74 78 92 Z" fill={color} stroke="#374151" strokeWidth="2" />
      </svg>
    </div>
  );
};

interface SpacedRetrievalGameProps {
  onBack: () => void;
}

export const SpacedRetrievalGame: React.FC<SpacedRetrievalGameProps> = ({ onBack }) => {
  const { recordGameCompletion, language, familyMembers } = useApp();

  const isHindi = language === 'hi';

  // Build bilingual questions array dynamically from familyMembers + SEED_FAMILY_TRIVIA
  const questions: FamilyTriviaItem[] = useMemo(() => {
    const list: FamilyTriviaItem[] = [];

    // 1. If custom family members exist in database, generate bilingual questions for them
    if (familyMembers && familyMembers.length > 0) {
      familyMembers.forEach((member: FamilyMember, idx: number) => {
        const enRel = getLocalizedRelation(member.relation, 'en');
        const hiRel = getLocalizedRelation(member.relation, 'hi');

        // Question 1: Who is this in the photo?
        list.push({
          id: `dyn-ident-${member.id || idx}`,
          memberId: member.id,
          memberName: member.name,
          avatarUrl: member.avatarUrl,
          avatarColor: member.avatarColor || '#10B981',
          correctOptionIndex: 0,
          en: {
            question: 'Who is this in the photo?',
            subtext: member.description || member.funFact || 'Look at this dear family member who loves you.',
            options: [
              `${member.name} (${enRel})`,
              'Neighbour Sharma',
              'Dr. Baruah',
              'Old Colleague',
            ],
            explanation: `Yes! That is ${member.name}, your ${enRel.toLowerCase()}.`,
            audioPrompt: `Yes! That is ${member.name}, your ${enRel.toLowerCase()}.`,
          },
          hi: {
            question: 'तस्वीर में यह कौन हैं?',
            subtext: member.description || member.funFact || 'इस प्यारे पारिवारिक सदस्य को ध्यान से पहचानें।',
            options: [
              `${member.name} (${hiRel})`,
              'पड़ोसी शर्मा जी',
              'डॉ. बरुआ',
              'पुराने सहकर्मी',
            ],
            explanation: `शाबाश! यह ${member.name} हैं, आपकी/आपके ${hiRel}।`,
            audioPrompt: `शाबाश! यह ${member.name} हैं, आपकी/आपके ${hiRel}।`,
          },
        });

        // Question 2: What is your relationship with {name}?
        list.push({
          id: `dyn-rel-${member.id || idx}`,
          memberId: member.id,
          memberName: member.name,
          avatarUrl: member.avatarUrl,
          avatarColor: member.avatarColor || '#10B981',
          correctOptionIndex: 0,
          en: {
            question: `What is your relationship with ${member.name}?`,
            subtext: `Think about your cherished bond with ${member.name}.`,
            options: [enRel, 'Neighbour', 'Physiotherapist', 'Bank Clerk'],
            explanation: `${member.name} is your beloved ${enRel.toLowerCase()}.`,
            audioPrompt: `${member.name} is your beloved ${enRel.toLowerCase()}.`,
          },
          hi: {
            question: `${member.name} से आपका क्या रिश्ता है?`,
            subtext: `${member.name} के साथ अपने पारिवारिक रिश्ते को याद करें।`,
            options: [hiRel, 'पड़ोसी', 'थेरेपिस्ट', 'बैंक कर्मचारी'],
            explanation: `${member.name} आपकी/आपके ${hiRel} हैं।`,
            audioPrompt: `${member.name} आपकी/आपके ${hiRel} हैं।`,
          },
        });
      });
    }

    // Blend with seed family questions to guarantee at least 5 rich questions
    SEED_FAMILY_TRIVIA.forEach((seed) => {
      // Avoid duplicate questions if already covered
      if (!list.some((q) => q.memberId && q.memberId === seed.memberId)) {
        list.push(seed);
      }
    });

    return list.slice(0, 6);
  }, [familyMembers]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentItem: FamilyTriviaItem = questions[currentIndex] || questions[0];
  const activeContent: LocalizedQuestionContent = isHindi ? currentItem.hi : currentItem.en;

  const handleSpeakQuestion = () => {
    if (!activeContent) return;
    soundFx.playClickSound();
    speechSynth.speak(
      `${activeContent.question} ${activeContent.subtext}`
    );
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerChecked) return;
    soundFx.playClickSound();
    setSelectedOptionIndex(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOptionIndex === null || isAnswerChecked || !currentItem) return;
    setIsAnswerChecked(true);

    const isCorrect = selectedOptionIndex === currentItem.correctOptionIndex;
    if (isCorrect) {
      soundFx.playSuccessChime();
      setScore((s) => s + 20);
      setCorrectCount((c) => c + 1);
      speechSynth.speak(activeContent.audioPrompt);
    } else {
      soundFx.playClickSound();
      const correctAnswerText = activeContent.options[currentItem.correctOptionIndex];
      const spokenIncorrect = isHindi
        ? `शाबाश प्रयास कोका! सही उत्तर है: ${correctAnswerText}। ${activeContent.explanation}`
        : `Good try Koka! The right answer is ${correctAnswerText}. ${activeContent.explanation}`;
      speechSynth.speak(spokenIncorrect);
    }
  };

  const handleNext = () => {
    soundFx.playClickSound();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerChecked(false);
    } else {
      // Quiz complete!
      setIsCompleted(true);
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#15803D', '#F59E0B', '#10B981', '#E11D48'],
        });
      } catch (e) {
        // ignore
      }

      const finalCorrect = correctCount + (selectedOptionIndex === currentItem.correctOptionIndex ? 1 : 0);
      const finalAccuracy = Math.round((finalCorrect / questions.length) * 100);
      const finalScore = score + (selectedOptionIndex === currentItem.correctOptionIndex ? 20 : 0);

      // Record completion with Supabase telemetry
      recordGameCompletion(
        'Family Trivia',
        finalScore,
        questions.length,
        60,
        finalAccuracy
      );
    }
  };

  const handleRestart = () => {
    soundFx.playClickSound();
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerChecked(false);
    setScore(0);
    setCorrectCount(0);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-6" id="family-trivia-game">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 font-extrabold text-stone-800 dark:text-stone-100 shadow-duo-neutral active:translate-y-1 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{isHindi ? 'खेलों पर वापस जाएं' : 'Back to Games'}</span>
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs mx-2 sm:mx-4">
          <div className="flex justify-between text-xs font-black text-stone-700 dark:text-stone-300 mb-1">
            <span>
              {isHindi
                ? `प्रश्न ${currentIndex + 1} / ${questions.length}`
                : `Question ${currentIndex + 1} of ${questions.length}`}
            </span>
            <span>{score} {isHindi ? 'अंक' : 'Pts'}</span>
          </div>
          <div className="w-full h-3.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{
                width: `${((currentIndex + (isAnswerChecked ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Read Aloud Button */}
        <button
          onClick={handleSpeakQuestion}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 font-black shadow-duo-neutral active:translate-y-1 transition-all"
          title={isHindi ? 'प्रश्न बोलकर सुनें' : 'Read question out loud'}
        >
          <Volume2 className="w-5 h-5" />
          <span className="hidden sm:inline">{isHindi ? 'सुनें' : 'Read Aloud'}</span>
        </button>
      </div>

      {isCompleted ? (
        /* Victory Completion Card */
        <div className="duo-card border-rose-500 border-b-6 border-b-rose-700 bg-rose-50/90 dark:bg-rose-950/30 p-6 sm:p-8 text-center animate-tactile-bounce max-w-xl mx-auto shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white mb-2">
            {isHindi ? 'शाबाश कोका! अद्भुत पारिवारिक स्मृति!' : 'Wonderful Memory, Koka!'}
          </h3>
          <p className="text-lg sm:text-xl font-bold text-stone-700 dark:text-stone-300 mb-6 leading-relaxed">
            {isHindi
              ? `आपने आज की पारिवारिक प्रश्नोत्तरी को ${score} अंकों के शानदार स्कोर के साथ पूरा किया!`
              : `You completed today’s Family Trivia with a fantastic score of ${score} points!`}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleRestart}
              className="duo-btn bg-emerald-600 text-white border-b-4 border-emerald-800 hover:bg-emerald-700 active:border-b-0 active:translate-y-1 text-lg px-8 py-3.5 flex items-center gap-2 rounded-2xl font-black shadow-sm"
            >
              <RotateCcw className="w-6 h-6" />
              <span>{isHindi ? 'फिर से खेलें' : 'Practice Again'}</span>
            </button>
            <button
              onClick={onBack}
              className="duo-btn bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-2 border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 text-lg px-8 py-3.5 rounded-2xl font-black shadow-sm"
            >
              <span>{isHindi ? 'खेलों पर वापस जाएं' : 'Back to Games Hub'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Trivia Question Container */
        <div className="duo-card p-6 sm:p-8 max-w-2xl mx-auto space-y-5 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 shadow-sm">
          {/* Header & Category Badge */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-black text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider border border-rose-300 dark:border-rose-700">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>
                  {isHindi
                    ? 'पारिवारिक प्रश्नोत्तरी (Family Trivia)'
                    : 'Family Trivia'}
                </span>
              </span>

              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                {isHindi
                  ? 'अपने प्रियजनों और पुरानी यादों को पहचानें'
                  : 'Remember your loved ones and cherished memories'}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight leading-snug">
              {activeContent.question}
            </h3>
            <p className="text-base sm:text-lg font-bold text-stone-600 dark:text-stone-300 mt-1">
              {activeContent.subtext}
            </p>
          </div>

          {/* Prominent Photo / Avatar Container */}
          <div className="py-2">
            <TriviaAvatar item={currentItem} />
          </div>

          {/* Massive Dementia-Friendly Multiple Choice Buttons (min 64px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {activeContent.options.map((option: string, index: number) => {
              const isSelected = selectedOptionIndex === index;
              const isCorrect = index === currentItem.correctOptionIndex;

              let btnStyle = 'bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white hover:border-emerald-500';
              if (isAnswerChecked) {
                if (isCorrect) {
                  btnStyle = 'border-2 border-emerald-700 bg-emerald-600 text-white';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'border-2 border-red-700 bg-red-600 text-white';
                }
              } else if (isSelected) {
                btnStyle = 'border-2 border-amber-600 bg-amber-500 text-white shadow-md';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  disabled={isAnswerChecked}
                  className={`duo-btn min-h-[64px] sm:min-h-[72px] text-lg sm:text-xl font-black text-left px-5 py-3.5 justify-between rounded-2xl transition-all ${btnStyle}`}
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

          {/* Feedback & Action Bar */}
          <div className="pt-4 border-t-2 border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            {isAnswerChecked ? (
              <>
                <div className="text-left flex-1">
                  <p className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                    {selectedOptionIndex === currentItem.correctOptionIndex
                      ? `🎉 ${isHindi ? 'शाबाश सही उत्तर!' : 'Correct!'} ${activeContent.explanation}`
                      : `💡 ${isHindi ? 'याद रखें:' : 'Remember:'} ${activeContent.explanation}`}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="duo-btn bg-emerald-600 text-white border-b-4 border-emerald-800 hover:bg-emerald-700 active:border-b-0 active:translate-y-1 min-h-[58px] text-xl px-8 py-3 w-full sm:w-auto flex-shrink-0 rounded-2xl font-black transition-all cursor-pointer"
                >
                  <span>{isHindi ? 'अगला प्रश्न' : 'Next Question'}</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-sm sm:text-base font-bold text-stone-500 dark:text-stone-400">
                  {isHindi
                    ? 'ऊपर अपना उत्तर चुनें, फिर उत्तर जांचें पर टैप करें!'
                    : 'Select your answer above, then tap Check Answer!'}
                </p>
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedOptionIndex === null}
                  className="duo-btn bg-emerald-600 text-white border-b-4 border-emerald-800 hover:bg-emerald-700 active:border-b-0 active:translate-y-1 min-h-[58px] text-xl px-8 py-3 w-full sm:w-auto flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black transition-all cursor-pointer"
                >
                  <span>{isHindi ? 'उत्तर जांचें' : 'Check Answer'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mascot cheer message */}
      {!isCompleted && (
        <div className="max-w-2xl mx-auto bg-stone-100 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-3xl p-4">
          <Mascot
            message={
              isHindi
                ? 'आराम से समय लें कोका। अपने परिवार को याद करने से मन को शांति और खुशी मिलती है।'
                : 'Take your time Koka. Remembering your loved ones and cherished memories brings peaceful joy to the heart.'
            }
            mood="gentle"
            size="small"
          />
        </div>
      )}
    </div>
  );
};

// Aliases for clean backward and forward compatibility
export const FamilyTrivia = SpacedRetrievalGame;
export default SpacedRetrievalGame;
