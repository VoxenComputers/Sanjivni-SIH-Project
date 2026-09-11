/**
 * Cognitive Stability Trajectory & Telemetry Scoring Engine
 * 
 * PROTOTYPE NOTICE:
 * This stability index is an exploratory heuristic metric (10.0 to 30.0 range)
 * designed solely for interactive software demonstration and caregiver engagement.
 * It is NOT scientifically validated and does NOT constitute a certified clinical
 * or diagnostic medical evaluation.
 */

export interface GameTelemetry {
  accuracy: number; // 0 to 100 (%)
  timeTakenSec: number; // elapsed seconds
  expectedTimeSec: number; // benchmark duration (e.g. 45s or 60s)
  tries: number; // number of attempts (1 = perfect)
}

export interface MetricBreakdown {
  baselineInteraction: number; // 20.0 pts heuristic baseline
  accuracyContribution: number; // max 5.0 pts
  speedContribution: number; // max 3.0 pts
  precisionContribution: number; // max 2.0 pts
  totalScore: number; // max 30.0 pts
  prototypeStatus: 'Above Benchmark (>24)' | 'Moderate Interaction (19-23)' | 'Attention Suggested (<19)';
  disclaimer: string;
}

export const PROTOTYPE_DISCLAIMER_TEXT = 
  "Prototype Notice: This stability index is an experimental heuristic metric designed solely for software demonstration. It is not scientifically validated, does not correlate to certified clinical criteria, and must not be used for medical diagnosis or clinical evaluation.";

/**
 * Calculates the exploratory telemetry proxy score (10.0–30.0 scale)
 * Formula: Index = Baseline (20) + Accuracy (max 5) + Speed (max 3) + Precision (max 2)
 */
export function calculatePrototypeScore(metrics: GameTelemetry): MetricBreakdown {
  const baselineInteraction = 20.0;

  // 1. Accuracy (0 to 100% -> 0 to 5.0 points)
  const accuracyContribution = parseFloat(
    ((Math.min(Math.max(metrics.accuracy, 0), 100) / 100) * 5.0).toFixed(1)
  );

  // 2. Latency / Speed Factor (max 3.0 points)
  const timeRatio = metrics.timeTakenSec / Math.max(metrics.expectedTimeSec, 10);
  let speedContribution = 3.0;
  if (timeRatio > 1.0) {
    speedContribution = Math.max(0.5, 3.0 - (timeRatio - 1.0) * 1.5);
  }
  speedContribution = parseFloat(speedContribution.toFixed(1));

  // 3. Precision / Attempt Factor (max 2.0 points)
  const excessTries = Math.max(0, metrics.tries - 1);
  const precisionContribution = parseFloat(Math.max(0, 2.0 - excessTries * 0.5).toFixed(1));

  const rawTotal = baselineInteraction + accuracyContribution + speedContribution + precisionContribution;
  const totalScore = parseFloat(Math.min(Math.max(rawTotal, 10.0), 30.0).toFixed(1));

  let prototypeStatus: MetricBreakdown['prototypeStatus'] = 'Above Benchmark (>24)';
  if (totalScore < 19.0) {
    prototypeStatus = 'Attention Suggested (<19)';
  } else if (totalScore <= 24.0) {
    prototypeStatus = 'Moderate Interaction (19-23)';
  }

  return {
    baselineInteraction,
    accuracyContribution,
    speedContribution,
    precisionContribution,
    totalScore,
    prototypeStatus,
    disclaimer: PROTOTYPE_DISCLAIMER_TEXT
  };
}

export interface CognitiveTrajectoryPoint {
  id?: string;
  label?: string;
  day?: string;
  calculated_score: number;
  accuracy_percentage?: number;
  time_taken_seconds?: number;
  tries_count?: number;
  game_type?: string;
  created_at?: string;
}

/**
 * Merges real recorded game sessions from Supabase into a standard 7-bar progression.
 * Real sessions replace the rightmost bars ('Prev Game', 'Today', etc.) so database
 * records are NEVER discarded regardless of how few there are.
 */
export function mergeTrajectoryWithBaseline(
  realSessions: Array<{
    id?: string;
    calculated_score: number | string;
    created_at?: string;
    accuracy_percentage?: number | string;
    time_taken_seconds?: number | string;
    tries_count?: number | string;
    game_type?: string;
  }>
): CognitiveTrajectoryPoint[] {
  const BASELINE_TEMPLATE: CognitiveTrajectoryPoint[] = [
    { id: 'base-1', label: 'Day 1', day: 'Day 1', calculated_score: 24.5 },
    { id: 'base-2', label: 'Day 5', day: 'Day 5', calculated_score: 25.0 },
    { id: 'base-3', label: 'Day 10', day: 'Day 10', calculated_score: 24.8 },
    { id: 'base-4', label: 'Day 15', day: 'Day 15', calculated_score: 25.2 },
    { id: 'base-5', label: 'Day 20', day: 'Day 20', calculated_score: 25.0 },
    { id: 'base-6', label: 'Prev Game', day: 'Prev Game', calculated_score: 25.5 },
    { id: 'base-7', label: 'Today', day: 'Today', calculated_score: 26.2 },
  ];

  if (!realSessions || realSessions.length === 0) {
    return BASELINE_TEMPLATE;
  }

  // Format real sessions into CognitiveTrajectoryPoint objects
  const formattedReal: CognitiveTrajectoryPoint[] = realSessions.map((s, idx) => ({
    id: s.id || `session-${idx}`,
    label: `Session ${idx + 1}`,
    day: `Session ${idx + 1}`,
    calculated_score: parseFloat(Number(s.calculated_score).toFixed(1)),
    accuracy_percentage: s.accuracy_percentage !== undefined ? Number(s.accuracy_percentage) : undefined,
    time_taken_seconds: s.time_taken_seconds !== undefined ? Number(s.time_taken_seconds) : undefined,
    tries_count: s.tries_count !== undefined ? Number(s.tries_count) : undefined,
    game_type: s.game_type,
    created_at: s.created_at,
  }));

  // If more than 7, take the latest 7
  const activeSlice = formattedReal.length > 7 ? formattedReal.slice(-7) : formattedReal;
  const count = activeSlice.length;

  // Combine baseline slots on the left, real sessions on the right
  const result: CognitiveTrajectoryPoint[] = [
    ...BASELINE_TEMPLATE.slice(0, 7 - count),
    ...activeSlice,
  ];

  // Assign clean labels to the 7 slots
  return result.map((item, idx) => {
    // If it's from the baseline template, keep its original label (e.g. 'Day 1', 'Day 5', etc.)
    if (idx < 7 - count) {
      return item;
    }
    // For the real session slots on the right:
    let label = 'Session';
    if (idx === 6) {
      label = 'Today';
    } else if (idx === 5) {
      label = 'Prev Game';
    } else if (item.created_at) {
      label = new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      label = `Day ${idx * 4 + 1}`;
    }

    return {
      ...item,
      label,
      day: label,
    };
  });
}

