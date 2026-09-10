import React, { useState } from 'react';
import { RoutineTask, useApp } from '../../../context/AppContext';
import { SpeechButton } from '../../common/SpeechButton';
import { Pill, GlassWater, Footprints, Utensils, Gamepad2, Check, Bell, BellRing } from 'lucide-react';

interface RoutineItemProps {
  task: RoutineTask;
  onToggle: (id: string) => void;
}

export const RoutineItem: React.FC<RoutineItemProps> = ({ task, onToggle }) => {
  const { scheduleTaskReminder, notificationPermission, requestNotificationPermission, t } = useApp();
  const [justToggled, setJustToggled] = useState<boolean>(false);
  const [isReminderSet, setIsReminderSet] = useState<boolean>(false);

  const handleClick = () => {
    setJustToggled(true);
    onToggle(task.id);
    setTimeout(() => setJustToggled(false), 500);
  };

  const handleReminderClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notificationPermission !== 'granted') {
      await requestNotificationPermission();
    }
    const success = scheduleTaskReminder(task);
    if (success) {
      setIsReminderSet(true);
      setTimeout(() => setIsReminderSet(false), 4000);
    }
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'medication':
        return <Pill className="w-8 h-8 text-rose-600" />;
      case 'hydration':
        return <GlassWater className="w-8 h-8 text-sky-600" />;
      case 'exercise':
        return <Footprints className="w-8 h-8 text-emerald-600" />;
      case 'food':
        return <Utensils className="w-8 h-8 text-amber-600" />;
      case 'game':
        return <Gamepad2 className="w-8 h-8 text-purple-600" />;
      default:
        return <Check className="w-8 h-8 text-stone-600" />;
    }
  };

  // Strictly pull localized title and description from i18n
  const taskTitle = task.titleKey ? t(task.titleKey) : task.title;
  const taskDesc = task.descKey ? t(task.descKey) : task.description;
  const spokenText = `${taskTitle}. ${taskDesc}. ${task.timeStr}.`;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${taskTitle}, at ${task.timeStr}, ${task.completed ? t('completed') : 'pending'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className={`duo-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none transition-all ${
        task.completed
          ? 'border-emerald-600 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
          : 'border-stone-200 dark:border-stone-700 shadow-sm hover:border-emerald-600 dark:hover:border-emerald-500 bg-white dark:bg-stone-800'
      } ${justToggled ? 'animate-bounce' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Category Icon Container */}
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 ${
            task.completed
              ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700'
              : 'bg-stone-50 dark:bg-stone-700/80 border-stone-200 dark:border-stone-600'
          }`}
        >
          {getCategoryIcon()}
        </div>

        {/* Localized Task Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-xs sm:text-sm font-black uppercase px-2.5 py-0.5 rounded-full border ${
                task.completed
                  ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-600'
              }`}
            >
              {task.timeStr}
            </span>
            {isReminderSet && (
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <BellRing className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {t('scheduleSuccess')}
              </span>
            )}
          </div>
          <h4
            className={`text-xl sm:text-2xl font-black tracking-tight leading-snug truncate ${
              task.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-white'
            }`}
          >
            {taskTitle}
          </h4>
          <p className="text-sm sm:text-base font-bold text-stone-600 dark:text-stone-300 truncate mt-0.5">
            {taskDesc}
          </p>
        </div>
      </div>

      {/* Action Controls: Speech, Device Reminder & Chunky Duolingo Checkmark */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Read Aloud Button */}
        <div onClick={(e) => e.stopPropagation()}>
          <SpeechButton text={spokenText} size="sm" />
        </div>

        {/* Browser-Native Web Notification Button */}
        <button
          onClick={handleReminderClick}
          className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${
            isReminderSet
              ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-800 dark:text-amber-200 scale-105'
              : 'bg-stone-100 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-600 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-400'
          }`}
          title={t('enableReminder')}
          aria-label={t('enableReminder')}
        >
          {isReminderSet ? (
            <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-bounce" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </button>

        {/* Duolingo Checkmark Button */}
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-3 flex items-center justify-center transition-all ${
            task.completed
              ? 'bg-emerald-700 border-emerald-900 text-white rotate-3 shadow-md'
              : 'bg-stone-100 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
          } ${justToggled ? 'scale-110' : ''}`}
        >
          <Check className={`w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5] ${task.completed ? 'text-white' : 'opacity-25'}`} />
        </div>
      </div>
    </div>
  );
};
