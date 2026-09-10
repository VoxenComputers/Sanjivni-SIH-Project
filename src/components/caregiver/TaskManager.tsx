import React, { useState } from 'react';
import { useApp, RoutineTask } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { 
  Pill, 
  UtensilsCrossed, 
  Activity, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  CalendarCheck2,
  Sparkles,
  Trash2
} from 'lucide-react';

export const TaskManager: React.FC = () => {
  const { tasks, addTask, toggleTaskCompletion, t } = useApp();

  const [selectedType, setSelectedType] = useState<'medicine' | 'food' | 'activity'>('medicine');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [description, setDescription] = useState('');
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

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

  const quickPresets = [
    { type: 'medicine' as const, title: 'Blood Pressure Tablet', time: '08:00 AM', desc: '1 tablet with warm water after breakfast' },
    { type: 'food' as const, title: 'Warm Lemon Water & Honey', time: '11:00 AM', desc: 'Hydration and immunity boost' },
    { type: 'activity' as const, title: 'Garden Stroll & Sun', time: '04:30 PM', desc: '15-minute gentle walk around flowers' },
    { type: 'medicine' as const, title: 'Evening Memory Multivitamin', time: '08:30 PM', desc: 'Prescribed neuro-cognitive supplement' },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      soundFx.playClickSound();
      return;
    }

    addTask({
      title: title.trim(),
      time: time || '12:00 PM',
      type: selectedType,
      description: description.trim() || `${selectedType} scheduled at ${time}`,
    });

    setTitle('');
    setDescription('');
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 2500);
  };

  const applyPreset = (preset: typeof quickPresets[0]) => {
    soundFx.playClickSound();
    setSelectedType(preset.type);
    setTitle(preset.title);
    setTime(preset.time);
    setDescription(preset.desc);
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
              Caregiver Task Creation Engine
            </h3>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
              Inject new medicine, meal, or activity reminders directly into Koka's Daily Routine view
            </p>
          </div>
        </div>

        {showSuccessBadge && (
          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Task Injected into Patient Routine!</span>
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

        {/* 2. Title & Deadline Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-1.5 tracking-wider">
              2. Reminder Title
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
            <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-1.5 tracking-wider">
              3. Strict Deadline
            </label>
            <div className="relative">
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="02:30 PM"
                required
                className="w-full py-3 px-4 pl-10 rounded-2xl border-2 border-stone-300 dark:border-stone-700 focus:border-emerald-500 dark:focus:border-emerald-400 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-black text-sm outline-none"
              />
              <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. Description Note */}
        <div>
          <label className="block text-xs font-black uppercase text-stone-500 dark:text-stone-400 mb-1.5 tracking-wider">
            Patient Instructions (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 1 green capsule with half glass of warm milk"
            className="w-full py-2.5 px-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 focus:border-emerald-500 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-bold text-xs outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="duo-btn duo-btn-green w-full py-3.5 px-4 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-duo-green min-h-[52px] cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Reminder to Patient's Schedule</span>
        </button>
      </form>
    </div>
  );
};
