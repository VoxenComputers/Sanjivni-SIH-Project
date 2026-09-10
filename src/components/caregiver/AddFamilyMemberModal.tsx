import React, { useState } from 'react';
import { useApp, FamilyMember } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audio';
import { uploadMediaFile, addFamilyMemberDb } from '../../lib/supabaseDb';
import {
  Heart,
  User,
  Camera,
  Loader2,
  CheckCircle2,
  X,
  Calendar,
  MessageSquareQuote,
  FileText,
} from 'lucide-react';

export interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  onSuccess?: (newMember: FamilyMember) => void;
}

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  patientId: customPatientId,
  onSuccess,
}) => {
  const { familyMembers, updateCustomFamilyMembers, activePatientId, refreshFamilyMembers } = useApp();
  const { user: authUser, appUser } = useAuth();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [age, setAge] = useState<string>('');
  const [description, setDescription] = useState('');
  const [quote, setQuote] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClickSound();
    setIsUploadingPhoto(true);

    try {
      const url = await uploadMediaFile(file, 'family');
      setAvatarUrl(url);
    } catch (err) {
      console.warn('Photo upload failed:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter the family member's name.");
      return;
    }
    if (!relationship.trim()) {
      setErrorMessage('Please enter their relationship to the patient.');
      return;
    }

    soundFx.playClickSound();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const resolvedPatientId =
      customPatientId ||
      activePatientId ||
      (typeof window !== 'undefined' ? localStorage.getItem('smriti_linked_patient_id') : null) ||
      authUser?.id ||
      appUser?.id ||
      'demo-patient-koka';

    let createdMember: FamilyMember;

    // STEP 1: DB INSERT (Primary Action with isolated error handling)
    try {
      createdMember = await addFamilyMemberDb(resolvedPatientId, {
        name: name.trim(),
        relationship: relationship.trim(),
        relation: relationship.trim(),
        age: age ? parseInt(age, 10) || 30 : 30,
        description: description.trim() || 'Visits often and loves spending time together.',
        notes: description.trim() || 'Visits often and loves spending time together.',
        quote: quote.trim() || 'Pranam! Remember we are always with you. Keep smiling!',
        voiceMessage: quote.trim() || 'Pranam! Remember we are always with you. Keep smiling!',
        avatarUrl: avatarUrl || undefined,
      });
    } catch (err: any) {
      console.error('Actual DB Insert Error:', err);
      // ONLY display error toast if error is genuinely truthy
      setErrorMessage(err?.message || 'Failed to add family member to database. Please check your connection.');
      setIsSubmitting(false);
      return;
    }

    // STEP 2: MODAL & STATE SUCCESS TRANSITION
    try {
      updateCustomFamilyMembers([...familyMembers, createdMember]);
      if (onSuccess) onSuccess(createdMember);
    } catch (stateErr) {
      console.warn('Local state update notice:', stateErr);
    }

    soundFx.playSuccessChime();
    setSuccessMessage(`${createdMember.name} added to family circle!`);
    setIsSubmitting(false);

    // Reset Form
    setName('');
    setRelationship('');
    setAge('');
    setDescription('');
    setQuote('');
    setAvatarUrl('');
    setErrorMessage('');

    // Close modal on success after a short confirmation
    setTimeout(() => {
      onClose();
    }, 400);

    // STEP 3: SECONDARY ACTIONS (Isolated in separate Try/Catch)
    try {
      if (refreshFamilyMembers) {
        await refreshFamilyMembers();
      }
    } catch (secondaryErr) {
      console.warn('Background refresh warning after adding family member:', secondaryErr);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-member-title" className="text-lg sm:text-xl font-black tracking-tight">
                Add Family Member
              </h3>
              <p className="text-xs text-teal-100 font-bold">
                Synced to Patient's Reminiscence Memory Book
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-black flex items-center gap-2 animate-slide-up">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border-2 border-stone-200 dark:border-stone-700">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-stone-200 dark:bg-stone-700 border-2 border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-center text-stone-400">
                  <User className="w-8 h-8" />
                </div>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all">
                <Camera className="w-3.5 h-3.5" />
                <span>{isUploadingPhoto ? 'Uploading photo...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
              </label>
              <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mt-1">
                Optional: Upload a warm photo for visual recognition
              </p>
            </div>
          </div>

          {/* Name & Relationship Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Baruah"
                className="w-full text-sm font-bold py-2.5 px-3.5 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300 mb-1">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Grandson, Daughter-in-law"
                className="w-full text-sm font-bold py-2.5 px-3.5 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Custom Input 1: Age */}
          <div>
            <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Age (Years)</span>
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 24"
              className="w-full text-sm font-bold py-2.5 px-3.5 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-teal-600"
            />
          </div>

          {/* Custom Input 2: Description / Memory Note */}
          <div>
            <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Description / Memory Note</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Visits every Sunday, studies engineering in Guwahati..."
              className="w-full text-xs sm:text-sm font-bold py-2.5 px-3.5 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-teal-600 resize-none"
            />
          </div>

          {/* Custom Input 3: Personalized Message / Quote */}
          <div>
            <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300 mb-1 flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-teal-600" />
              <span>Personalized Message / Voice Note Prompt</span>
            </label>
            <textarea
              rows={2}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="e.g. Pranam! Remember that our family is always with you. Keep smiling!"
              className="w-full text-xs sm:text-sm font-bold py-2.5 px-3.5 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-teal-600 resize-none"
            />
            <p className="text-[10px] text-stone-400 font-bold mt-0.5">
              Spoken aloud to the patient when they tap the "Play Voice Note" button.
            </p>
          </div>

          {/* Genuine DB Error Banner */}
          {errorMessage && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-shake">
              {errorMessage}
            </p>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="duo-btn duo-btn-green py-2.5 px-5 text-xs sm:text-sm font-black flex items-center gap-2 shadow-duo-green cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Member...</span>
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
      </div>
    </div>
  );
};

export default AddFamilyMemberModal;
