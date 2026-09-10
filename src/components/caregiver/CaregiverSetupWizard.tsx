import React, { useState } from 'react';
import { useApp, FamilyMember } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audio';
import { uploadMediaFile, saveCaregiverWizardData, verifyAndLinkPatient } from '../../lib/supabaseDb';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  User,
  HeartHandshake,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  Phone,
  KeyRound,
  Users,
  Sparkles,
  Camera,
  X,
  AlertTriangle,
} from 'lucide-react';

interface FamilyMemberFormItem {
  id: string;
  name: string;
  relation: string;
  avatarUrl?: string;
  isUploading?: boolean;
}

export const CaregiverSetupWizard: React.FC = () => {
  const {
    isCaregiverWizardOpen,
    setIsCaregiverWizardOpen,
    setMode,
    updateCustomFamilyMembers,
  } = useApp();

  const { user: authUser, appUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [loadingStatusText, setLoadingStatusText] = useState('Setting up your family profile...');
  // Backwards-compatible aliases
  const isSaving = isLoading;
  const setIsSaving = setIsLoading;

  // Step 1: Caregiver Personal Details (Name, DOB, Phone)
  const [caregiverName, setCaregiverName] = useState(appUser?.name || 'Dr. Priya Baruah');
  const [caregiverDob, setCaregiverDob] = useState('1986-08-14');
  const [caregiverPhone, setCaregiverPhone] = useState('+91 98640 12345');
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Patient's 6-Digit Code Verification
  const [patientCode, setPatientCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [linkedPatientId, setLinkedPatientId] = useState('demo-patient-koka');
  const [linkedPatientName, setLinkedPatientName] = useState('Bhaben Baruah (Koka)');
  const [step2Error, setStep2Error] = useState('');

  // Step 3: Caregiver's Relationship (Standard Text Box ONLY)
  const [relationship, setRelationship] = useState('Daughter');
  const [step3Error, setStep3Error] = useState('');

  // Step 4: Caregiver Photo & Family Circle
  const [caregiverAvatarUrl, setCaregiverAvatarUrl] = useState<string>(
    appUser?.avatar || 'https://images.unsplash.com/photo-1594824813589-989679c6d4ba?w=150&auto=format&fit=crop&q=80'
  );
  const [isUploadingCaregiverPhoto, setIsUploadingCaregiverPhoto] = useState(false);
  const [familyList, setFamilyList] = useState<FamilyMemberFormItem[]>([
    {
      id: 'fam-initial-1',
      name: 'Rahul Baruah',
      relation: 'Grandson',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'fam-initial-2',
      name: 'Ananya Baruah',
      relation: 'Granddaughter',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  ]);

  if (!isCaregiverWizardOpen) return null;

  // Step 1 Validation & Next
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caregiverName.trim()) {
      setStep1Error('Please enter your full name.');
      return;
    }
    if (!caregiverDob) {
      setStep1Error('Please enter your date of birth.');
      return;
    }
    if (!caregiverPhone.trim()) {
      setStep1Error('Please enter your phone number.');
      return;
    }

    soundFx.playClickSound();
    setStep1Error('');
    setCurrentStep(2);
  };

  // Step 2 Verification & Link
  const handleVerifyPatientCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = patientCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      soundFx.playClickSound();
      setStep2Error('Please enter a valid 6-digit connection code.');
      return;
    }

    soundFx.playClickSound();
    setIsVerifyingCode(true);
    setStep2Error('');

    const caregiverId = authUser?.id || appUser?.id || `caregiver-${Date.now()}`;
    const result = await verifyAndLinkPatient(caregiverId, cleanCode);

    setIsVerifyingCode(false);

    if (result.success) {
      soundFx.playSuccessChime();
      setVerifySuccess(true);
      setLinkedPatientId(result.patientId || 'patient-linked');
      setLinkedPatientName(result.patientName || 'Linked Patient');
    } else {
      soundFx.playClickSound();
      setStep2Error(result.error || 'Connection code did not match. (Try demo code: 849201)');
    }
  };

  const handleStep2Next = () => {
    if (!verifySuccess) {
      setStep2Error('Please verify the 6-digit connection code before continuing.');
      return;
    }
    soundFx.playClickSound();
    setStep2Error('');
    setCurrentStep(3);
  };

  // Step 3 Validation & Next
  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relationship.trim()) {
      setStep3Error('Please enter your relationship to the patient.');
      return;
    }

    soundFx.playClickSound();
    setStep3Error('');
    setCurrentStep(4);
  };

  // Step 4: Caregiver Photo Upload
  const handleCaregiverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClickSound();
    setIsUploadingCaregiverPhoto(true);

    const url = await uploadMediaFile(file, 'caregivers');
    setCaregiverAvatarUrl(url);
    setIsUploadingCaregiverPhoto(false);
  };

  // Step 4: Family Member Photo Upload
  const handleFamilyMemberPhotoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClickSound();
    setFamilyList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUploading: true } : item))
    );

    const url = await uploadMediaFile(file, 'family');

    setFamilyList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, avatarUrl: url, isUploading: false } : item
      )
    );
  };

  const handleAddFamilyMember = () => {
    soundFx.playClickSound();
    setFamilyList((prev) => [
      ...prev,
      {
        id: `fam-custom-${Date.now()}`,
        name: '',
        relation: '',
        avatarUrl: '',
      },
    ]);
  };

  const handleRemoveFamilyMember = (id: string) => {
    soundFx.playClickSound();
    setFamilyList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateFamilyMember = (id: string, field: 'name' | 'relation', val: string) => {
    setFamilyList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Final Step 4 Submission with Strict Error Handling
  const handleFinishWizard = async () => {
    soundFx.playClickSound();
    setIsLoading(true);
    setLoadingStatusText('Setting up your family profile...');
    setDbError(null);

    try {
      const caregiverId = authUser?.id || appUser?.id || `caregiver-${Date.now()}`;
      const cleanedFamily = familyList
        .filter((f) => f.name.trim().length > 0)
        .map((f) => ({
          name: f.name.trim(),
          relation: f.relation.trim() || 'Family Member',
          avatarUrl: f.avatarUrl,
        }));

      const caregiverPayload = {
        name: caregiverName.trim(),
        dob: caregiverDob,
        phone: caregiverPhone.trim(),
        relationship: relationship.trim(),
        avatarUrl: caregiverAvatarUrl,
      };

      setLoadingStatusText('Linking devices and family circle...');

      const result = await saveCaregiverWizardData(
        caregiverId,
        linkedPatientId,
        caregiverPayload,
        cleanedFamily
      );

      if (result.formattedFamily.length > 0) {
        updateCustomFamilyMembers(result.formattedFamily);
      }

      soundFx.playSuccessChime();
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
      });

      setIsCaregiverWizardOpen(false);
      setMode('caregiver');
    } catch (err: any) {
      console.error('[Caregiver Wizard] Database submission rejection:', err);
      const errorMessage =
        err?.message ||
        err?.error_description ||
        (typeof err === 'string' ? err : 'Database submission failed. Please verify your connection.');
      setDbError(errorMessage);
      soundFx.playClickSound();
    } finally {
      // Explicitly unlock button even if request fails
      setIsLoading(false);
    }
  };

  // Resilient Offline/Local Mode Fallback
  const handleProceedLocally = () => {
    soundFx.playSuccessChime();
    const avatarColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
    const cleanedFamily: FamilyMember[] = familyList
      .filter((f) => f.name.trim().length > 0)
      .map((f, index) => ({
        id: `fam-local-${Date.now()}-${index}`,
        name: f.name.trim(),
        relation: f.relation.trim() || 'Family Member',
        localRelation: `${f.relation.trim() || 'Family Member'} • Family Member`,
        age: 30,
        avatarColor: avatarColors[index % avatarColors.length],
        avatarIcon: 'user' as const,
        voiceMessage: `Pranam! Remember that our family is always with you. Keep smiling!`,
        lastSpokenDate: 'Recently added',
        funFact: `Loves spending time together with the family.`,
        avatarUrl: f.avatarUrl,
      }));

    if (cleanedFamily.length > 0) {
      updateCustomFamilyMembers(cleanedFamily);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_custom_family', JSON.stringify(cleanedFamily));
      localStorage.setItem(
        'smriti_caregiver_info',
        JSON.stringify({
          name: caregiverName.trim(),
          dob: caregiverDob,
          phone: caregiverPhone.trim(),
          relationship: relationship.trim(),
          avatarUrl: caregiverAvatarUrl,
        })
      );
      localStorage.setItem('smriti_user_role', 'caregiver');
      localStorage.setItem('smriti_is_paired', 'true');
      if (caregiverAvatarUrl) {
        localStorage.setItem('smriti_caregiver_avatar', caregiverAvatarUrl);
      }
    }

    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.6 },
    });

    setIsCaregiverWizardOpen(false);
    setMode('caregiver');
  };

  const steps = [
    { num: 1, label: 'Caregiver Info' },
    { num: 2, label: 'Link Patient' },
    { num: 3, label: 'Relationship' },
    { num: 4, label: 'Photos & Family' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="caregiver-wizard-title"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-stone-900 border-4 border-stone-200 dark:border-stone-700 rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 text-center relative flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playClickSound();
              setIsCaregiverWizardOpen(false);
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 id="caregiver-wizard-title" className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Caregiver Setup Wizard
          </h2>
          <p className="text-xs sm:text-sm font-bold text-teal-100 mt-0.5">
            Step {currentStep} of 4 • Set up your family profile, safety links & loving memories
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
                  currentStep === s.num
                    ? 'bg-white text-teal-900 shadow-md scale-105'
                    : currentStep > s.num
                    ? 'bg-white/40 text-white'
                    : 'bg-black/20 text-white/60'
                }`}
              >
                <span>{s.num}.</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1">
          {/* STEP 1: Caregiver Personal Details (Name, DOB, Phone) */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4 animate-slide-up">
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                  Caregiver Contact Information
                </h3>
                <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                  Please provide your contact details so the patient and clinic can reach you during geofence alerts.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                  Caregiver Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={caregiverName}
                    onChange={(e) => setCaregiverName(e.target.value)}
                    placeholder="e.g. Dr. Priya Baruah"
                    className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-teal-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                  />
                  <User className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={caregiverDob}
                    onChange={(e) => setCaregiverDob(e.target.value)}
                    className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-teal-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                  />
                  <Calendar className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                  Primary Phone Number (Emergency SMS & SOS Alerts) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={caregiverPhone}
                    onChange={(e) => setCaregiverPhone(e.target.value)}
                    placeholder="e.g. +91 98640 12345"
                    className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-teal-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                  />
                  <Phone className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                </div>
              </div>

              {step1Error && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center animate-shake">
                  {step1Error}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="duo-btn duo-btn-green w-full py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px]"
                >
                  <span>Continue to Step 2: Link Patient</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Patient 6-Digit Connection Code */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                  Enter Patient's 6-Digit Code
                </h3>
                <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                  Look at the patient's screen to find their 6-digit key and enter it below to pair your accounts.
                </p>
              </div>

              <form onSubmit={handleVerifyPatientCode} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={patientCode}
                      onChange={(e) => {
                        setPatientCode(e.target.value.replace(/\D/g, ''));
                        setVerifySuccess(false);
                        setStep2Error('');
                      }}
                      placeholder="849201"
                      className="w-full text-center tracking-[0.4em] font-black text-3xl sm:text-4xl py-4 px-4 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-teal-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none shadow-inner"
                      autoFocus
                    />
                    <KeyRound className="absolute right-4 top-5 w-6 h-6 text-stone-400 pointer-events-none" />
                  </div>

                  {step2Error && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-2 text-center animate-shake">
                      {step2Error}
                    </p>
                  )}

                  {verifySuccess && (
                    <div className="p-3.5 mt-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-black text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Successfully verified & linked to: {linkedPatientName}</span>
                    </div>
                  )}
                </div>

                {/* Auto-Fill Demo Code Helper */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    💡 Demo Patient Code: <span className="font-black font-mono">849201</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClickSound();
                      setPatientCode('849201');
                      setStep2Error('');
                    }}
                    className="text-amber-800 dark:text-amber-300 underline font-black cursor-pointer hover:text-amber-950"
                  >
                    Auto-Fill
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClickSound();
                      setCurrentStep(1);
                    }}
                    className="duo-btn duo-btn-white py-3.5 px-4 font-black flex items-center gap-1.5 min-h-[56px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  {!verifySuccess ? (
                    <button
                      type="submit"
                      disabled={isVerifyingCode}
                      className="duo-btn duo-btn-green flex-1 py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px] disabled:opacity-50"
                    >
                      {isVerifyingCode ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Linking patient device...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Verify & Link Code</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStep2Next}
                      className="duo-btn duo-btn-green flex-1 py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px]"
                    >
                      <span>Continue to Step 3: Relationship</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Relationship to Patient (Standard Text Box ONLY) */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Next} className="space-y-4 animate-slide-up">
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                  Your Relationship to Patient
                </h3>
                <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                  Enter how you are related to {linkedPatientName} (used in voice prompts and reminiscence games).
                </p>
              </div>

              {/* Standard TEXT BOX (Explicitly NO DROPDOWN) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                  Relationship (Text Box) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Daughter, Grandson, Primary Nurse, Eldest Son..."
                    className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-teal-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                    autoFocus
                  />
                  <HeartHandshake className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                </div>
              </div>

              {step3Error && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center animate-shake">
                  {step3Error}
                </p>
              )}

              {/* Suggestions chips */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-stone-400">Quick suggestions:</span>
                <div className="flex flex-wrap gap-2">
                  {['Daughter', 'Son', 'Granddaughter', 'Grandson', 'Wife', 'Husband', 'Primary Care Nurse'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        soundFx.playClickSound();
                        setRelationship(sug);
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-teal-950 border border-stone-300 dark:border-stone-700 cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setCurrentStep(2);
                  }}
                  className="duo-btn duo-btn-white py-3.5 px-4 font-black flex items-center gap-1.5 min-h-[56px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="duo-btn duo-btn-green flex-1 py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px]"
                >
                  <span>Continue to Step 4: Photos & Family</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Caregiver Photo & Initial Family Members (Media Storage Upload) */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                  Caregiver Photo & Family Circle
                </h3>
                <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                  Upload your caregiver avatar and add initial family members to populate Koka's Reminiscence Vault.
                </p>
              </div>

              {/* Part A: Caregiver Profile Photo */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border-2 border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={caregiverAvatarUrl}
                      alt={caregiverName}
                      className="w-16 h-16 rounded-2xl object-cover border-3 border-teal-600 shadow-md bg-stone-200"
                    />
                    {isUploadingCaregiverPhoto && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-stone-900 dark:text-white truncate">
                      Your Profile Photo ({caregiverName})
                    </h4>
                    <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                      Warmly displayed to your loved one during morning check-ins and video calls
                    </p>

                    <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-xs active:scale-95 transition-all">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingCaregiverPhoto ? 'Uploading photo...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCaregiverPhotoUpload}
                        disabled={isUploadingCaregiverPhoto}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Part B: Dynamic Initial Family Members */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <h4 className="text-base font-black text-stone-900 dark:text-white">
                      Initial Family Members ({familyList.length})
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFamilyMember}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-teal-950 border border-stone-300 dark:border-stone-700 text-xs font-black text-stone-800 dark:text-stone-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {familyList.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border-2 border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center gap-3"
                    >
                      {/* Member Photo */}
                      <div className="relative flex-shrink-0">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name || 'Member'}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-teal-500 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        {member.isUploading && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-white">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Inputs: Name & Relation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleUpdateFamilyMember(member.id, 'name', e.target.value)}
                          placeholder="Member Name"
                          className="text-xs font-bold py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white outline-none"
                        />
                        <input
                          type="text"
                          value={member.relation}
                          onChange={(e) => handleUpdateFamilyMember(member.id, 'relation', e.target.value)}
                          placeholder="Relationship (e.g. Grandson)"
                          className="text-xs font-bold py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white outline-none"
                        />
                      </div>

                      {/* Upload and Remove Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                        <label className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer" title="Upload Photo">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFamilyMemberPhotoUpload(member.id, e)}
                            disabled={member.isUploading}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveFamilyMember(member.id)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visible Database Rejection Error Banner */}
              {dbError && (
                <div
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-3 border-rose-500 text-rose-900 dark:text-rose-100 shadow-xl animate-shake space-y-2.5"
                  role="alert"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100">
                          Database Submission Error
                        </h4>
                        <button
                          type="button"
                          onClick={() => setDbError(null)}
                          className="text-rose-500 hover:text-rose-800 dark:hover:text-white p-1 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900/50 cursor-pointer"
                          aria-label="Dismiss error"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs font-mono font-bold mt-2 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-800 break-words text-rose-700 dark:text-rose-300 select-all">
                        {dbError}
                      </p>
                      {(dbError.includes('schema cache') || dbError.includes('profiles')) && (
                        <div className="mt-2 text-xs text-rose-800 dark:text-rose-200 bg-rose-100/70 dark:bg-rose-900/50 p-3 rounded-xl border border-rose-300 dark:border-rose-800 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <span>📌</span>
                            <span>Why this happens:</span>
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            The table <code className="font-mono font-bold bg-rose-200 dark:bg-rose-800 px-1 py-0.5 rounded">public.profiles</code> has not yet been created in your Supabase project.
                            To enable full cloud sync, copy and run <code className="font-mono font-bold bg-rose-200 dark:bg-rose-800 px-1 py-0.5 rounded">supabase/schema.sql</code> in your <strong>Supabase Dashboard &rarr; SQL Editor</strong>.
                          </p>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleProceedLocally}
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Continue in Local Mode (Save Offline)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          or adjust inputs and retry
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setCurrentStep(3);
                  }}
                  className="duo-btn duo-btn-white py-3.5 px-4 font-black flex items-center gap-1.5 min-h-[56px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishWizard}
                  disabled={isLoading}
                  className="duo-btn duo-btn-green flex-1 py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{loadingStatusText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Save Profile & Launch Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
