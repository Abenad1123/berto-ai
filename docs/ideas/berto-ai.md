# Berto AI: Fast, Tactile, Free Active-Recall for Students

## Problem Statement
How might we give students an active-recall study platform with a friendly, tactile visual design, running at 60 FPS offline on budget devices, with completely free, transparent AI deck generation and zero bloatware?

## Recommended Direction
Build an ultra-lightweight, offline-first Progressive Web App (PWA) that delivers a joyful, tactile study experience (neo-brutalist rounded cards, tactile press-down button physics, celebratory micro-feedback, and segmented progress bars) powered by pure CSS hardware acceleration and the modern FSRS memory algorithm.

AI inference is transparent and utility-driven: one-click deck generation from pasted text, PDFs, or YouTube links, powered directly by free-tier LLM APIs (Gemini 2.0 Flash / Groq) or Bring-Your-Own-Key (BYOK), costing the user $0 and the developer $0 in server overhead.

## Key Assumptions to Validate
- [ ] Students stay engaged with pure tactile quiz feedback (satisfying button clicks, sound effects, completion animations) without needing virtual coins or pet cosmetics.
- [ ] Free-tier Gemini Flash / Groq via client-side requests provides fast enough card generation (<5 seconds for 20 high-yield questions) without hitting rate limit walls.
- [ ] The app achieves a consistent 60 FPS and <100ms response time on an entry-level budget Android device or low-end laptop.

## MVP Scope (What's In)
- **Tactile Neo-Brutalist UI:**
  - Modern, friendly student aesthetic: rounded cards, pastel category tags, chunky readable typography.
  - Tactile quiz controls with hardware-accelerated press physics (`active:scale-95`).
  - Segmented top progress bar with celebratory feedback states (instant green bounce for correct, soft coral for incorrect with instant 1-sentence explanation).
- **Core Study Modes:**
  - Multiple-Choice Quiz mode (smart distractors).
  - Active Recall / Tap-to-Reveal Flashcard mode.
  - Spaced Repetition scheduling powered by a lightweight client-side FSRS/SM-2 engine.
- **Smart AI Deck Creator:**
  - Ingest raw text, lecture notes, or pasted summary.
  - Ingest PDF / Slide text.
  - One-click "Magic Generate": creates 10–25 clean question/answer pairs.
  - Support for Free Gemini API key or Groq API key stored securely in local browser storage.
- **Offline-First Storage:**
  - Full IndexedDB storage via local database: all decks, study history, and cards work with zero internet connection.
  - One-click Export/Import (JSON / CSV) for easy backup and deck sharing.

## Not Doing (and Why)
- **Virtual currency, coins, and shops** — Distracts from real studying, adds database bloat, and encourages dark patterns.
- **3D avatars and pet dressing rooms** — Primary cause of client-side lag and battery drain on low-end hardware.
- **Conversational chatbot personas** — Students find chatty AI confusing when studying. AI should be a precision question generator and grader, not a fake friend.
- **Paid subscription tiers and artificial daily caps** — No paywalls, ever. The app runs client-side with free API keys.
- **Heavy Lottie animations and WebGL canvases** — All animations will use native CSS transforms (`translate3d`, `opacity`, `scale`) to guarantee 60 FPS on any hardware.
- **Social feeds and global multiplayer duels** — Unnecessary server complexity for v1 that distracts from personal academic mastery.

## Open Questions & Architecture Decisions
1. **Frontend Stack:** Vite + React + Tailwind CSS with Lucide icons (or Svelte/Solid for extreme light-weightiness).
2. **Local Storage:** Dexie.js (IndexedDB wrapper) for type-safe, reactive offline storage.
3. **Spaced Repetition Algorithm:** `ts-fsrs` (TypeScript implementation of the modern Free Spaced Repetition Scheduler).
4. **AI Client:** Direct client-side SDK for Google Generative AI (Gemini 2.0 / 1.5 Flash) and Groq SDK with prompt templates tuned for structured JSON flashcard generation.
