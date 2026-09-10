# System Architecture Document

## Project Name: SANJIVNI (মন-স্মৃতি)
### Cognitive Gaming & Memory Assistance Platform for Elderly Dementia Patients in NER (SIH26003)

---

## 1. System Overview & Technology Stack

SANJIVNI is engineered as a responsive, high-performance Progressive Web Application (PWA) optimized for elder accessibility, touchscreens, tablets, and low-latency client-side interaction. For SIH26003, all persistent states and telemetry are managed via a reactive centralized store with `localStorage` persistence, accompanied by mock services simulating future production microservices.

### Frontend Technology Stack
* **Framework:** React 18 / 19 with TypeScript for strong type safety and robust component interfaces.
* **Build Tooling:** Vite (ESBuild / Rollup) for rapid HMR and lightweight bundle sizes.
* **Styling Architecture:** Tailwind CSS paired with custom Duolingo design tokens (OKLCH-grounded colors, 3D tactile borders with bottom click depth, generous spacing scales $\ge 56\text{px}$ touch targets, and accessible Nunito typography).
* **Iconography:** Lucide React (accessible, consistent, scalable SVG vector icons; no emojis as icons).
* **Feedback & Sensory Engines:**
  * **Visual Confetti:** Canvas Confetti for congratulatory gamification states.
  * **Voice Synthesis (TTS):** Web Speech API (`window.speechSynthesis`) for real-time natural language speech playback across daily orientation, routine tasks, family notes, and game instructions.
  * **Device Reminders:** Web Notification API (`window.Notification`) triggering native operating system notifications for scheduled medication and hydration.
  * **Audio Synthesis:** Web Audio API (`AudioContext`) oscillator and gain nodes for synthetic chimes, button clicks, and emergency sirens without external network dependencies.
* **Localization:** 6-Language Regional Engine supporting English, Hindi, Assamese, Bengali, Manipuri, and Mizo.

```
+---------------------------------------------------------------------------------------------------+
|                                      SANJIVNI Web Platform                                       |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [AUTHENTICATION & LOCALIZATION GATEWAY]                                                          |
|  - 6-Language Selector (English, Hindi, Assamese, Bengali, Manipuri, Mizo)                        |
|  - 4 NER Vector Background Doodles (Kamakhya, Tawang, Loktak, Ujjayanta)                          |
|  - Google Authentication Modal & LocalStorage Session Cache (`smriti_session`)                    |
|  - Step-by-Step Visual "How to Use" User Manual Carousel                                          |
|                                       │                                                           |
|                     ┌─────────────────┴─────────────────┐                                         |
|                     ▼                                   ▼                                         |
|  +------------------------------------+   +------------------------------------+                  |
|  |           PATIENT MODE             |   |          CAREGIVER MODE            |                  |
|  +------------------------------------+   +------------------------------------+                  |
|  | - Reminiscence Vault & Voice Notes |   | - Cognitive Decline MMSE Analytics |                  |
|  | - Daily Snapshot (Orientation TTS) |   | - Task Adherence Monitoring        |                  |
|  | - 3 NER Cognitive Games:           |   | - Interactive Geofence Map         |                  |
|  |   1. Picture Matching (SVGs)       |   | - Wandering Simulation & SOS Siren |                  |
|  |   2. Match the Order (Sequence)    |   | - Device Reminder Push Scheduler   |                  |
|  |   3. Guess the Picture (3 Options) |   | - Caregiver AI Chatbot Assistant   |                  |
|  | - Daily Routine Checklist + Audio  |   +------------------------------------+                  |
|  +------------------┬-----------------+                     │                                     |
|                     │                                       │                                     |
|                     └───────────────────┬───────────────────┘                                     |
|                                         ▼                                                         |
|  +---------------------------------------------------------------------------------------------+  |
|  |                           Unified AppContext (State & Services)                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|  | - Active Language & Dictionary     - Patient Profile & Family Data                          |  |
|  | - Cognitive Game Scores & Streaks  - Routine Tasks & Device Notification Hooks              |  |
|  | - Geofence Coordinates & SOS State - Web Speech API Voice Synthesizer                       |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. State Management Architecture

The application state is centralized in `AppContext` (React Context + React Hooks), providing real-time reactivity across all modules:

### Core State Slices:
1. **Authentication & Routing Slice:**
   * `currentRoute`: `'app' | 'login'` (auto-routed based on `localStorage` session).
   * `isLoggedIn`: Boolean session flag.
   * `user`: Current authenticated user details (name, email, avatar).
   * `loginWithGoogle()` / `logout()`: Session mutations.
2. **Localization Slice:**
   * `language`: `'en' | 'hi' | 'as' | 'bn' | 'mni' | 'lus'`.
   * `setLanguage(lang)`: Dynamically re-renders localized UI text across the entire app.
3. **Patient Profile & Reminiscence Slice:**
   * `patient`: Name, age, residence, photo, stage of MCI, preferred language.
   * `familyMembers`: Array of family cards with relation, photo, message text, and voice status.
4. **Cognitive Gaming Suite Slice:**
   * `streak`: Current consecutive day count (e.g., 5 days).
   * `totalStars`: Experience points (XP) earned from games.
   * `gameHistory`: Performance telemetry (accuracy %, moves, time elapsed).
   * `recordGameCompletion()`: Triggers XP, streak increase, chimes, and confetti.
5. **Daily Routine & Device Notification Slice:**
   * `tasks`: Array of timeline tasks (id, timeOfDay, title, timeStr, icon, completed).
   * `toggleTask(id)`: Toggles completion, plays tactile sound chime, updates caregiver metrics.
   * `notificationPermission`: Browser permission state (`'default' | 'granted' | 'denied'`).
   * `scheduleReminder(task)`: Triggers native operating system notification.
6. **Geofencing & Telemetry Slice:**
   * `safeZone`: Center coordinates (`26.1445, 91.7898` - Beltola, Guwahati), radius in meters (`500m`).
   * `currentLocation`: Current simulated patient GPS coordinates.
   * `isWandering`: Boolean toggle simulating safe vs breached state.
   * `sosTriggered`: Boolean state controlling full-screen emergency modal and siren.
7. **Auxiliary Modals Slice:**
   * `isUserManualOpen`: Controls the "How to Use" onboarding carousel.

---

## 3. Subsystem Specifications

### 3.1 Web Speech Synthesis Engine (`src/utils/speech.ts` & `SpeechButton.tsx`)
* Utilizes `window.speechSynthesis` and `SpeechSynthesisUtterance`.
* Configures natural pitch, gentle cadence (rate: 0.88), and regional voice selection where available.
* Component `<SpeechButton text="..." />` exposes a minimum 56px touch target with tactile audio feedback and active pulsing animation.

### 3.2 Native Device Notifications (`src/utils/notifications.ts`)
* Implements the browser `Notification` API.
* Requests permission with clear user messaging.
* Fires operating system banners with custom application icons and vibration patterns for task adherence.

### 3.3 NER Vector Heritage Background Illustrations
* Embedded directly into the login screen as lightweight SVG doodles:
  1. **Kamakhya Temple** (Assam): Iconic beehive-shaped shikhara.
  2. **Tawang Monastery** (Arunachal Pradesh): Majestic Himalayan fortress architecture.
  3. **Loktak Lake & Phumdis** (Manipur): Circular floating biomass islands.
  4. **Ujjayanta Palace** (Tripura): Neo-classical domes and Mughal-style garden gates.

### 3.4 Cognitive Gaming Overhaul
* **Game 1: Picture Matching:** Flip-card memory game matching 6 pairs of high-contrast cultural SVGs.
* **Game 2: Match the Order:** Sequence memory test displaying an item sequence with audio-visual flashes.
* **Game 3: Guess the Picture:** Visual recognition displaying an item with 3 massive 64px button options.

### 3.5 Caregiver AI Chatbot (`CaregiverChatbot.tsx`)
* Accessible via a prominent floating action button (FAB).
* Natural language assistant interface providing real-time queries regarding task adherence, cognitive scores, and geofence status.

---

## 4. Production Cloud & IoT Integration (Roadmap)

```
[IoT Smartwatch / GPS Wearable] 
             │
             ▼ (MQTT / WebSockets)
[Node.js / Express Telemetry Ingestion Service]
             │
      ┌──────┴──────────────────────┐
      ▼                             ▼
[Firebase Firestore]       [Geofencing Engine]
- Patient Profiles         - PostGIS / Turf.js Boundary checks
- Game Metric Logs         - Real-time breach detection
- Family Media Buckets               │
                                     ▼ (Twilio / Firebase Cloud Messaging)
                           [Caregiver Push & SMS Alert System]
```
