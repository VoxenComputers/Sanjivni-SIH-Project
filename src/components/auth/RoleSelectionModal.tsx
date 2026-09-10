import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audio';
import { 
  createPatientProfile, 
  checkPatientPairingStatus, 
  verifyAndLinkPatient 
} from '../../lib/supabaseDb';
import confetti from 'canvas-confetti';
import { 
  HeartHandshake, 
  ShieldCheck, 
  User, 
  Copy, 
  Check, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  X,
  Calendar,
  Radio,
  Loader2,
  RefreshCw,
  Sparkles,
  Phone
} from 'lucide-react';

export const RoleSelectionModal: React.FC = () => {
  const { 
    isRoleModalOpen, 
    setIsRoleModalOpen, 
    userRole, 
    connectionCode, 
    selectRole,
    setIsCaregiverWizardOpen,
    setIsPatientWaitingForCaregiver,
  } = useApp();

  const { user: authUser, appUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'patient' | 'caregiver' | null>(userRole || null);
  
  // Patient Minimalist Form state (3 Fields: Name, DOB, Phone)
  const [username, setUsername] = useState(appUser?.name || 'Koka Bhaben');
  const [dob, setDob] = useState('1948-04-12');
  const [phone, setPhone] = useState('+91 98640 12345');
  const [patientCode, setPatientCode] = useState(connectionCode || '849201');
  const [patientRegistered, setPatientRegistered] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('smriti_patient_profile');
    }
    return false;
  });
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [isWaitingForCaregiver, setIsWaitingForCaregiver] = useState(false);
  const [isPollingPairing, setIsPollingPairing] = useState(false);
  const [pairingUnlocked, setPairingUnlocked] = useState(false);

  // Caregiver form state
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [pairError, setPairError] = useState('');
  const [pairSuccess, setPairSuccess] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Polling effect when Patient is in "Waiting for Caregiver" locked state
  useEffect(() => {
    if (!isWaitingForCaregiver || pairingUnlocked) return;

    const interval = setInterval(async () => {
      const userId = authUser?.id || appUser?.id || 'demo-patient';
      const status = await checkPatientPairingStatus(userId, patientCode);
      if (status.isPaired) {
        handleCaregiverLinkedSuccess();
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isWaitingForCaregiver, pairingUnlocked, patientCode, authUser, appUser]);

  if (!isRoleModalOpen) return null;

  const handleCopyCode = () => {
    soundFx.playClickSound();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(patientCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePatientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setPatientError('Please enter your preferred name or username.');
      return;
    }
    if (!dob) {
      setPatientError('Please enter your date of birth.');
      return;
    }
    if (!phone.trim()) {
      setPatientError('Please enter your phone number.');
      return;
    }

    soundFx.playClickSound();
    setIsSubmittingPatient(true);
    setPatientError('');

    // Generate random 6-digit connection code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPatientCode(newCode);

    const userId = authUser?.id || appUser?.id || `patient-${Date.now()}`;
    await createPatientProfile(userId, username, dob, phone, newCode);

    setIsSubmittingPatient(false);
    setPatientRegistered(true);
    setIsWaitingForCaregiver(true);
    setIsPatientWaitingForCaregiver(true);
    selectRole('patient', newCode);
    soundFx.playSuccessChime();
  };

  const handleManualPairCheck = async () => {
    soundFx.playClickSound();
    setIsPollingPairing(true);
    const userId = authUser?.id || appUser?.id || 'demo-patient';
    const status = await checkPatientPairingStatus(userId, patientCode);
    setIsPollingPairing(false);

    if (status.isPaired) {
      handleCaregiverLinkedSuccess();
    }
  };

  const handleCaregiverLinkedSuccess = () => {
    setPairingUnlocked(true);
    soundFx.playSuccessChime();
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setIsWaitingForCaregiver(false);
      setIsPatientWaitingForCaregiver(false);
      setIsRoleModalOpen(false);
    }, 1400);
  };

  const handleCaregiverPair = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      soundFx.playClickSound();
      setPairError('Please enter a valid 6-digit connection code.');
      return;
    }

    soundFx.playClickSound();
    setIsVerifyingCode(true);
    setPairError('');

    const caregiverId = authUser?.id || appUser?.id || `caregiver-${Date.now()}`;
    const result = await verifyAndLinkPatient(caregiverId, cleanCode);

    setIsVerifyingCode(false);

    if (result.success) {
      soundFx.playSuccessChime();
      setPairSuccess(true);
      selectRole('caregiver', cleanCode);

      setTimeout(() => {
        setIsRoleModalOpen(false);
        // Launch Caregiver Setup Wizard immediately
        setIsCaregiverWizardOpen(true);
      }, 900);
    } else {
      soundFx.playClickSound();
      setPairError(result.error || 'Connection code did not match. (Try demo code: 849201)');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-stone-900 border-4 border-stone-200 dark:border-stone-700 rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 text-center relative flex-shrink-0">
          {userRole && !isWaitingForCaregiver && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setIsRoleModalOpen(false);
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white shadow-inner">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 id="role-selection-title" className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Welcome to SANJIVNI
          </h2>
          <p className="text-xs sm:text-sm font-bold text-emerald-100 mt-1">
            Choose your role to customize your care circle experience
          </p>
        </div>

        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Two Role Options */}
          {!selectedRole && (
            <div className="space-y-4">
              <p className="text-center font-extrabold text-stone-600 dark:text-stone-300 text-sm sm:text-base">
                How will you be using this device today?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Patient */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedRole('patient');
                  }}
                  className="duo-card p-6 flex flex-col items-center text-center gap-3 bg-stone-50 dark:bg-stone-800 border-3 border-stone-200 dark:border-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-3xl cursor-pointer group transition-all active:scale-98 min-h-[220px] justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white">
                      I am a Patient
                    </h3>
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      For elderly seniors (Koka / Aita). Enjoy family memories, play memory games, and check daily routines.
                    </p>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-black text-emerald-800 dark:text-emerald-300">
                    <span>Select Patient</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Option 2: Caregiver */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setIsRoleModalOpen(false);
                    setIsCaregiverWizardOpen(true);
                  }}
                  className="duo-card p-6 flex flex-col items-center text-center gap-3 bg-stone-50 dark:bg-stone-800 border-3 border-stone-200 dark:border-stone-700 hover:border-teal-600 dark:hover:border-teal-500 rounded-3xl cursor-pointer group transition-all active:scale-98 min-h-[220px] justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white">
                      I am a Caregiver
                    </h3>
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      For family members or doctors. Monitor safe geofencing, manage medicine reminders, and setup family photos.
                    </p>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-black text-teal-800 dark:text-teal-300">
                    <span>Start Caregiver Wizard</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2A: Patient Flow */}
          {selectedRole === 'patient' && (
            <div className="space-y-5 animate-slide-up">
              {/* Back navigation only if not locked in waiting state */}
              {!isWaitingForCaregiver && (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClickSound();
                      setSelectedRole(null);
                      setPatientError('');
                    }}
                    className="text-xs font-black text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                  >
                    ← Back to role selection
                  </button>
                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-black px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                    Patient Setup
                  </span>
                </div>
              )}

              {/* Sub-flow A1: Minimalist Patient Registration Form (3 Fields: Name, DOB, Phone) */}
              {!patientRegistered && !isWaitingForCaregiver ? (
                <form onSubmit={handlePatientFormSubmit} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                      Patient Details
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                      Quick 10-second setup to create your personal connection key.
                    </p>
                  </div>

                  {/* Username / Name Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                      Patient Name / Preferred Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. Koka Bhaben or Baruah Deuta"
                        className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-brand-green bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                      />
                      <User className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                    </div>
                  </div>

                  {/* Date of Birth Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-brand-green bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                      />
                      <Calendar className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-300">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98640 12345"
                        className="w-full text-base font-bold py-3.5 px-4 pl-11 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-brand-green bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                      />
                      <Phone className="absolute left-3.5 top-4 w-5 h-5 text-stone-400" />
                    </div>
                  </div>

                  {patientError && (
                    <p className="text-xs font-bold text-rose-600 text-center animate-shake">
                      {patientError}
                    </p>
                  )}

                  <p className="text-[11px] font-bold text-stone-400 text-center pt-1">
                    Photo, medical details, and family recordings can be configured by your caregiver or edited later in Profile Settings.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmittingPatient}
                    className="duo-btn duo-btn-green w-full py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px] disabled:opacity-50"
                  >
                    {isSubmittingPatient ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating Connection Key...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Key & Continue</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Sub-flow A2: Locked "Waiting for Caregiver" Screen with Massive 6-Digit Code */
                <div className="space-y-5 animate-slide-up">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-black animate-pulse">
                      <Radio className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>Waiting for Caregiver to Link Device</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
                      Your Connection Code
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                      Show this 6-digit key to your daughter, son, or caregiver. Once they enter it on their device, your dashboard will instantly unlock!
                    </p>
                  </div>

                  {/* Massive 6-Digit Display */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border-4 border-emerald-500 rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-duo-green">
                    <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                      Secure Pairing Key (Unique to {username})
                    </span>

                    <div className="flex items-center justify-center gap-2 sm:gap-3.5">
                      {patientCode.split('').map((digit, i) => (
                        <div
                          key={i}
                          className="w-12 h-16 sm:w-16 sm:h-20 rounded-2xl bg-white dark:bg-stone-900 border-3 border-emerald-600 dark:border-emerald-400 flex items-center justify-center text-3xl sm:text-5xl font-black text-emerald-800 dark:text-emerald-200 shadow-duo-green select-all"
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border-2 border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs font-black shadow-xs hover:bg-emerald-50 cursor-pointer active:scale-95 transition-all"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied Key!' : 'Copy Code'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleManualPairCheck}
                        disabled={isPollingPairing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isPollingPairing ? 'animate-spin' : ''}`} />
                        <span>Check Status</span>
                      </button>
                    </div>
                  </div>

                  {pairingUnlocked && (
                    <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-500 text-emerald-900 font-black text-sm text-center animate-bounce">
                      🎉 Caregiver linked! Unlocking your memories and routines...
                    </div>
                  )}

                  {/* Locked Notice */}
                  <div className="text-center p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/80 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    🔒 Screen locked in standby mode. Keep this page open while your caregiver finishes pairing.
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClickSound();
                        setIsWaitingForCaregiver(false);
                        setIsPatientWaitingForCaregiver(false);
                        setIsRoleModalOpen(false);
                      }}
                      className="text-xs font-black text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                    >
                      Continue to Dashboard (Pair later in Profile Settings)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2B: Caregiver Flow - Enter 6-Digit Code */}
          {selectedRole === 'caregiver' && (
            <div className="space-y-5 animate-slide-up">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickSound();
                    setSelectedRole(null);
                    setPairError('');
                  }}
                  className="text-xs font-black text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  ← Back to role selection
                </button>
                <span className="bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200 text-xs font-black px-3 py-1 rounded-full border border-teal-300 dark:border-teal-800">
                  Caregiver Link
                </span>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                  Enter Patient's Connection Code
                </h3>
                <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                  Type the 6-digit number displayed on the patient's device to securely link their safety telemetry and launch the Caregiver Setup Wizard.
                </p>
              </div>

              <form onSubmit={handleCaregiverPair} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.replace(/\D/g, ''));
                        setPairError('');
                      }}
                      placeholder="e.g. 849201"
                      className="w-full text-center tracking-[0.4em] font-black text-2xl sm:text-4xl py-4 px-4 rounded-2xl border-3 border-stone-300 dark:border-stone-700 focus:border-teal-600 dark:focus:border-teal-400 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white outline-none shadow-inner"
                      autoFocus
                    />
                    <KeyRound className="absolute right-4 top-5 w-6 h-6 text-stone-400 pointer-events-none" />
                  </div>

                  {pairError && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-2 text-center animate-shake">
                      {pairError}
                    </p>
                  )}

                  {pairSuccess && (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 mt-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Account linked! Launching Caregiver Setup Wizard...</span>
                    </div>
                  )}
                </div>

                {/* Demo Helper Pill */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    💡 Demo Patient Code: <span className="font-black font-mono">849201</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClickSound();
                      setInputCode('849201');
                      setPairError('');
                    }}
                    className="text-amber-800 dark:text-amber-300 underline font-black cursor-pointer hover:text-amber-950"
                  >
                    Auto-Fill
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingCode}
                  className="duo-btn duo-btn-green w-full py-3.5 px-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-duo-green cursor-pointer min-h-[56px] disabled:opacity-50"
                >
                  {isVerifyingCode ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Link Patient & Start Setup Wizard</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
