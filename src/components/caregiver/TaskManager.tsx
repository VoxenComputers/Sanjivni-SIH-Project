import React, { useState } from 'react';
import { useApp, RoutineTask } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { addPatientTask } from '../../lib/supabaseDb';
import { 
  Pill, 
  UtensilsCrossed, 
  Activity, 
  Clock, 
  Plus, 
  CheckCircle2, 
  CalendarCheck2,
  Sparkles,
  Sun,
  CloudSun,
  Moon,
  Loader2
} from 'lucide-react';

export const TaskManager: React.FC = () => {
  const { tasks, addTask, activePatientId, t } = useApp();

  const [selectedType, setSelectedType] = useState<'medicine' | 'food' | 'activity'>('medicine');
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [title, setTitle] = useState('');
  const [time24, setTime24] = useState('09:00');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Standardized 12-hour Time Slot Formatter
  const formatTimeSlot = (time24Val: string): string => {
    if (!time24Val) return '';
    const [hours, minutes] = time24Val.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${(minutes || 0).toString().padStart(2, '0')} ${period}`;
  };

  // 2. Automatic Period Detection based on 24-hour time
  // Before 12:00 PM -> 'morning'
  // 12:00 PM to 5:00 PM -> 'afternoon'
  // After 5:00 PM -> 'evening'
  const detectPeriod = (time24Val: string): 'morning' | 'afternoon' | 'evening' => {
    if (!time24Val) return 'morning';
    const [hours] = time24Val.split(':').map(Number);
    if (hours < 12) return 'morning';
    if (hours < 17) return 'afternoon';
    return 'evening';
  };

  // Helper to convert 12-hour preset strings (e.g. "08:00 AM") to 24-hour "HH:mm"
  const to24Hour = (time12: string): string => {
    if (!time12) return '09:00';
    const match = time12.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return time12.slice(0, 5);
    let hours = parseInt(match[1], 10);
    const minutes = match[2].padStart(2, '0');
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleTimeChange = (newTime24: string) => {
    setTime24(newTime24);
    const autoPeriod = detectPeriod(newTime24);
    setSelectedPeriod(autoPeriod);
  };

  const categoryConfigs = [
    {
      type: 'medicine' as const,
      label: 'Medicine',
      icon: Pill,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
      activeColor: 'bg-rose-500 text-white border-rose-700 shadow-duo-rose',
    },
    {
      type: 'food' as const,
      label: 'Meal / Diet',
      icon: UtensilsCrossed,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      activeColor: 'bg-amber-500 text-white border-amber-700 shadow-duo-amber',
    },
    {
      type: 'activity' as const,
      label: 'Activity',
      icon: Activity,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      activeColor: 'bg-emerald-600 text-white border-emerald-800 shadow-duo-green',
    },
  ];

  const periodOptions = [
    { id: 'morning' as const, label: 'Morning', icon: Sun, color: 'text-amber-500' },
    { id: 'afternoon' as const, label: 'Afternoon', icon: CloudSun, color: 'text-sky-500' },
    { id: 'evening' as const, label: 'Evening', icon: Moon, color: 'text-indigo-500' },
  ];

  const quickPresets = [
    { type: 'medicine' as const, period: 'morning' as const, title: 'Blood Pressure Tablet', time: '08:00 AM', desc: '1 tablet with warm water after breakfast' },
    { type: 'food' as const, period: 'morning' as const, title: 'Warm Lemon Water & Honey', time: '11:00 AM', desc: 'Hydration and immunity boost' },
    { type: 'activity' as const, period: 'afternoon' as const, title: 'Garden Stroll & Sun', time: '04:30 PM', desc: '15-minute gentle walk around flowers' },
    { type: 'medicine' as const, period: 'evening' as const, title: 'Evening Memory Multivitamin', time: '08:30 PM', desc: 'Prescribed neuro-cognitive supplement' },
  ];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      soundFx.playClickSound();
      setErrorMessage('Please enter a task title.');
      return;
    }

    soundFx.playClickSound();
    setIsSubmitting(true);
    setErrorMessage('');

    const resolvedPatientId =
      activePatientId ||
      (typeof window !== 'undefined' ? localStorage.getItem('smriti_linked_patient_id') : null) ||
      'demo-patient-koka';

    const category = selectedType === 'medicine' ? 'medication' : (selectedType as any);
    const standardizedTime = formatTimeSlot(time24) || '09:00 AM';
    const periodToSave = selectedPeriod || detectPeriod(time24);

    try {
      // 1. Insert into Supabase database (patient_tasks with .select())
      const createdTask = await addPatientTask({
        patientId: resolvedPatientId,
        title: title.trim(),
        timeSlot: standardizedTime,
        time_slot: standardizedTime,
        time: standardizedTime,
        period: periodToSave,
        timeOfDay: periodToSave,
        notes: description.trim() || `${selectedType} scheduled at ${standardizedTime}`,
        description: description.trim() || `${selectedType} scheduled at ${standardizedTime}`,
        type: selectedType,
        category: category,
      });

      // 2. Update global context
      addTask(createdTask);

      // 3. Dispatch broadcast event for instantaneous cross-component and tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sanjivni:tasks-updated', { detail: createdTask }));
      }

      soundFx.playSuccessChime();
      setTitle('');
      setDescription('');
      setShowSuccessBadge(true);
      setTimeout(() => setShowSuccessBadge(false), 3000);
    } catch (err: any) {
      console.error('Failed to add routine task:', err);
      setErrorMessage(err?.message || 'Failed to save task to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: typeof quickPresets[0]) => {
    soundFx.playClickSound();
    setSelectedType(preset.type);
    setSelectedPeriod(preset.period);
    setTitle(preset.title);
    const converted24 = to24Hour(preset.time);
    setTime24(converted24);
    setDescription(preset.desc);
    setErrorMessage('');
  };

  return (
    <div className="duo-card p-6 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-stone-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-800 flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Caregiver Daily Routine Engine
            </h3>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
              Inject tasks that instantly sync & render in the patient's Routine Timeline via Supabase Realtime
            </p>
          </div>
        </div>

        {showSuccessBadge && (
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Task Synced to Patient Routine!</span>
          </span>
        )}
      </div>

      {/* Task Creation Form */}
      <form onSubmit={handleCreateTask} className="space-y-4">
        {/* 1. Category Selection */}
        <div>
          <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-2 tracking-wider">
            1. Select Category
          </label>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {categoryConfigs.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedType(cat.type);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 sm:px-4 rounded-2xl border-3 font-black text-xs sm:text-sm transition-all cursor-pointer select-none min-h-[56px] ${
                    isSelected
                      ? `${cat.activeColor} scale-[1.02]`
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Timeline Period Selection (Morning, Afternoon, Evening) */}
        <div>
          <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-2 tracking-wider">
            2. Routine Period (Timeline Grouping)
          </label>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {periodOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedPeriod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedPeriod(opt.id);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border-2 font-black text-xs sm:text-sm transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? '' : opt.color}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div>
          <span className="text-[11px] font-extrabold text-stone-400 dark:text-stone-400 flex items-center gap-1 mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Quick Clinical Presets:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-[11px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1 text-stone-700 dark:text-stone-300 cursor-pointer transition-colors"
              >
                + {preset.title} ({preset.time})
              </button>
            ))}
          </div>
        </div>

        {/* 3. Title & Time Slot Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-1.5 tracking-wider">
              3. Reminder Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon Blood Pressure Medicine"
              required
              className="w-full py-3 px-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 focus:border-emerald-500 dark:focus:border-emerald-400 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-bold text-sm outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 tracking-wider">
                4. Scheduled Time <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                {formatTimeSlot(time24) || '09:00 AM'}
              </span>
            </div>
            <div className="relative">
              <input
                type="time"
                value={time24}
                onChange={(e) => handleTimeChange(e.target.value)}
                required
                className="w-full py-3 px-4 pl-10 rounded-2xl border-2 border-stone-300 dark:border-stone-700 focus:border-emerald-500 dark:focus:border-emerald-400 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-black text-sm outline-none cursor-pointer"
              />
              <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4. Description Note */}
        <div>
          <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-1.5 tracking-wider">
            5. Patient Instructions / Notes (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 1 green capsule with half glass of warm milk after lunch"
            className="w-full py-2.5 px-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 focus:border-emerald-500 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-bold text-xs outline-none"
          />
        </div>

        {errorMessage && (
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-shake">
            {errorMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="duo-btn duo-btn-green w-full py-3.5 px-4 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-duo-green min-h-[52px] cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Syncing with Patient Routine...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Add Routine Task to Patient's Schedule</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
