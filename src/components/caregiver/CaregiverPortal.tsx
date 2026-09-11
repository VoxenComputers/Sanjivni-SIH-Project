import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CaregiverDashboard } from './CaregiverDashboard';
import { TaskManager } from './TaskManager';
import { FamilyManager } from './FamilyManager';
import { AddFamilyMemberModal } from './AddFamilyMemberModal';
import { GeofencingMap } from './GeofencingMap';
import { soundFx } from '../../utils/audio';
import {
  createTask,
  addCaregiverMember,
  addPatient,
  linkPatientToCaregiver,
  fetchCaregiverPatients,
  fetchCaregiverTeam,
  resolveToValidUuid,
  toNullableUuid,
  isValidUuid,
} from '../../lib/supabaseDb';
import {
  ShieldCheck,
  UserPlus,
  CalendarPlus,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const CaregiverPortal: React.FC = () => {
  const {
    patient,
    currentPatient,
    activeCaregiver,
    activePatientId,
    addTask,
    addMember,
    deleteTask,
    toggleTaskCompletion,
    refreshFamilyMembers,
  } = useApp();

  const { user: authUser, appUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'family' | 'geofence'>('dashboard');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isLinkingPatient, setIsLinkingPatient] = useState(false);
  const [patientConnectionCode, setPatientConnectionCode] = useState('');
  const [portalStatus, setPortalStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Safe mutation wrapper surfacing DB / RLS errors
  const handleSafeMutation = async <T,>(
    mutationName: string,
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      const result = await operation();
      return result;
    } catch (err: any) {
      console.error(`[CaregiverPortal] Database mutation failed in ${mutationName}:`, {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      });
      setPortalStatus({
        type: 'error',
        message: `Database error (${mutationName}): ${err?.message || 'Operation failed'}`,
      });
      throw err;
    }
  };

  // 1. Create Task Handler with Full Error Surfacing
  const handleQuickCreateTask = async (taskPayload: {
    title: string;
    time_slot: string;
    period: 'morning' | 'afternoon' | 'evening';
    notes?: string;
    type?: string;
    category?: string;
  }) => {
    const targetPatientId = resolveToValidUuid(activePatientId || currentPatient?.id);
    return await handleSafeMutation('createTask', async () => {
      const newTask = await createTask({
        patient_id: targetPatientId,
        title: taskPayload.title,
        time_slot: taskPayload.time_slot,
        period: taskPayload.period,
        notes: taskPayload.notes,
        type: taskPayload.type || 'activity',
        category: taskPayload.category || 'medication',
      });
      addTask(newTask);
      soundFx.playSuccessChime();
      setPortalStatus({ type: 'success', message: `Task "${newTask.title}" scheduled successfully.` });
      return newTask;
    });
  };

  // 2. Add Caregiver Team / Family Member with Full Error Surfacing
  const handleQuickAddMember = async (memberPayload: {
    name: string;
    relation: string;
    phone?: string;
    email?: string;
    role?: string;
  }) => {
    const targetCaregiverId = toNullableUuid(authUser?.id || appUser?.id || activeCaregiver?.id);
    const targetPatientId = resolveToValidUuid(activePatientId || currentPatient?.id);

    return await handleSafeMutation('addCaregiverMember', async () => {
      const newMember = await addCaregiverMember({
        caregiver_id: targetCaregiverId || undefined,
        patient_id: targetPatientId,
        name: memberPayload.name,
        relation: memberPayload.relation,
        phone: memberPayload.phone,
        email: memberPayload.email,
        role: memberPayload.role || 'support',
      });
      addMember(newMember);
      soundFx.playSuccessChime();
      setPortalStatus({ type: 'success', message: `${newMember.name} added to care team.` });
      return newMember;
    });
  };

  // 3. Register or Link Patient with Strict UUID Foreign Key Constraints
  const handleRegisterOrLinkPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientConnectionCode.trim()) return;

    soundFx.playClickSound();
    setIsLinkingPatient(true);
    setPortalStatus(null);

    try {
      const caregiverUuid = toNullableUuid(authUser?.id || appUser?.id || activeCaregiver?.id);
      const cleanCode = patientConnectionCode.trim().replace(/\D/g, '');

      await handleSafeMutation('linkPatientToCaregiver', async () => {
        // If caregiverUuid exists, link atomically
        if (caregiverUuid) {
          const res = await linkPatientToCaregiver(caregiverUuid, resolveToValidUuid(activePatientId));
          if (!res.success) {
            throw new Error(res.error || 'Failed to pair caregiver and patient.');
          }
        }
        setPortalStatus({ type: 'success', message: 'Patient profile synchronized successfully.' });
        setPatientConnectionCode('');
      });
    } catch (err: any) {
      // Error already surfaced in console via handleSafeMutation
    } finally {
      setIsLinkingPatient(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Portal Status / Error Banner */}
      {portalStatus && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 animate-slide-up shadow-sm ${
            portalStatus.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {portalStatus.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            )}
            <p className="text-sm font-bold">{portalStatus.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setPortalStatus(null)}
            className="p-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Caregiver Dashboard Content */}
      <CaregiverDashboard />

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={() => {
          setPortalStatus({ type: 'success', message: 'Family member successfully saved.' });
          setTimeout(() => setPortalStatus(null), 4000);
        }}
      />
    </div>
  );
};

export default CaregiverPortal;
