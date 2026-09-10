import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { soundFx } from './utils/audio';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { FamilyVault } from './components/patient/reminiscence/FamilyVault';
import { GamesHub } from './components/patient/games/GamesHub';
import { RoutineTimeline } from './components/patient/routine/RoutineTimeline';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { Login } from './components/auth/Login';
import { UserManualModal } from './components/common/UserManualModal';
import { RegionSelectModal } from './components/common/RegionSelectModal';
import { SpotlightTour } from './components/common/SpotlightTour';
import { RoleSelectionModal } from './components/auth/RoleSelectionModal';
import { PinLockModal } from './components/auth/PinLockModal';
import { ProfileSettingsModal } from './components/common/ProfileSettingsModal';
import { CaregiverSetupWizard } from './components/caregiver/CaregiverSetupWizard';
import { HeartHandshake } from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    mode, 
    setMode, 
    patientTab, 
    currentRoute, 
    isLoggedIn,
    authLoading,
    isPinModalOpen, 
    setIsPinModalOpen,
    isProfileSettingsOpen,
    setIsProfileSettingsOpen,
    isPatientWaitingForCaregiver,
    setIsRoleModalOpen,
  } = useApp();

  // Page Visibility API: Stop all speech & audio immediately on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        soundFx.stopAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Ensure Patient screen stays locked in standby mode if waiting for caregiver pairing
  useEffect(() => {
    if (isLoggedIn && isPatientWaitingForCaregiver) {
      setIsRoleModalOpen(true);
    }
  }, [isLoggedIn, isPatientWaitingForCaregiver, setIsRoleModalOpen]);

  // Smooth startup authentication loading splash (prevents flash of login screen)
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#1C1917] text-stone-900 dark:text-stone-100">
        <div className="w-16 h-16 rounded-3xl bg-brand-green border-3 border-brand-green-dark flex items-center justify-center text-white shadow-duo-green animate-pulse mb-3">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-white">SANJIVNI</h2>
        <p className="text-xs font-bold text-stone-400 mt-1">Verifying session...</p>
      </div>
    );
  }

  return (
    <>
      {/* Global Modals, Security PIN Pad & Coach-Mark Walkthrough */}
      <UserManualModal />
      <RegionSelectModal />
      <SpotlightTour />
      <RoleSelectionModal />
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
      <CaregiverSetupWizard />
      <PinLockModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setMode('caregiver');
        }}
      />

      {/* Route Protection: Unauthenticated or 'login' route -> Login page */}
      {!isLoggedIn || currentRoute === 'login' ? (
        <Login />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#1C1917] text-stone-900 dark:text-stone-100 transition-colors duration-200">
          {/* Responsive Header with Desktop Tabs & Profile Dropdown */}
          <Header />

          {/* Main Container: Full desktop max-w-5xl, clean mobile padding */}
          <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 py-4 sm:px-6 sm:py-6 pb-20 md:pb-10">
            {mode === 'patient' ? (
              <>
                {patientTab === 'reminisce' && <FamilyVault />}
                {patientTab === 'games' && <GamesHub />}
                {patientTab === 'routine' && <RoutineTimeline />}
              </>
            ) : (
              /* Caregiver Portal */
              <CaregiverDashboard />
            )}
          </main>

          {/* Mobile-Only Bottom Navigation (md:hidden) */}
          {mode === 'patient' && <BottomNav />}
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
