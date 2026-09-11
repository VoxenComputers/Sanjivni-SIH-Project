import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Clock, 
  Target, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchCognitiveTrajectory, CognitiveTrajectoryPoint, isValidUuid, DEFAULT_PATIENT_ID } from '../../lib/supabaseDb';
import { 
  calculatePrototypeScore, 
  GameTelemetry, 
  MetricBreakdown, 
  PROTOTYPE_DISCLAIMER_TEXT,
  mergeTrajectoryWithBaseline
} from '../../utils/cognitiveMetrics';
import { useApp } from '../../context/AppContext';

interface CognitiveTrajectoryProps {
  patientId?: string | null;
}

export const CognitiveTrajectory: React.FC<CognitiveTrajectoryProps> = ({ patientId }) => {
  const { activePatientId } = useApp();

  const effectivePatientId = useMemo(() => {
    if (patientId && isValidUuid(patientId)) return patientId;
    if (activePatientId && isValidUuid(activePatientId)) return activePatientId;
    if (typeof window !== 'undefined') {
      const savedSanjivni = localStorage.getItem('sanjivni_patient_id');
      if (savedSanjivni && isValidUuid(savedSanjivni)) return savedSanjivni;
      const saved = localStorage.getItem('smriti_linked_patient_id');
      if (saved && isValidUuid(saved) && saved !== 'demo-patient-koka' && saved !== '70fde7c0-c85e-4c3d-bc49-8ea172128ebd') return saved;
    }
    return DEFAULT_PATIENT_ID;
  }, [patientId, activePatientId]);

  const [trajectoryData, setTrajectoryData] = useState<CognitiveTrajectoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<CognitiveTrajectoryPoint | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(true);

  // 1. Fetch cognitive trajectory from Supabase game_sessions and merge with baseline
  const loadTrajectory = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: realSessions, error } = await supabase
        .from('game_sessions')
        .select('id, calculated_score, created_at, accuracy_percentage, time_taken_seconds, tries_count, game_type')
        .eq('patient_id', effectivePatientId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[CognitiveTrajectory] Supabase query notice:', error.message);
      }

      const merged = mergeTrajectoryWithBaseline(realSessions || []);
      setTrajectoryData(merged);
      if (merged.length > 0) {
        setSelectedPoint(merged[merged.length - 1]);
      }
    } catch (err) {
      console.warn('[CognitiveTrajectory] Fetch error:', err);
      const fallback = mergeTrajectoryWithBaseline([]);
      setTrajectoryData(fallback);
      if (fallback.length > 0) {
        setSelectedPoint(fallback[fallback.length - 1]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadTrajectory();
  }, [loadTrajectory]);

  // 2. Listen to custom game-completed events from memory games
  useEffect(() => {
    const handleGameCompleted = () => {
      loadTrajectory();
    };

    window.addEventListener('sanjivni:game-completed', handleGameCompleted);
    return () => {
      window.removeEventListener('sanjivni:game-completed', handleGameCompleted);
    };
  }, [loadTrajectory]);

  // 3. Realtime Supabase Subscription on 'game_sessions' table
  useEffect(() => {
    if (!effectivePatientId || !isValidUuid(effectivePatientId)) return;

    const channel = supabase
      .channel(`game_sessions_${effectivePatientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `patient_id=eq.${effectivePatientId}`,
        },
        () => {
          loadTrajectory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectivePatientId, loadTrajectory]);

  // Derive latest score and performance status
  const latestPoint = trajectoryData.length > 0 ? trajectoryData[trajectoryData.length - 1] : null;
  const currentScore = latestPoint ? latestPoint.calculated_score : 25.8;

  const previousPoint = trajectoryData.length > 1 ? trajectoryData[trajectoryData.length - 2] : null;
  const scoreDiff = previousPoint ? parseFloat((currentScore - previousPoint.calculated_score).toFixed(1)) : 1.2;

  // Selected telemetry breakdown
  const activeBreakdown: MetricBreakdown = useMemo(() => {
    if (selectedPoint && selectedPoint.accuracy_percentage !== undefined && selectedPoint.time_taken_seconds !== undefined) {
      const telemetry: GameTelemetry = {
        accuracy: selectedPoint.accuracy_percentage,
        timeTakenSec: selectedPoint.time_taken_seconds,
        expectedTimeSec: 45,
        tries: selectedPoint.tries_count || 1,
      };
      return calculatePrototypeScore(telemetry);
    }

    // Default simulated breakdown matching current selected score
    const targetScore = selectedPoint ? selectedPoint.calculated_score : currentScore;
    const estAccuracy = Math.min(100, Math.max(60, Math.round(((targetScore - 20) / 10) * 100)));
    return calculatePrototypeScore({
      accuracy: estAccuracy,
      timeTakenSec: 40,
      expectedTimeSec: 45,
      tries: 1,
    });
  }, [selectedPoint, currentScore]);

  // Dynamic color coding according to score thresholds
  const getBarColorClass = (score: number) => {
    if (score >= 24.0) return 'bg-emerald-500';
    if (score >= 19.0) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getContainerBorderClass = (score: number, isSelected: boolean) => {
    if (score >= 24.0) {
      return isSelected
        ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/40'
        : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 group-hover:border-emerald-400';
    }
    if (score >= 19.0) {
      return isSelected
        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40'
        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 group-hover:border-amber-400';
    }
    return isSelected
      ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/40'
      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 group-hover:border-rose-400';
  };

  const getScorePillClass = (score: number, isSelected: boolean) => {
    if (isSelected) {
      if (score >= 24.0) return 'bg-emerald-500 text-white';
      if (score >= 19.0) return 'bg-amber-500 text-white';
      return 'bg-rose-500 text-white';
    }
    if (score >= 24.0) return 'text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600';
    if (score >= 19.0) return 'text-amber-700 dark:text-amber-300 group-hover:text-amber-600';
    return 'text-rose-700 dark:text-rose-300 group-hover:text-rose-600';
  };

  return (
    <div className="duo-card p-6 space-y-5 bg-white dark:bg-stone-900 border-3 border-stone-200 dark:border-stone-700 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-green-light dark:bg-emerald-950 border border-green-300 dark:border-emerald-800 flex items-center justify-center text-brand-green-dark dark:text-emerald-300 shadow-xs flex-shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white tracking-tight">
                Cognitive Stability Trajectory
              </h3>
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 uppercase tracking-wide">
                Heuristic Telemetry
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">
              Interactive session trajectory over recent memory challenges (Benchmark Threshold: &gt;24.0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={loadTrajectory}
            disabled={isLoading}
            title="Refresh Trajectory Data"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <div
            className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-2xl border ${
              currentScore >= 24.0
                ? 'text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800'
                : currentScore >= 19.0
                ? 'text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800'
                : 'text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800'
            }`}
          >
            {scoreDiff >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>
              {scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`} Pts •{' '}
              {currentScore >= 24.0
                ? 'Stable Baseline'
                : currentScore >= 19.0
                ? 'Moderate Interaction'
                : 'Attention Suggested'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Dynamic SVG Bar Chart */}
      <div className="bg-stone-50 dark:bg-stone-800/70 border-2 border-stone-200 dark:border-stone-700 rounded-3xl p-4 pt-6">
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 px-2">
          {trajectoryData.map((pt, i) => {
            // Dynamic column height: (score / 30) * 100%
            const heightPercent = Math.min(100, Math.max(15, (pt.calculated_score / 30) * 100));
            const isSelected = selectedPoint?.id === pt.id;

            return (
              <button
                key={pt.id || i}
                type="button"
                onClick={() => setSelectedPoint(pt)}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer focus:outline-none transition-transform active:scale-95"
              >
                {/* Score Pill */}
                <span
                  className={`text-[11px] sm:text-xs font-black transition-colors px-1.5 py-0.5 rounded-md ${getScorePillClass(
                    pt.calculated_score,
                    isSelected
                  )}`}
                >
                  {pt.calculated_score.toFixed(1)}
                </span>

                {/* Column Bar Container */}
                <div
                  className={`w-full max-w-[42px] rounded-t-2xl overflow-hidden border h-32 flex items-end transition-all duration-200 ${getContainerBorderClass(
                    pt.calculated_score,
                    isSelected
                  )}`}
                >
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${getBarColorClass(
                      pt.calculated_score
                    )} ${isSelected ? 'shadow-md brightness-105 ring-1 ring-white/40' : 'hover:brightness-105'}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[11px] sm:text-xs font-bold truncate w-full text-center ${
                    isSelected
                      ? 'text-emerald-700 dark:text-emerald-300 font-black'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {pt.day || pt.label || `Day ${i + 1}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Meta */}
        <div className="mt-3.5 pt-2.5 border-t border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400 gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${getBarColorClass(currentScore)}`}></span>
            <span>Current Heuristic Score: <strong className="text-stone-800 dark:text-stone-200">{currentScore.toFixed(1)} / 30.0</strong></span>
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Game Telemetry Active</span>
          </span>
        </div>
      </div>

      {/* Interactive Metric Explainer Breakdown Panel */}
      <div className="border-2 border-stone-200 dark:border-stone-700 rounded-3xl overflow-hidden bg-white dark:bg-stone-900 transition-all">
        <button
          type="button"
          onClick={() => setIsExplainerOpen(!isExplainerOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between bg-stone-50/80 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm sm:text-base font-black text-stone-800 dark:text-stone-100">
                Metric Calculation & Telemetry Model
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">
                Detailed telemetry breakdown for {selectedPoint?.day || selectedPoint?.label || 'Selected Session'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
              {activeBreakdown.totalScore.toFixed(1)} Pts
            </span>
            {isExplainerOpen ? (
              <ChevronUp className="w-5 h-5 text-stone-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-stone-500" />
            )}
          </div>
        </button>

        {isExplainerOpen && (
          <div className="p-4 sm:p-5 space-y-4 border-t border-stone-200 dark:border-stone-700 animate-in fade-in duration-150">
            {/* Formula Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-xs sm:text-sm">
                <strong>Formula:</strong> Index (30.0) = Baseline (20.0) + Accuracy (max 5.0) + Speed (max 3.0) + Precision (max 2.0)
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-200 dark:bg-emerald-900 font-black text-xs text-emerald-900 dark:text-emerald-100">
                {activeBreakdown.prototypeStatus}
              </span>
            </div>

            {/* 4 Telemetry Contributors Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Baseline */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      1. Baseline
                    </span>
                    <Brain className="w-4 h-4 text-stone-400" />
                  </div>
                  <h5 className="text-sm font-black text-stone-800 dark:text-white mb-1">
                    Interaction Anchor
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    Standard heuristic base score for active participation.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-400">Weight</span>
                  <span className="text-base font-black text-stone-900 dark:text-stone-100">
                    +{activeBreakdown.baselineInteraction.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* 2. Accuracy */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      2. Accuracy
                    </span>
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h5 className="text-sm font-black text-stone-800 dark:text-white mb-1">
                    Matching Fidelity
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    Percentage of correct responses in memory challenges.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-400">Max 5.0</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    +{activeBreakdown.accuracyContribution.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* 3. Speed Factor */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      3. Speed Factor
                    </span>
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h5 className="text-sm font-black text-stone-800 dark:text-white mb-1">
                    Latency & Pace
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    Measured response duration relative to benchmark pacing.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-400">Max 3.0</span>
                  <span className="text-base font-black text-sky-600 dark:text-sky-400">
                    +{activeBreakdown.speedContribution.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* 4. Precision Factor */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      4. Precision
                    </span>
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h5 className="text-sm font-black text-stone-800 dark:text-white mb-1">
                    Attempt Efficiency
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    Minimal trial friction without repetitive incorrect taps.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-400">Max 2.0</span>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">
                    +{activeBreakdown.precisionContribution.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* CRITICAL PROTOTYPE DISCLAIMER BANNER */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-700 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-900/80 flex items-center justify-center flex-shrink-0 text-amber-800 dark:text-amber-300 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h5 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Prototype Disclaimer & Diagnostic Notice</span>
                </h5>
                <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
                  {PROTOTYPE_DISCLAIMER_TEXT}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CognitiveTrajectory;
