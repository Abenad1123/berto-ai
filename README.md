<div align="center">

```
  ██████╗ ███████╗██████╗ ████████╗ ██████╗      █████╗ ██╗
  ██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔═══██╗    ██╔══██╗██║
  ██████╔╝█████╗  ██████╔╝   ██║   ██║   ██║    ███████║██║
  ██╔══██╗██╔══╝  ██╔══██╗   ██║   ██║   ██║    ██╔══██║██║
  ██████╔╝███████╗██║  ██║   ██║   ╚██████╔╝    ██║  ██║██║
  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝     ╚═╝  ╚═╝╚═╝
```

### **Gamified, Local-First Spaced Repetition Mastery Arena**

[![GitHub Repository](https://img.shields.io/badge/GitHub-Abenad1123%2Fberto--ai-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Abenad1123/berto-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-11%20Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Bundle Size](https://img.shields.io/badge/Gzipped%20Size-164%20kB-blueviolet?style=for-the-badge)](https://github.com/Abenad1123/berto-ai)

<p align="center">
  <b>Berto AI</b> transforms flashcard study into an engaging, high-retention quest.<br/>
  Powered by the modern <b>FSRS mathematical memory model</b>, zero-latency <b>offline heuristic transforms</b>,<br/>
  and transparent <b>client-side AI generation (Gemini & Groq)</b>. Zero ads. Zero paywalls. Zero telemetry.
</p>

[Key Highlights](#-key-highlights) • [Interactive Quiz Arena](#-interactive-quiz-arena) • [FSRS Spaced Repetition](#-scientific-fsrs-spaced-repetition) • [Quick Start](#-quick-start) • [Design System & Theming](#-design-system--theming) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [BYOK AI Setup](#-byok-ai-setup)

</div>

---

## ⚡ Key Highlights

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│        ⚡ 100% Local-First       │       🧠 Modern FSRS Engine     │     🎮 Neo-Brutalist Arena      │
│  All cards, decks, and schedules│  Replaces rigid SM-2 algorithms │  Chunky 3D buttons, sound FX,   │
│  are stored in IndexedDB via    │  with mathematical stability    │  streak flames, and celebratory │
│  Dexie.js. Zero cloud telemetry.│  and lapse decay predictions.   │  confetti bursts at 60 FPS.     │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

- **Offline-First Resilience**: Full PWA service worker caching. Import, export, study, and quiz with zero internet connection.
- **5 Dynamic Question Formats**: Flashcards, Multiple Choice, True/False, Cloze (Fill-in-the-Blank), and Multi-Select Checkboxes.
- **Offline Smart Heuristic Generator**: Converts any plain deck into multi-choice or true/false quizzes using companion distractor pooling.
- **Transparent AI Forge**: One-click deck and quiz creation from PDFs, PowerPoint slides (`.pptx`), or raw lecture notes powered by free-tier **Google Gemini** or **Groq Cloud**.
- **Nested Realm Hierarchy**: Unlimited sub-deck nesting and zero-card organizational **Folder Decks**.
- **Full Tactile Customization**: 6 vivid accent colors, 3 visual densities (Tactile, Modern, Compact), text scaling, and auto-advance timers.

---

## 🎮 Interactive Quiz Arena

Transform standard two-sided flashcards into 5 interactive assessment formats:

```
  1. MULTIPLE CHOICE [A, B, C, D]         2. TRUE OR FALSE [1 / 2]
  ┌──────────────────────────────────┐    ┌──────────────────────────────────┐
  │ [A] Mitochondria                 │    │  [1] True    │  [2] False        │
  │ [B] Ribosome    [C] Nucleus      │    │    ✓               ✗             │
  └──────────────────────────────────┘    └──────────────────────────────────┘
  3. CLOZE FILL-IN-THE-BLANK              4. MULTI-SELECT CHECKBOXES
  ┌──────────────────────────────────┐    ┌──────────────────────────────────┐
  │ The powerhouse is [______]       │    │  [✓] Glycolysis                  │
  │ [ Mitochondria ] <Enter ↵>       │    │  [✓] Krebs Cycle   [ ] Calvin    │
  └──────────────────────────────────┘    └──────────────────────────────────┘
```

### Format Breakdown

| Format | Interaction | Key Advantage |
|---|---|---|
| **Multiple Choice** | 4 candy-coded choice cards (`A: Violet`, `B: Sky`, `C: Amber`, `D: Rose`) | Tests discrimination among related concepts; auto-generates distractors from your deck. |
| **True or False** | Split tactile buttons with giant check/cross glyphs (`1 or T` / `2 or F`) | Rapid-fire concept verification for quick revision sessions. |
| **Cloze Deletion** | Live `[______]` masking with realtime preview card | High active recall; includes a **"Typo / Close Enough"** override button to prevent unfair penalties. |
| **Checkboxes** | Springy multi-select tiles with emerald check indicators | Tests multi-part truths (e.g. *"Which of the following are steps in cellular respiration?"*). |
| **3D Flashcard Arena** | Perspective 3D flip card with FSRS cognitive rating buttons | Classic active recall with intervals (`Again <10m`, `Hard 1d`, `Good 3d`, `Easy 5d`). |

---

## 🧠 Scientific FSRS Spaced Repetition

Berto AI discards the 35-year-old SuperMemo SM-2 algorithm in favor of the **Free Spaced Repetition Scheduler (FSRS v5)**.

### Why FSRS Outperforms SM-2

```
  SM-2 (Legacy)        → Fixed multipliers, ignores lapses, over-reviews easy cards.
  FSRS (Berto AI)      → Dynamic retention modeling: R(t) = (1 + F · t / S)^(-1)
```

| Metric | Legacy SM-2 (Anki Default) | Berto AI (FSRS v5) | Advantage |
|---|---|---|---|
| **Memory Model** | Heuristic ease factor ($EF$) | Retrievability ($R$), Stability ($S$), Difficulty ($D$) | Clinically validated memory decay curves |
| **Over-Review Waste** | High (static intervals) | **30% to 50% fewer reviews** | Spend less time for the same retention target |
| **Lapse Recovery** | Punitive reset to step 1 | Proportional stability penalty | Faster recovery on forgotten facts |
| **Custom Retention** | Hardcoded ~85% | Selectable: **85%**, **90%**, or **95%** | Tailor rigor to casual learning vs. board exams |
| **Practice Mode** | Not supported | **Non-destructive sandbox** | Drill ahead of tests without corrupting future review intervals |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) (bundled with Node)

### Installation & Local Run

```bash
# 1. Clone the repository
git clone https://github.com/Abenad1123/berto-ai.git
cd berto-ai

# 2. Install dependencies
npm install

# 3. Start development server with Hot Module Replacement (HMR)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Quality Verification Commands

```bash
# Execute automated Vitest algorithm suite (11/11 tests)
npm test

# Run Oxlint (fast Rust-based static analysis)
npm run lint

# Compile TypeScript and bundle production assets with Vite
npm run build

# Preview production build locally
npm run preview
```

---

## 🎨 Design System & Theming

Berto AI combines **Tactile Neo-Brutalism** with flexible design tokens defined in [`docs/brand-guidelines.md`](docs/brand-guidelines.md) and [`assets/design-tokens.json`](assets/design-tokens.json).

```
   NEO-BRUTALIST TACTILE FORMULA
   ┌───────────────────────────────────────────────┐
   │  Border:      2.5px solid #09090b             │
   │  Shadow:      0 5px 0 0 #09090b               │
   │  Active:      translateY(4px), shadow: none   │
   │  Transitions: 90ms cubic-bezier(0.34, 1.56)   │
   └───────────────────────────────────────────────┘
```

### Customizable Settings (Settings Hub `Ctrl+,`)

- **Theme Mode**:
  - `Light`: Warm cream canvas (`#fbfaf8`) with dark slate typography.
  - `Dark`: Deep obsidian canvas (`#090d16`) with high-contrast text.
  - `System`: Automatically tracks OS preference.
- **6 Dynamic Accent Palettes**:
  - 🟣 **Violet** (`#8b5cf6`) • Default, imaginative & cognitive.
  - 🔵 **Indigo** (`#6366f1`) • Architectural & deep focus.
  - 🟢 **Emerald** (`#10b981`) • Vitality, biology & life sciences.
  - 🟡 **Amber** (`#f59e0b`) • Warm streak flame & humanities.
  - 🔴 **Rose** (`#f43f5e`) • High urgency & vocabulary recall.
  - 🌊 **Sky** (`#0284c7`) • Crisp physics & mathematical precision.
- **Card Densities**:
  - `Tactile Neo-Brutalist`: Chunky borders and solid 3D depth shadows.
  - `Modern Soft`: Ambient elevations with subtle 1.5px borders.
  - `Compact Drill`: Reduced padding optimized for speed-drilling large decks.
- **Auto-Advance Timer**:
  - Automatically moves to the next card on correct answers with an animated progress bar:
  - `Off` (manual click) • `Fast Rush (1.0s)` • `Balanced (1.8s)`.
- **Text Scaling**: Toggle between standard scale (100%) and high-legibility large (110%).

---

## ⌨️ Keyboard Shortcuts

Complete keyboard controllability designed for high-speed review sessions:

### Navigation & Global
| Key | Action |
|---|---|
| <kbd>/</kbd> | Focus deck search input on Dashboard |
| <kbd>N</kbd> | Open New Deck quest builder |
| <kbd>?</kbd> | Toggle Keyboard Shortcuts Cheat Sheet modal |
| <kbd>Esc</kbd> | Close any open modal or exit active study session |

### In-Session Quiz Controls
| Key | Context | Action |
|---|---|---|
| <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd> | Multiple Choice | Select option `A`, `B`, `C`, or `D` |
| <kbd>1</kbd> or <kbd>T</kbd>, <kbd>2</kbd> or <kbd>F</kbd> | True / False | Choose `True` or `False` |
| <kbd>Space</kbd> | Flashcard (Front) | Flip flashcard to reveal answer |
| <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd> | Flashcard (Back) | Grade recall: Again (<kbd>1</kbd>), Hard (<kbd>2</kbd>), Good (<kbd>3</kbd>), Easy (<kbd>4</kbd>) |
| <kbd>Enter</kbd> | Fill-in-the-Blank | Submit typed answer |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Feedback Screen | Continue immediately to next card (skips auto-advance countdown) |

---

## 🔑 BYOK AI Setup

Berto AI adopts a **Bring-Your-Own-Key (BYOK)** model with **zero intermediary proxy servers**. Your API key communicates directly from your browser to the official provider and is stored safely in your browser's local IndexedDB.

### Supported Providers

<details>
<summary><b>1. Google Gemini (Recommended — 100% Free)</b></summary>
<br/>

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. In Berto AI, open **Settings** (<kbd>Ctrl+,</kbd>) → **AI Engine**.
4. Select **Google Gemini**, paste your key, and click **Test Connection**.
5. *Models supported*: `gemini-1.5-flash`, `gemini-2.5-flash` with dynamic fallback.
</details>

<details>
<summary><b>2. Groq Cloud (Ultra-Fast Llama 3.3 70B — Free Tier)</b></summary>
<br/>

1. Go to [Groq Console](https://console.groq.com/keys).
2. Create a free API key.
3. In Berto AI, open **Settings** (<kbd>Ctrl+,</kbd>) → **AI Engine**.
4. Select **Groq Cloud**, paste your key, and click **Test Connection**.
5. *Models supported*: `llama-3.3-70b-versatile`.
</details>

> [!NOTE]
> An API key is **completely optional**. You can import documents (PDF/PPTX/TXT), create cards manually, or use the **Offline Smart Heuristic Engine** indefinitely without an API key.

---

## 📁 Document Ingestion & File Support

Easily convert study materials into flashcards:

- 📄 **PDF Documents**: Ingest lecture slides, journal articles, and textbooks. Parsed via locally-bundled `pdfjs-dist` (lazy loaded on demand).
- 📊 **PowerPoint (`.pptx`)**: Extracts all slide text with automatic XML entity decoding (`&amp;`, `&lt;`, `&quot;`).
- 📝 **Plain Text / Notes (`.txt`, `.md`)**: Paste notes or upload raw text files.
- 💾 **JSON Vault Backup**: One-click full deck export and restore with automated date sanitization.

---

## 🏛 Technical Architecture & Directory Structure

```
berto-ai/
├── src/
│   ├── components/                # UI Components (React 19 + Tailwind v4)
│   │   ├── CreateDeckPage.tsx     # Quest builder, category icons & file parser
│   │   ├── DeckCard.tsx           # Tactile card with dynamic theme colors & count
│   │   ├── DeckViewPage.tsx       # Subdeck realm cards, cloze tools & card list
│   │   ├── Header.tsx             # Brand mascot, streak flame & quick controls
│   │   ├── MobileNav.tsx          # Responsive mobile navigation drawer
│   │   ├── ProfileModal.tsx       # Learner profile & daily goal tracker
│   │   ├── SettingsModal.tsx      # 5-section customization hub & API tester
│   │   ├── ShortcutsModal.tsx     # Keyboard shortcuts cheat sheet modal
│   │   ├── Sidebar.tsx            # RPG learner card, deck tree & tag filters
│   │   ├── StudyLauncherModal.tsx # Game mode cards & round length selector
│   │   ├── StudyView.tsx          # Multi-format quiz arena & FSRS scheduler
│   │   ├── SummaryModal.tsx       # Post-round celebration & accuracy metrics
│   │   └── WeeklyStreakWidget.tsx # 7-day study rhythm matrix with celebration glow
│   ├── lib/                       # Core Algorithms & Local Engines
│   │   ├── ai.ts                  # Resilient Gemini & Groq API handlers
│   │   ├── aiQuizEngine.ts        # AI dynamic question generation
│   │   ├── algorithms.test.ts     # Vitest automated test suite (FSRS & heuristics)
│   │   ├── categoryIcons.tsx      # Lucide icon resolver by category name
│   │   ├── db.ts                  # Dexie.js IndexedDB schema & starter deck seeds
│   │   ├── fileParser.ts          # Lazy dynamic import parser for PDF & PPTX
│   │   ├── fsrs.ts                # FSRS mathematical memory scheduling algorithms
│   │   ├── offlineQuizEngine.ts   # Zero-latency local distractor & question heuristics
│   │   └── sound.ts               # Web Audio API synthesizers (taps, chimes, buzz)
│   ├── types/                     # Unified TypeScript type definitions
│   ├── App.tsx                    # State coordinator, routing & theme listeners
│   ├── index.css                  # Neo-brutalist tactile physics & accent tokens
│   └── main.tsx                   # React 19 root mounting
├── assets/                        # Design tokens (JSON & CSS variables)
├── docs/                          # Brand guidelines & project philosophy
├── public/                        # PWA manifest & offline service worker
├── package.json                   # Dependencies & test scripts
└── vite.config.ts                 # Vite bundler configuration
```

---

## 🧪 Testing & Verification

Berto AI includes unit tests verifying both FSRS mathematical stability and offline question heuristics:

```bash
npm test
```

```
 ✓ src/lib/algorithms.test.ts (11 tests) 14ms
   ✓ FSRS Scheduling Algorithm (4)
     ✓ initializes FSRS fields with valid defaults
     ✓ updates card state and schedules next review on "good" response
     ✓ handles "again" (lapse) response for new and review cards
     ✓ handles "easy" grade
   ✓ Offline Smart Heuristic Quiz Generator (7)
     ✓ returns empty array when given empty cards list
     ✓ respects the count parameter
     ✓ transforms card to multiple choice with target answer in options
     ✓ transforms card to true/false question format
     ✓ transforms card to fill in the blank with cloze deletion
     ✓ transforms card to multiple select with correct answers
     ✓ generates a mixed quiz cycling question types
```

---

## 🔒 Privacy & Local Storage Guarantee

1. **No External Tracking**: No Google Analytics, Mixpanel, or third-party telemetry scripts.
2. **Local Database**: All flashcards, study logs, schedules, and custom settings live exclusively in your browser's IndexedDB.
3. **Safe Backup & Restore**: Full JSON export allows backing up your decks to your personal drive, thumb drive, or private cloud storage at any time.

---

## 🤝 Contributing

Contributions are warmly welcomed! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes with descriptive commit messages (`git commit -m 'feat: add audio speed controls'`).
4. Ensure all tests pass and linter is clean:
   ```bash
   npm test && npm run lint && npm run build
   ```
5. Push to the branch (`git push origin feat/amazing-feature`).
6. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

---

<div align="center">
  <sub>Engineered with precision for students, candidates, and lifelong learners worldwide.</sub><br/>
  <sub>Crafted with ❤️ by <a href="https://github.com/Abenad1123">Abenad1123</a></sub>
</div>
