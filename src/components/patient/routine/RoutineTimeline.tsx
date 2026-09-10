import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp, RoutineTask } from '../../../context/AppContext';
import { fetchPatientTasks, toggleTaskCompletion, isValidUuid } from '../../../lib/supabaseDb';
import { supabase } from '../../../lib/supabase';
import { RoutineItem } from './RoutineItem';
import { Mascot } from '../../common/Mascot';
import { Sun, CloudSun, Moon, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react';

// Helper: Normalize period from explicit period string or derive from time string
const normalizePeriod = (
  period?: string | null,
  timeStr?: string | null
): 'morning' | 'afternoon' | 'evening' => {
  if (period) {
    const p = period.trim().toLowerCase();
    if (p === 'morning') return 'morning';
    if (p === 'afternoon') return 'afternoon';
    if (p === 'evening' || p === 'night') return 'evening';
  }

  if (timeStr) {
    // 24-hour format (e.g., 09:00, 14:30)
    const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      if (h < 12) return 'morning';
      if (h < 17) return 'afternoon';
      return 'evening';
    }

    // 12-hour format (e.g., 09:00 AM, 2:30 PM, 9am)
    const match12 = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const mer = match12[3]?.toLowerCase();
      if (mer === 'pm' && h < 12) h += 12;
      if (mer === 'am' && h === 12) h = 0;
      if (h < 12) return 'morning';
      if (h < 17) return 'afternoon';
      return 'evening';
    }
  }

  return 'morning';
};

export const RoutineTimeline: React.FC = () => {
  const { tasks: contextTasks, toggleTask, activePatientId, t } = useApp();

  const [dbTasks, setDbTasks] = useState<RoutineTask[] | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);

  // Determine target patient ID to query from Supabase
  const targetPatientId = useMemo(() => {
    if (activePatientId && activePatientId !== 'demo-patient-koka' && isValidUuid(activePatientId)) {
      return activePatientId;
    }
    if (typeof window !== 'undefined') {
      const savedLinked = localStorage.getItem('smriti_linked_patient_id');
      if (savedLinked && savedLinked !== 'demo-patient-koka' && isValidUuid(savedLinked)) {
        return savedLinked;
      }
    }
    return null;
  }, [activePatientId]);

  // 1. Fetch Patient Tasks from Supabase Database (filtered by patient_id)
  const loadLiveTasks = useCallback(async () => {
    if (!targetPatientId) {
      setDbTasks(null);
      return;
    }

    try {
      setIsLoadingTasks(true);
      const liveTasks = await fetchPatientTasks(targetPatientId);
      if (liveTasks && liveTasks.length > 0) {
        setDbTasks(liveTasks);
      } else {
        // Fall back to demo routine items only if the database query returns zero custom tasks
        setDbTasks(null);
      }
    } catch (err) {
      console.warn('[RoutineTimeline] Failed to load live patient tasks:', err);
      setDbTasks(null);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [targetPatientId]);

  // Initial fetch on mount or when patient ID changes
  useEffect(() => {
    loadLiveTasks();
  }, [loadLiveTasks]);

  // 2. Realtime Live Sync: Supabase Realtime Subscription on 'patient_tasks' & 'routine_tasks'
  useEffect(() => {
    if (!targetPatientId) {
      return;
    }

    const channel = supabase
      .channel(`realtime_timeline_tasks_${targetPatientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_tasks',
          filter: `patient_id=eq.${targetPatientId}`,
        },
        (payload) => {
          console.log('[RoutineTimeline] Realtime task change detected (patient_tasks):', payload.eventType);
          loadLiveTasks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routine_tasks',
          filter: `patient_id=eq.${targetPatientId}`,
        },
        (payload) => {
          console.log('[RoutineTimeline] Realtime task change detected (routine_tasks):', payload.eventType);
          loadLiveTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetPatientId, loadLiveTasks]);

  // 3. Instant In-App & Multi-Tab Synchronization Listeners
  useEffect(() => {
    const handleImmediateRefresh = () => {
      console.log('[RoutineTimeline] Instant refresh triggered via task update event');
      loadLiveTasks();
    };

    window.addEventListener('sanjivni:tasks-updated', handleImmediateRefresh);
    window.addEventListener('storage', handleImmediateRefresh);
    window.addEventListener('focus', handleImmediateRefresh);

    return () => {
      window.removeEventListener('sanjivni:tasks-updated', handleImmediateRefresh);
      window.removeEventListener('storage', handleImmediateRefresh);
      window.removeEventListener('focus', handleImmediateRefresh);
    };
  }, [loadLiveTasks]);

  // Resolve active tasks list (DB tasks if custom tasks exist, else demo tasks fallback)
  const displayTasks = useMemo(() => {
    if (dbTasks && dbTasks.length > 0) {
      return dbTasks;
    }
    return contextTasks;
  }, [dbTasks, contextTasks]);

  // Handle task completion toggle with optimistic UI and live DB sync
  const handleToggleTask = async (taskId: string) => {
    // If working with dbTasks, perform optimistic update and sync to Supabase
    if (dbTasks && dbTasks.length > 0) {
      const target = dbTasks.find((t) => t.id === taskId);
      if (target) {
        const nextState = !(target.completed ?? target.isCompleted);
        setDbTasks((prev) =>
          prev
            ? prev.map((t) =>
                t.id === taskId ? { ...t, completed: nextState, isCompleted: nextState } : t
              )
            : prev
        );
        await toggleTaskCompletion(taskId, nextState);
      }
    }

    // Always update global context state
    toggleTask(taskId);
  };

  // Group tasks by period (morning, afternoon, evening) using robust period normalizer
  const morningTasks = displayTasks.filter(
    (t) => normalizePeriod(t.period || t.timeOfDay, t.time_slot || t.timeStr || t.time) === 'morning'
  );
  const afternoonTasks = displayTasks.filter(
    (t) => normalizePeriod(t.period || t.timeOfDay, t.time_slot || t.timeStr || t.time) === 'afternoon'
  );
  const eveningTasks = displayTasks.filter(
    (t) => normalizePeriod(t.period || t.timeOfDay, t.time_slot || t.timeStr || t.time) === 'evening'
  );

  const completedCount = displayTasks.filter((t) => t.completed || t.isCompleted).length;
  const progressPercent =
    displayTasks.length > 0 ? Math.round((completedCount / displayTasks.length) * 100) : 0;

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
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                {t('routineTab')}
              </span>
              {dbTasks && dbTasks.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 border border-teal-300 dark:border-teal-800 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Caregiver Synced</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              {t('dailyChecklist')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300">
              {completedCount} {t('of')} {displayTasks.length} {t('completed')} ({progressPercent}%)
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

      {/* Loading Indicator */}
      {isLoadingTasks && displayTasks.length === 0 && (
        <div className="p-8 text-center flex items-center justify-center gap-2 text-stone-500 font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Syncing routine schedule...</span>
        </div>
      )}

      {/* Tasks Timeline Container Grouped by Period */}
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
                <RoutineItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
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
                <RoutineItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
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
                <RoutineItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
