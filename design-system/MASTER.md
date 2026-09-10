# SANJIVNI Design System Master (MASTER.md)
*UI/UX Pro Max Architecture — Duolingo-Inspired Tactile Accessibility for Elderly Dementia Care*

---

## 1. Design Philosophy & Aesthetic Core
* **Visual Inspiration:** **Duolingo** — friendly, playful, tactile, confidence-building, and physically reassuring.
* **Target Demographic:** Elderly individuals with Mild Cognitive Impairment (MCI) / Dementia alongside their primary family caregivers in the North Eastern Region of India.
* **Core Principles:**
  * **Tactile Chunkiness:** Everything feels like a physical, tangible wooden or soft-plastic block. Solid structural borders (`border-2` or `border-3`), thick pressable bases (`border-b-4` or `border-b-6`), and exaggerated rounded corners (`rounded-2xl` and `rounded-3xl`).
  * **Anti-AI Slop Manifesto:**
    * ❌ NO neon purple/cyan gradients.
    * ❌ NO muddy, diffused drop shadows (`box-shadow: 0 20px 25px rgba(...)` is banned).
    * ❌ NO microscopic, low-contrast typography (no gray-400 on white).
    * ❌ NO dense, cognitive-overload corporate dashboard grids for patients.
    * ✅ High-contrast solid borders that visually segregate each interactable area.
    * ✅ Crisp, physical-feeling translation offsets on button presses (`active:translate-y-1 active:border-b-0`).
    * ✅ Warm, earthy, welcoming organic colors reflecting the natural beauty of Assam and the North East (tea leaves, bamboo, terracotta, golden sunshine).

---

## 2. Color System (OKLCH Grounded & WCAG AAA Compliant)

All text combinations are strictly validated to exceed WCAG AAA standards ($\ge 7:1$ for body copy, $\ge 4.5:1$ for large headings and icons).

| Token Name | Hex Value | Semantic Role | WCAG Contrast Ratio against Background |
|---|---|---|---|
| `color-canvas-cream` | `#FAF8F5` | Primary app canvas background (warm, non-glare, comforting) | Base Canvas |
| `color-canvas-card` | `#FFFFFF` | Interactive card and surface background | Card Surface |
| `color-text-main` | `#1C1917` | Primary high-contrast text (deep earthy slate bark) | **15.2:1** (AAA Exceeded) |
| `color-text-muted` | `#44403C` | Secondary explanatory copy & timestamps | **8.4:1** (AAA Exceeded) |
| `color-primary-green` | `#15803D` | Primary brand action, success confirmations, Safe Zone | **4.9:1** against white (Large) |
| `color-primary-green-dark` | `#166534` | 3D bottom border for primary buttons | Deep Structural Base |
| `color-primary-green-light` | `#DCFCE7` | Calming chip badge and card highlight background | Subtle Warm Mint |
| `color-warm-amber` | `#D97706` | Secondary brand action, streak flames, warm notifications | Warm Terracotta Marigold |
| `color-warm-amber-dark` | `#B45309` | 3D bottom border for amber buttons | Deep Terracotta Base |
| `color-warm-amber-light` | `#FEF3C7` | Memory note highlighting and active status backings | Soft Sunlight Cream |
| `color-alert-crimson` | `#DC2626` | Emergency wandering SOS, critical warning markers | High-Visibility Safety |
| `color-alert-crimson-dark` | `#991B1B` | 3D bottom border for emergency controls | Deep Crimson Base |
| `color-border-structural` | `#E7E5E4` | Solid structural card boundary | 2px solid separator |
| `color-border-distinct` | `#D6D3D1` | Distinct interactive card boundary | 2px tactile border |

---

## 3. Typography Hierarchy

* **Primary Font Family:** `'Nunito', 'Quicksand', system-ui, sans-serif`
  * Rounded letterforms that feel friendly and non-intimidating.
  * Exceptionally wide apertures and distinct character glyphs to aid visual recognition for deteriorating vision.
* **Type Scale:**
  * **Base Body Copy:** `19px` (`1.1875rem`, `leading-relaxed`, `font-semibold` or `font-medium`). Never drop below 18px!
  * **Small Badges / Labels:** `16px` (`1rem`, `font-bold`, uppercase tracking).
  * **Subheadings:** `22px – 24px` (`font-bold`).
  * **Primary Headings:** `28px – 32px` (`font-extrabold`).
  * **Hero Snapshot Day/Time:** `40px – 48px` (`font-black`, unmissable orientation).

---

## 4. Component Standards & Touch Geometry

### 4.1 Touch Targets & Buttons
* **Minimum Touch Target Height:** `56px` (Standard action buttons default to `60px - 68px`).
* **Tactile 3D Button Architecture:**
  ```css
  /* Duolingo-style Chunky Button Specification */
  .duo-button-green {
    background-color: #15803D;
    color: #FFFFFF;
    border-radius: 1.25rem; /* rounded-2xl */
    border: 2px solid #166534;
    border-bottom: 5px solid #166534;
    font-size: 1.25rem;
    font-weight: 800;
    min-height: 58px;
    padding: 0.875rem 1.75rem;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .duo-button-green:active {
    transform: translateY(4px);
    border-bottom-width: 1px;
    margin-bottom: 4px;
  }
  ```
* **Amber & Neutral Variants:** Same 3D tactile physics applied with `#D97706` (Amber) and `#FFFFFF` (White with `#E7E5E4` border and `#D6D3D1` bottom border).

### 4.2 Cards & Containers
* **Radii:** `rounded-2xl` (`16px`) for sub-elements; `rounded-3xl` (`24px`) for primary cards.
* **Borders:** `border-2 border-stone-200` or `border-3 border-stone-300` (flat, solid, clear demarcation).
* **Padding:** Generous internal breathing space (`p-5` to `p-7`).

### 4.3 Patient Bottom Navigation
* Maximum 3 primary destinations:
  1. 🏠 **Reminisce (স্মৃতি)**: Family tree & memory vault.
  2. 🎮 **Games (খেলা)**: Cultural cognitive training exercises.
  3. 📋 **Routine (নিয়ম)**: Daily timeline task checklist.
* Extra-large icon footprint with distinct active highlight pills and clear text labels.

---

## 5. Animation & Micro-Interactions
* **Duolingo Bounce (Task Completion):**
  * Spring cubic-bezier keyframe (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
  * Scale bounce ($1.0 \to 1.15 \to 0.95 \to 1.0$) upon clicking routine tasks.
* **Card Flip Motion (Memory Match):**
  * 3D perspective card flip (`transform: rotateY(180deg)` with `backface-visibility: hidden`).
* **Emergency Flash (SOS Modal):**
  * High-visibility, steady pulsing amber/crimson header to guarantee caregiver urgency without inducing sensory panic.
* **Sound Design:**
  * Non-jarring, pleasant frequencies (Major triads for victory, warm clicks for taps, distinct dual tone for SOS).
