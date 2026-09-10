import React from 'react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { BookHeart, Gamepad2, CalendarCheck2 } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { patientTab, setPatientTab, t } = useApp();

  const handleTabSwitch = (tab: 'reminisce' | 'games' | 'routine') => {
    soundFx.playClickSound();
    setPatientTab(tab);
  };

  const navItems = [
    {
      id: 'reminisce' as const,
      domId: 'nav-memories-mobile',
      label: t('memoriesTab'),
      icon: BookHeart,
    },
    {
      id: 'games' as const,
      domId: 'nav-games-mobile',
      label: t('gamesTab'),
      icon: Gamepad2,
    },
    {
      id: 'routine' as const,
      domId: 'nav-routine-mobile',
      label: t('routineTab'),
      icon: CalendarCheck2,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-stone-900/98 backdrop-blur-md border-t-2 border-stone-200 dark:border-stone-800 shadow-2xl px-3 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = patientTab === item.id;

          return (
            <button
              key={item.id}
              id={item.domId}
              onClick={() => handleTabSwitch(item.id)}
              className={`flex flex-col items-center justify-center min-h-[58px] px-1 py-1 rounded-2xl border-2 font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm -translate-y-0.5'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 active:translate-y-0.5'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-6 h-6 mb-0.5 ${isActive ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`} />
              <span className="text-xs font-black tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
