import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GeofencingMap } from './GeofencingMap';
import { SOSAlertModal } from './SOSAlertModal';
import { CaregiverChatbot } from './CaregiverChatbot';
import { TaskManager } from './TaskManager';
import { FamilyManager } from './FamilyManager';
import { CognitiveTrajectory } from './CognitiveTrajectory';
import { deviceNotifications } from '../../utils/notifications';
import { soundFx } from '../../utils/audio';
import { getTranslation } from '../../utils/i18n';
import {
  TrendingUp,
  Brain,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShieldCheck,
  Award,
  PhoneCall,
  AlertTriangle,
  Bell,
  Clock,
  Trash2,
} from 'lucide-react';

// Helper to parse time string ("8:00 AM", "01:30 PM", "8:00 PM") into minutes from midnight
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const CaregiverDashboard: React.FC = () => {
  const { 
    patient, 
    tasks, 
    deleteTask,
    toggleTaskCompletion, 
    streak, 
    mmseScore,
    activePatientId,
    t, 
    language 
  } = useApp();

  const handleDeleteTask = async (taskId: string, titleStr: string) => {
    if (window.confirm(`Delete routine reminder "${titleStr}"? This will remove it from Koka's daily schedule.`)) {
      try {
        await deleteTask(taskId);
      } catch (err: any) {
        console.error('[CaregiverDashboard] Delete task error:', {
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
        });
      }
    }
  };

  // Simulated time toggle for testing/evaluation (default uses real local time)
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);
  const [notifiedTasks, setNotifiedTasks] = useState<{ [id: string]: boolean }>({});

  const now = new Date();
  const currentMinutes = simulatedHour !== null ? simulatedHour * 60 : now.getHours() * 60 + now.getMinutes();

  // Critical Requirement 4: Real-time missed task check
  // Identifies tasks where deadline has elapsed and patient has not completed them
  const overdueTasks = tasks.filter((task) => {
    const isDone = task.isCompleted ?? task.completed;
    if (isDone) return false;
    const taskMinutes = parseTimeToMinutes(task.time || task.timeStr);
    return currentMinutes > taskMinutes;
  });

  // Trigger native browser notification and audio feedback for missed tasks
  useEffect(() => {
    if (overdueTasks.length > 0) {
      overdueTasks.forEach((t) => {
        if (!notifiedTasks[t.id]) {
          const taskName = t.titleKey ? getTranslation(language, t.titleKey) : t.title;
          deviceNotifications.sendNotification(
            '⚠️ SANJIVNI: Overdue Task Alert',
            `Koka has missed scheduled routine: ${taskName} (Deadline: ${t.time || t.timeStr})`
          );
          setNotifiedTasks((prev) => ({ ...prev, [t.id]: true }));
        }
      });
    }
  }, [overdueTasks, notifiedTasks, language]);

  const completedTasks = tasks.filter((t) => t.isCompleted ?? t.completed).length;
  const taskAdherence = Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="space-y-5 sm:space-y-6 pb-6">
      {/* Active Full-Screen SOS Modal if Geofence Breached */}
      <SOSAlertModal />

      {/* Critical Requirement 4: High-Visibility Missed Task Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/70 border-3 border-rose-500 dark:border-rose-600 rounded-3xl p-4 sm:p-5 shadow-lg animate-tactile-bounce space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-md">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Caregiver Real-Time Alert
                </span>
                <h3 className="text-lg sm:text-xl font-black text-rose-900 dark:text-rose-100 tracking-tight leading-tight">
                  {overdueTasks.length} Missed Routine Reminder{overdueTasks.length > 1 ? 's' : ''} for Koka Bhaben
                </h3>
              </div>
            </div>

            {/* Quick Demo Simulator Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickSound();
                  setSimulatedHour(simulatedHour ? null : 21); // 9:00 PM toggle
                }}
                className="text-xs font-black text-rose-800 dark:text-rose-300 underline cursor-pointer hover:text-rose-950"
              >
                {simulatedHour ? 'Reset to Real Clock' : 'Simulate 9:00 PM (Trigger All Overdue)'}
              </button>
            </div>
          </div>

          {/* List of Overdue Tasks with Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {overdueTasks.map((t) => {
              const taskTitle = t.titleKey ? getTranslation(language, t.titleKey) : t.title;
              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-stone-900 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 truncate">
                      {taskTitle}
                    </p>
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                      Scheduled: {t.time || t.timeStr} • Overdue
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => alert(`Sending Gentle Reminder Chime to Koka's Tablet for "${taskTitle}"...`)}
                      className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-extrabold text-[11px] hover:bg-rose-200 border border-rose-300 dark:border-rose-800 cursor-pointer"
                      title="Send Gentle Chime"
                    >
                      Buzzer
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(t.id)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer"
                      title="Mark as Done"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Profile Card & Quick Stats */}
      <div className="duo-card p-6 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 shadow-duo-neutral">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Patient Bio */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-brand-green-light dark:bg-emerald-950 border-3 border-brand-green flex items-center justify-center text-3xl font-black text-brand-green-dark dark:text-emerald-300 flex-shrink-0 shadow-sm">
              BB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-brand-dark dark:text-white tracking-tight">
                  {patient.name} ({patient.honorific})
                </h2>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                  MCI Stage 1 Stable
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-stone-600 dark:text-stone-300 mt-0.5">
                Age {patient.age} • Beltola, Guwahati • Blood: {patient.bloodGroup}
              </p>
              <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400 mt-1">
                Attending: {patient.doctorName} ({patient.clinic})
              </p>
            </div>
          </div>

          {/* Key Metrics Pills */}
          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            {/* Streak */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-3 text-center">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase block">Streak</span>
              <span className="text-2xl sm:text-3xl font-black text-brand-amber-dark dark:text-amber-200">{streak} Days</span>
            </div>

            {/* Routine Adherence */}
            <div className="bg-green-50 dark:bg-emerald-950/40 border-2 border-green-300 dark:border-emerald-800 rounded-2xl p-3 text-center">
              <span className="text-xs font-bold text-green-800 dark:text-emerald-300 uppercase block">Routine</span>
              <span className="text-2xl sm:text-3xl font-black text-brand-green-dark dark:text-emerald-200">{taskAdherence}%</span>
            </div>

            {/* Cognitive Score */}
            <div className="bg-stone-100 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-2xl p-3 text-center">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase block">MMSE Score</span>
              <span className="text-2xl sm:text-3xl font-black text-brand-dark dark:text-white">
                {(mmseScore ?? 25.8).toFixed(1)} / 30
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Requirement 3: Task Creation Engine */}
      <TaskManager />

      {/* Requirement 4: Live Supabase Family Circle Management */}
      <FamilyManager />

      {/* Geofencing Map & Wandering Simulator Section */}
      <GeofencingMap />

      {/* Cognitive Decline & Memory Performance Analytics */}
      <div className="space-y-6">
        {/* Dynamic Cognitive Trajectory & Telemetry Heuristic */}
        <CognitiveTrajectory patientId={activePatientId} />

        {/* Daily Task & Routine Adherence Monitor */}
        <div className="duo-card p-6 space-y-4 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light dark:bg-emerald-950 border border-green-300 dark:border-emerald-800 flex items-center justify-center text-brand-green-dark dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white tracking-tight">
                  Daily Routine Adherence
                </h3>
                <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                  Real-time sync with Koka’s morning/evening tablet checklists
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-brand-green-dark dark:text-emerald-300">
              {completedTasks} / {tasks.length} Done
            </span>
          </div>

          <div className="divide-y-2 divide-stone-100 dark:divide-stone-800 max-h-56 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const taskTitle = task.titleKey ? t(task.titleKey) : task.title;
              return (
                <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        task.completed ? 'bg-brand-green' : 'bg-stone-300 dark:bg-stone-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-bold truncate ${task.completed ? 'line-through text-stone-500 dark:text-stone-500' : 'text-stone-800 dark:text-stone-100'}`}>
                        {taskTitle}
                      </p>
                      <span className="text-xs font-semibold text-stone-400">{task.timeStr}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        task.completed
                          ? 'bg-green-100 dark:bg-emerald-950 text-brand-green-dark dark:text-emerald-300 border-green-300 dark:border-emerald-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id, taskTitle)}
                      title="Delete routine task"
                      aria-label={`Delete task ${taskTitle}`}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emergency Quick Action Contacts */}
      <div className="bg-stone-100 dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 flex items-center justify-center text-brand-green dark:text-emerald-400">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black text-brand-dark dark:text-white">Primary Caregiver: Dr. Priya Baruah (Daughter)</h4>
            <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300">Dispur Hospital Resident • +91 98640 12345</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => alert(`Calling Dr. Priya Baruah at +91 98640 12345...`)}
            className="duo-btn duo-btn-green py-2.5 px-5 text-base flex-1 sm:flex-initial"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Primary Caregiver</span>
          </button>
        </div>
      </div>

      {/* Floating Caregiver AI Chatbot */}
      <CaregiverChatbot />
    </div>
  );
};
