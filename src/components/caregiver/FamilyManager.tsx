import React, { useState } from 'react';
import { useApp, FamilyMember } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { deleteFamilyMemberDb } from '../../lib/supabaseDb';
import { AddFamilyMemberModal } from './AddFamilyMemberModal';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';

export const FamilyManager: React.FC = () => {
  const { familyMembers, updateCustomFamilyMembers, patient, refreshFamilyMembers } = useApp();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Handle Delete Member
  const handleDeleteMember = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Remove ${name} from ${patient.name}'s family circle?`);
    if (!confirmDelete) return;

    soundFx.playClickSound();
    setDeletingId(id);

    try {
      await deleteFamilyMemberDb(id);
      const updatedList = familyMembers.filter((m) => m.id !== id);
      updateCustomFamilyMembers(updatedList);
      refreshFamilyMembers?.();
      soundFx.playSuccessChime();
    } catch (err) {
      console.warn('Delete member failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="duo-card p-6 space-y-5 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 shadow-duo-neutral">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 border-2 border-teal-300 dark:border-teal-800 flex items-center justify-center text-teal-800 dark:text-teal-300 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Family Circle Management
            </h3>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
              Live sync with {patient.name}'s Reminiscence Vault & voice prompts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClickSound();
            setIsAddingMember(true);
          }}
          className="duo-btn duo-btn-green py-2.5 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Success Notification Banner / Toast */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-black flex items-center justify-between gap-2 animate-slide-up shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={isAddingMember}
        onClose={() => setIsAddingMember(false)}
        onSuccess={(created) => {
          setSuccessMessage(`${created.name} added to family circle!`);
          setTimeout(() => setSuccessMessage(''), 4000);
        }}
      />

      {/* Existing Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border-2 border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 group hover:border-teal-500/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Photo or Initials */}
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500 shadow-xs flex-shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0"
                  style={{ backgroundColor: member.avatarColor || '#0D9488' }}
                >
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h4 className="text-sm font-black text-stone-900 dark:text-white truncate">
                  {member.name}
                </h4>
                <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300 truncate">
                  {member.age ? `Age ${member.age} • ` : ''}{member.relation || member.relationship}
                </p>
                <span className="text-[10px] text-stone-400 font-bold truncate block">
                  {member.description || member.funFact || 'Voice prompts enabled'}
                </span>
              </div>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => handleDeleteMember(member.id, member.name)}
              disabled={deletingId === member.id}
              className="p-2.5 rounded-xl bg-white dark:bg-stone-800 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-stone-200 dark:border-stone-700 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title={`Remove ${member.name}`}
            >
              {deletingId === member.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
