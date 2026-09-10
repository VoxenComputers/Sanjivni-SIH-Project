import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, AlertOctagon, MapPin, Radio, Battery, Compass, Navigation, RefreshCw } from 'lucide-react';

export const GeofencingMap: React.FC = () => {
  const { geofence, toggleWanderingSimulation, patient, requestLocationAccess, isLocationLoading } = useApp();

  // Coordinates on our SVG map coordinate space (0-600 x, 0-400 y)
  // Safe zone center: x: 300, y: 220, radius: 100
  // When safe: patient at (300, 220)
  // When wandering: patient moves to (460, 110) outside the circle
  const patientX = geofence.isSimulatingWandering ? 470 : 300;
  const patientY = geofence.isSimulatingWandering ? 100 : 220;

  return (
    <div className="duo-card p-5 sm:p-6 space-y-5 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700">
      {/* Top Map Status & Wandering Simulator Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider border ${
                geofence.isSafe
                  ? 'bg-green-100 dark:bg-emerald-950 text-brand-green-dark dark:text-emerald-300 border-green-300 dark:border-emerald-800'
                  : 'bg-red-100 dark:bg-rose-950 text-red-800 dark:text-rose-200 border-red-400 dark:border-rose-700 animate-pulse'
              }`}
            >
              <Radio className="w-4 h-4" />
              {geofence.isSafe ? 'Patient Within Safe Zone' : 'BREACH DETECTED: Outside Safe Zone'}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-brand-dark dark:text-white tracking-tight mt-1">
            Live Geofencing & GPS Telemetry
          </h3>
          <p className="text-sm sm:text-base font-bold text-stone-600 dark:text-stone-300">
            500m Safe Zone configured around {patient.name}'s Beltola residence
          </p>
        </div>

        {/* The Mandatory Hackathon Simulation Toggle */}
        <button
          onClick={toggleWanderingSimulation}
          className={`duo-btn text-lg sm:text-xl font-black px-6 py-3 min-h-[58px] transition-all w-full sm:w-auto flex-shrink-0 ${
            geofence.isSimulatingWandering
              ? 'duo-btn-green'
              : 'duo-btn-crimson'
          }`}
          aria-pressed={geofence.isSimulatingWandering}
        >
          {geofence.isSimulatingWandering ? (
            <>
              <ShieldCheck className="w-6 h-6" />
              <span>Reset to Safe Zone</span>
            </>
          ) : (
            <>
              <AlertOctagon className="w-6 h-6" />
              <span>Simulate Patient Wandering</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Vector Map Canvas */}
      <div className="relative w-full h-[300px] sm:h-[420px] rounded-3xl overflow-hidden border-3 border-stone-300 bg-[#E8EDE5] shadow-inner select-none">
        {/* SVG Map of Guwahati Roads, River & Safe Zone */}
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full object-cover"
          aria-label="Map of Beltola Guwahati Safe Zone"
        >
          {/* Map Grid / Land Background */}
          <rect width="600" height="400" fill="#EDF3E8" />

          {/* Brahmaputra river bend indicator (North-West) */}
          <path
            d="M -20 50 Q 150 70 300 40 T 620 20 L 620 -20 L -20 -20 Z"
            fill="#BAE6FD"
            opacity="0.8"
          />
          <text x="70" y="32" fill="#0369A1" fontSize="12" fontWeight="bold">
            Brahmaputra River (North)
          </text>

          {/* Road Network Lines */}
          {/* GS Road Arterial */}
          <path
            d="M 120 420 L 320 230 L 520 80"
            stroke="#CBD5E1"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 120 420 L 320 230 L 520 80"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Beltola Tiniali Road */}
          <path
            d="M 200 120 L 300 220 L 420 380"
            stroke="#E2E8F0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 200 120 L 300 220 L 420 380"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Road labels */}
          <text x="210" y="330" fill="#64748B" fontSize="11" fontWeight="800">
            Beltola Tiniali Road
          </text>
          <text x="410" y="160" fill="#64748B" fontSize="11" fontWeight="800">
            GS Road to Six Mile
          </text>

          {/* Landmark Pins */}
          {/* Dispur Capital Complex */}
          <circle cx="210" cy="170" r="4" fill="#64748B" />
          <text x="220" y="174" fill="#475569" fontSize="10" fontWeight="bold">
            Dispur Secretariat
          </text>

          {/* Six Mile Flyover */}
          <circle cx="490" cy="110" r="4" fill="#64748B" />
          <text x="495" y="105" fill="#475569" fontSize="10" fontWeight="bold">
            Six Mile Flyover
          </text>

          {/* Safe Zone Circle (500m radius around Beltola Home) */}
          <circle
            cx="300"
            cy="220"
            r="95"
            fill={geofence.isSafe ? '#22C55E25' : '#EF444420'}
            stroke={geofence.isSafe ? '#16A34A' : '#DC2626'}
            strokeWidth="3"
            strokeDasharray={geofence.isSafe ? 'none' : '6,4'}
          />

          {/* Safe Zone Label Tag */}
          <rect x="230" y="275" width="140" height="24" rx="12" fill="#15803D" />
          <text x="300" y="291" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
            500m Safe Zone Boundary
          </text>

          {/* Residence Home Center Marker */}
          <circle cx="300" cy="220" r="8" fill="#15803D" stroke="#FFFFFF" strokeWidth="2.5" />
          <text x="300" y="242" fill="#166534" fontSize="11" fontWeight="black" textAnchor="middle">
            Home (Beltola)
          </text>

          {/* Wandering Path Trajectory if active */}
          {geofence.isSimulatingWandering && (
            <path
              d="M 300 220 Q 380 200 410 160 T 470 100"
              fill="none"
              stroke="#DC2626"
              strokeWidth="4"
              strokeDasharray="6,4"
              className="animate-pulse"
            />
          )}

          {/* Live Patient GPS Marker with pulsing radar ring */}
          <g transform={`translate(${patientX}, ${patientY})`}>
            {/* Outer radar pulse */}
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={geofence.isSafe ? '#22C55E' : '#EF4444'}
              opacity="0.35"
              className="animate-ping"
            />
            {/* Core Pin */}
            <circle
              cx="0"
              cy="0"
              r="14"
              fill={geofence.isSafe ? '#15803D' : '#DC2626'}
              stroke="#FFFFFF"
              strokeWidth="3"
            />
            {/* Icon inside pin */}
            <circle cx="0" cy="-3" r="4" fill="#FFFFFF" />
            <path d="M -5 6 Q 0 1 5 6 Z" fill="#FFFFFF" />

            {/* Floating Patient Name Tag */}
            <rect
              x="-65"
              y="-42"
              width="130"
              height="24"
              rx="12"
              fill="#1C1917"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-26"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
            >
              {patient.honorific} {patient.name}
            </text>
          </g>
        </svg>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-2 border-stone-200 dark:border-stone-700 rounded-2xl p-3 shadow-md text-xs font-bold text-stone-800 dark:text-stone-100 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-brand-green inline-block border border-green-700" />
            <span>500m Safe Zone (Beltola Residence)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-brand-crimson inline-block border border-red-700" />
            <span>Patient Live GPS Location</span>
          </div>
        </div>

        {/* GPS Live Telemetry Pill */}
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-2 border-stone-200 dark:border-stone-700 rounded-2xl px-3.5 py-2 shadow-md text-xs font-black text-stone-800 dark:text-stone-100 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-brand-green dark:text-emerald-400">
            <Compass className="w-4 h-4" />
            <span>{geofence.currentLocation.lat}° N, {geofence.currentLocation.lng}° E</span>
          </div>
          <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300 border-l border-stone-300 dark:border-stone-700 pl-2">
            <Battery className="w-4 h-4 text-brand-green dark:text-emerald-400" />
            <span>{geofence.currentLocation.batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Location Address Strip with Live GPS Acquisition */}
      <div className="bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin className={`w-6 h-6 flex-shrink-0 ${geofence.isSafe ? 'text-brand-green dark:text-emerald-400' : 'text-brand-crimson'}`} />
          <div className="min-w-0">
            <p className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase">Current Monitored Location</p>
            <p className="text-base sm:text-lg font-black text-brand-dark dark:text-white truncate" title={geofence.currentLocation.currentAddress}>
              {geofence.currentLocation.currentAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
          <button
            type="button"
            onClick={requestLocationAccess}
            disabled={isLocationLoading}
            className="duo-btn duo-btn-green text-xs font-black px-3.5 py-2 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            title="Poll patient device for live GPS coordinates"
          >
            {isLocationLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Polling GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Sync Real GPS</span>
              </>
            )}
          </button>

          <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
            {geofence.currentLocation.lastUpdated}
          </span>
        </div>
      </div>
    </div>
  );
};
