import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { soundFx } from '../utils/audio';
import { SupportedLanguage, getTranslation, getLocalizedFamily, getLocalizedPatient } from '../utils/i18n';
import { deviceNotifications } from '../utils/notifications';
import { NERStateId } from '../utils/nerData';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  fetchUserProfile,
  isValidUuid,
  resolveToValidUuid,
  toNullableUuid,
  DEFAULT_DEMO_PATIENT_UUID,
  fetchFamilyMembers,
  fetchPatientTasks,
  seedDefaultPatientTasks,
  addPatientTask,
  createTask,
  addCaregiverMember,
  addPatient,
  linkPatientToCaregiver,
  fetchCaregiverPatients,
  fetchCaregiverTeam,
  addFamilyMemberDb,
  deletePatientTask,
  toggleTaskCompletion as toggleTaskCompletionDb,
  calculateDynamicMmse,
  fetchPatientTelemetry,
  savePatientTelemetry,
  recordGameSessionInDb,
  PatientProfileRecord,
} from '../lib/supabaseDb';
import {
  LocationData,
  WeatherData,
  DEFAULT_NER_LOCATION,
  DEFAULT_WEATHER,
  fetchLiveWeather,
  getDevicePosition,
  reverseGeocode,
  formatFriendlyLocation,
  isCoordinateString,
  NER_STATE_CAPITALS,
} from '../utils/locationWeather';

export type { SupportedLanguage, NERStateId, LocationData, WeatherData };

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  relationship?: string;
  localRelation: string;
  age: number;
  avatarColor: string;
  avatarIcon: string;
  voiceMessage: string;
  quote?: string;
  description?: string;
  lastSpokenDate: string;
  funFact: string;
  avatarUrl?: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  time: string;
  timeStr: string;
  isCompleted: boolean;
  completed: boolean;
  type: 'medicine' | 'activity' | 'hydration' | 'food' | 'exercise' | 'game';
  category: 'medication' | 'hydration' | 'exercise' | 'food' | 'game';
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  period?: 'morning' | 'afternoon' | 'evening';
  time_slot?: string;
  description: string;
  notes?: string;
  titleKey?: string;
  descKey?: string;
}

export interface GameScoreRecord {
  id: string;
  game: string;
  date: string;
  score: number;
  moves?: number;
  timeSeconds: number;
  accuracy: number;
}

export interface GeofenceState {
  isSafe: boolean;
  isSimulatingWandering: boolean;
  safeZoneCenter: {
    lat: number;
    lng: number;
    radiusMeters: number;
    address: string;
  };
  currentLocation: {
    lat: number;
    lng: number;
    lastUpdated: string;
    batteryLevel: number;
    currentAddress: string;
  };
  sosActive: boolean;
  alertPayload: {
    timestamp: string;
    message: string;
    recipientPhone: string;
    smsDelivered: boolean;
  } | null;
}

interface AppContextType {
  currentRoute: 'app' | 'login';
  setCurrentRoute: (route: 'app' | 'login') => void;
  isLoggedIn: boolean;
  authLoading: boolean;
  user: { name: string; email: string; avatar: string } | null;
  loginWithGoogle: (userData?: { name: string; email: string; avatar: string }) => void;
  logout: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  t: (key: string) => string;
  selectedRegion: NERStateId;
  setSelectedRegion: (region: NERStateId) => void;
  isRegionModalOpen: boolean;
  setRegionModalOpen: (open: boolean) => void;
  isSpotlightActive: boolean;
  spotlightStep: number;
  startSpotlightTour: () => void;
  nextSpotlightStep: () => void;
  prevSpotlightStep: () => void;
  closeSpotlightTour: () => void;
  isUserManualOpen: boolean;
  setUserManualOpen: (open: boolean) => void;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  scheduleTaskReminder: (task: RoutineTask) => boolean;
  userRole: 'patient' | 'caregiver' | null;
  connectionCode: string;
  isPaired: boolean;
  isRoleModalOpen: boolean;
  setIsRoleModalOpen: (open: boolean) => void;
  selectRole: (role: 'patient' | 'caregiver', code?: string) => boolean;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  isProfileSettingsOpen: boolean;
  setIsProfileSettingsOpen: (open: boolean) => void;
  isCaregiverWizardOpen: boolean;
  setIsCaregiverWizardOpen: (open: boolean) => void;
  isPatientWaitingForCaregiver: boolean;
  setIsPatientWaitingForCaregiver: (waiting: boolean) => void;
  activePatientId: string | null;
  isLoadingFamily: boolean;
  refreshFamilyMembers: () => Promise<void>;
  updateCustomFamilyMembers: (members: FamilyMember[]) => void;
  updateCustomTasks: (tasks: RoutineTask[]) => void;
  updatePatientProfile: (profile: { name?: string; avatar?: string }) => void;
  mode: 'patient' | 'caregiver';
  setMode: (mode: 'patient' | 'caregiver') => void;
  patientTab: 'reminisce' | 'games' | 'routine';
  setPatientTab: (tab: 'reminisce' | 'games' | 'routine') => void;
  patient: {
    name: string;
    honorific: string;
    age: number;
    location: string;
    diagnosis: string;
    bloodGroup: string;
    emergencyContact: string;
    doctorName: string;
    clinic: string;
  };
  currentPatient: {
    id: string;
    name: string;
    honorific: string;
    age: number;
    location: string;
    diagnosis: string;
    bloodGroup: string;
    emergencyContact: string;
    doctorName: string;
    clinic: string;
  };
  activeCaregiver: {
    id: string;
    name: string;
    role: 'caregiver';
  };
  familyMembers: FamilyMember[];
  tasks: RoutineTask[];
  addTask: (task: any) => Promise<void> | void;
  addMember: (member: any) => Promise<void>;
  createTask: (taskData: any) => Promise<RoutineTask>;
  addCaregiverMember: (memberData: any) => Promise<FamilyMember>;
  addPatient: (patientData: any) => Promise<PatientProfileRecord>;
  linkPatientToCaregiver: (caregiverId: string, patientId: string) => Promise<{ success: boolean; error?: string }>;
  fetchCaregiverPatients: (caregiverId: string) => Promise<PatientProfileRecord[]>;
  fetchCaregiverTeam: (caregiverId: string) => Promise<any[]>;
  deleteTask: (id: string) => Promise<void>;
  restoreDefaultTasks: () => Promise<void>;
  toggleTaskCompletion: (id: string) => void;
  toggleTask: (id: string) => void;
  streak: number;
  totalStars: number;
  mmseScore: number;
  gameHistory: GameScoreRecord[];
  recordGameCompletion: (gameName: string, score: number, moves: number, timeSec: number, accuracy: number) => void;
  geofence: GeofenceState;
  toggleWanderingSimulation: () => void;
  dismissSOS: () => void;
  locationData: LocationData;
  weatherData: WeatherData;
  isLocationLoading: boolean;
  requestLocationAccess: () => Promise<boolean>;
  refreshLocationAndWeather: () => Promise<void>;
}

const INITIAL_FAMILY: FamilyMember[] = [
  {
    id: 'rahul',
    name: 'Rahul Baruah',
    relation: 'Grandson',
    localRelation: 'নাতি (Grandson)',
    age: 14,
    avatarColor: '#F59E0B',
    avatarIcon: 'boy',
    voiceMessage: "Pranam Koka! It's your grandson Rahul. I scored two goals in football today! I'm bringing your favorite sweets this Sunday. Please drink your water and smile!",
    lastSpokenDate: 'Today, 8:15 AM',
    funFact: 'Plays striker in school football and loves eating Koka’s homemade rice cakes.'
  },
  {
    id: 'priya',
    name: 'Dr. Priya Baruah',
    relation: 'Daughter',
    localRelation: 'জী (Daughter)',
    age: 36,
    avatarColor: '#10B981',
    avatarIcon: 'doctor',
    voiceMessage: "Nomoskar Deuta! It's Priya. I have kept your morning blood pressure tablet on the verandah table. Have your hot ginger Assam tea and rest comfortably.",
    lastSpokenDate: 'Today, 7:45 AM',
    funFact: 'Cardiologist at Dispur Hospital; checks on Deuta three times a day.'
  },
  {
    id: 'bikash',
    name: 'Bikash Baruah',
    relation: 'Son',
    localRelation: 'পুত্ৰ (Son)',
    age: 42,
    avatarColor: '#3B82F6',
    avatarIcon: 'engineer',
    voiceMessage: "Nomoskar Pitaji! I spoke with your gardener today, and the winter marigolds look blooming and bright. I will visit this evening after work.",
    lastSpokenDate: 'Yesterday, 6:30 PM',
    funFact: 'Civil Engineer with Assam PWD; loves talking politics with Koka.'
  },
  {
    id: 'ananya',
    name: 'Ananya Baruah',
    relation: 'Granddaughter',
    localRelation: 'নাতিনী (Granddaughter)',
    age: 9,
    avatarColor: '#EC4899',
    avatarIcon: 'girl',
    voiceMessage: "Hi Koka! I drew a big colorful picture of Rongmon the baby rhino in drawing class! I am keeping it on your bed table when I come home from school!",
    lastSpokenDate: 'Yesterday, 5:00 PM',
    funFact: 'Loves listening to Koka’s bedtime tales of the Kaziranga forest.'
  }
];

const INITIAL_TASKS: RoutineTask[] = [
  {
    id: 'task-1',
    time: '08:30 AM',
    timeStr: '08:30 AM',
    time_slot: '08:30 AM',
    timeOfDay: 'morning',
    period: 'morning',
    title: 'Morning Medication & Glass of Water',
    description: 'Take prescribed morning medicines with a full glass of fresh water.',
    notes: 'Take prescribed morning medicines with a full glass of fresh water.',
    type: 'medicine',
    category: 'medication',
    isCompleted: false,
    completed: false,
  },
  {
    id: 'task-2',
    time: '11:00 AM',
    timeStr: '11:00 AM',
    time_slot: '11:00 AM',
    timeOfDay: 'morning',
    period: 'morning',
    title: 'Gentle Cognitive Exercise / Memory Game',
    description: 'Play North-East cultural memory cards with Rongmon to stimulate recall.',
    notes: 'Play North-East cultural memory cards with Rongmon to stimulate recall.',
    type: 'activity',
    category: 'game',
    isCompleted: false,
    completed: false,
  },
  {
    id: 'task-3',
    time: '01:30 PM',
    timeStr: '01:30 PM',
    time_slot: '01:30 PM',
    timeOfDay: 'afternoon',
    period: 'afternoon',
    title: 'Afternoon Rest & Hydration',
    description: 'Rest peacefully and drink a glass of lukewarm water or herbal tea.',
    notes: 'Rest peacefully and drink a glass of lukewarm water or herbal tea.',
    type: 'hydration',
    category: 'hydration',
    isCompleted: false,
    completed: false,
  },
  {
    id: 'task-4',
    time: '08:00 PM',
    timeStr: '08:00 PM',
    time_slot: '08:00 PM',
    timeOfDay: 'evening',
    period: 'evening',
    title: 'Evening Medication',
    description: 'Take evening multivitamin and prescribed night dose after dinner.',
    notes: 'Take evening multivitamin and prescribed night dose after dinner.',
    type: 'medicine',
    category: 'medication',
    isCompleted: false,
    completed: false,
  }
];

const INITIAL_GAMES: GameScoreRecord[] = [
  { id: 'g-1', game: 'Picture Matching (Assam)', date: 'Yesterday', score: 100, moves: 8, timeSeconds: 42, accuracy: 94 },
  { id: 'g-2', game: 'Guess the Picture', date: 'Yesterday', score: 90, moves: 5, timeSeconds: 38, accuracy: 100 },
  { id: 'g-3', game: 'Match the Order', date: '2 days ago', score: 95, moves: 10, timeSeconds: 49, accuracy: 88 },
  { id: 'g-4', game: 'Picture Matching', date: '3 days ago', score: 100, moves: 5, timeSeconds: 35, accuracy: 100 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const [currentRoute, setCurrentRouteState] = useState<'app' | 'login'>(() => {
    return auth.isLoggedIn ? 'app' : 'login';
  });

  const isLoggedIn = auth.isLoggedIn;
  const user = auth.appUser
    ? {
      name: auth.appUser.name,
      email: auth.appUser.email,
      avatar: auth.appUser.avatar,
    }
    : null;

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('smriti_lang') : null;
    return (saved as SupportedLanguage) || 'en';
  });

  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smriti_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
    return 'system';
  });

  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const [selectedRegion, setSelectedRegionState] = useState<NERStateId>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('smriti_region') : null;
    return (saved as NERStateId) || 'assam';
  });

  const [isRegionModalOpen, setRegionModalOpen] = useState<boolean>(false);
  const [isUserManualOpen, setUserManualOpen] = useState<boolean>(false);

  // Interactive Spotlight Tour State
  const [isSpotlightActive, setIsSpotlightActive] = useState<boolean>(false);
  const [spotlightStep, setSpotlightStep] = useState<number>(0);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    deviceNotifications.getPermissionStatus()
  );

  const [userRole, setUserRole] = useState<'patient' | 'caregiver' | null>(() => {
    return (typeof window !== 'undefined' ? (localStorage.getItem('smriti_user_role') as any) : null) || null;
  });
  const [connectionCode, setConnectionCode] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('smriti_conn_code') : null;
    return saved || '849201';
  });
  const [isPaired, setIsPaired] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('smriti_is_paired') === 'true' : false;
  });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isCaregiverWizardOpen, setIsCaregiverWizardOpen] = useState<boolean>(false);
  const [isPatientWaitingForCaregiver, setIsPatientWaitingForCaregiver] = useState<boolean>(false);

  const [mode, setModeState] = useState<'patient' | 'caregiver'>('patient');
  const [patientTab, setPatientTab] = useState<'reminisce' | 'games' | 'routine'>('reminisce');

  // Active Patient ID resolution (for patient view and caregiver view)
  const activePatientId = useMemo<string | null>(() => {
    // 1. If caregiver mode or user is caregiver: MUST use linked patient ID
    if (userRole === 'caregiver' || mode === 'caregiver') {
      if (typeof window !== 'undefined') {
        const linkedId = localStorage.getItem('smriti_linked_patient_id');
        if (linkedId && linkedId !== 'demo-patient-koka' && isValidUuid(linkedId)) return linkedId;
      }
      return '70fde7c0-c85e-4c3d-bc49-8ea172128ebd';
    }

    // 2. If authenticated Supabase user (patient)
    if (auth.user?.id && isValidUuid(auth.user.id)) {
      return auth.user.id;
    }

    // 3. If appUser has an ID and not demo
    if (auth.appUser?.id && auth.appUser.id !== 'demo-patient' && isValidUuid(auth.appUser.id)) {
      return auth.appUser.id;
    }

    // 4. If stored patient profile in localStorage
    if (typeof window !== 'undefined') {
      const savedPatient = localStorage.getItem('smriti_patient_profile');
      if (savedPatient) {
        try {
          const parsed = JSON.parse(savedPatient);
          if (parsed?.id && parsed.id !== 'demo-patient' && isValidUuid(parsed.id)) return parsed.id;
        } catch (e) {
          // ignore
        }
      }
      const linkedId = localStorage.getItem('smriti_linked_patient_id');
      if (linkedId && linkedId !== 'demo-patient-koka' && isValidUuid(linkedId)) return linkedId;
    }

    return '70fde7c0-c85e-4c3d-bc49-8ea172128ebd';
  }, [auth.user?.id, auth.appUser?.id, userRole, mode]);

  const [isLoadingFamily, setIsLoadingFamily] = useState<boolean>(false);

  const [customFamilyMembers, setCustomFamilyMembers] = useState<FamilyMember[] | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smriti_custom_family');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  });

  const loadFamilyMembersFromDb = useCallback(async (targetPatientId?: string | null) => {
    const idToQuery = targetPatientId || activePatientId;
    if (!idToQuery || idToQuery === 'demo-patient-koka') {
      return;
    }

    try {
      setIsLoadingFamily(true);
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('patient_id', idToQuery)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[AppContext] Error querying family_members from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const avatarColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
        const mapped: FamilyMember[] = data.map((row: any, index: number) => ({
          id: row.id,
          name: row.name,
          relation: row.relation,
          localRelation: row.local_relation || `${row.relation} • Family Member`,
          age: row.age || 30,
          avatarColor: row.avatar_color || avatarColors[index % avatarColors.length],
          avatarIcon: 'user' as const,
          voiceMessage: row.voice_message || `Pranam! Remember that our family is always with you. Keep smiling!`,
          lastSpokenDate: 'Recently added',
          funFact: row.fun_fact || `Loves spending time together with the family.`,
          avatarUrl: row.avatar_url || undefined,
        }));

        setCustomFamilyMembers(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smriti_custom_family', JSON.stringify(mapped));
        }
      } else if (data && data.length === 0) {
        // Explicitly set to empty array so demo cards are NOT shown for linked/authenticated patient
        setCustomFamilyMembers([]);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smriti_custom_family', JSON.stringify([]));
        }
      }
    } catch (err) {
      console.warn('[AppContext] loadFamilyMembersFromDb exception:', err);
    } finally {
      setIsLoadingFamily(false);
    }
  }, [activePatientId]);

  const refreshFamilyMembers = useCallback(async () => {
    await loadFamilyMembersFromDb();
  }, [loadFamilyMembersFromDb]);

  // Tasks Database Loader & Telemetry Realtime Sync
  const loadTasksFromDb = useCallback(async (targetPatientId?: string | null) => {
    const idToQuery = targetPatientId || activePatientId;
    if (!idToQuery || idToQuery === 'demo-patient-koka' || !isValidUuid(idToQuery)) {
      return;
    }

    try {
      let resolvedTasks: RoutineTask[] = [];
      const liveTasks = await fetchPatientTasks(idToQuery);
      if (liveTasks && liveTasks.length > 0) {
        resolvedTasks = liveTasks;
        setTasks(liveTasks);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smriti_tasks', JSON.stringify(liveTasks));
        }
      } else {
        const seeded = await seedDefaultPatientTasks(idToQuery);
        resolvedTasks = seeded;
        setTasks(seeded);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smriti_tasks', JSON.stringify(seeded));
        }
      }

      // Synchronize streak, totalStars, and MMSE stability score with Supabase
      const telemetry = await fetchPatientTelemetry(idToQuery);
      if (telemetry) {
        setStreak(telemetry.streak);
        setTotalStars(telemetry.totalStars);
        setMmseScore(telemetry.mmseScore);
      } else if (resolvedTasks.length > 0) {
        const dynamicMmse = calculateDynamicMmse(resolvedTasks, 90);
        setMmseScore(dynamicMmse);
        await savePatientTelemetry(idToQuery, {
          streak: 5,
          totalStars: 240,
          mmseScore: dynamicMmse,
        });
      }
    } catch (err) {
      console.warn('[AppContext] loadTasksFromDb exception:', err);
    }
  }, [activePatientId]);

  // Initial and reactive load from Supabase whenever activePatientId is resolved
  useEffect(() => {
    if (activePatientId) {
      loadFamilyMembersFromDb(activePatientId);
      loadTasksFromDb(activePatientId);
    }
  }, [activePatientId, loadFamilyMembersFromDb, loadTasksFromDb]);

  // If caregiver is logged in, check profile for linked_patient_id if not yet in localStorage
  useEffect(() => {
    const resolveCaregiverLinked = async () => {
      if (auth.user?.id && userRole === 'caregiver') {
        const profile = await fetchUserProfile(auth.user.id);
        if (profile?.linked_patient_id) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('smriti_linked_patient_id', profile.linked_patient_id);
          }
          loadFamilyMembersFromDb(profile.linked_patient_id);
          loadTasksFromDb(profile.linked_patient_id);
        }
      }
    };
    resolveCaregiverLinked();
  }, [auth.user?.id, userRole, loadFamilyMembersFromDb, loadTasksFromDb]);

  // Realtime Live Sync: Listen for changes to family_members table for activePatientId
  useEffect(() => {
    if (!activePatientId || activePatientId === 'demo-patient-koka' || !isValidUuid(activePatientId)) {
      return;
    }

    const channel = supabase
      .channel(`realtime_family_${activePatientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_members',
          filter: `patient_id=eq.${activePatientId}`,
        },
        () => {
          loadFamilyMembersFromDb(activePatientId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePatientId, loadFamilyMembersFromDb]);

  // Realtime Live Sync: Listen for changes to patient_tasks and routine_tasks table
  useEffect(() => {
    if (!activePatientId || activePatientId === 'demo-patient-koka' || !isValidUuid(activePatientId)) {
      return;
    }

    const channel = supabase
      .channel(`realtime_app_tasks_${activePatientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_tasks',
          filter: `patient_id=eq.${activePatientId}`,
        },
        () => {
          loadTasksFromDb(activePatientId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routine_tasks',
          filter: `patient_id=eq.${activePatientId}`,
        },
        () => {
          loadTasksFromDb(activePatientId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePatientId, loadTasksFromDb]);

  const DEMO_FAMILY_IDS = useMemo(() => new Set(['rahul', 'priya', 'bikash', 'ananya']), []);

  // Determine whether running in an unauthenticated offline demo sandbox
  const isOfflineDemoSandbox = useMemo(() => {
    if (auth.user?.id) return false;
    if (activePatientId && isValidUuid(activePatientId)) return false;
    if (isPaired && connectionCode !== '849201') return false;
    return true;
  }, [auth.user?.id, activePatientId, isPaired, connectionCode]);

  const localizedFamily = React.useMemo(() => getLocalizedFamily(language), [language]);

  const familyMembers = React.useMemo(() => {
    // 1. If custom family members exist (from Supabase query or localStorage cache)
    if (customFamilyMembers !== null) {
      // If NOT in demo sandbox, strictly use custom members (never fall back to 4 demo cards)
      if (!isOfflineDemoSandbox) {
        return customFamilyMembers.filter((m) => !DEMO_FAMILY_IDS.has(m.id));
      }

      // If in demo sandbox, use custom members if available
      if (customFamilyMembers.length > 0) {
        return customFamilyMembers;
      }
    }

    // 2. Only fall back to localized demo cards if explicitly in offline demo sandbox
    if (isOfflineDemoSandbox) {
      return localizedFamily;
    }

    return [];
  }, [customFamilyMembers, localizedFamily, isOfflineDemoSandbox, DEMO_FAMILY_IDS]);

  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    if (typeof window !== 'undefined') {
      const savedVersion = localStorage.getItem('smriti_tasks_version');
      if (savedVersion === '2.0') {
        const saved = localStorage.getItem('smriti_tasks');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch {
            // ignore
          }
        }
      } else {
        localStorage.setItem('smriti_tasks_version', '2.0');
        localStorage.setItem('smriti_tasks', JSON.stringify(INITIAL_TASKS));
      }
    }
    return INITIAL_TASKS;
  });

  const [customPatient, setCustomPatient] = useState<{ name?: string; avatar?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const savedPatient = localStorage.getItem('smriti_patient_profile');
      const savedAvatar = localStorage.getItem('smriti_patient_avatar');
      if (savedPatient || savedAvatar) {
        try {
          const parsed = savedPatient ? JSON.parse(savedPatient) : {};
          return { name: parsed.username, avatar: savedAvatar || parsed.avatar_url };
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  });

  const localizedPatient = React.useMemo(() => getLocalizedPatient(language), [language]);
  const patient = React.useMemo(() => {
    return {
      ...localizedPatient,
      ...(customPatient?.name ? { name: customPatient.name } : {}),
      ...(customPatient?.avatar ? { avatar: customPatient.avatar } : {}),
    };
  }, [localizedPatient, customPatient]);
  const [streak, setStreak] = useState<number>(5);
  const [totalStars, setTotalStars] = useState<number>(240);
  const [mmseScore, setMmseScore] = useState<number>(25.8);
  const [gameHistory, setGameHistory] = useState<GameScoreRecord[]>(INITIAL_GAMES);

  const [geofence, setGeofence] = useState<GeofenceState>({
    isSafe: true,
    isSimulatingWandering: false,
    safeZoneCenter: {
      lat: 26.1445,
      lng: 91.7898,
      radiusMeters: 500,
      address: 'Beltola Tiniali, Dispur, Guwahati, Assam 781028',
    },
    currentLocation: {
      lat: 26.1445,
      lng: 91.7898,
      lastUpdated: 'Just now (GPS Synced)',
      batteryLevel: 84,
      currentAddress: 'Home Verandah, Beltola Tiniali',
    },
    sosActive: false,
    alertPayload: null,
  });

  const [locationData, setLocationData] = useState<LocationData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sanjivni_saved_location');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            // Immediately sanitize stored coordinates into a friendly location name
            if (isCoordinateString(parsed.displayName)) {
              parsed.displayName = formatFriendlyLocation(parsed);
              if (isCoordinateString(parsed.city)) {
                parsed.city = parsed.displayName.split(',')[0].trim();
              }
            }
            return parsed;
          }
        } catch { }
      }
    }
    return DEFAULT_NER_LOCATION;
  });

  const [weatherData, setWeatherData] = useState<WeatherData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sanjivni_cached_weather');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return DEFAULT_WEATHER;
  });

  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);

  const requestLocationAccess = async (): Promise<boolean> => {
    setIsLocationLoading(true);
    try {
      const position = await getDevicePosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      soundFx.playSuccessChime();

      // Reverse geocode to get city, neighborhood, state
      const geocoded = await reverseGeocode(lat, lng);
      const friendlyName = formatFriendlyLocation({
        coordinates: { lat, lng },
        displayName: geocoded.displayName,
        city: geocoded.city,
        state: geocoded.state,
        permission: 'granted',
        isLiveGps: true,
      });

      const resolvedCity = geocoded.city && !isCoordinateString(geocoded.city)
        ? geocoded.city
        : friendlyName.split(',')[0].trim();

      const newLocation: LocationData = {
        coordinates: { lat, lng },
        displayName: friendlyName,
        city: resolvedCity,
        state: geocoded.state,
        permission: 'granted',
        isLiveGps: true,
      };

      setLocationData(newLocation);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sanjivni_saved_location', JSON.stringify(newLocation));
      }

      // Update geofence with real coordinates and live address
      setGeofence((prev) => ({
        ...prev,
        currentLocation: {
          ...prev.currentLocation,
          lat,
          lng,
          lastUpdated: 'Just now (Live GPS)',
          currentAddress: friendlyName,
        },
      }));

      // Fetch live weather for detected coordinates
      const liveWeather = await fetchLiveWeather(lat, lng);
      setWeatherData(liveWeather);

      setIsLocationLoading(false);
      return true;
    } catch (err: any) {
      console.warn('Geolocation permission or lookup failed:', err);
      setLocationData((prev) => ({
        ...prev,
        permission: 'denied',
      }));
      setIsLocationLoading(false);
      return false;
    }
  };

  const refreshLocationAndWeather = async () => {
    setIsLocationLoading(true);
    try {
      const weather = await fetchLiveWeather(locationData.coordinates.lat, locationData.coordinates.lng);
      setWeatherData(weather);
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Initialize live weather and auto-detect existing location permissions
  useEffect(() => {
    fetchLiveWeather(locationData.coordinates.lat, locationData.coordinates.lng).then((w) => {
      setWeatherData(w);
    });

    // If initial location has coordinate strings or placeholder names, re-geocode in background
    if (isCoordinateString(locationData.displayName) && locationData.coordinates) {
      reverseGeocode(locationData.coordinates.lat, locationData.coordinates.lng).then((geocoded) => {
        const cleanName = formatFriendlyLocation({
          ...locationData,
          displayName: geocoded.displayName,
          city: geocoded.city,
          state: geocoded.state,
        });
        setLocationData((prev) => {
          const updated: LocationData = {
            ...prev,
            displayName: cleanName,
            city: geocoded.city && !isCoordinateString(geocoded.city) ? geocoded.city : cleanName.split(',')[0].trim(),
            state: geocoded.state || prev.state,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('sanjivni_saved_location', JSON.stringify(updated));
          }
          return updated;
        });
      });
    }

    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            requestLocationAccess();
          }
          status.onchange = () => {
            if (status.state === 'granted') {
              requestLocationAccess();
            }
          };
        })
        .catch(() => { });
    }
  }, []);


  // Synchronize authenticated session, database profiles & role persistence
  useEffect(() => {
    if (auth.loading) return;

    if (auth.isLoggedIn) {
      setCurrentRouteState('app');

      const syncUserProfile = async () => {
        const userId = auth.appUser?.id;
        let roleFound: 'patient' | 'caregiver' | null = null;
        let pairedFound = false;

        // 1. Query Supabase profiles table for live database-persisted role
        if (userId) {
          const profile = await fetchUserProfile(userId);
          if (profile && profile.role) {
            roleFound = profile.role;
            pairedFound = !!profile.is_paired;
            if (profile.connection_code) {
              setConnectionCode(profile.connection_code);
            }
            if (profile.username) {
              setCustomPatient({ name: profile.username, avatar: profile.avatar_url || undefined });
            }
          }
        }

        // 2. Fallback to localStorage if offline or demo user
        if (!roleFound && typeof window !== 'undefined') {
          roleFound = (localStorage.getItem('smriti_user_role') as 'patient' | 'caregiver' | null) || null;
          pairedFound = localStorage.getItem('smriti_is_paired') === 'true';
        }

        // 3. Apply role state or open onboarding
        if (roleFound) {
          setUserRole(roleFound);
          setModeState(roleFound);
          setIsPaired(pairedFound);
          setIsRoleModalOpen(false);
          setIsCaregiverWizardOpen(false);
          setIsPatientWaitingForCaregiver(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smriti_user_role', roleFound);
            localStorage.setItem('smriti_is_paired', String(pairedFound));
          }
        } else {
          // No role assigned yet -> route user to Role Selection Onboarding
          setIsRoleModalOpen(true);
        }
      };

      syncUserProfile();
    } else {
      // Unauthenticated user -> strictly enforce login route
      setCurrentRouteState('login');
      setIsRoleModalOpen(false);
      setIsCaregiverWizardOpen(false);
      setIsPatientWaitingForCaregiver(false);
    }
  }, [auth.isLoggedIn, auth.loading, auth.appUser?.id]);

  // Trigger initial onboarding if new session on mount
  useEffect(() => {
    if (auth.isLoggedIn && !auth.loading && typeof window !== 'undefined') {
      const hasCompleted = localStorage.getItem('smriti_hasCompletedOnboarding');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setIsSpotlightActive(true);
          setSpotlightStep(0);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [auth.isLoggedIn, auth.loading]);

  const setCurrentRoute = (route: 'app' | 'login') => {
    soundFx.playClickSound();
    if (route === 'app' && !auth.isLoggedIn) {
      setCurrentRouteState('login');
      return;
    }
    setCurrentRouteState(route);
  };

  const setMode = (newMode: 'patient' | 'caregiver') => {
    if (mode === newMode) return;
    soundFx.playClickSound();
    setModeState(newMode);
  };

  const setLanguage = (lang: SupportedLanguage) => {
    soundFx.playClickSound();
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_lang', lang);
    }
  };

  const setSelectedRegion = (region: NERStateId) => {
    soundFx.playClickSound();
    setSelectedRegionState(region);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_region', region);
    }

    // If live GPS is not active, update default location & weather to the selected region capital
    const cap = NER_STATE_CAPITALS[region];
    if (cap && !locationData.isLiveGps) {
      const updatedLoc: LocationData = {
        coordinates: { lat: cap.lat, lng: cap.lng },
        displayName: cap.displayName,
        city: cap.city,
        state: cap.state,
        permission: locationData.permission,
        isLiveGps: false,
      };
      setLocationData(updatedLoc);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sanjivni_saved_location', JSON.stringify(updatedLoc));
      }
      fetchLiveWeather(cap.lat, cap.lng).then(setWeatherData);
    }
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    soundFx.playClickSound();
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_theme', newTheme);
    }
  };

  const startSpotlightTour = () => {
    soundFx.playClickSound();
    setModeState('patient');
    setPatientTab('reminisce');
    setSpotlightStep(0);
    setIsSpotlightActive(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const nextSpotlightStep = () => {
    if (spotlightStep >= 5) {
      closeSpotlightTour();
    } else {
      const nextStep = spotlightStep + 1;
      if (nextStep === 4) {
        setPatientTab('games');
      } else if (nextStep === 5) {
        setPatientTab('routine');
      } else {
        setPatientTab('reminisce');
      }
      setSpotlightStep(nextStep);
    }
  };

  const prevSpotlightStep = () => {
    const prev = Math.max(0, spotlightStep - 1);
    if (prev === 4) {
      setPatientTab('games');
    } else if (prev === 5) {
      setPatientTab('routine');
    } else {
      setPatientTab('reminisce');
    }
    setSpotlightStep(prev);
  };

  const closeSpotlightTour = () => {
    soundFx.playSuccessChime();
    setIsSpotlightActive(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_hasCompletedOnboarding', 'true');
    }
  };

  const loginWithGoogle = (userData?: { name: string; email: string; avatar: string }) => {
    soundFx.playSuccessChime();
    if (userData) {
      auth.signInWithDemo(userData);
    } else {
      auth.signInWithGoogle();
    }
  };

  const selectRole = (role: 'patient' | 'caregiver', code?: string): boolean => {
    if (role === 'patient') {
      setUserRole('patient');
      setModeState('patient');
      if (code) {
        setConnectionCode(code);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smriti_conn_code', code);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_user_role', 'patient');
      }
      return true;
    } else {
      // Caregiver pairing logic: valid if code matches, demo code 849201, or valid 6 digits
      const isValid = !code || code === connectionCode || code === '849201' || code.length === 6;
      if (isValid) {
        setUserRole('caregiver');
        setIsPaired(true);
        setModeState('caregiver');
        if (code) {
          setConnectionCode(code);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smriti_conn_code', code);
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('smriti_user_role', 'caregiver');
          localStorage.setItem('smriti_is_paired', 'true');
        }
        return true;
      }
      return false;
    }
  };

  const updateCustomFamilyMembers = (members: FamilyMember[]) => {
    setCustomFamilyMembers(members);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_custom_family', JSON.stringify(members));
    }
  };

  const updateCustomTasks = (newTasks: RoutineTask[]) => {
    setTasks(newTasks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_tasks', JSON.stringify(newTasks));
    }
  };

  const updatePatientProfile = (profile: { name?: string; avatar?: string }) => {
    setCustomPatient(prev => ({ ...prev, ...profile }));
    if (typeof window !== 'undefined') {
      if (profile.avatar) localStorage.setItem('smriti_patient_avatar', profile.avatar);
    }
  };

  const logout = () => {
    soundFx.playClickSound();
    setIsRoleModalOpen(false);
    setIsPinModalOpen(false);
    setIsProfileSettingsOpen(false);
    setIsCaregiverWizardOpen(false);
    setIsPatientWaitingForCaregiver(false);
    setUserRole(null);
    setCurrentRouteState('login');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smriti_user_role');
      localStorage.removeItem('smriti_is_paired');
      localStorage.removeItem('smriti_conn_code');
    }
    auth.signOut();
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    const status = await deviceNotifications.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      soundFx.playSuccessChime();
      deviceNotifications.sendNotification(
        '🔔 SANJIVNI Reminders Activated',
        'Device notifications are now active for Koka’s daily medications and routine.'
      );
    }
    return status;
  };

  const scheduleTaskReminder = (task: RoutineTask): boolean => {
    soundFx.playClickSound();
    const taskName = task.titleKey ? t(task.titleKey) : task.title;
    return deviceNotifications.triggerTaskReminder(taskName, task.timeStr);
  };

  const toggleTaskCompletion = (id: string) => {
    soundFx.playClickSound();
    let nextState = false;
    let previousStatus = false;

    // 1. Instant optimistic local state update
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      if (target) {
        previousStatus = !!(target.isCompleted ?? target.completed);
        nextState = !previousStatus;
        if (nextState) {
          soundFx.playSuccessChime();
        }
      }
      const updated = prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            isCompleted: nextState,
            completed: nextState,
          };
        }
        return t;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_tasks', JSON.stringify(updated));
      }

      // Dynamically calculate new MMSE stability score from task adherence
      const newMmse = calculateDynamicMmse(updated, 90);
      setMmseScore(newMmse);

      return updated;
    });

    // 2. Persist to Supabase asynchronously with rollback on failure
    const targetId = activePatientId || (typeof window !== 'undefined' ? localStorage.getItem('smriti_linked_patient_id') : null);
    if (isValidUuid(id)) {
      toggleTaskCompletionDb(id, nextState).then(success => {
        if (!success) {
          console.error('[AppContext] Failed to update task status in Supabase, reverting local state:', id);
          setTasks(prev => {
            const reverted = prev.map(t => t.id === id ? { ...t, isCompleted: previousStatus, completed: previousStatus } : t);
            if (typeof window !== 'undefined') {
              localStorage.setItem('smriti_tasks', JSON.stringify(reverted));
            }
            return reverted;
          });
        }
      }).catch(err => {
        console.error('[AppContext] Error updating task status in Supabase:', err);
        setTasks(prev => {
          const reverted = prev.map(t => t.id === id ? { ...t, isCompleted: previousStatus, completed: previousStatus } : t);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smriti_tasks', JSON.stringify(reverted));
          }
          return reverted;
        });
      });
    }

    if (targetId && isValidUuid(targetId)) {
      savePatientTelemetry(targetId, {
        streak,
        totalStars,
        mmseScore: calculateDynamicMmse(tasks, 90),
      }).catch(err => {
        console.warn('[AppContext] savePatientTelemetry sync notice:', err);
      });
    }

    // 3. Dispatch broadcast event with source 'toggle' to prevent race-condition re-fetch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sanjivni:tasks-updated', {
        detail: { source: 'toggle', taskId: id, nextState }
      }));
    }
  };

  const toggleTask = (id: string) => {
    toggleTaskCompletion(id);
  };

  const deleteTask = async (taskId: string) => {
    soundFx.playClickSound();
    // 1. Optimistic removal from local state & storage
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_tasks', JSON.stringify(updated));
      }
      return updated;
    });

    // 2. Dispatch cross-component and multi-tab sync event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sanjivni:tasks-updated', { detail: { deletedId: taskId } }));
    }

    // 3. Delete from Supabase database
    try {
      if (isValidUuid(taskId)) {
        await deletePatientTask(taskId);
      }
    } catch (err) {
      console.warn('[AppContext] deleteTask live sync warning:', err);
    }
  };

  const restoreDefaultTasks = async () => {
    soundFx.playSuccessChime();
    const targetId = resolveToValidUuid(activePatientId);
    let seededTasks: RoutineTask[] = INITIAL_TASKS;
    if (targetId) {
      seededTasks = await seedDefaultPatientTasks(targetId, true);
    }
    setTasks(seededTasks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_tasks_version', '2.0');
      localStorage.setItem('smriti_tasks', JSON.stringify(seededTasks));
      window.dispatchEvent(new CustomEvent('sanjivni:tasks-updated', { detail: { source: 'restore' } }));
    }
  };

  const currentPatient = useMemo(() => ({
    ...patient,
    id: resolveToValidUuid(activePatientId),
  }), [patient, activePatientId]);

  const activeCaregiver = useMemo(() => ({
    id: (typeof window !== 'undefined' && isValidUuid(localStorage.getItem('smriti_caregiver_id'))
      ? localStorage.getItem('smriti_caregiver_id')!
      : '9e3ba6c7-fb34-4927-b07b-01bf059acaf1'),
    name: 'Dr. Priya Baruah',
    role: 'caregiver' as const,
  }), []);

  const addMember = async (newMemberData: any): Promise<void> => {
    soundFx.playClickSound();
    const resolvedPatientId = resolveToValidUuid(newMemberData.patient_id || newMemberData.patientId || activePatientId);

    try {
      const created = await addFamilyMemberDb(resolvedPatientId, newMemberData);
      updateCustomFamilyMembers([...familyMembers, created]);
      soundFx.playSuccessChime();
    } catch (err: any) {
      console.error('[AppContext] addMember error:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      });
      throw err;
    }
  };

  const addTask = async (newTask: any): Promise<void> => {
    soundFx.playClickSound();
    const type = newTask.type || 'activity';
    const category: 'medication' | 'hydration' | 'exercise' | 'food' | 'game' =
      type === 'medicine' ? 'medication' : (type as any);

    let timeOfDay: 'morning' | 'afternoon' | 'evening' = newTask.period || newTask.timeOfDay || 'morning';
    if (!newTask.timeOfDay && !newTask.period && newTask.time) {
      const lower = newTask.time.toLowerCase();
      if (lower.includes('pm')) {
        const hour = parseInt(newTask.time, 10);
        if (hour >= 5 && hour < 12) {
          timeOfDay = 'evening';
        } else {
          timeOfDay = 'afternoon';
        }
      } else {
        timeOfDay = 'morning';
      }
    }

    const finalTime = newTask.time || newTask.timeStr || newTask.time_slot || '09:00 AM';
    const tempId = isValidUuid(newTask.id) ? newTask.id : crypto.randomUUID();

    const task: RoutineTask = {
      id: tempId,
      title: newTask.title,
      time: finalTime,
      timeStr: newTask.timeStr || finalTime,
      time_slot: newTask.time_slot || finalTime,
      isCompleted: !!(newTask.completed || newTask.isCompleted),
      completed: !!(newTask.completed || newTask.isCompleted),
      type,
      category,
      timeOfDay,
      period: timeOfDay,
      description: newTask.description || newTask.notes || newTask.title,
      notes: newTask.notes || newTask.description || '',
      titleKey: newTask.titleKey,
      descKey: newTask.descKey,
    };

    // Optimistic UI update
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== task.id);
      const updated = [...filtered, task];
      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_tasks', JSON.stringify(updated));
      }
      return updated;
    });

    const targetPatientId = resolveToValidUuid(newTask.patientId || newTask.patient_id || activePatientId);

    try {
      const created = await createTask({
        id: tempId,
        patient_id: targetPatientId,
        title: newTask.title,
        time_slot: finalTime,
        period: timeOfDay,
        notes: task.notes,
        description: task.description,
        type: type,
        category: category,
        icon: newTask.icon || 'default',
        priority: newTask.priority || 'normal',
      });

      if (created && created.id !== tempId) {
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: created.id } : t));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sanjivni:tasks-updated', { detail: created || task }));
      }
      soundFx.playSuccessChime();
    } catch (err: any) {
      console.error('[AppContext] addTask database error:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      });
    }
  };

  const recordGameCompletion = (
    gameName: string,
    score: number,
    moves: number,
    timeSec: number,
    accuracy: number
  ) => {
    soundFx.playSuccessChime();
    const newRecord: GameScoreRecord = {
      id: `g-${Date.now()}`,
      game: gameName,
      date: 'Today',
      score,
      moves,
      timeSeconds: timeSec,
      accuracy,
    };
    setGameHistory(prev => [newRecord, ...prev]);

    const nextStars = totalStars + 25;
    const nextStreak = streak + 1;
    setTotalStars(nextStars);
    setStreak(nextStreak);

    // Auto-mark any daily routine game task as completed
    let hasUpdatedGameTask = false;
    const updatedTasks = tasks.map(t => {
      const isGameTask =
        t.type === 'game' ||
        t.category === 'game' ||
        t.title.toLowerCase().includes('game') ||
        t.title.toLowerCase().includes('memory') ||
        t.title.toLowerCase().includes('rongmon');
      if (isGameTask && !(t.isCompleted ?? t.completed)) {
        hasUpdatedGameTask = true;
        return { ...t, isCompleted: true, completed: true };
      }
      return t;
    });

    if (hasUpdatedGameTask) {
      setTasks(updatedTasks);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_tasks', JSON.stringify(updatedTasks));
        window.dispatchEvent(new CustomEvent('sanjivni:tasks-updated'));
      }
    }

    // Dynamic MMSE calculation reflecting task adherence and game accuracy
    const newMmse = calculateDynamicMmse(updatedTasks, accuracy);
    setMmseScore(newMmse);

    // Sync cognitive session, routine game task, and telemetry to Supabase
    const targetId = activePatientId || (typeof window !== 'undefined' ? localStorage.getItem('smriti_linked_patient_id') : null) || '70fde7c0-c85e-4c3d-bc49-8ea172128ebd';
    if (targetId && isValidUuid(targetId)) {
      recordGameSessionInDb(
        targetId,
        { game: gameName, score, moves, timeSeconds: timeSec, accuracy },
        { streak: nextStreak, totalStars: nextStars, mmseScore: newMmse }
      ).catch(err => {
        console.warn('[AppContext] recordGameSessionInDb sync notice:', err);
      });
    }
  };

  const toggleWanderingSimulation = () => {
    soundFx.playClickSound();
    setGeofence(prev => {
      const nextSim = !prev.isSimulatingWandering;
      if (nextSim) {
        soundFx.startSiren();
        return {
          ...prev,
          isSafe: false,
          isSimulatingWandering: true,
          sosActive: true,
          currentLocation: {
            lat: 26.1555,
            lng: 91.8020,
            lastUpdated: '1 min ago (Dispur Supermarket Area)',
            batteryLevel: 81,
            currentAddress: 'Outside Beltola Safe Perimeter (~1.2 km away)',
          },
          alertPayload: {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: '🚨 CRITICAL GEOFENCE ALERT: Patient Bhaben Baruah has left Beltola Safe Zone near Dispur Supermarket.',
            recipientPhone: '+91 98640 12345 (Dr. Priya Baruah)',
            smsDelivered: true,
          }
        };
      } else {
        soundFx.stopSiren();
        soundFx.playSuccessChime();
        return {
          ...prev,
          isSafe: true,
          isSimulatingWandering: false,
          sosActive: false,
          currentLocation: {
            lat: 26.1445,
            lng: 91.7898,
            lastUpdated: 'Just now (GPS Synced)',
            batteryLevel: 84,
            currentAddress: 'Home Verandah, Beltola Tiniali',
          },
          alertPayload: null,
        };
      }
    });
  };

  const dismissSOS = () => {
    soundFx.stopSiren();
    soundFx.playClickSound();
    setGeofence(prev => ({
      ...prev,
      sosActive: false,
      isSafe: true,
      isSimulatingWandering: false,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        isLoggedIn,
        authLoading: auth.loading,
        user,
        loginWithGoogle,
        logout,
        language,
        setLanguage,
        theme,
        setTheme,
        t,
        selectedRegion,
        setSelectedRegion,
        isRegionModalOpen,
        setRegionModalOpen,
        isSpotlightActive,
        spotlightStep,
        startSpotlightTour,
        nextSpotlightStep,
        prevSpotlightStep,
        closeSpotlightTour,
        isUserManualOpen,
        setUserManualOpen,
        notificationPermission,
        requestNotificationPermission,
        scheduleTaskReminder,
        userRole,
        connectionCode,
        isPaired,
        isRoleModalOpen,
        setIsRoleModalOpen,
        isProfileSettingsOpen,
        setIsProfileSettingsOpen,
        isCaregiverWizardOpen,
        setIsCaregiverWizardOpen,
        isPatientWaitingForCaregiver,
        setIsPatientWaitingForCaregiver,
        activePatientId,
        isLoadingFamily,
        refreshFamilyMembers,
        updateCustomFamilyMembers,
        updateCustomTasks,
        updatePatientProfile,
        selectRole,
        isPinModalOpen,
        setIsPinModalOpen,
        mode,
        setMode,
        patientTab,
        setPatientTab,
        patient,
        currentPatient,
        activeCaregiver,
        familyMembers,
        tasks,
        addTask,
        addMember,
        createTask,
        addCaregiverMember,
        addPatient,
        linkPatientToCaregiver,
        fetchCaregiverPatients,
        fetchCaregiverTeam,
        deleteTask,
        restoreDefaultTasks,
        toggleTaskCompletion,
        toggleTask,
        streak,
        totalStars,
        mmseScore,
        gameHistory,
        recordGameCompletion,
        geofence,
        toggleWanderingSimulation,
        dismissSOS,
        locationData,
        weatherData,
        isLocationLoading,
        requestLocationAccess,
        refreshLocationAndWeather,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
