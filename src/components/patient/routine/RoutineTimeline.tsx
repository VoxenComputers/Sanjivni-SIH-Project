import React from 'react';
import { useApp } from '../../../context/AppContext';
import { RoutineItem } from './RoutineItem';
import { Mascot } from '../../common/Mascot';
import { Sun, CloudSun, Moon, CheckCircle2 } from 'lucide-react';

export const RoutineTimeline: React.FC = () => {
  const { tasks, toggleTask, t } = useApp();

  const morningTasks = tasks.filter((t) => t.timeOfDay === 'morning');
  const afternoonTasks = tasks.filter((t) => t.timeOfDay === 'afternoon');
  const eveningTasks = tasks.filter((t) => t.timeOfDay === 'evening');

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="space-y-4 sm:space-y-5" id="routine-checklist-container">
      {/* Daily Progress Card */}
      <div className="bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="inline-block bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-1 border border-emerald-300 dark:border-emerald-800">
              {t('routineTab')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              {t('dailyChecklist')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300">
              {completedCount} {t('of')} {tasks.length} {t('completed')} ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Chunky Progress Bar */}
        <div className="w-full h-5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden border-2 border-stone-300 dark:border-stone-700 p-0.5">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mascot Cheer */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 shadow-sm">
        <Mascot
          message={
            progressPercent === 100
              ? t('routineMascotAllDone')
              : t('routineMascotProgress')
          }
          mood={progressPercent === 100 ? 'celebrating' : 'happy'}
          size="medium"
        />
      </div>

      {/* Morning Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-xl px-2">
          <Sun className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <h3>{t('morningRoutine')}</h3>
        </div>
        <div className="space-y-3">
          {morningTasks.map((task) => (
            <RoutineItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </div>
      </div>

      {/* Afternoon Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-black text-xl px-2">
          <CloudSun className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          <h3>{t('afternoonRoutine')}</h3>
        </div>
        <div className="space-y-3">
          {afternoonTasks.map((task) => (
            <RoutineItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </div>
      </div>

      {/* Evening Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-300 font-black text-xl px-2">
          <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h3>{t('eveningRoutine')}</h3>
        </div>
        <div className="space-y-3">
          {eveningTasks.map((task) => (
            <RoutineItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </div>
      </div>
    </div>
  );
};
