import { GoogleGenAI } from '@google/genai';
import { fetchPatientTasks, fetchFamilyMembers, isValidUuid } from '../lib/supabaseDb';
import { RoutineTask, FamilyMember } from '../context/AppContext';

export interface PatientChatContext {
  patient: {
    name: string;
    honorific: string;
    age: number;
    diagnosis: string;
    location: string;
    primaryCaregiver: string;
    emergencyContact: string;
    preferredLanguage: string;
  };
  tasks: RoutineTask[];
  completedTasks: RoutineTask[];
  pendingTasks: RoutineTask[];
  nextUpcomingTask: RoutineTask | null;
  familyMembers: FamilyMember[];
  currentTimeStr: string;
  currentPeriod: 'morning' | 'afternoon' | 'evening';
}

export interface PatientAiResponse {
  text: string;
  isEmergency: boolean;
  emergencyReason?: string;
  suggestedAction?: 'sos' | 'call_caregiver' | 'view_routine' | 'view_family';
  isLiveGemini: boolean;
}

/**
 * Emergency & Medical Boundary Patterns:
 * Detects acute physical symptoms or medication adjustments that strictly require
 * immediate caregiver/emergency redirection rather than conversational chat.
 */
const EMERGENCY_SYMPTOMS_REGEX = /\b(chest\s*pain|chest\s*hurts|heart\s*attack|cannot\s*breathe|short\s*of\s*breath|difficulty\s*breathing|fainted|passed\s*out|feel\s*very\s*dizzy|dizziness|bleeding|fell\s*down|fallen|severe\s*pain|stroke|numb\s*arm|paralysis)\b/i;
const MED_CHANGE_REGEX = /\b(extra\s*dose|double\s*dose|two\s*pills|another\s*pill|stop\s*taking|change\s*dose|take\s*more|dosage|missed\s*pill\s*take\s*two)\b/i;

/**
 * Checks if a user message warrants an immediate emergency redirect.
 */
export const checkEmergencyIntent = (
  message: string
): { isEmergency: boolean; reason?: string } => {
  if (EMERGENCY_SYMPTOMS_REGEX.test(message)) {
    return {
      isEmergency: true,
      reason: 'Physical symptom distress reported. Emergency redirection triggered.',
    };
  }
  if (MED_CHANGE_REGEX.test(message)) {
    return {
      isEmergency: true,
      reason: 'Medication alteration inquiry. Must be deferred to caregiver or doctor.',
    };
  }
  return { isEmergency: false };
};

/**
 * Parses time string (e.g. "08:30 AM", "3:00 PM") into minutes from midnight.
 */
const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3]?.toUpperCase();

  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Aggregates live patient routine, family notes, and profile context
 * from Supabase with safe fallback to provided localState.
 */
export const buildPatientChatContext = async (
  patientId: string,
  localState?: {
    patient?: any;
    tasks?: RoutineTask[];
    familyMembers?: FamilyMember[];
    language?: string;
  }
): Promise<PatientChatContext> => {
  const p = localState?.patient || {
    name: 'Bhaben Baruah',
    honorific: 'Koka',
    age: 78,
    diagnosis: 'Mild Cognitive Impairment (MCI)',
    location: 'Guwahati, Assam',
    doctorName: 'Dr. Priya Baruah',
    emergencyContact: '+91 98640 12345',
  };

  // 1. Live Tasks Retrieval
  let tasks: RoutineTask[] = [];
  const targetId = patientId && isValidUuid(patientId) ? patientId : '70fde7c0-c85e-4c3d-bc49-8ea172128ebd';
  try {
    tasks = await fetchPatientTasks(targetId);
  } catch (err) {
    console.warn('[Patient AI] fetchPatientTasks notice, using local state:', err);
  }

  if ((!tasks || tasks.length === 0) && localState?.tasks && localState.tasks.length > 0) {
    tasks = localState.tasks;
  }

  if (!tasks || tasks.length === 0) {
    tasks = [
      { id: '1', title: 'Take Morning Blood Pressure Medicine', time: '08:00 AM', timeStr: '08:00 AM', isCompleted: true, completed: true, type: 'medicine', category: 'medication', description: '1 tablet with a warm glass of water' },
      { id: '2', title: 'Drink Warm Water & Lemon', time: '08:30 AM', timeStr: '08:30 AM', isCompleted: true, completed: true, type: 'hydration', category: 'hydration', description: 'Fresh water' },
      { id: '3', title: 'Morning Walk in Garden', time: '10:30 AM', timeStr: '10:30 AM', isCompleted: false, completed: false, type: 'exercise', category: 'exercise', description: '15-minute gentle stroll' },
      { id: '4', title: 'Play Cultural Memory Game with Rongmon', time: '03:30 PM', timeStr: '03:30 PM', isCompleted: false, completed: false, type: 'game', category: 'game', description: 'Match North-East cards' },
      { id: '5', title: 'Evening Hydration & Herbal Tea', time: '05:30 PM', timeStr: '05:30 PM', isCompleted: false, completed: false, type: 'hydration', category: 'hydration', description: 'Assam tea' },
    ];
  }

  // 2. Family Members Retrieval
  let familyMembers: FamilyMember[] = [];
  try {
    familyMembers = await fetchFamilyMembers(targetId);
  } catch {
    // fallback
  }

  if ((!familyMembers || familyMembers.length === 0) && localState?.familyMembers && localState.familyMembers.length > 0) {
    familyMembers = localState.familyMembers;
  }

  if (!familyMembers || familyMembers.length === 0) {
    familyMembers = [
      { id: 'priya', name: 'Dr. Priya Baruah', relation: 'Daughter', localRelation: 'জী (Daughter)', age: 36, avatarColor: '#10B981', avatarIcon: 'doctor', voiceMessage: "Nomoskar Deuta! I have kept your blood pressure medicine ready. Rest comfortably.", lastSpokenDate: 'Today, 7:45 AM', funFact: 'Checks on Deuta three times a day.' },
      { id: 'rahul', name: 'Rahul Baruah', relation: 'Grandson', localRelation: 'নাতি (Grandson)', age: 14, avatarColor: '#F59E0B', avatarIcon: 'boy', voiceMessage: "Pranam Koka! I scored two goals today. Drink your water!", lastSpokenDate: 'Today, 8:15 AM', funFact: 'Loves Koka homemade rice cakes.' },
    ];
  }

  const completedTasks = tasks.filter((t) => t.completed || t.isCompleted);
  const pendingTasks = tasks.filter((t) => !t.completed && !t.isCompleted);

  // Determine current clock and next upcoming task
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sortedPending = [...pendingTasks].sort(
    (a, b) => parseTimeToMinutes(a.timeStr || a.time) - parseTimeToMinutes(b.timeStr || b.time)
  );

  const nextUpcomingTask = sortedPending.find(
    (t) => parseTimeToMinutes(t.timeStr || t.time) >= currentMinutes
  ) || sortedPending[0] || null;

  const currentPeriod: 'morning' | 'afternoon' | 'evening' =
    now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';

  return {
    patient: {
      name: p.name || 'Bhaben Baruah',
      honorific: p.honorific || 'Koka',
      age: p.age || 78,
      diagnosis: p.diagnosis || 'Mild Cognitive Impairment (MCI)',
      location: p.location || 'Guwahati, Assam',
      primaryCaregiver: p.doctorName || 'Dr. Priya Baruah (Daughter)',
      emergencyContact: p.emergencyContact || '+91 98640 12345',
      preferredLanguage: localState?.language || 'English',
    },
    tasks,
    completedTasks,
    pendingTasks,
    nextUpcomingTask,
    familyMembers,
    currentTimeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    currentPeriod,
  };
};

/**
 * Builds the strict, clinical-grade safety System Prompt for Google Gemini
 */
export const buildPatientAssistantSystemPrompt = (ctx: PatientChatContext): string => {
  const taskListSummary = ctx.tasks
    .map(
      (t) =>
        `- [${(t.completed || t.isCompleted) ? 'DONE' : 'PENDING'}] ${t.title} at ${t.timeStr || t.time} (${t.description || t.notes || 'Routine activity'})`
    )
    .join('\n');

  const familyListSummary = ctx.familyMembers
    .map(
      (f) =>
        `- ${f.name} (${f.relation || f.relationship}): Quote/Message: "${f.quote || f.voiceMessage || 'Thinking of you always.'}"`
    )
    .join('\n');

  const nextTaskText = ctx.nextUpcomingTask
    ? `Next scheduled task is "${ctx.nextUpcomingTask.title}" at ${ctx.nextUpcomingTask.timeStr || ctx.nextUpcomingTask.time}.`
    : 'All scheduled routine tasks for today have been completed.';

  return `
You are "Sanjivni Saathi" (সঞ্জীৱনী সাৰথী / संजीवनी साथी), a loving, patient, and respectful elder-care AI companion for ${ctx.patient.honorific} ${ctx.patient.name} (Age ${ctx.patient.age}).
${ctx.patient.honorific} has mild cognitive impairment (MCI) and lives comfortably at home in ${ctx.patient.location}.
His daughter and primary caregiver is ${ctx.patient.primaryCaregiver} (Emergency: ${ctx.patient.emergencyContact}).

==================== CRITICAL SAFETY & CLINICAL GUARDRAILS ====================
1. MEDICAL BOUNDARY (ZERO DIAGNOSIS / ZERO DOSAGE ADVICE):
   - You must NEVER give medical diagnoses, prescribe drugs, or advise changing medication dosages.
   - If ${ctx.patient.honorific} mentions physical pain, chest tightness, dizziness, difficulty breathing, feeling like fainting, or asking if they should take extra medicine:
     DO NOT GIVE CLINICAL ADVICE. Immediately respond with calm reassurance:
     "Please sit down comfortably, Koka. I am notifying your daughter ${ctx.patient.primaryCaregiver} right now. If you feel very unwell, please press the red SOS button on your screen."

2. REALITY ORIENTATION & NON-SYCOPHANCY (COGNITIVE SAFETY):
   - If ${ctx.patient.honorific} expresses confusion, false memories, or disorientation (e.g., "I must go to the railway office", "Where is my mother?", "Am I late for school?"):
     * DO NOT argue, criticize, or sharply correct him.
     * DO NOT validate or feed into hallucinations or delusions.
     * Gently validate the emotional feeling, provide warmth, and steer him softly to the present moment and his safe home:
       "You are safe and peaceful here at home in ${ctx.patient.location}, Koka. There is no rush to go anywhere today. Let us relax and look at your routine together."

3. BREVITY & LARGE-TEXT READABILITY:
   - Keep answers SHORT: 1 to 3 sentences maximum.
   - Speak with deep respect and warmth, using polite honorifics ("Pranam Koka", "Koka", "Nomoskar").
   - Use simple, positive, comforting words. Avoid jargon, bullet points, or complex reasoning.

4. GROUNDING IN VERIFIED SCHEDULE & FAMILY:
   - Today is currently ${ctx.currentPeriod} (${ctx.currentTimeStr}).
   - When asked "What should I do now?", answer: "${nextTaskText}"
   - When asked about medication, refer STRICTLY to today's schedule below.

==================== TODAY'S VERIFIED SCHEDULE ====================
${taskListSummary}

==================== FAMILY MEMBERS & MESSAGES ====================
${familyListSummary}
`.trim();
};

/**
 * Local Fallback Scripted Engine:
 * Generates immediate, compassionate, clinically safe replies grounded in live data
 * if Google Gemini API key is missing or offline.
 */
export const generateLocalPatientFallback = (
  userMessage: string,
  ctx: PatientChatContext
): PatientAiResponse => {
  const q = userMessage.toLowerCase().trim();

  // 1. Emergency or Medical Symptom check
  const emergencyCheck = checkEmergencyIntent(userMessage);
  if (emergencyCheck.isEmergency) {
    return {
      text: `Please sit down comfortably, ${ctx.patient.honorific}. I am alerting your daughter ${ctx.patient.primaryCaregiver} right away. If you feel severe discomfort, please press the red SOS button on your screen.`,
      isEmergency: true,
      emergencyReason: emergencyCheck.reason,
      suggestedAction: 'sos',
      isLiveGemini: false,
    };
  }

  // 2. Next task / What should I do?
  if (q.includes('next') || q.includes('what should i do') || q.includes('what to do') || q.includes('schedule') || q.includes('routine') || q.includes('now')) {
    if (ctx.nextUpcomingTask) {
      return {
        text: `Pranam ${ctx.patient.honorific}! Your next routine is "${ctx.nextUpcomingTask.title}" at ${ctx.nextUpcomingTask.timeStr || ctx.nextUpcomingTask.time}. Take your time, there is no hurry.`,
        isEmergency: false,
        suggestedAction: 'view_routine',
        isLiveGemini: false,
      };
    }
    return {
      text: `Pranam ${ctx.patient.honorific}! You have completed all your scheduled tasks for today. You can relax in the veranda or listen to your family messages.`,
      isEmergency: false,
      suggestedAction: 'view_routine',
      isLiveGemini: false,
    };
  }

  // 3. Medication status
  if (q.includes('medicine') || q.includes('tablet') || q.includes('pill') || q.includes('bp') || q.includes('dose')) {
    const medTasks = ctx.tasks.filter((t) => t.category === 'medication' || t.type === 'medicine');
    const takenMeds = medTasks.filter((t) => t.completed || t.isCompleted);
    const pendingMeds = medTasks.filter((t) => !t.completed && !t.isCompleted);

    if (pendingMeds.length === 0) {
      return {
        text: `All your scheduled medicines for today have been completed, ${ctx.patient.honorific}. Everything is on track and your caregiver has been notified.`,
        isEmergency: false,
        suggestedAction: 'view_routine',
        isLiveGemini: false,
      };
    }

    const nextMed = pendingMeds[0];
    const takenCount = takenMeds.length;
    return {
      text: `You have taken ${takenCount} medicine task${takenCount === 1 ? '' : 's'} today, ${ctx.patient.honorific}. Next is "${nextMed.title}" scheduled for ${nextMed.timeStr || nextMed.time}.`,
      isEmergency: false,
      suggestedAction: 'view_routine',
      isLiveGemini: false,
    };
  }

  // 4. Family members inquiry
  if (q.includes('family') || q.includes('children') || q.includes('priya') || q.includes('rahul') || q.includes('bikash') || q.includes('ananya') || q.includes('who is')) {
    const firstMember = ctx.familyMembers[0];
    const memberName = firstMember?.name || 'Dr. Priya';
    const quote = firstMember?.quote || firstMember?.voiceMessage || 'Thinking of you always, Deuta.';
    return {
      text: `Your loving family is always close to you, ${ctx.patient.honorific}. ${memberName} sent a sweet voice note today: "${quote}"`,
      isEmergency: false,
      suggestedAction: 'view_family',
      isLiveGemini: false,
    };
  }

  // 5. Restlessness, anxiety, disorientation
  if (q.includes('restless') || q.includes('anxious') || q.includes('worried') || q.includes('afraid') || q.includes('where am i') || q.includes('scared') || q.includes('office') || q.includes('work')) {
    return {
      text: `You are safe and peaceful at home in ${ctx.patient.location}, ${ctx.patient.honorific}. Take a slow, gentle breath. Your family loves you, and everything is in order.`,
      isEmergency: false,
      isLiveGemini: false,
    };
  }

  // 6. Polite greeting / general comforting reply
  return {
    text: `Pranam ${ctx.patient.honorific}! I am your Sanjivni Saathi. I am right here with you to help with your daily routine, family memories, or anything you need.`,
    isEmergency: false,
    isLiveGemini: false,
  };
};

/**
 * Sends a patient query to the Patient Companion AI ("Sanjivni Saathi").
 * Employs Google Gemini (gemini-2.5-flash) with clinical safety pre-screening
 * and resilient local fallback.
 */
export const sendPatientAiChat = async (
  userMessage: string,
  patientId: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }> = [],
  localState?: any
): Promise<PatientAiResponse> => {
  const context = await buildPatientChatContext(patientId, localState);

  // Pre-screen for emergency symptoms or medication alteration inquiries
  const emergencyPreCheck = checkEmergencyIntent(userMessage);
  if (emergencyPreCheck.isEmergency) {
    return {
      text: `Please sit down comfortably, ${context.patient.honorific}. I am alerting your caregiver ${context.patient.primaryCaregiver} right now. If you feel severe discomfort, please press the red SOS button.`,
      isEmergency: true,
      emergencyReason: emergencyPreCheck.reason,
      suggestedAction: 'sos',
      isLiveGemini: false,
    };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.trim() === '') {
    return generateLocalPatientFallback(userMessage, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildPatientAssistantSystemPrompt(context);

    // Multi-turn conversational structure
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

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: 250, // enforce conciseness
        },
      });
    } catch (modelErr: any) {
      console.warn('[Patient AI] gemini-2.5-flash fallback:', modelErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: 250,
        },
      });
    }

    const responseText = response?.text?.trim() || '';
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    // Post-generation check: verify model didn't suggest emergency/dosage
    const postCheck = checkEmergencyIntent(responseText);

    return {
      text: responseText,
      isEmergency: postCheck.isEmergency,
      emergencyReason: postCheck.reason,
      suggestedAction: postCheck.isEmergency ? 'sos' : undefined,
      isLiveGemini: true,
    };
  } catch (err: any) {
    console.warn('[Patient AI] Gemini API call notice, using local safety engine:', err?.message || err);
    return generateLocalPatientFallback(userMessage, context);
  }
};
