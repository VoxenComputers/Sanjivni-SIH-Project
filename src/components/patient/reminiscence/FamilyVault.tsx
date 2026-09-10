import React from 'react';
import { useApp } from '../../../context/AppContext';
import { DailySnapshot } from './DailySnapshot';
import { FamilyCard } from './FamilyCard';
import { Mascot } from '../../common/Mascot';
import { Users, Heart } from 'lucide-react';

export const FamilyVault: React.FC = () => {
  const { familyMembers, t } = useApp();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Daily Orientation Snapshot */}
      <DailySnapshot />

      {/* Compact Mascot Cheer Banner */}
      <div className="bg-brand-green-light dark:bg-emerald-950/40 border-2 border-green-300 dark:border-emerald-800 rounded-3xl p-3.5 sm:p-4 shadow-sm">
        <Mascot
          message={t('familyMascotGreeting')}
          mood="happy"
          size="small"
        />
      </div>

      {/* Family Memory Book Section (Targeted by Spotlight Tour) */}
      <div id="family-memory-book" className="space-y-3 pt-1">
        {/* Section Title */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-amber-light dark:bg-amber-950/60 border-2 border-brand-amber dark:border-amber-700 flex items-center justify-center text-brand-amber-dark dark:text-amber-300 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                {t('familyMemoryBook')}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300">
                {t('familyBookSubtitle')}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full font-black text-xs sm:text-sm">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>{t('familyCount')}</span>
          </div>
        </div>

        {/* Family Cards Grid (2-column on desktop, 1-column on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {familyMembers.map((member, index) => (
            <FamilyCard key={member.id} member={member} isFirst={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
};
