import React, { useState } from 'react';
import { useApp, FamilyMember } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audio';
import { uploadMediaFile, addFamilyMemberDb, deleteFamilyMemberDb } from '../../lib/supabaseDb';
import {
  Users,
  Plus,
  Trash2,
  Upload,
  User,
  Heart,
  Loader2,
  CheckCircle2,
  Camera,
  X,
} from 'lucide-react';

export const FamilyManager: React.FC = () => {
  const { familyMembers, updateCustomFamilyMembers, patient } = useApp();
  const { user: authUser, appUser } = useAuth();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [newMemberAvatarUrl, setNewMemberAvatarUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClickSound();
    setIsUploadingPhoto(true);

    try {
      const url = await uploadMediaFile(file, 'family');
      setNewMemberAvatarUrl(url);
    } catch (err) {
      console.warn('Photo upload failed:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Add Member Submission
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setErrorMessage('Please enter the family member\'s name.');
      return;
    }
    if (!newMemberRelation.trim()) {
      setErrorMessage('Please enter their relationship to the patient.');
      return;
    }

    soundFx.playClickSound();
    setIsSubmitting(true);
    setErrorMessage('');

    const patientId =
      (typeof window !== 'undefined' ? localStorage.getItem('smriti_linked_patient_id') : null) ||
      authUser?.id ||
      appUser?.id ||
      'demo-patient-koka';

    try {
      const createdMember = await addFamilyMemberDb(patientId, {
        name: newMemberName.trim(),
        relation: newMemberRelation.trim(),
        avatarUrl: newMemberAvatarUrl || undefined,
      });

      // Update state in AppContext
      updateCustomFamilyMembers([...familyMembers, createdMember]);

      soundFx.playSuccessChime();
      setNewMemberName('');
      setNewMemberRelation('');
      setNewMemberAvatarUrl('');
      setIsAddingMember(false);
    } catch (err) {
      console.warn('Failed to add family member:', err);
      setErrorMessage('Failed to save family member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {!isAddingMember && (
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
        )}
      </div>

      {/* Add Family Member Form */}
      {isAddingMember && (
        <form
          onSubmit={handleAddMember}
          className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border-2 border-teal-500/50 dark:border-teal-600/50 space-y-4 animate-slide-up"
        >
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-3">
            <h4 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-teal-600" />
              <span>New Family Member</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setIsAddingMember(false);
                setErrorMessage('');
              }}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Photo Upload Thumbnail */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {newMemberAvatarUrl ? (
                  <img
                    src={newMemberAvatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-stone-200 dark:bg-stone-700 border-2 border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-center text-stone-400">
                    <User className="w-7 h-7" />
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                </label>
                <p className="text-[10px] font-bold text-stone-400 mt-1">PNG, JPG to `media/family`</p>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-stone-400 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="e.g. Rahul Baruah"
                className="w-full text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white outline-none focus:border-teal-600"
              />
            </div>

            {/* Relationship Input */}
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-stone-400 mb-1">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newMemberRelation}
                onChange={(e) => setNewMemberRelation(e.target.value)}
                placeholder="e.g. Grandson, Daughter-in-law"
                className="w-full text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-shake">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="px-4 py-2 rounded-xl text-xs font-black text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="duo-btn duo-btn-green py-2 px-5 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-duo-green cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Member to Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

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
                  {member.relation}
                </p>
                <span className="text-[10px] text-stone-400 font-bold truncate block">
                  Voice prompts enabled
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
