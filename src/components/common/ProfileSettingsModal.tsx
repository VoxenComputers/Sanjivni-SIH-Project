import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_NER_REGIONS } from '../../utils/nerData';
import { soundFx } from '../../utils/audio';
import { deleteUserProfile } from '../../lib/supabaseDb';
import {
  X,
  MapPin,
  ShieldCheck,
  LogOut,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Sparkles,
  Bot,
  Key,
  ExternalLink,
} from 'lucide-react';
import {
  getGeminiApiKey,
  setCustomGeminiApiKey,
  testGeminiConnection,
  isGeminiConfigured,
} from '../../services/geminiConfig';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    user,
    userRole,
    connectionCode,
    isPaired,
    selectedRegion,
    setRegionModalOpen,
    logout,
  } = useApp();

  const { user: authUser } = useAuth();

  const [copied, setCopied] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveGeminiKey = () => {
    soundFx.playClickSound();
    setCustomGeminiApiKey(geminiKeyInput);
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2500);
  };

  const handleTestGemini = async () => {
    soundFx.playClickSound();
    setIsTestingGemini(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(geminiKeyInput);
      setTestResult(res);
      if (res.success) {
        soundFx.playSuccessChime();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  if (!isOpen) return null;

  const currentRegionObj =
    OFFICIAL_NER_REGIONS.find((r) => r.id === selectedRegion) || OFFICIAL_NER_REGIONS[1];

  const handleCopyCode = () => {
    soundFx.playClickSound();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenRegionSelector = () => {
    soundFx.playClickSound();
    onClose();
    setRegionModalOpen(true);
  };

  const handleLogout = () => {
    soundFx.playClickSound();
    onClose();
    logout();
  };

  const handleDeleteAccount = async () => {
    soundFx.playClickSound();
    setIsDeleting(true);

    const userId = authUser?.id || (user as any)?.id || 'current-user';
    await deleteUserProfile(userId);

    setIsDeleting(false);
    setIsConfirmingDelete(false);
    onClose();
    logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 border-4 border-stone-200 dark:border-stone-700 rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 id="profile-settings-title" className="text-xl sm:text-2xl font-black tracking-tight">
                Profile & Settings
              </h2>
              <p className="text-xs font-bold text-emerald-100">
                {userRole === 'caregiver' ? 'Caregiver Account' : 'Patient Account'} • SANJIVNI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Region Profile */}
          <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-4 border-2 border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-300 dark:border-amber-800">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900 dark:text-white">Regional Profile</h4>
                  <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    Cultural landmarks & dialect cues
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                {currentRegionObj.name} ({currentRegionObj.nativeScript})
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenRegionSelector}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700/80 border-2 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-xs font-black transition-all cursor-pointer"
            >
              <span>Change Regional State (8 NER States)</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Section 2: Device Pairing Status */}
          <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-4 border-2 border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-300 dark:border-teal-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900 dark:text-white">Device Pairing</h4>
                  <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    Encrypted family connection key
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  isPaired
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isPaired ? '🟢 Paired' : '🟡 Waiting for Link'}
              </span>
            </div>

            {/* Connection Code Display */}
            <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-3 rounded-xl border-2 border-stone-200 dark:border-stone-700">
              <div>
                <p className="text-[10px] font-black uppercase text-stone-400">Connection Code</p>
                <p className="text-xl font-black font-mono tracking-widest text-stone-900 dark:text-stone-100">
                  {connectionCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="duo-btn duo-btn-white py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 border-2 border-stone-300 dark:border-stone-600 shadow-xs cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section 2.5: Google Gemini AI Cloud & Vercel Sync */}
          <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-4 border-2 border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center justify-center border border-indigo-300 dark:border-indigo-800">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900 dark:text-white">Google Gemini AI Engine</h4>
                  <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    Vercel & localhost connectivity
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  isGeminiConfigured()
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isGeminiConfigured() ? '🟢 Active Key' : '🟡 Fallback Engine'}
              </span>
            </div>

            {/* API Key Input Field */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-black text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-400" />
                <span>Gemini API Key (Google AI Studio)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Paste AIzaSy... or AQ.Ab8... key"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveGeminiKey}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
                >
                  {isKeySaved ? 'Saved!' : 'Save Key'}
                </button>
              </div>
              <p className="text-[10px] text-stone-400 font-bold leading-tight">
                For permanent Vercel deployment: Set <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-stone-800 dark:text-stone-200 font-mono">VITE_GEMINI_API_KEY</code> in Vercel Project Settings &gt; Environment Variables, then Redeploy.
              </p>
            </div>

            {/* Diagnostic Ping Test */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={isTestingGemini}
                className="w-full py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingGemini ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Pinging Google Gemini API...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Test Gemini API Connection Now</span>
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`mt-2 p-2.5 rounded-xl border text-[11px] font-bold ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Log Out Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              <LogOut className="w-4 h-4 text-stone-500" />
              <span>Log Out of SANJIVNI</span>
            </button>
          </div>

          {/* Section 4: Delete Account Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setIsConfirmingDelete(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-rose-400 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account & Data</span>
            </button>
          </div>
        </div>

        {/* Strict Delete Account Confirmation Modal Overlay */}
        {isConfirmingDelete && (
          <div
            className="absolute inset-0 z-20 bg-stone-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center animate-fade-in"
            role="alertdialog"
            aria-labelledby="confirm-delete-title"
          >
            <div className="w-16 h-16 rounded-3xl bg-rose-600 border-3 border-rose-800 flex items-center justify-center text-white shadow-duo-red mb-3">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 id="confirm-delete-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Permanently Delete Account?
            </h3>

            <p className="text-xs sm:text-sm font-bold text-stone-300 mt-2 max-w-sm leading-relaxed">
              This action is strictly irreversible. All your stored daily routines, family reminiscence audio recordings, and pairing history will be permanently erased.
            </p>

            <div className="mt-6 w-full max-w-xs space-y-2.5">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:translate-y-0.5 text-white font-black text-sm shadow-duo-red cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Profile...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClickSound();
                  setIsConfirmingDelete(false);
                }}
                disabled={isDeleting}
                className="w-full py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-xs cursor-pointer border border-stone-700"
              >
                Cancel, Keep My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
