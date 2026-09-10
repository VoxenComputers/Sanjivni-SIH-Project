import React from 'react';
import { useApp } from '../../../context/AppContext';
import { RoutineItem } from './RoutineItem';
import { Mascot } from '../../common/Mascot';
import { Sun, CloudSun, Moon, CheckCircle2, Clock } from 'lucide-react';

export const RoutineTimeline: React.FC = () => {
  const { tasks, toggleTask, t } = useApp();

  const morningTasks = tasks.filter((t) => t.timeOfDay === 'morning');
  const afternoonTasks = tasks.filter((t) => t.timeOfDay === 'afternoon');
  const eveningTasks = tasks.filter((t) => t.timeOfDay === 'evening');

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  // Time-slot awareness for current active period highlighting
  const currentHour = new Date().getHours();
  const currentSlot: 'morning' | 'afternoon' | 'evening' =
    currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-4 sm:space-y-5 pb-4 sm:pb-6" id="routine-checklist-container">
      {/* Daily Progress Card */}
      <div className="bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 rounded-3xl p-4 sm:p-6 shadow-sm">
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
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
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
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-4 sm:p-5 shadow-sm">
        <Mascot
          message={
            progressPercent === 100
              ? t('routineMascotAllDone')
              : t('routineMascotProgress')
          }
          mood={progressPercent === 100 ? 'celebrating' : 'happy'}
          size="small"
        />
      </div>

      {/* Tasks Timeline Container */}
      <div className="space-y-4 sm:space-y-5">
        {/* Morning Section */}
        {morningTasks.length > 0 && (
          <div className={`space-y-2.5 rounded-2xl p-2 sm:p-0 ${currentSlot === 'morning' ? 'bg-amber-50/40 dark:bg-amber-950/20 sm:bg-transparent' : ''}`}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-lg sm:text-xl">
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                <h3>{t('morningRoutine')}</h3>
              </div>
              {currentSlot === 'morning' && (
                <span className="flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3 h-3" />
                  <span>Now</span>
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {morningTasks.map((task) => (
                <RoutineItem key={task.id} task={task} onToggle={toggleTask} />
              ))}
            </div>
          </div>
        )}

        {/* Afternoon Section */}
        {afternoonTasks.length > 0 && (
          <div className={`space-y-2.5 rounded-2xl p-2 sm:p-0 pt-1 ${currentSlot === 'afternoon' ? 'bg-sky-50/40 dark:bg-sky-950/20 sm:bg-transparent' : ''}`}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-black text-lg sm:text-xl">
                <CloudSun className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400" />
                <h3>{t('afternoonRoutine')}</h3>
              </div>
              {currentSlot === 'afternoon' && (
                <span className="flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-700">
                  <Clock className="w-3 h-3" />
                  <span>Now</span>
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {afternoonTasks.map((task) => (
                <RoutineItem key={task.id} task={task} onToggle={toggleTask} />
              ))}
            </div>
          </div>
        )}

        {/* Evening Section */}
        {eveningTasks.length > 0 && (
          <div className={`space-y-2.5 rounded-2xl p-2 sm:p-0 pt-1 ${currentSlot === 'evening' ? 'bg-indigo-50/40 dark:bg-indigo-950/20 sm:bg-transparent' : ''}`}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-300 font-black text-lg sm:text-xl">
                <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                <h3>{t('eveningRoutine')}</h3>
              </div>
              {currentSlot === 'evening' && (
                <span className="flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                  <Clock className="w-3 h-3" />
                  <span>Now</span>
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {eveningTasks.map((task) => (
                <RoutineItem key={task.id} task={task} onToggle={toggleTask} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
