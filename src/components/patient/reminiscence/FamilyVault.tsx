import React, { useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { DailySnapshot } from './DailySnapshot';
import { FamilyCard } from './FamilyCard';
import { Mascot } from '../../common/Mascot';
import { Users, Heart, Loader2 } from 'lucide-react';

export const FamilyVault: React.FC = () => {
  const { familyMembers, isLoadingFamily, refreshFamilyMembers, activePatientId, t } = useApp();

  // Re-fetch latest live family members from Supabase on mount or when activePatientId changes
  useEffect(() => {
    if (activePatientId) {
      refreshFamilyMembers?.();
    }
  }, [activePatientId, refreshFamilyMembers]);

  // Compute dynamic count label replacing static '4' with familyMembers.length
  const getFamilyCountText = (count: number) => {
    const raw = t('familyCount');
    if (/[0-9৪]/.test(raw)) {
      return raw.replace(/[0-9৪]+/, count.toString());
    }
    return `${count} ${count === 1 ? 'Family Member' : 'Family Members'}`;
  };

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

          {/* Dynamic Family Count Badge */}
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full font-black text-xs sm:text-sm">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>{getFamilyCountText(familyMembers.length)}</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoadingFamily && familyMembers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 animate-pulse">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="duo-card p-5 bg-white dark:bg-stone-800/80 border-2 border-stone-200 dark:border-stone-700 rounded-2xl flex items-center gap-4 min-h-[160px]"
              >
                <div className="w-24 h-24 rounded-2xl bg-stone-200 dark:bg-stone-700 flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/3" />
                  <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-2/3" />
                  <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : familyMembers.length === 0 ? (
          /* Empty State (Caregiver has not added family members yet) */
          <div className="duo-card p-8 sm:p-10 text-center space-y-3 bg-stone-50/60 dark:bg-stone-800/40 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-300 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
              No Family Members Added Yet
            </h3>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              Your caregiver can add family photos, relationships, and voice notes from the Caregiver Portal to populate your memory book.
            </p>
          </div>
        ) : (
          /* Family Cards Grid (2-column on desktop, 1-column on mobile) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {familyMembers.map((member, index) => (
              <FamilyCard key={member.id} member={member} isFirst={index === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
