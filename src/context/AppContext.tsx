import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundFx } from '../utils/audio';
import { SupportedLanguage, getTranslation, getLocalizedFamily, getLocalizedPatient } from '../utils/i18n';
import { deviceNotifications } from '../utils/notifications';
import { NERStateId } from '../utils/nerData';
import { useAuth } from './AuthContext';
import { fetchUserProfile } from '../lib/supabaseDb';
import {
  LocationData,
  WeatherData,
  DEFAULT_NER_LOCATION,
  DEFAULT_WEATHER,
  fetchLiveWeather,
  getDevicePosition,
  reverseGeocode,
} from '../utils/locationWeather';

export type { SupportedLanguage, NERStateId, LocationData, WeatherData };

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  localRelation: string;
  age: number;
  avatarColor: string;
  avatarIcon: string;
  voiceMessage: string;
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
  description: string;
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
  familyMembers: FamilyMember[];
  tasks: RoutineTask[];
  addTask: (task: {
    title: string;
    time: string;
    type?: 'medicine' | 'activity' | 'hydration' | 'food' | 'exercise' | 'game';
    description?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    titleKey?: string;
    descKey?: string;
  }) => void;
  toggleTaskCompletion: (id: string) => void;
  toggleTask: (id: string) => void;
  streak: number;
  totalStars: number;
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
    time: '8:00 AM',
    timeStr: '8:00 AM',
    timeOfDay: 'morning',
    title: 'Take Morning Blood Pressure Medicine',
    description: '1 tablet with a warm glass of water after breakfast',
    titleKey: 'taskBloodPressureTitle',
    descKey: 'taskBloodPressureDesc',
    type: 'medicine',
    category: 'medication',
    isCompleted: true,
    completed: true,
  },
  {
    id: 'task-2',
    time: '8:30 AM',
    timeStr: '8:30 AM',
    timeOfDay: 'morning',
    title: 'Drink Warm Water & Lemon',
    description: 'Staying well hydrated keeps your memory active',
    titleKey: 'taskHydrationTitle',
    descKey: 'taskHydrationDesc',
    type: 'hydration',
    category: 'hydration',
    isCompleted: true,
    completed: true,
  },
  {
    id: 'task-3',
    time: '10:30 AM',
    timeStr: '10:30 AM',
    timeOfDay: 'morning',
    title: 'Morning Walk in Garden',
    description: 'Take a peaceful 15-minute stroll around the flowers',
    titleKey: 'taskMorningWalkTitle',
    descKey: 'taskMorningWalkDesc',
    type: 'exercise',
    category: 'exercise',
    isCompleted: false,
    completed: false,
  },
  {
    id: 'task-4',
    time: '1:00 PM',
    timeStr: '1:00 PM',
    timeOfDay: 'afternoon',
    title: 'Drink Warm Water & Lemon',
    description: 'Staying well hydrated keeps your memory active',
    titleKey: 'taskHydrationTitle',
    descKey: 'taskHydrationDesc',
    type: 'hydration',
    category: 'hydration',
    isCompleted: false,
    completed: false,
  },
  {
    id: 'task-5',
    time: '3:30 PM',
    timeStr: '3:30 PM',
    timeOfDay: 'afternoon',
    title: 'Play Cultural Memory Game with Rongmon',
    description: 'Match North-East cards to exercise your mind',
    titleKey: 'taskGameTitle',
    descKey: 'taskGameDesc',
    type: 'activity',
    category: 'game',
    isCompleted: false,
    completed: false,
  },
  {
    id: 'task-6',
    time: '8:00 PM',
    timeStr: '8:00 PM',
    timeOfDay: 'evening',
    title: 'Take Evening Multivitamin Tablet',
    description: '1 capsule with dinner as prescribed by Dr. Priya',
    titleKey: 'taskEveningMedTitle',
    descKey: 'taskEveningMedDesc',
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

  const localizedFamily = React.useMemo(() => getLocalizedFamily(language), [language]);
  const familyMembers = React.useMemo(() => {
    if (customFamilyMembers && customFamilyMembers.length > 0) {
      return customFamilyMembers;
    }
    return localizedFamily;
  }, [customFamilyMembers, localizedFamily]);

  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('smriti_tasks') : null;
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
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
          return JSON.parse(saved);
        } catch {}
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
        } catch {}
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

      const newLocation: LocationData = {
        coordinates: { lat, lng },
        displayName: geocoded.displayName,
        city: geocoded.city,
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
          currentAddress: geocoded.displayName,
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
        .catch(() => {});
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
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const currentStatus = t.isCompleted ?? t.completed;
          const nextState = !currentStatus;
          if (nextState) {
            soundFx.playSuccessChime();
          }
          return {
            ...t,
            isCompleted: nextState,
            completed: nextState,
          };
        }
        return t;
      })
    );
  };

  const toggleTask = (id: string) => {
    toggleTaskCompletion(id);
  };

  const addTask = (newTask: {
    title: string;
    time: string;
    type?: 'medicine' | 'activity' | 'hydration' | 'food' | 'exercise' | 'game';
    description?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    titleKey?: string;
    descKey?: string;
  }) => {
    soundFx.playSuccessChime();
    const type = newTask.type || 'activity';
    const category: 'medication' | 'hydration' | 'exercise' | 'food' | 'game' =
      type === 'medicine' ? 'medication' : (type as any);

    let timeOfDay: 'morning' | 'afternoon' | 'evening' = newTask.timeOfDay || 'morning';
    if (!newTask.timeOfDay && newTask.time) {
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

    const task: RoutineTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTask.title,
      time: newTask.time,
      timeStr: newTask.time,
      isCompleted: false,
      completed: false,
      type,
      category,
      timeOfDay,
      description: newTask.description || newTask.title,
      titleKey: newTask.titleKey,
      descKey: newTask.descKey,
    };

    setTasks(prev => [...prev, task]);
  };

  const recordGameCompletion = (
    gameName: string,
    score: number,
    moves: number,
    timeSec: number,
    accuracy: number
  ) => {
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
    setTotalStars(prev => prev + 25);
    setStreak(prev => (prev === 5 ? 6 : prev));
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
        familyMembers,
        tasks,
        addTask,
        toggleTaskCompletion,
        toggleTask,
        streak,
        totalStars,
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
