# 🧠 Berto AI Brand Guidelines & Visual Identity System

> **Version**: 1.0.0  
> **Classification**: Source of Truth  
> **Status**: Active  
> **Last Updated**: October 2026

---

## 1. Brand Essence & Philosophy

### 1.1 Brand Mission
To democratize academic mastery by providing every student, candidate, and lifelong learner with an ultra-fast, local-first active-recall arena that makes spaced repetition joyful, tactile, and completely free of paywalls, ads, or battery-draining bloat.

### 1.2 Core Pillars
1. **Frictionless Velocity**: Loads in under a second, works 100% offline at 60 FPS, and never forces you to create an account or connect to a cloud server to study.
2. **Tactile Neo-Brutalism**: Physical, high-energy interactive feedback. Satisfying button presses, solid 3D shadows, vibrant candy accents, and responsive sound chimes that make study sessions feel like a rewarding quest.
3. **Scientific Rigor**: Powered by the modern Free Spaced Repetition Scheduler (FSRS) with true memory stability decay, difficulty calibration, and lapse tracking.
4. **Transparent Intelligence**: AI is an invisible artisan, not a fake conversational chatbot. It ingests lecture notes and PDFs to forge precision questions, running client-side with zero telemetry.

### 1.3 What Berto AI Is NOT
- ❌ **No Paywalls or Artificial Daily Study Caps**: Learning is never monetized or throttled.
- ❌ **No Virtual Coins, Shops, or Pet Dressing Rooms**: Extrinsic cosmetics that distract from genuine academic retention.
- ❌ **No Conversational Chatbot Personas**: Studying requires razor-sharp active recall, not chatty small talk.
- ❌ **No Cloud Lock-in**: Your flashcards, memory ratings, and schedules belong exclusively to your device.

---

## 2. Voice & Tone Framework

Berto AI speaks like a brilliant, supportive study partner who respects your time and energy.

### 2.1 Voice Attributes

| Attribute | What It Means | How It Sounds | What to Avoid |
|---|---|---|---|
| **Encouraging** | Celebrates genuine effort and perseverance without patronizing cheerleading. | *"3 Day Streak! Spaced repetition keeps knowledge locked in long-term memory."* | *"Yayyy! You're a superstar genius!"* (Over-the-top, infantilizing) |
| **Rigorous** | Grounded in cognitive science, memory decay rates, and active recall. | *"FSRS stability scheduled for 3 days based on Good recall."* | Vague assertions or fake algorithmic hype. |
| **Playful & Tactile** | Uses game-inspired metaphors (Quest, Arena, Realm, Forge, Combo) that feel fun. | *"1. Name Your Quest • 2. Choose Banner Color"* | Dry enterprise corporate jargon ("Create Learning Unit"). |
| **Unpretentious** | Direct, concise, and focused on immediate action. | *"Tap to test yourself"* / *"Enter ↵"* | Flowery, bloated instructional paragraphs. |

### 2.2 Messaging Matrix

| Context | Recommended Copy | Discouraged Copy |
|---|---|---|
| **Round Start** | *"Ready to conquer 10 cards? Let's drill."* | *"Please select your operational examination parameters."* |
| **Correct Answer** | *"Correct! +10 XP • 4 Combo!"* | *"Acceptable answer submitted."* |
| **Incorrect Answer** | *"Not quite. The correct answer is X. Here's why..."* | *"WRONG! You lost 1 life!"* (Punitive) |
| **Streak Milestone** | *"🔥 5 Day Streak! Your rhythm is unstoppable."* | *"Streak updated in system database."* |
| **Round Complete** | *"Round Conquered! 90% Accuracy • 150 XP Earned."* | *"Quiz finished. Returning to dashboard."* |
| **Empty State** | *"No cards due for review! Enjoy your free time or explore sub-decks."* | *"0 items found."* |

---

## 3. Visual Identity & Logo Specifications

### 3.1 Primary Brand Mark (The Berto Mascot)
- **Geometry**: A tilted squircle badge (`w-10 h-10 rounded-2xl transform -rotate-2`) framed with a bold outline (`border-[2px] border-slate-900`) and a solid depth shadow (`shadow-[0_2.5px_0_0_#09090b]`).
- **Gradient Fill**: Dynamic linear gradient from Violet (`#7c3aed`) through Indigo (`#4f46e5`) to Purple (`#9333ea`).
- **Icon**: White Lucide `Brain` icon (`stroke-[2.5]`, `w-5.5 h-5.5`).
- **Logotype**: Set in `Plus Jakarta Sans` extra bold (Weight 900) with tracking `-0.03em`:
  - `Berto` (Slate 950 `#020617` light / Pure White `#ffffff` dark)
  - `AI` (Vivid Violet `#7c3aed` light / Violet 400 `#a78bfa` dark)
  - Companion Pill: `FREE` in Amber 300 (`#fcd34d`) with black 1.5px border.

```
       ┌──────────┐
  -2°  │  ╭────╮  │   BertoAI [FREE]
       │  │ 🧠 │  │   Active-Recall Arena
       └──┴────┴──┘
```

### 3.2 Clear Space & Sizing
- **Minimum Digital Size**: 28px height (mobile header), 16px favicon.
- **Clear Space**: Always preserve at least 50% of the mark's height around all four sides.
- **Safe Backgrounds**: Tested on Light Cream (`#fbfaf8`), OLED Dark (`#090d16`), and theme accents.

---

## 4. Color Architecture & Design Tokens

### 4.1 Base Canvas & Surface Tokens

| Token | Light Value | Dark Value | Purpose |
|---|---|---|---|
| `color-bg-canvas` | `#fbfaf8` (Warm Cream) | `#090d16` (Deep Obsidian) | Root body background. |
| `color-bg-surface` | `#ffffff` (Pure White) | `#111827` (Slate 900) | Primary card & modal surface. |
| `color-bg-elevated` | `#f8fafc` (Slate 50) | `#1e293b` (Slate 800) | Secondary panels, inputs, chips. |
| `color-border-bold` | `#09090b` (Black-Zinc) | `#374151` (Slate 700) | Standard 2.5px neo-brutalist border. |
| `color-text-primary`| `#020617` (Slate 950) | `#f8fafc` (Slate 50) | Headlines, active values. |
| `color-text-secondary`| `#475569` (Slate 600) | `#94a3b8` (Slate 400) | Explanations, micro-copy, labels. |

### 4.2 The 6 Theme Accents

Every user can customize their app-wide realm accent:

| Theme Name | Primary 500 | Light 100 | Deep 700 / Shadow | Character & Feel |
|---|---|---|---|---|
| **Violet** (Default) | `#8b5cf6` | `#ede9fe` | `#6d28d9` / `#2e1065` | Magic, cognitive acuity, imaginative. |
| **Indigo** | `#6366f1` | `#e0e7ff` | `#4338ca` / `#1e1b4b` | Technical, structural, deep focus. |
| **Emerald** | `#10b981` | `#d1fae5` | `#047857` / `#064e3b` | Vitality, life sciences, mastery. |
| **Amber** | `#f59e0b` | `#fef3c7` | `#b45309` / `#78350f` | Energy, humanities, streak flame. |
| **Rose** | `#f43f5e` | `#ffe4e6` | `#be123c` / `#881337` | Bold, urgency, vocabulary recall. |
| **Sky** | `#0284c7` | `#e0f2fe` | `#0369a1` / `#082f49` | Clear, astronomy, physics precision. |

### 4.3 Functional Semantic Colors

- **Success / Correct**: Emerald (`#10b981`), Badge (`#d1fae5`), Shadow (`#064e3b`).
- **Error / Lapse**: Rose (`#f43f5e`), Badge (`#ffe4e6`), Shadow (`#881337`).
- **Streak / Sparkle**: Amber (`#f59e0b`), Badge (`#fef3c7`), Shadow (`#78350f`).
- **Cloze / Info**: Sky (`#0284c7`), Badge (`#e0f2fe`), Shadow (`#0369a1`).

---

## 5. Typography Standards

### 5.1 Typeface Families
- **Primary Body & Display**: `Plus Jakarta Sans`, system fallbacks (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).
- **Monospace & Code**: `JetBrains Mono`, `ui-monospace`, `monospace` (for formulas, shortcuts, and keybindings).

### 5.2 Scale & Hierarchy

| Role | Size | Line Height | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| **Display Hero** | `2rem` (32px) | `1.15` | `900` (Black) | `-0.03em` | Summary score, deck hero titles. |
| **Heading 1** | `1.5rem` (24px) | `1.2` | `900` (Black) | `-0.025em` | Page headlines, modal titles. |
| **Heading 2** | `1.25rem` (20px) | `1.25` | `800` (Extra Bold) | `-0.02em` | Section headers, card titles. |
| **Subheading** | `1.05rem` (16.8px) | `1.35` | `700` (Bold) | `-0.015em` | Question prompts, category titles. |
| **Body** | `0.9375rem` (15px) | `1.5` | `500` (Medium) | `0` | Explanations, card answers. |
| **Caption / Badge** | `0.75rem` (12px) | `1.4` | `800` (Extra Bold) | `+0.05em` | Category badges, shortcuts, FSRS stats. |

---

## 6. Tactile Neo-Brutalist Component Specifications

### 6.1 The Tactile Button Formula
```css
.tactile-btn {
  border-width: 2.5px;
  border-color: #09090b;
  border-radius: 1.15rem; /* 18.4px */
  font-weight: 800;
  box-shadow: 0 5px 0 0 <ShadowColor>;
  transition: all 90ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tactile-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 0 0 <ShadowColor>;
}

.tactile-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 0 <ShadowColor> !important;
}
```

### 6.2 The Tactile Card Formula
- **Border**: `2.5px solid #09090b` (light) / `2.5px solid #374151` (dark).
- **Corner Radius**: `1.75rem` (28px).
- **Solid Offset Shadow**: `shadow-[0_6px_0_0_#09090b]` (light) / `shadow-[0_6px_0_0_#030712]` (dark).
- **Interactive Hover**: `hover:-translate-y-1 hover:shadow-[0_9px_0_0_#09090b]`.

---

## 7. Sound & Haptics Identity

Sound is integral to tactile feedback. Berto AI synthesizes audio on-the-fly using the Web Audio API with zero external audio assets:

- **Tap (`playTap`)**: Quick 80ms gentle pluck at 400Hz.
- **Correct Chime (`playCorrect`)**: High-energy dual major-third chime (523Hz `C5` + 659Hz `E5`), evoking success.
- **Wrong Buzz (`playWrong`)**: Low damped tone at 160Hz with soft decay.
- **Confetti Fanfare (`playCelebration`)**: Rapid ascending arpeggio (`C5 -> E5 -> G5 -> C6`).
- **Haptic Pulse**: Gentle 35ms vibration (`navigator.vibrate([35])`) on touch devices.

---

## 8. Governance & File Syncing

Any design token or styling adjustment must adhere to this document.
- Machine-readable tokens: `assets/design-tokens.json`
- Global CSS custom properties: `assets/design-tokens.css`
- Tailwind application styles: `src/index.css`
