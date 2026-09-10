import React, { useState } from 'react';
import { RoutineTask, useApp } from '../../../context/AppContext';
import { SpeechButton } from '../../common/SpeechButton';
import { Pill, GlassWater, Footprints, Utensils, Gamepad2, Check, Bell, BellRing, ChevronDown } from 'lucide-react';

interface RoutineItemProps {
  task: RoutineTask;
  onToggle: (id: string) => void;
}

export const RoutineItem: React.FC<RoutineItemProps> = ({ task, onToggle }) => {
  const { scheduleTaskReminder, notificationPermission, requestNotificationPermission, t } = useApp();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [justToggled, setJustToggled] = useState<boolean>(false);
  const [isReminderSet, setIsReminderSet] = useState<boolean>(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        return <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 dark:text-rose-400" />;
      case 'hydration':
        return <GlassWater className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400" />;
      case 'exercise':
        return <Footprints className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'food':
        return <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />;
      case 'game':
        return <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />;
      default:
        return <Check className="w-5 h-5 sm:w-6 sm:h-6 text-stone-600 dark:text-stone-400" />;
    }
  };

  // Strictly pull localized title and description from i18n
  const taskTitle = task.titleKey ? t(task.titleKey) : task.title;
  const taskDesc = task.descKey ? t(task.descKey) : task.description;
  const spokenText = `${taskTitle}. ${taskDesc}. ${task.timeStr}.`;

  return (
    <div
      className={`duo-card p-3.5 sm:p-4 transition-all duration-200 ${
        task.completed
          ? 'border-emerald-600 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
          : 'border-stone-200 dark:border-stone-700 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-stone-800'
      } ${justToggled ? 'scale-[1.01]' : ''}`}
    >
      {/* Compact Header (Accordion Header) */}
      <div
        id={`task-header-${task.id}`}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`task-detail-${task.id}`}
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
          }
        }}
        className="min-h-[48px] sm:min-h-[52px] flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
          {/* Category Icon */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
              task.completed
                ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700'
                : 'bg-stone-100 dark:bg-stone-700/80 border-stone-200 dark:border-stone-600'
            }`}
          >
            {getCategoryIcon()}
          </div>

          {/* Time Pill + Title Container (Stacked on Mobile, Inline on Desktop) */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
            <span
              className={`text-[11px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full border self-start flex-shrink-0 leading-tight ${
                task.completed
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-600'
              }`}
            >
              {task.timeStr}
            </span>

            <h4
              className={`text-sm sm:text-base font-semibold sm:font-bold tracking-tight leading-snug break-words ${
                task.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-white'
              }`}
            >
              {taskTitle}
            </h4>
          </div>
        </div>

        {/* Right Action/State Indicator & Dropdown Chevron */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Checkbox / Status Indicator */}
          <button
            type="button"
            onClick={handleToggleComplete}
            aria-label={task.completed ? t('completed') : t('markAsDone')}
            title={task.completed ? t('completed') : t('markAsDone')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              task.completed
                ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-400 text-white shadow-xs'
                : 'bg-stone-50 dark:bg-stone-700 border-stone-300 dark:border-stone-500 text-stone-400 hover:border-emerald-600 hover:text-emerald-600'
            }`}
          >
            <Check className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[3.5] ${task.completed ? 'text-white' : 'opacity-20'}`} />
          </button>

          {/* Accessible Dropdown Toggle Chevron */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 bg-stone-200 dark:bg-stone-600 text-emerald-700 dark:text-emerald-400' : ''
            }`}
            aria-hidden="true"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Collapsible Accordion Content */}
      <div
        id={`task-detail-${task.id}`}
        role="region"
        aria-labelledby={`task-header-${task.id}`}
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-stone-200 dark:border-stone-700' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden space-y-3">
          {/* Detailed Task Notes / Instructions */}
          <div className="bg-stone-50 dark:bg-stone-900/60 p-3 sm:p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700/80">
            <p className="text-sm sm:text-base font-bold text-stone-700 dark:text-stone-200 leading-relaxed">
              {taskDesc}
            </p>
            {task.category === 'medication' && (
              <p className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-400 mt-1.5 flex items-center gap-1.5">
                <Pill className="w-4 h-4 flex-shrink-0" />
                <span>Follow prescribed dosage with fresh drinking water</span>
              </p>
            )}
            {isReminderSet && (
              <span className="inline-flex text-xs font-black text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-xl items-center gap-1.5 mt-2 animate-pulse">
                <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {t('scheduleSuccess')}
              </span>
            )}
          </div>

          {/* Action Buttons Bar: High Contrast, Large Touch Targets min-h-[48px] */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap pt-1">
            {/* Primary Action Button: "Mark as Done" / "Completed" */}
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`flex-1 min-h-[48px] sm:min-h-[52px] px-4 py-2.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                task.completed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-b-4 border-emerald-800'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-b-4 border-emerald-950 shadow-sm'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{task.completed ? t('completed') : t('markAsDone')}</span>
            </button>

            {/* Read Aloud Button */}
            <div className="flex-shrink-0">
              <SpeechButton text={spokenText} size="md" />
            </div>

            {/* Notification Reminder Button */}
            <button
              type="button"
              onClick={handleReminderClick}
              className={`min-h-[48px] sm:min-h-[52px] px-3.5 py-2.5 rounded-2xl border-2 flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm transition-all cursor-pointer active:scale-95 ${
                isReminderSet
                  ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200'
                  : 'bg-stone-100 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-600 hover:text-amber-700 hover:border-amber-400'
              }`}
              title={t('enableReminder')}
              aria-label={t('enableReminder')}
            >
              {isReminderSet ? (
                <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="hidden xs:inline sm:inline">Remind</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
