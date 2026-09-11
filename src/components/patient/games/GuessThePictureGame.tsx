import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../../utils/audio';
import { speechSynth } from '../../../utils/speech';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { getGameAssetUrl, REGION_ASSETS, normalizeRegionId, getFallbackGameAssetUrl } from '../../../utils/assetManager';
import { SpeechButton } from '../../common/SpeechButton';
import { Mascot } from '../../common/Mascot';
import { ArrowLeft, RotateCcw, CheckCircle2, Award, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

interface GuessThePictureGameProps {
  onBack: () => void;
}

interface QuestionItem {
  id: string;
  name: string;
  stateName: string;
  description: string;
  funFact: string;
  imageUrl: string;
  options: string[];
  correctAnswer: string;
}

// Cultural metadata for authentic quiz descriptions and fun facts across all 8 North-Eastern states
const CULTURAL_METADATA: Record<string, { name: string; description: string; funFact: string }> = {
  // Meghalaya
  'meghalaya-root-bridge.jpg': {
    name: 'Living Root Bridge',
    description: 'Iconic bioengineering wonder grown by Khasi and Jaintia tribes using living rubber fig tree roots.',
    funFact: 'These bridges become stronger over generations as the living roots intertwine and grow thicker!',
  },
  'meghalaya-nohkalikai.jpg': {
    name: 'Nohkalikai Falls',
    description: 'India’s tallest plunge waterfall (1,115 ft) cascading from a lush rainforest cliff into an emerald pool.',
    funFact: 'Fed by the world-famous Cherrapunji rainwater, it creates dramatic rainbow mist on sunny afternoons.',
  },
  'meghalaya-dawki.jpg': {
    name: 'Dawki Umngot River',
    description: 'Celebrated crystal-clear river along the Indo-Bangladesh border where wooden boats seem to float on glass.',
    funFact: 'The riverbed is so transparent that river stones and schooling fish are clearly visible at deep depths.',
  },
  'meghalaya-mawlynnong.jpg': {
    name: 'Mawlynnong Cleanest Village',
    description: 'Picturesque eco-friendly hamlet renowned across Asia for pristine cleanliness and living harmony with nature.',
    funFact: 'Every family uses conical handwoven bamboo baskets called ‘Khoh’ to collect organic compost.',
  },
  // Arunachal Pradesh
  'arunachal-tawang.jpg': {
    name: 'Tawang Monastery',
    description: 'Magnificent 17th-century Himalayan monastery, the second largest Tibetan Buddhist monastery in the world.',
    funFact: 'Perched at 10,000 feet, it houses an 18-foot gilded Buddha statue and centuries-old sacred texts.',
  },
  'arunachal-hornbill.jpg': {
    name: 'Great Indian Hornbill',
    description: 'Majestic forest bird known for its brilliant yellow and black casque beak, revered in tribal folklore.',
    funFact: 'Its distinctive heavy wingbeats produce a rushing sound resembling a small locomotive in flight.',
  },
  'arunachal-sela-pass.jpg': {
    name: 'Sela Pass & Sacred Lake',
    description: 'High-altitude mountain pass at 13,700 feet with snow-covered slopes and a revered alpine lake.',
    funFact: 'Surrounded by prayer flags fluttering in mountain breezes, it remains blanketed in snow throughout winter.',
  },
  'arunachal-ziro-valley.jpg': {
    name: 'Ziro Valley Pine Hills',
    description: 'Serene pine-clad plateau inhabited by the Apatani community, famed for sustainable paddy-fish farming.',
    funFact: 'Ziro is recognized globally for ancient eco-friendly agricultural traditions passed down through generations.',
  },
  // Manipur
  'manipur-loktak.jpg': {
    name: 'Loktak Lake & Phumdis',
    description: 'The largest freshwater lake in Northeast India, famed for unique floating circular islands called Phumdis.',
    funFact: 'It contains the world’s only floating wildlife sanctuary, Keibul Lamjao National Park!',
  },
  'manipur-sangai.jpg': {
    name: 'Sangai Brow-Antlered Deer',
    description: 'Endangered and graceful deer found exclusively on the floating biomass meadows of Loktak Lake.',
    funFact: 'Known as the "dancing deer" because it gently balances on spongy floating vegetation.',
  },
  'manipur-kangla.jpg': {
    name: 'Kangla Fort Palace',
    description: 'Historic royal citadel and spiritual heart of the ancient Kingdom of Manipur on the Imphal River.',
    funFact: 'Kangla served as the royal seat of power and coronation venue for over 2,000 years.',
  },
  'manipur-raas-leela.jpg': {
    name: 'Manipuri Raas Leela',
    description: 'One of India’s eight classical dance forms, celebrated for gentle, poetic movements and elaborate costumes.',
    funFact: 'The distinctive cylindrical bell-shaped skirt worn by dancers is called a Potloi, embroidered with mirrors.',
  },
  // Assam
  'assam-bihu-dhol.jpg': {
    name: 'Bihu Dhol',
    description: 'Resonant barrel-shaped drum crafted from hollowed jackfruit wood, the vital pulse of Rongali Bihu.',
    funFact: 'Played with a bamboo stick and bare hand, its rhythmic cadence signals the joyous arrival of spring.',
  },
  'assam-kamakhya.jpg': {
    name: 'Kamakhya Temple',
    description: 'Ancient Shakti shrine atop Nilachal Hill in Guwahati overlooking the Brahmaputra River.',
    funFact: 'One of the oldest Shaktipeeth temples in the subcontinent, featuring unique beehive-shaped dome architecture.',
  },
  'assam-majuli.jpg': {
    name: 'Majuli River Island',
    description: 'The world’s largest river island on the Brahmaputra, the cultural cradle of Neo-Vaishnavite Satras.',
    funFact: 'Majuli is famous for its living traditions of mask-making and spiritual music dating back to Srimanta Sankardev.',
  },
  'assam-muga-silk.jpg': {
    name: 'Assam Muga Silk',
    description: 'Rare shimmering golden silk exclusive to Assam, celebrated for its natural sheen and incredible longevity.',
    funFact: 'Muga silk is so durable that it often outlives its owner and is passed down through generations as heirloom Mekhela Sador.',
  },
  'assam-rhino.jpg': {
    name: 'Kaziranga One-Horned Rhino',
    description: 'The iconic pride of Assam thriving in Kaziranga National Park elephant-grass wetlands.',
    funFact: 'Assam shelters more than two-thirds of the world’s remaining Great One-Horned Rhinoceros population!',
  },
  'assam-tea.jpg': {
    name: 'Assam Tea Garden',
    description: 'Sprawling emerald tea estates producing full-bodied, brisk malty black tea enjoyed worldwide.',
    funFact: 'Assam is the single largest contiguous tea-growing region on Earth, cultivated since the 1830s.',
  },
  // Mizoram
  'mizoram-cheraw.jpg': {
    name: 'Cheraw Bamboo Dance',
    description: 'Rhythmic folk dance where performers step in and out of clapping horizontal bamboo staves.',
    funFact: 'Cheraw holds the world record for the largest synchronized bamboo dance performance.',
  },
  'mizoram-reiek.jpg': {
    name: 'Reiek Heritage Peak',
    description: 'Towering cliff summit overlooking scenic Aizawl hills and a traditional model Mizo village.',
    funFact: 'The peak offers a panoramic view of the lush valleys and plains reaching all the way to Bangladesh!',
  },
  'mizoram-puan.jpg': {
    name: 'Puan Handwoven Textile',
    description: 'Intricately patterned handwoven shawl with bold traditional stripes, the pride of Mizo weavers.',
    funFact: 'Puan Chei is worn on grand festive occasions like Chapchar Kut and wedding ceremonies.',
  },
  'mizoram-vantawng.jpg': {
    name: 'Vantawng Falls',
    description: 'Highest two-tiered waterfall in Mizoram plunging 750 feet amidst thick bamboo forests.',
    funFact: 'Surrounded by lush bamboo groves, it is named after legendary swimmer Vantawnga.',
  },
  // Nagaland
  'nagaland-hornbill-festival.jpg': {
    name: 'Hornbill Festival Kisama',
    description: 'Grand cultural celebration bringing together all 16 Naga tribes in music, dance, and crafts.',
    funFact: 'Celebrated every December at the Naga Heritage Village Kisama, it is known as the "Festival of Festivals".',
  },
  'nagaland-dzukou.jpg': {
    name: 'Dzukou Valley of Lilies',
    description: 'Enchanting valley of rolling emerald green hillocks and rare endemic Dzukou lilies.',
    funFact: 'The rare Dzukou lily grows nowhere else on Earth except in this high-altitude pristine sanctuary.',
  },
  'nagaland-naga-shawl.jpg': {
    name: 'Naga Tribal Warrior Shawl',
    description: 'Distinctive geometric handloom textile woven with symbolic warrior motifs and natural dyes.',
    funFact: 'Each distinct stripe pattern and color combination identifies the specific tribe and warrior clan.',
  },
  'nagaland-khonoma.jpg': {
    name: 'Khonoma Green Village',
    description: 'Historic Angami settlement famous for community forest protection and terraced agriculture.',
    funFact: 'Khonoma was officially declared India’s first green village for banning all illegal logging and hunting.',
  },
  // Sikkim
  'sikkim-kanchenjunga.jpg': {
    name: 'Mount Kanchenjunga',
    description: 'World’s 3rd highest mountain peak (28,169 ft), venerated as the sacred guardian deity of Sikkim.',
    funFact: 'Out of deep reverence, mountaineering expeditions historically stopped just short of the sacred summit.',
  },
  'sikkim-rumtek.jpg': {
    name: 'Rumtek Monastery',
    description: 'Grand golden Tibetan Buddhist Gompa perched near Gangtok, seat of the Gyalwang Karmapa.',
    funFact: 'Rumtek houses some of the rarest religious Buddhist scriptures and sacred golden stupas in the world.',
  },
  'sikkim-red-panda.jpg': {
    name: 'Himalayan Red Panda',
    description: 'Gentle arboreal mammal with rust-red fur and striped tail, thriving in rhododendron forests.',
    funFact: 'The gentle Red Panda is the state animal of Sikkim and spends most of its life high up in bamboo treetops.',
  },
  'sikkim-gurudongmar.jpg': {
    name: 'Gurudongmar Sacred Lake',
    description: 'One of the highest alpine lakes in the world (17,800 ft), sacred to both Buddhists and Sikhs.',
    funFact: 'Even during freezing Himalayan winters, a sacred section of the lake never freezes completely!',
  },
  // Tripura
  'tripura-ujjayanta.jpg': {
    name: 'Ujjayanta Royal Palace',
    description: 'Grand neoclassical white palace built in 1901 by Maharaja Radha Kishore Manikya in Agartala.',
    funFact: 'Nobel Laureate Rabindranath Tagore was a frequent honored guest and gave this palace its royal name.',
  },
  'tripura-neermahal.jpg': {
    name: 'Neermahal Water Palace',
    description: 'Picturesque royal summer fortress palace erected in the middle of Lake Rudrasagar.',
    funFact: 'It is one of only two royal floating water palaces in all of India!',
  },
  'tripura-unakoti.jpg': {
    name: 'Unakoti Rock Reliefs',
    description: 'Colossal 7th-century rock-cut carvings of Lord Shiva carved along forested hillsides.',
    funFact: 'According to legend, there are 99,99,999 (one less than a crore) sacred stone carvings hidden here.',
  },
  'tripura-bamboo-craft.jpg': {
    name: 'Tripura Bamboo & Cane Crafts',
    description: 'Masterfully handwoven bamboo partitions, lamps, and furniture famed for sustainable craftsmanship.',
    funFact: 'Tripura produces some of the finest handmade bamboo products and flutes in Asia.',
  },
  'tripura-hojagiri.jpg': {
    name: 'Hojagiri Reang Folk Dance',
    description: 'Remarkable acrobatic folk dance balancing upon earthen pitchers and brass lamps.',
    funFact: 'Dancers balance brass plates and bottles on their heads while moving rhythmically only from the waist down.',
  },
};

export const GuessThePictureGame: React.FC<GuessThePictureGameProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { recordGameCompletion, t, selectedRegion } = useApp();

  // Robust region sanitization supporting all 8 North-Eastern states
  const rawRegion = user?.user_metadata?.region || (user as any)?.region || selectedRegion || 'assam';
  const safeRegion = normalizeRegionId(rawRegion);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Tab visibility listener: stop speech and audio immediately on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        speechSynth.stop();
        soundFx.stopAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Dynamically generate questions from REGION_ASSETS[safeRegion] via getGameAssetUrl
  useEffect(() => {
    const files = REGION_ASSETS[safeRegion] || REGION_ASSETS['assam'];
    const formattedStateName = safeRegion.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const generated: QuestionItem[] = files.map((fileName, index) => {
      const meta = CULTURAL_METADATA[fileName] || {
        name: `Heritage Landmark ${index + 1}`,
        description: `Cultural landmark from ${formattedStateName}.`,
        funFact: `A cherished cultural emblem of ${formattedStateName}.`,
      };

      const imageUrl = getGameAssetUrl('guess-the-picture', safeRegion, fileName);

      // Distractors from other items in the same region
      const siblingNames = files
        .filter((f) => f !== fileName)
        .map((f, idx) => CULTURAL_METADATA[f]?.name || `Heritage Landmark ${idx + 1}`);

      const distractors = siblingNames.slice(0, 2);
      const options = [meta.name, ...distractors].sort(() => 0.5 - Math.random());

      return {
        id: `guess-${safeRegion}-${fileName}`,
        name: meta.name,
        stateName: formattedStateName,
        description: meta.description,
        funFact: meta.funFact,
        imageUrl,
        options,
        correctAnswer: meta.name,
      };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  }, [safeRegion]);

  const currentQ: QuestionItem | undefined = questions[currentIndex] || questions[0];

  const handleOptionSelect = (option: string) => {
    if (isAnswered || !currentQ) return;

    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQ.correctAnswer) {
      soundFx.playSuccessChime();
      setScore((s) => s + 1);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else {
      soundFx.playClickSound();
    }
  };

  const handleNext = () => {
    soundFx.playClickSound();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      soundFx.playSuccessChime();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      const finalAccuracy = Math.round((score / questions.length) * 100);
      recordGameCompletion(`Guess Picture (${safeRegion})`, 100 + score * 25, questions.length, 45, finalAccuracy);
    }
  };

  const handleRestart = () => {
    soundFx.playClickSound();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (!currentQ) {
    return (
      <div className="duo-card p-6 text-center bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700">
        <p className="text-stone-600 dark:text-stone-300 font-bold">{t('loading')}...</p>
      </div>
    );
  }

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
                {t('guessPictureTitle')}
              </h2>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 capitalize">
                {safeRegion.replace('-', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400 mt-0.5">
              {t('question')} {currentIndex + 1} {t('of')} {questions.length} • {t('score')}: {score}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <SpeechButton
            text={`${currentQ.name}. ${currentQ.description}`}
            size="sm"
          />
          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:border-stone-400 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-all cursor-pointer"
            title="Restart quiz"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isFinished ? (
        <>
          {/* Main Photo Card */}
          <div className="duo-card p-4 sm:p-5 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 space-y-4 shadow-sm">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-72 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 shadow-inner">
              <img
                src={currentQ.imageUrl}
                alt={currentQ.name}
                className="object-cover w-full h-full rounded-xl"
                loading="eager"
                onError={(e) => {
                  console.error('Failed to load image:', e.currentTarget.src);
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackGameAssetUrl('guess-the-picture');
                }}
              />
              <div className="absolute top-3 left-3 bg-stone-900/75 backdrop-blur-xs text-white px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentQ.stateName}</span>
              </div>
            </div>

            {/* Prompt */}
            <div className="text-center px-2">
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                {t('guessPrompt')}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400 mt-0.5">
                {t('guessSubPrompt')}
              </p>
            </div>

            {/* Tap Target Option Buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQ.correctAnswer;

                let btnStyles = 'bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 hover:bg-emerald-50 dark:hover:bg-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyles = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-600 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-400';
                  } else if (isSelected) {
                    btnStyles = 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-950 dark:text-rose-100';
                  } else {
                    btnStyles = 'opacity-50 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full min-h-[64px] rounded-2xl border-3 p-4 font-black text-base sm:text-lg flex items-center justify-between transition-all select-none cursor-pointer active:scale-98 ${btnStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 border-2 border-stone-300 dark:border-stone-600 flex items-center justify-center text-xs font-black text-stone-600 dark:text-stone-200 shadow-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Fun Fact Card */}
            {isAnswered && (
              <div
                className={`p-4 rounded-2xl border-2 space-y-2 animate-in fade-in-50 duration-200 ${
                  selectedOption === currentQ.correctAnswer
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                    : 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {selectedOption === currentQ.correctAnswer ? t('correctAnswerBanner') : t('culturalFact')}
                  </span>
                  <SpeechButton text={`${currentQ.name}. ${currentQ.description}. ${currentQ.funFact}`} size="sm" />
                </div>
                <p className="text-sm font-bold leading-relaxed">{currentQ.description}</p>
                <p className="text-xs font-extrabold text-stone-600 dark:text-stone-300 italic">"{currentQ.funFact}"</p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="duo-btn duo-btn-green py-2.5 px-5 font-black text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentIndex < questions.length - 1 ? t('nextQuestion') : t('finishQuiz')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mascot Cheer */}
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-3xl p-4 sm:p-5 shadow-sm">
            <Mascot
              message={
                isAnswered
                  ? selectedOption === currentQ.correctAnswer
                    ? t('roundComplete')
                    : currentQ.name
                  : t('guessPrompt')
              }
              mood={isAnswered ? (selectedOption === currentQ.correctAnswer ? 'celebrating' : 'gentle') : 'happy'}
              size="medium"
            />
          </div>
        </>
      ) : (
        /* Round Finish View */
        <div className="duo-card p-6 bg-amber-50 dark:bg-stone-900 border-3 border-amber-300 dark:border-amber-700 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Award className="w-9 h-9" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">{t('roundComplete')}</h3>
          <p className="text-base font-bold text-stone-700 dark:text-stone-300">
            {t('score')}: {score} / {questions.length}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="duo-btn duo-btn-green py-3 px-6 font-black text-sm flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('playAgain')}</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="duo-btn duo-btn-amber py-3 px-6 font-black text-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('returnToApp')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
