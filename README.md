<div align="center">

# 🧠 Berto AI
**Gamified, Local-First Spaced Repetition Mastery Arena**

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

*Berto AI turns flashcard study into an engaging, high-retention quest. Powered by modern FSRS scheduling, offline smart question transformations, and optional Gemini/Groq AI generation.*

[Features](#-core-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Customization](#-customization--design-system) • [Keyboard Shortcuts](#-keyboard-shortcuts)

</div>

---

## 🌟 Core Features

### 🧠 Modern FSRS Spaced Repetition
- Implements the state-of-the-art **Free Spaced Repetition Scheduler (FSRS)** via `ts-fsrs`.
- Scientific memory decay curves calculated individually per card based on:
  - **Stability ($S$)**: Expected memory retention duration.
  - **Difficulty ($D$)**: Inherent complexity factor.
  - **Lapses ($L$)**: Mistake penalties and memory resets.
- Four distinct cognitive grades: **Again** (<10m), **Hard** (1d), **Good** (3d), and **Easy** (5d).
- Supports sandbox **Practice Mode** so you can drill ahead of exams without mutating your scheduling timeline.

### 🎮 Dynamic Multi-Format Quizzes
Transform standard flashcards on-the-fly into rich interactive assessments:
- **Multiple Choice (A, B, C, D)**: Auto-distractor pool sampling with candy-coded letter badges and instant feedback.
- **True or False**: Giant tactile split-button toggles with color glow indicators.
- **Cloze / Fill in the Blank**: Highlight-to-cloze card creation, realtime masking `[______]`, and typo tolerance override button.
- **Multi-Select Checkboxes**: Multi-answer challenges with lively check state animations.
- **Classic 3D Flip Flashcards**: Tactile flip physics with full keyboard shortcut bindings.

### ⚡ Offline Smart Heuristic Engine
- **Zero-Latency & 100% Offline**: Generate multi-choice, true/false, and cloze assessments without an internet connection or API quota.
- Intelligent distractor extraction draws plausible incorrect options from companion cards in your deck.

### ✨ AI Quiz Forge (Gemini & Groq)
- Connect free API keys from **Google Gemini** (`gemini-1.5-flash`, `gemini-2.5-flash`) or **Groq Cloud** (`llama-3.3-70b-versatile`).
- Contextual question extraction, automatic difficulty tuning (Beginner, Balanced, Tough), and instant live connection verification.
- **Zero-telemetry**: API keys are stored strictly inside your local browser database.

### 📂 Nested Realm Hierarchy & Folder Decks
- Create deep deck trees with parent-child relationships (`parentId`).
- **Folder Decks**: Organizational containers (0 study cards) to group multi-chapter syllabi.
- Cascade deletion safeguards that clean up all nested sub-decks and cards atomically.

### 🎨 Vibrant & Gamified Neo-Brutalist Design
- **Tactile Neo-Brutalism**: Chunky borders (`border-[2.5px] border-slate-900`), 3D solid drop shadows (`shadow-[0_4px_0_0_#09090b]`), and crisp tactile press feedback.
- **6 Dynamic Accent Themes**: Violet, Indigo, Emerald, Amber, Rose, and Sky.
- **Gamified Rewards**: Daily study rhythm streak tracker, combo counters (`🔥 5 Combo!`), XP reward previews, audio chimes, and celebratory confetti.
- **Local-First Privacy**: Powered by IndexedDB (`Dexie.js`) with complete JSON export and date-sanitizing restore.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or bun

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/berto-ai.git
cd berto-ai

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build & Testing

```bash
# Run automated Vitest test suite
npm test

# Fast code linting (Oxlint)
npm run lint

# Production build with TypeScript checks
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗 Architecture

```
berto-ai/
├── src/
│   ├── components/            # UI components and modals
│   │   ├── CreateDeckPage.tsx # Quest builder, category picker & file importer
│   │   ├── DeckCard.tsx       # Tactile deck card with theme colors & stats
│   │   ├── DeckViewPage.tsx   # Subdecks, cloze preview & card management
│   │   ├── Header.tsx         # Brand mascot, streak flame & action controls
│   │   ├── SettingsModal.tsx  # 5-section customization hub & API manager
│   │   ├── Sidebar.tsx        # Learner level card, deck tree & tag filter
│   │   ├── StudyLauncherModal.tsx # Game mode & question count launcher
│   │   ├── StudyView.tsx      # Multi-format quiz arena & FSRS scheduler
│   │   ├── SummaryModal.tsx   # Post-session celebration & accuracy stats
│   │   └── WeeklyStreakWidget.tsx # 7-day study rhythm matrix
│   ├── lib/                   # Business logic, engines & database
│   │   ├── ai.ts              # Resilient Gemini & Groq API handlers
│   │   ├── aiQuizEngine.ts    # AI dynamic question generation
│   │   ├── algorithms.test.ts # Vitest test suite for FSRS & heuristics
│   │   ├── db.ts              # Dexie.js IndexedDB schema & starter seeds
│   │   ├── fileParser.ts      # Lazy-loaded PDF, PPTX, TXT & JSON parsers
│   │   ├── fsrs.ts            # FSRS spacing mathematical scheduler
│   │   ├── offlineQuizEngine.ts # Smart local distractor & question heuristics
│   │   └── sound.ts           # Web Audio API synthesizers & sound effects
│   ├── types/                 # Unified TypeScript interfaces
│   ├── App.tsx                # State coordination, routing & theme listeners
│   └── index.css              # Neo-brutalist tactile classes & theme tokens
├── public/                    # Service worker & static icons
└── package.json
```

---

## 🎨 Customization & Design System

Access the **Settings Hub** (`Ctrl+,` or Header Gear) to customize:

| Dimension | Options | Description |
|---|---|---|
| **Theme Mode** | `Light` • `Dark` • `System` | True dark mode with OLED-friendly background (`#090d16`). |
| **Accent Theme** | `Violet` • `Indigo` • `Emerald` • `Amber` • `Rose` • `Sky` | Injects global CSS tokens across buttons, badges, and rings. |
| **Visual Density** | `Tactile` • `Modern` • `Compact` | Choose between bold neo-brutalism, softer elevations, or high-density drill cards. |
| **Text Scale** | `Normal` • `Large` | High-legibility font scaling (110%) for reading ease. |
| **Auto-Advance** | `Off` • `Fast (1.0s)` • `Normal (1.8s)` | Automatically moves to next card on correct answers with countdown progress. |
| **Audio & FX** | `Mute` to `100%` | Synthesized chimes for correct, wrong, tap, and confetti fanfare. |

---

## ⌨️ Keyboard Shortcuts

Speed through study sessions without taking your hands off the keyboard:

| Shortcut | Context | Action |
|---|---|---|
| `/` | Dashboard | Focus deck search input |
| `N` | Dashboard | Create new deck |
| `?` | Anywhere | Toggle keyboard shortcuts cheat sheet |
| `1`, `2`, `3`, `4` | Study (Multiple Choice) | Select choice `A`, `B`, `C`, or `D` |
| `1` / `T`, `2` / `F` | Study (True / False) | Choose `True` or `False` |
| `Space` | Study (Flashcard) | Flip flashcard |
| `1`, `2`, `3`, `4` | Study (Flashcard Flipped) | Rate difficulty: Again (`1`), Hard (`2`), Good (`3`), Easy (`4`) |
| `Enter` | Study | Submit typed answer or advance to next card |
| `Esc` | Modals & Study | Close modal or exit to deck view |

---

## 🔒 Privacy & Local-First Philosophy

- **No Remote Telemetry**: Your cards, study history, and performance stats stay exclusively in your browser's IndexedDB.
- **Offline Capable**: Registered Service Worker (`public/sw.js`) caches application assets for full offline usability.
- **Data Portability**: Full JSON export and backup restore with automatic timestamp and FSRS schedule sanitization.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
