import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/audio';
import { AlertTriangle, PhoneCall, Navigation, MessageSquare, ShieldAlert, X } from 'lucide-react';

export const SOSAlertModal: React.FC = () => {
  const { geofence, dismissSOS, patient } = useApp();

  // Continuous siren audio loop while SOS is active
  useEffect(() => {
    if (geofence.sosActive) {
      soundFx.startSiren();
    }
    return () => {
      soundFx.stopSiren();
    };
  }, [geofence.sosActive]);

  if (!geofence.sosActive) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-red-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border-4 border-brand-crimson rounded-3xl overflow-hidden shadow-2xl animate-tactile-bounce">
        {/* Flashing Emergency Header Banner */}
        <div className="bg-brand-crimson text-white px-6 py-5 flex items-center justify-between border-b-4 border-brand-crimson-dark">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Emergency Geofence Breach
              </span>
              <h2 id="sos-title" className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                PATIENT WANDERING DETECTED!
              </h2>
            </div>
          </div>

          <button
            onClick={dismissSOS}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            title="Dismiss Alert"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Simulated SMS Broadcast Card */}
          <div className="bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 rounded-2xl p-4 sm:p-5 relative">
            <div className="flex items-center gap-2 mb-2 text-stone-700 dark:text-stone-200 font-extrabold text-sm">
              <MessageSquare className="w-5 h-5 text-brand-green dark:text-emerald-400" />
              <span>Simulated Emergency SMS Dispatched</span>
              <span className="ml-auto bg-green-100 dark:bg-emerald-950 text-brand-green dark:text-emerald-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-green-300 dark:border-emerald-800">
                SENT • DELIVERED
              </span>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 text-stone-900 dark:text-stone-100 font-bold text-base leading-relaxed">
              <p className="text-red-700 dark:text-rose-400 font-black mb-1">
                ⚠️ [SANJIVNI-ALERT]: Patient {patient.name} ({patient.honorific}) has exited safe zone!
              </p>
              <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200">
                <strong>Time:</strong> {geofence.alertPayload?.timestamp || 'Just now'} <br />
                <strong>Last Known Location:</strong> {geofence.currentLocation.currentAddress} <br />
                <strong>GPS Coordinates:</strong> {geofence.currentLocation.lat}° N, {geofence.currentLocation.lng}° E <br />
                <strong>Device Battery:</strong> {geofence.currentLocation.batteryLevel}% (Wearable Watch Online)
              </p>
            </div>
          </div>

          {/* Quick Action Dial Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => alert(`Dialing Patient's Smartwatch Speaker at Beltola...`)}
              className="duo-btn duo-btn-green flex-col py-3 px-2 min-h-[72px]"
            >
              <PhoneCall className="w-6 h-6" />
              <span className="text-sm font-black">Call Smartwatch</span>
            </button>

            <button
              onClick={() => alert(`Opening Live Turn-by-Turn GPS tracking to 26.1592° N, 91.8015° E (Six Mile Flyover)...`)}
              className="duo-btn duo-btn-amber flex-col py-3 px-2 min-h-[72px]"
            >
              <Navigation className="w-6 h-6" />
              <span className="text-sm font-black">Navigate to GPS</span>
            </button>

            <button
              onClick={() => alert(`Calling Dispur Police Emergency Station (+91 361 2261357)...`)}
              className="duo-btn duo-btn-crimson flex-col py-3 px-2 min-h-[72px]"
            >
              <ShieldAlert className="w-6 h-6" />
              <span className="text-sm font-black">Alert Police / 112</span>
            </button>
          </div>

            {/* Caregiver Dismiss & Acknowledge */}
            <div className="pt-2 flex items-center justify-between gap-4 border-t-2 border-stone-200 dark:border-stone-700">
              <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300">
                Continuous siren active. Click Acknowledge Alert to silence the alarm.
              </p>
              <button
                onClick={dismissSOS}
                className="duo-btn duo-btn-crimson dark:bg-rose-700 px-6 py-2.5 min-h-[50px] text-base font-black flex-shrink-0 shadow-duo-crimson cursor-pointer"
              >
                <span>Acknowledge Alert</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
