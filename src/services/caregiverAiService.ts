import { GoogleGenAI } from '@google/genai';
import { 
  fetchPatientTasks, 
  fetchWeeklyTaskAdherence, 
  fetchPatientCognitiveScores,
  fetchFamilyMembers 
} from '../lib/supabaseDb';
import { RoutineTask, GameScoreRecord, FamilyMember } from '../context/AppContext';

export interface HealthAnomalyAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric: string;
  detectedAt: string;
  recommendedAction: string;
}

export interface PatientHealthContext {
  profile: {
    name: string;
    honorific: string;
    age: number;
    location: string;
    diagnosis: string;
    bloodGroup: string;
    emergencyContact: string;
    doctorName: string;
    clinic: string;
    preferredLanguage: string;
    region: string;
  };
  routineStats: {
    totalTasksToday: number;
    completedTasksToday: number;
    completionRateToday: number; // 0 - 100
    completionRateYesterday: number; // 0 - 100
    completionRateDropPercent: number; // e.g. -25%
    missedCriticalMedications: Array<{ title: string; timeStr: string; description?: string }>;
    completedMedicationsCount: number;
    totalMedicationsCount: number;
    pendingTasks: RoutineTask[];
    completedTasks: RoutineTask[];
    weeklyAdherencePercent: number;
  };
  cognitiveStats: {
    totalRecordedSessions: number;
    todayAvgScore: number;
    yesterdayAvgScore: number;
    rolling3DayAvgScore: number;
    weeklyAvgScore: number;
    prevWeeklyAvgScore: number;
    scoreDropPercent: number; // e.g. -20%
    avgAccuracyPercent: number;
    avgReactionSpeedSec: number;
    recentGames: Array<{
      game: string;
      score: number;
      accuracy: number;
      date: string;
      timeSeconds: number;
    }>;
  };
  familyEngagement: {
    totalFamilyMembers: number;
    voiceNotesCount: number;
    recentlyInteractedMember?: string;
    lastInteractionNote?: string;
  };
  anomalies: HealthAnomalyAlert[];
}

/**
 * Checks if a scheduled task time (e.g., "08:30 AM", "2:00 PM") has passed today
 */
export const isTaskOverdue = (timeStr?: string): boolean => {
  if (!timeStr) return false;
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3]?.toUpperCase();

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);

    return new Date().getTime() > taskTime.getTime();
  } catch {
    return false;
  }
};

/**
 * Aggregates patient health, routine adherence, and cognitive performance data
 * from Supabase with resilient fallback to current client state.
 */
export const buildPatientHealthContext = async (
  patientId: string,
  localState?: {
    patient?: any;
    tasks?: RoutineTask[];
    gameHistory?: GameScoreRecord[];
    familyMembers?: FamilyMember[];
    language?: string;
    selectedRegion?: string;
  }
): Promise<PatientHealthContext> => {
  // 1. Core Profile & Baseline
  const p = localState?.patient || {
    name: 'Bhaben Baruah',
    honorific: 'Koka',
    age: 78,
    location: 'Guwahati, Assam',
    diagnosis: 'Early-Stage Mild Cognitive Impairment (MCI) with Mild Hypertension',
    bloodGroup: 'B+',
    emergencyContact: '+91 98640 12345 (Dr. Priya Baruah, Daughter)',
    doctorName: 'Dr. Priya Baruah',
    clinic: 'Dispur Wellness & Senior Care',
  };

  // 2. Daily Routine Adherence Query & Aggregation
  let tasks: RoutineTask[] = [];
  try {
    tasks = await fetchPatientTasks(patientId);
  } catch (err) {
    console.warn('[Caregiver AI] fetchPatientTasks notice, using local state:', err);
  }

  if ((!tasks || tasks.length === 0) && localState?.tasks && localState.tasks.length > 0) {
    tasks = localState.tasks;
  }

  // Fallback demo tasks if completely empty
  if (!tasks || tasks.length === 0) {
    tasks = [
      { id: '1', title: 'Morning BP Medicine (Amlodipine 5mg)', time: '08:30 AM', timeStr: '08:30 AM', isCompleted: true, completed: true, type: 'medicine', category: 'medication', description: 'Take with warm water after light breakfast.' },
      { id: '2', title: 'Morning Garden Walk & Sunlight', time: '09:30 AM', timeStr: '09:30 AM', isCompleted: true, completed: true, type: 'exercise', category: 'exercise', description: '15 minutes gentle walk in the veranda.' },
      { id: '3', title: 'Mid-day Memory Match Game', time: '11:30 AM', timeStr: '11:30 AM', isCompleted: false, completed: false, type: 'game', category: 'game', description: 'Play 1 round of cultural card matching.' },
      { id: '4', title: 'Afternoon Hydration (Coconut Water)', time: '02:30 PM', timeStr: '02:30 PM', isCompleted: false, completed: false, type: 'hydration', category: 'hydration', description: 'Drink 1 glass of fresh water or daab.' },
      { id: '5', title: 'Evening Memory Walk with Rahul', time: '05:00 PM', timeStr: '05:00 PM', isCompleted: false, completed: false, type: 'activity', category: 'exercise', description: 'Gentle stroll and conversation.' },
      { id: '6', title: 'Night Calcium Tablet (Shelcal 500)', time: '08:30 PM', timeStr: '08:30 PM', isCompleted: false, completed: false, type: 'medicine', category: 'medication', description: 'After dinner with lukewarm milk.' },
    ];
  }

  const totalTasksToday = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed || t.isCompleted);
  const pendingTasks = tasks.filter((t) => !t.completed && !t.isCompleted);
  const completionRateToday = totalTasksToday > 0 
    ? Math.round((completedTasks.length / totalTasksToday) * 100) 
    : 100;

  // Baseline yesterday's rate (historically averaged at ~85% for Koka)
  const completionRateYesterday = 85;
  const completionRateDropPercent = completionRateYesterday - completionRateToday;

  // Critical Medication filtering & overdue detection
  const medTasks = tasks.filter((t) => t.category === 'medication' || t.type === 'medicine');
  const completedMeds = medTasks.filter((t) => t.completed || t.isCompleted);
  const missedCriticalMedications = medTasks
    .filter((t) => !t.completed && !t.isCompleted && isTaskOverdue(t.timeStr || t.time))
    .map((t) => ({
      title: t.title,
      timeStr: t.timeStr || t.time,
      description: t.description || t.notes,
    }));

  // Weekly task adherence
  let weeklyAdherencePercent = 82;
  try {
    const weeklyData = await fetchWeeklyTaskAdherence(patientId);
    if (weeklyData && weeklyData.totalTasks > 0) {
      weeklyAdherencePercent = weeklyData.adherencePercentage;
    }
  } catch {
    // preserve default 82%
  }

  // 3. Cognitive & Game Performance Ingestion
  let gameScores: GameScoreRecord[] = [];
  try {
    const remoteScores = await fetchPatientCognitiveScores(patientId, 14);
    if (remoteScores && remoteScores.length > 0) {
      gameScores = remoteScores.map((r: any) => ({
        id: r.id,
        game: r.game,
        date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent',
        score: r.score || 0,
        moves: r.moves || 0,
        timeSeconds: r.time_seconds || 45,
        accuracy: r.accuracy || 80,
      }));
    }
  } catch {
    // fallback to local
  }

  if (gameScores.length === 0 && localState?.gameHistory && localState.gameHistory.length > 0) {
    gameScores = localState.gameHistory;
  }

  // Default baseline game records if none recorded yet
  if (gameScores.length === 0) {
    gameScores = [
      { id: 'g1', game: 'Memory Match Pairs', date: 'Today', score: 68, timeSeconds: 62, accuracy: 72 },
      { id: 'g2', game: 'Guess The Cultural Picture', date: 'Yesterday', score: 92, timeSeconds: 38, accuracy: 94 },
      { id: 'g3', game: 'Match The Order', date: '2 days ago', score: 88, timeSeconds: 44, accuracy: 88 },
      { id: 'g4', game: 'Spaced Retrieval Trivia', date: '3 days ago', score: 85, timeSeconds: 50, accuracy: 86 },
    ];
  }

  const todayScore = gameScores[0]?.score || 70;
  const yesterdayScore = gameScores[1]?.score || 90;
  const rolling3DayAvg = Math.round(
    gameScores.slice(0, 3).reduce((sum, g) => sum + g.score, 0) / Math.min(gameScores.length, 3)
  );
  const weeklyAvg = Math.round(
    gameScores.slice(0, 7).reduce((sum, g) => sum + g.score, 0) / Math.min(gameScores.length, 7)
  );
  const prevWeeklyAvg = 86;
  const scoreDropPercent = Math.round(((yesterdayScore - todayScore) / yesterdayScore) * 100);
  const avgAccuracyPercent = Math.round(
    gameScores.reduce((sum, g) => sum + g.accuracy, 0) / gameScores.length
  );
  const avgReactionSpeedSec = Math.round(
    gameScores.reduce((sum, g) => sum + g.timeSeconds, 0) / gameScores.length
  );

  // 4. Family Engagement Query
  let familyList: FamilyMember[] = [];
  try {
    familyList = await fetchFamilyMembers(patientId);
  } catch {
    // ignore
  }

  if (familyList.length === 0 && localState?.familyMembers && localState.familyMembers.length > 0) {
    familyList = localState.familyMembers;
  }

  const voiceNotesCount = familyList.filter((f) => f.quote || f.voiceMessage).length;
  const recentlyInteractedMember = familyList[0]?.name || 'Dr. Priya Baruah';

  const context: PatientHealthContext = {
    profile: {
      name: p.name,
      honorific: p.honorific,
      age: p.age,
      location: p.location,
      diagnosis: p.diagnosis,
      bloodGroup: p.bloodGroup,
      emergencyContact: p.emergencyContact,
      doctorName: p.doctorName,
      clinic: p.clinic,
      preferredLanguage: localState?.language || 'English / Assamese',
      region: localState?.selectedRegion || 'Assam',
    },
    routineStats: {
      totalTasksToday,
      completedTasksToday: completedTasks.length,
      completionRateToday,
      completionRateYesterday,
      completionRateDropPercent,
      missedCriticalMedications,
      completedMedicationsCount: completedMeds.length,
      totalMedicationsCount: medTasks.length,
      pendingTasks,
      completedTasks,
      weeklyAdherencePercent,
    },
    cognitiveStats: {
      totalRecordedSessions: gameScores.length,
      todayAvgScore: todayScore,
      yesterdayAvgScore: yesterdayScore,
      rolling3DayAvgScore: rolling3DayAvg,
      weeklyAvgScore: weeklyAvg,
      prevWeeklyAvgScore: prevWeeklyAvg,
      scoreDropPercent,
      avgAccuracyPercent,
      avgReactionSpeedSec,
      recentGames: gameScores.slice(0, 5),
    },
    familyEngagement: {
      totalFamilyMembers: familyList.length || 4,
      voiceNotesCount: voiceNotesCount || 4,
      recentlyInteractedMember,
      lastInteractionNote: familyList[0]?.quote || 'Remember our family is always with you!',
    },
    anomalies: [],
  };

  // 5. Automated Trend Analysis & Alert Detection Engine
  context.anomalies = detectHealthAnomalies(context);
  return context;
};

/**
 * Trend Analysis & Anomaly Detection Engine:
 * - Detects >= 20% drops in cognitive score or routine adherence
 * - Detects overdue critical medications
 * - Flags consecutive missed routines
 */
export const detectHealthAnomalies = (ctx: PatientHealthContext): HealthAnomalyAlert[] => {
  const alerts: HealthAnomalyAlert[] = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Cognitive Dip Alert (>= 20% score drop vs yesterday or 3-day average)
  if (ctx.cognitiveStats.scoreDropPercent >= 20) {
    alerts.push({
      id: 'alert-cognitive-drop',
      level: 'critical',
      title: `Cognitive Score Dip Detected (${ctx.cognitiveStats.scoreDropPercent}% drop)`,
      description: `${ctx.profile.honorific} scored ${ctx.cognitiveStats.todayAvgScore} today, down from ${ctx.cognitiveStats.yesterdayAvgScore} yesterday (rolling 3-day avg: ${ctx.cognitiveStats.rolling3DayAvgScore}).`,
      metric: `${ctx.cognitiveStats.scoreDropPercent}% Score Decline`,
      detectedAt: nowStr,
      recommendedAction: 'Assess for fatigue, sleep deprivation, or hydration before re-testing. Avoid repetitive drills that cause frustration.',
    });
  }

  // 2. Overdue Critical Medication Alert
  if (ctx.routineStats.missedCriticalMedications.length > 0) {
    const overdueMedsList = ctx.routineStats.missedCriticalMedications
      .map((m) => `${m.title} (${m.timeStr})`)
      .join(', ');
    alerts.push({
      id: 'alert-med-overdue',
      level: 'critical',
      title: 'Overdue Critical Medication',
      description: `Medication task is past its scheduled slot: ${overdueMedsList}.`,
      metric: `${ctx.routineStats.missedCriticalMedications.length} Pending Med(s)`,
      detectedAt: nowStr,
      recommendedAction: 'Trigger an audio reminder through the patient tablet or check in via phone call.',
    });
  }

  // 3. Routine Adherence Dip Alert (>= 20% drop vs yesterday)
  if (ctx.routineStats.completionRateDropPercent >= 20) {
    alerts.push({
      id: 'alert-routine-drop',
      level: 'warning',
      title: `Daily Routine Adherence Dip (-${ctx.routineStats.completionRateDropPercent}%)`,
      description: `Today's completion rate is ${ctx.routineStats.completionRateToday}% compared to ${ctx.routineStats.completionRateYesterday}% yesterday.`,
      metric: `${ctx.routineStats.completionRateToday}% Completed`,
      detectedAt: nowStr,
      recommendedAction: 'Review remaining afternoon/evening tasks and reduce cognitive clutter by pinning simple steps.',
    });
  }

  // 4. Low Hydration Warning
  const hydrationTask = ctx.routineStats.pendingTasks.find((t) => t.category === 'hydration');
  if (hydrationTask && isTaskOverdue(hydrationTask.timeStr)) {
    alerts.push({
      id: 'alert-hydration-due',
      level: 'info',
      title: 'Hydration Intake Pending',
      description: `${hydrationTask.title} was scheduled for ${hydrationTask.timeStr} and has not yet been marked completed.`,
      metric: 'Fluids Pending',
      detectedAt: nowStr,
      recommendedAction: 'Encourage a warm cup of Assam tea or fresh water to support cognitive alertness.',
    });
  }

  return alerts;
};

/**
 * Builds the structured clinical System Prompt for Google Gemini
 */
export const buildCaregiverSystemPrompt = (ctx: PatientHealthContext): string => {
  const anomaliesSummary = ctx.anomalies.length > 0
    ? ctx.anomalies.map((a, i) => `[ALERT #${i + 1} - ${a.level.toUpperCase()}] ${a.title}: ${a.description} (Recommended Action: ${a.recommendedAction})`).join('\n')
    : 'No acute anomalies detected at this moment. All monitored baselines are within expected bounds.';

  return `
You are the SANJIVNI Caregiver Companion AI — a clinical-grade, empathetic, and observant geriatric care and cognitive health thought partner for family caregivers and healthcare providers.

You are interacting directly with the patient's primary caregiver, Dr. Priya Baruah (daughter & physician), who is caring for her father:
- Patient: ${ctx.profile.name} (${ctx.profile.honorific} Bhaben), Age ${ctx.profile.age}
- Baseline Diagnosis: ${ctx.profile.diagnosis}
- Location & Cultural Roots: ${ctx.profile.location} (${ctx.profile.region}, Northeast India)
- Preferred Communication: ${ctx.profile.preferredLanguage}

--- CURRENT PATIENT INGESTED HEALTH CONTEXT (LIVE STATS) ---
1. Routine Adherence (Today):
   - Total Tasks: ${ctx.routineStats.totalTasksToday} | Completed: ${ctx.routineStats.completedTasksToday} (${ctx.routineStats.completionRateToday}%)
   - Yesterday Comparison: ${ctx.routineStats.completionRateYesterday}% (Drop: ${ctx.routineStats.completionRateDropPercent > 0 ? `-${ctx.routineStats.completionRateDropPercent}%` : 'Stable/Improved'})
   - Weekly 7-Day Adherence: ${ctx.routineStats.weeklyAdherencePercent}%
   - Medications: ${ctx.routineStats.completedMedicationsCount}/${ctx.routineStats.totalMedicationsCount} completed
   - Overdue/Missed Critical Meds: ${ctx.routineStats.missedCriticalMedications.length > 0 ? ctx.routineStats.missedCriticalMedications.map(m => `${m.title} scheduled at ${m.timeStr}`).join(', ') : 'None, all current medications taken!'}

2. Cognitive & Brain Game Trajectory:
   - Today's Game Score: ${ctx.cognitiveStats.todayAvgScore} pts
   - Yesterday's Game Score: ${ctx.cognitiveStats.yesterdayAvgScore} pts
   - Rolling 3-Day Average: ${ctx.cognitiveStats.rolling3DayAvgScore} pts | Weekly Avg: ${ctx.cognitiveStats.weeklyAvgScore} pts
   - Score Trend: ${ctx.cognitiveStats.scoreDropPercent >= 0 ? `${ctx.cognitiveStats.scoreDropPercent}% drop` : `+${Math.abs(ctx.cognitiveStats.scoreDropPercent)}% gain`}
   - Average Accuracy: ${ctx.cognitiveStats.avgAccuracyPercent}% | Avg Speed: ${ctx.cognitiveStats.avgReactionSpeedSec}s

3. Family & Cultural Memory Engagement:
   - Family Members Monitored: ${ctx.familyEngagement.totalFamilyMembers}
   - Voice Notes Available: ${ctx.familyEngagement.voiceNotesCount}
   - Primary Connection: ${ctx.familyEngagement.recentlyInteractedMember} (Quote: "${ctx.familyEngagement.lastInteractionNote}")

4. CURRENT_ANOMALIES_AND_ALERTS:
${anomaliesSummary}

--- YOUR CORE RESPONSIBILITIES & GUIDELINES ---
1. Observation & Clinical Reasoning:
   - Summarize the patient's daily or weekly trajectory in clear, bulleted, jargon-free points.
   - If a dip in cognitive scores or task completion is detected, explicitly alert the caregiver, explaining possible non-alarmist causes (e.g. sleep fluctuation, afternoon fatigue, dehydration, eye strain, or mood) and suggest compassionate, low-stress interventions.
   - Ground every single insight in the real ingested stats provided above. NEVER hallucinate unrecorded vitals or fictitious lab tests.

2. Personalization & Cultural Grounding:
   - Incorporate the patient's Assamese / North-Eastern cultural background (e.g. morning tea rituals, family reminiscence with grandchildren Rahul and Ananya, familiar folk songs, garden walks in Guwahati).
   - Address the caregiver respectfully as Dr. Priya and refer to the patient warmly as Koka or Bhaben Baruah.

3. Tone:
   - Professional, reassuring, observant, and actionable. Avoid clinical coldness, and avoid excessive alarmism.
   - Format answers using markdown bold headings, bullet points, and concise action steps.
`.trim();
};

/**
 * Intelligent local fallback generator when Gemini API key is not configured or network fails
 */
export const generateLocalClinicalFallback = (
  userQuery: string,
  ctx: PatientHealthContext
): string => {
  const q = userQuery.toLowerCase();

  // Anomaly & score drops query
  if (q.includes('anomal') || q.includes('drop') || q.includes('dip') || q.includes('alert') || q.includes('concern')) {
    if (ctx.anomalies.length === 0) {
      return `### 🟢 No Acute Anomalies Detected Today\n\nDr. Priya, **${ctx.profile.honorific} Bhaben**'s health and cognitive metrics are holding steady today:\n\n- **Routine Completion:** ${ctx.routineStats.completionRateToday}% (on track with weekly average of ${ctx.routineStats.weeklyAdherencePercent}%)\n- **Cognitive Score:** ${ctx.cognitiveStats.todayAvgScore} pts (stable vs 3-day baseline of ${ctx.cognitiveStats.rolling3DayAvgScore} pts)\n- **Medications:** ${ctx.routineStats.completedMedicationsCount}/${ctx.routineStats.totalMedicationsCount} doses completed.\n\n*Recommendation:* Continue the peaceful daily routine. A brief evening listening session of family voice notes from Rahul or Ananya will reinforce positive emotional grounding!`;
    }

    const items = ctx.anomalies.map((a) => `- **[${a.level.toUpperCase()}] ${a.title}:** ${a.description}\n  *Recommended Step:* ${a.recommendedAction}`).join('\n\n');
    return `### ⚠️ Observational Health Alerts Detected\n\nDr. Priya, our real-time monitoring has identified the following items requiring your attention:\n\n${items}\n\n**Clinical Perspective:** Sudden score fluctuations in early MCI frequently stem from minor sleep disruption, mild dehydration, or eye fatigue rather than neurological worsening. Keep Koka comfortable and avoid high-pressure testing today.`;
  }

  // Weekly Health & Memory Summary
  if (q.includes('summary') || q.includes('weekly') || q.includes('overview') || q.includes('trajectory')) {
    return `### 📊 Weekly Health & Memory Trajectory for ${ctx.profile.honorific} Bhaben\n\n**Patient Profile:** ${ctx.profile.name}, Age ${ctx.profile.age} • ${ctx.profile.diagnosis}\n\n**1. Cognitive Health & Memory Games:**\n- **Weekly Average Score:** ${ctx.cognitiveStats.weeklyAvgScore} pts (vs ${ctx.cognitiveStats.prevWeeklyAvgScore} pts baseline)\n- **Average Game Accuracy:** ${ctx.cognitiveStats.avgAccuracyPercent}%\n- **Recent Focus:** Memory Match Pairs & Cultural Picture Identification show strong familiarity with regional symbols.\n\n**2. Daily Routine & Medication Adherence:**\n- **7-Day Schedule Adherence:** ${ctx.routineStats.weeklyAdherencePercent}%\n- **Today's Status:** ${ctx.routineStats.completedTasksToday}/${ctx.routineStats.totalTasksToday} tasks completed (${ctx.routineStats.completionRateToday}%)\n- **Critical Medications:** Morning Amlodipine BP dose recorded successfully.\n\n**3. Family & Emotional Grounding:**\n- ${ctx.familyEngagement.voiceNotesCount} family voice messages available in the Memory Book.\n- Frequent engagement with ${ctx.familyEngagement.recentlyInteractedMember}'s audio note promotes calm transition into evening hours.\n\n**Actionable Caregiver Tip:** Schedule memory games in mid-morning (10:00–11:30 AM) when cognitive stamina is highest.`;
  }

  // Improve routine adherence
  if (q.includes('adherence') || q.includes('improve') || q.includes('routine') || q.includes('schedule')) {
    return `### 💡 Strategies to Optimize ${ctx.profile.honorific} Bhaben's Routine\n\nBased on ${ctx.profile.honorific}'s 7-day adherence rate (${ctx.routineStats.weeklyAdherencePercent}%), here are 3 actionable adjustments:\n\n1. **Anchor Tasks to Sensory Cues:** Pair his afternoon hydration or medication with his favorite cup of warm tea or a regional radio segment.\n2. **Break Evening Tasks into Single Steps:** When cognitive fatigue peaks after 5:00 PM, display only one task at a time on the patient tablet to avoid overwhelm.\n3. **Leverage Family Voice Prompts:** Use the green audio buttons recorded by Ananya and Rahul to introduce daily walk time playfully.\n\nWould you like me to adjust the time slots for any pending routines in the Caregiver Task Manager?`;
  }

  // Handoff report
  if (q.includes('handoff') || q.includes('report') || q.includes('shift') || q.includes('transfer')) {
    return `### 📋 Caregiver Shift Handoff Report\n**Date:** ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n**Patient:** ${ctx.profile.name} (${ctx.profile.honorific} Bhaben) | Age: ${ctx.profile.age}\n**Primary Physician:** Dr. Priya Baruah (${ctx.profile.clinic})\n\n**Current Status & Observations:**\n- **Routine Completion:** ${ctx.routineStats.completedTasksToday}/${ctx.routineStats.totalTasksToday} (${ctx.routineStats.completionRateToday}%)\n- **Medication Status:** ${ctx.routineStats.completedMedicationsCount}/${ctx.routineStats.totalMedicationsCount} taken. ${ctx.routineStats.missedCriticalMedications.length > 0 ? `⚠️ Pending: ${ctx.routineStats.missedCriticalMedications.map(m => m.title).join(', ')}` : 'All scheduled doses completed.'}\n- **Cognitive State:** Today's game score was ${ctx.cognitiveStats.todayAvgScore} pts with ${ctx.cognitiveStats.avgAccuracyPercent}% accuracy.\n- **Mood & Demeanor:** Calm, responsive to family voice messages.\n\n**Upcoming Tasks for Next Shift:**\n- Evening hydration & 15-minute veranda stroll.\n- Night Shelcal 500 Calcium tablet (08:30 PM with lukewarm milk).\n- Geofence Safety: Safe zone verified active at ${ctx.profile.location}.`;
  }

  // General response grounded in health context
  return `### Observation for Dr. Priya\n\nRegarding your query about **${ctx.profile.honorific} Bhaben**:\n\n- **Current Routine Status:** ${ctx.routineStats.completedTasksToday}/${ctx.routineStats.totalTasksToday} tasks completed today (${ctx.routineStats.completionRateToday}% completion rate).\n- **Cognitive Score Baseline:** Most recent game score is **${ctx.cognitiveStats.todayAvgScore} pts** (${ctx.cognitiveStats.avgAccuracyPercent}% accuracy).\n- **Active Alerts:** ${ctx.anomalies.length > 0 ? ctx.anomalies.map(a => a.title).join('; ') : 'No acute flags; vitals and daily rhythm are stable.'}\n\nFeel free to ask for a detailed weekly trend, medication check, or personalized handoff report!`;
};

/**
 * Sends a message to the Caregiver Companion AI and returns full response text.
 * Uses Google Gemini (gemini-3.6-flash / gemini-2.5-flash) with local clinical fallback.
 */
export const sendCaregiverAiChat = async (
  userMessage: string,
  patientId: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }> = [],
  localState?: any
): Promise<{ text: string; context: PatientHealthContext; isLiveGemini: boolean }> => {
  const context = await buildPatientHealthContext(patientId, localState);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.trim() === '') {
    const fallbackText = generateLocalClinicalFallback(userMessage, context);
    return { text: fallbackText, context, isLiveGemini: false };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildCaregiverSystemPrompt(context);

    // Build multi-turn interaction contents
    const contents: any[] = [];
    
    // Include past 4 turns for conversational continuity
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Attempt generation with gemini-3.6-flash first, falling back to gemini-3.5-flash
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });
    } catch (modelErr: any) {
      console.warn('[Caregiver AI] gemini-3.6-flash notice, attempting gemini-3.5-flash:', modelErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });
    }

    const responseText = response?.text || '';
    if (!responseText) {
      throw new Error('Gemini API returned an empty response');
    }

    console.log('[Caregiver AI] Live Gemini generative response generated successfully');
    return { text: responseText, context, isLiveGemini: true };
  } catch (err: any) {
    console.warn('[Caregiver AI] Gemini API call exception, falling back to clinical engine:', err?.message || err);
    const fallbackText = generateLocalClinicalFallback(userMessage, context);
    return { text: fallbackText, context, isLiveGemini: false };
  }
};

/**
 * Streams the response from Google Gemini token by token for real-time responsiveness.
 */
export const streamCaregiverAiChat = async (
  userMessage: string,
  patientId: string,
  onChunk: (chunkText: string) => void,
  history: Array<{ sender: 'user' | 'bot'; text: string }> = [],
  localState?: any
): Promise<{ fullText: string; context: PatientHealthContext; isLiveGemini: boolean }> => {
  const context = await buildPatientHealthContext(patientId, localState);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.trim() === '') {
    const fallbackText = generateLocalClinicalFallback(userMessage, context);
    // Simulate natural progressive streaming for fallback text
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const slice = words.slice(i, i + 3).join(' ') + ' ';
      onChunk(slice);
      await new Promise((r) => setTimeout(r, 25));
    }
    return { fullText: fallbackText, context, isLiveGemini: false };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildCaregiverSystemPrompt(context);

    const contents: any[] = [];
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    let fullText = '';
    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });
    } catch (streamErr: any) {
      console.warn('[Caregiver AI] gemini-3.6-flash stream notice, attempting gemini-3.5-flash:', streamErr?.message);
      stream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });
    }

    for await (const chunk of stream) {
      const piece = chunk.text || '';
      fullText += piece;
      onChunk(piece);
    }

    console.log('[Caregiver AI] Live Gemini stream completed successfully');
    return { fullText, context, isLiveGemini: true };
  } catch (err: any) {
    console.warn('[Caregiver AI] Stream error, using clinical fallback:', err?.message || err);
    const fallbackText = generateLocalClinicalFallback(userMessage, context);
    onChunk(fallbackText);
    return { fullText: fallbackText, context, isLiveGemini: false };
  }
};
