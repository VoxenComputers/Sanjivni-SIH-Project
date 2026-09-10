# Product Requirements Document (PRD)

## Project Name: SANJIVNI (মন-স্মৃতি)
### SIH Problem Statement ID: SIH26003
**Title:** AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER)

---

## 1. Executive Summary
Dementia and progressive cognitive impairment are burgeoning healthcare challenges in India, disproportionately impacting elderly populations in the North Eastern Region (NER) due to geographic isolation, limited specialized geriatric facilities, and cultural/linguistic nuances overlooked by mainstream cognitive tools.

**SANJIVNI** is a dual-mode, hyper-accessible web platform engineered to slow cognitive decline, preserve personal biographical identity, maintain daily functional independence, and provide continuous peace of mind to family caregivers. Inspired by Duolingo's friendly, tactile, and rewarding interaction design, SANJIVNI combines reminiscence therapy, culturally localized North Eastern cognitive exercises, intuitive routine management, native browser device notifications, Web Speech read-aloud features, and real-time geofence wandering safety simulations.

---

## 2. Target Personas

### Persona 1: The Patient ("Koka" / Elderly User)
* **Name:** Bhaben Baruah ("Koka", Assamese for Grandfather)
* **Age:** 76 years old
* **Location:** Guwahati, Assam (NER)
* **Condition:** Mild Cognitive Impairment (MCI) / Early-stage Alzheimer’s Disease
* **Challenges:**
  * Mild tremors and reduced fine motor control; struggles with tiny mobile buttons.
  * Difficulty recalling short-term events, while retaining long-term childhood memories.
  * Visual acuity decline; easily overwhelmed by cluttered interfaces.
* **Needs:**
  * Massive, high-contrast, tactile UI components (minimum 56px touch targets).
  * High-legibility typography (base 18–20px Nunito font).
  * Chunky Text-to-Speech (TTS) speaker buttons next to all major text blocks.
  * Familiar cultural cues (Bihu, Kaziranga, Hornbill, local family relations).
  * Reassuring voice notes from loved ones and instantaneous positive reinforcement (cheers, confetti).

### Persona 2: The Primary Caregiver
* **Name:** Ananya Baruah
* **Age:** 36 years old
* **Role:** Daughter & working professional managing father's elder care
* **Location:** Dispur / Guwahati
* **Needs:**
  * Comprehensive dashboard tracking cognitive stability (MMSE-aligned scoring).
  * Interactive Caregiver AI Chatbot for quick queries (*"Did Koka take his medicine?"*, *"Summarize today's cognitive scores"*).
  * Device-level Web Push notification scheduling for daily routines.
  * Real-time geofencing visualization with immediate high-visibility SOS alert broadcasting.

---

## 3. Core Feature Requirements

### 3.1 Authentication & Localization Landing Page
1. **Unauthenticated Routing Gate:**
   * Unauthenticated users are directed to the Authentication & Localization Landing page as the initial screen.
   * If a session is detected in `localStorage`, the user is auto-routed to the main app (`currentRoute: 'app'`).
2. **Prominent 6-Language Regional Selector:**
   * Selector dropdown featuring:
     1. English (`en`) - Default
     2. Hindi (`hi`) - हिन्दी
     3. Assamese (`as`) - অসমীয়া
     4. Bengali (`bn`) - বাংলা
     5. Manipuri (`mni`) - মৈতৈলোন্
     6. Mizo (`lus`) - Mizo ṭawng
   * Dynamically updates the global application context and translates UI labels.
3. **Visual Aesthetics & Heritage Background:**
   * Clean, green-tinted, minimal vector doodles representing 4 major NER landmarks:
     - **Kamakhya Temple** (Assam)
     - **Tawang Monastery** (Arunachal Pradesh)
     - **Loktak Lake** (Manipur)
     - **Ujjayanta Palace** (Tripura)
   * Centered Google Authentication modal with interactive account picker and 1-tap quick demo login.
   * Access link to the step-by-step User Manual onboarding carousel.

---

### 3.2 Accessibility & Global Web APIs
1. **Ubiquitous Text-to-Speech (Read Aloud):**
   * Integrated Web Speech API (`SpeechSynthesis`).
   * High-contrast, chunky speaker icons ($\ge 48\text{px} - 56\text{px}$) next to all key text:
     - Daily orientation headers
     - Family messages
     - Routine tasks & medication dosages
     - Cognitive game questions and instructions
     - User manual slides
   * Gentle, soothing speech rate ($0.88\text{x}$) tuned for elderly comprehension.
2. **Device-Level Reminders (Web Notification API):**
   * Routine tasks trigger native browser device notification prompts.
   * Caregivers can schedule reminders that display native operating system alert banners with sound and vibration fallback.

---

### 3.3 Cognitive Gaming Suite (NER Localized)
All games feature positive reinforcement (chunky bouncy animations, Web Audio synthesizer chimes, victory confetti, XP points, and streak counts):
1. **Picture Matching (Card-Flipping Memory Match):**
   * Grid of tactile cards featuring large authentic NER cultural SVGs (Kaziranga Rhino, Bihu Dhol, Hornbill, Muga Silk, Assam Tea, Loktak Lake).
   * 3D card flip mechanics with click depths, real-time match validation, and move counters.
2. **Match the Order (Sequence Memory Game):**
   * Flashes 3 to 5 local items in a specific visual sequence.
   * Patient repeats the sequence by tapping items in the exact observed order.
   * Multi-level progressive difficulty.
3. **Guess the Picture (Visual Identification):**
   * Displays a prominent cultural illustration.
   * Provides 3 massive, text-based tactile option buttons ($\ge 64\text{px}$ height).
   * Provides immediate feedback and learning explanations.

---

### 3.4 Additional App Views
1. **User Manual Onboarding Carousel:**
   * Step-by-step visual carousel accessible from the landing page and navigation header.
   * Massive graphics and minimal, reassuring text tailored for elderly users.
   * Slide controls (Next, Prev, Dot indicators, Skip/Close) and Read Aloud voice buttons.
2. **Caregiver AI Assistant Chatbot:**
   * Floating action button (FAB) in the Caregiver Dashboard with pulsing notification badge.
   * Natural conversational interface with quick prompt chips:
     - *"Did Koka take his medicine?"*
     - *"Summarize today's cognitive scores."*
     - *"Is Koka in the safe zone?"*
     - *"How is Koka's routine adherence?"*
   * Real-time answers computed directly from active application state.

---

## 4. Design Standards & Compliance
* **WCAG 2.1 AAA Accessibility:**
  * Minimum touch target size $\ge 56\text{px} \times 56\text{px}$.
  * Text contrast $\ge 7:1$ for body copy and $\ge 4.5:1$ for large text/icons.
  * Base font size $\ge 18\text{px}$ with Nunito typography.
* **Duolingo-Style Tactile UI:**
  * Solid structural borders (`border-2` / `border-3`).
  * 3D button press effects (`translate-y-1` on active).
  * Warm earthy green primary palette (`#15803D` / `#166534`), warm cream background (`#FAF8F5`), and gold amber accents (`#D97706`).
  * Zero AI-slop (no purple/cyan neon gradients, no muddy shadows).
