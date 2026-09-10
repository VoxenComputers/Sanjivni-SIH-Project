# Implementation Plan & Roadmap

## Project Name: SANJIVNI (মন-স্মৃতি)
### SIH Problem Statement ID: SIH26003

---

## 1. Milestones Checklist

### Phase 1: Specifications & Documentation [COMPLETED]
- [x] Product Requirements Document (`/docs/PRD.md`)
- [x] System Architecture Document (`/docs/Architecture.md`)
- [x] Detailed Implementation Checklist (`/docs/Implementation.md`)

### Phase 2: Design System & Tokens (`MASTER.md`) [CURRENT]
- [ ] UI UX Pro Max accessible design system tokens (`design-system/MASTER.md`).
- [ ] Duolingo aesthetic guidelines: chunky buttons with 3D bottom borders, 2xl/3xl radii, high WCAG AAA contrast, Nunito typography.
- [ ] OKLCH-derived warm earthy color palette (Moss Green, Terracotta Amber, Cream Canvas, Bark Slate).

### Phase 3: Application Scaffolding & State Framework
- [ ] Scaffold React + Vite + TypeScript application in workspace root.
- [ ] Configure Tailwind CSS with custom colors, spacing, and micro-interaction keyframes.
- [ ] Install Lucide React (`lucide-react`) and Canvas Confetti (`canvas-confetti`).
- [ ] Create Central State Store (`AppContext.tsx`) with localStorage backup and mock data.
- [ ] Build Web Speech API synthesizer and Web Audio API oscillator engines.

### Phase 4: Core Features Implementation
- [ ] **Shared UI Elements:**
  - [ ] Top Mode Switcher (`Patient Mode` <-> `Caregiver Mode`).
  - [ ] Rongmon the Assam Rhino Mascot with cheerful affirmations.
  - [ ] 3-tab Bottom Navigation bar for Patient view.
- [ ] **Patient Mode: Reminiscence Vault:**
  - [ ] Daily Snapshot Bar (large time, date, Guwahati weather, day orientation).
  - [ ] Family Memory Book / Tree with large photo cards and speech playback.
- [ ] **Patient Mode: Culturally Localized Cognitive Games:**
  - [ ] Game 1: NER Memory Match (Bihu, Kaziranga Rhino, Hornbill, Muga Silk, Tea, Loktak).
  - [ ] Game 2: Spaced Retrieval Trivia (Personalized questions from family vault).
  - [ ] Duolingo streak counter and victory celebrations (confetti + audio).
- [ ] **Patient Mode: Daily Routine Checklist:**
  - [ ] Timeline checklist (Morning, Afternoon, Evening).
  - [ ] Duolingo bouncy check animation with acoustic feedback.
- [ ] **Caregiver Mode: Dashboard & Geofencing Simulation:**
  - [ ] Cognitive tracking chart (MMSE scores trend) and routine completion meter.
  - [ ] Interactive SVG Map of Guwahati with 500m Safe Zone circle.
  - [ ] "Simulate Patient Wandering" toggle button.
  - [ ] High-visibility emergency full-screen SOS alert modal with siren and SMS simulation.

### Phase 5: Verification & Impeccable Audit
- [ ] Run `npm run build` to verify TypeScript compile health.
- [ ] Run `impeccable detect` to verify accessibility, color contrast, and elderly readability standards.
- [ ] Interactive browser walkthrough testing all user flows.

---

## 2. Component Hierarchy

```
App.tsx
│
├── ModeSwitcher (Patient Mode / Caregiver Mode Toggle)
│
├── PatientModeView
│   ├── TopHeader (Rongmon Mascot greeting + Duolingo Streak Flame)
│   ├── TabContent
│   │   ├── Tab 1: ReminiscenceVault
│   │   │   ├── DailySnapshot (Time, Date, Guwahati Weather)
│   │   │   └── FamilyGrid (Cards with photo, relation, and speech synthesis button)
│   │   │
│   │   ├── Tab 2: CognitiveGamesHub
│   │   │   ├── GameSelector (Memory Match vs Spaced Retrieval)
│   │   │   ├── MemoryMatchGame (6 NER cultural pairs, flip mechanics, win state)
│   │   │   └── SpacedRetrievalGame (Vault-linked trivia, massive buttons, streak boost)
│   │   │
│   │   └── Tab 3: RoutineTimeline
│   │       ├── RoutineHeader (Completion progress)
│   │       └── RoutineItemList (Bouncy interactive tasks)
│   │
│   └── BottomNavBar (3 massive buttons: Reminisce, Games, Routine)
│
└── CaregiverModeView
    ├── CaregiverHeader (Patient health summary & sync indicator)
    ├── CognitiveMetricsPanel (MMSE trend score chart, adherence rate)
    ├── GeofencingMapSection
    │   ├── InteractiveMap (Guwahati coordinates, 500m Safe Zone circle, Patient pin)
    │   └── WanderingSimulatorControls ("Simulate Patient Wandering" toggle)
    └── SOSAlertModal (High-visibility full-screen takeover, siren audio, simulated SMS)
```

---

## 3. Hackathon Demonstration Script (For Pitching)

1. **Orientation (Patient Mode):**
   * Demonstrate the **Daily Snapshot**: Notice how large, reassuring, and clear the time, day, and weather are for a disoriented patient.
2. **Emotional Grounding (Reminiscence Vault):**
   * Click on Rahul's card: Listen to the audio greeting *"Pranam Koka! It's Rahul..."* generated live.
3. **Cognitive Exercise (Cultural Memory Match):**
   * Open the Memory Match game: Match the Bihu Dhol and Kaziranga Rhino cards. Experience the satisfying Duolingo confetti and chime celebration.
4. **Daily Independence (Routine):**
   * Check off *"Take Morning Blood Pressure Medicine"* and witness the bouncy checkmark animation.
5. **Caregiver Assurance (Caregiver Mode):**
   * Switch to Caregiver Mode: Inspect the cognitive trend metrics and 100% adherence score.
6. **Live Geofencing & Wandering SOS:**
   * In the Geofencing Map, click **"Simulate Patient Wandering"**.
   * Instant red alert siren triggers, the patient pin moves outside the green circle, and the full-screen SOS modal simulates an SMS broadcast to family members with exact coordinates.
