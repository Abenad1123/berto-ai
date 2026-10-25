# Enhanced Study Gamification & UI Streamlining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase study engagement with streak & combo XP multipliers, add a "Reveal Answer" option that resets combo, add collapsible deck trees to the hamburger drawer, and prune visual noise/redundant micro-copy from the Study Launcher modal per user feedback.

---

## File Structure & Responsibilities

| File | Responsibility |
|---|---|
| `src/lib/gamification.ts` | Gamification logic: compute streak XP multiplier (1.0x–2.0x) and combo XP multiplier (1.0x–3.0x). |
| `src/lib/gamification.test.ts` | Unit tests for streak & combo multipliers, maximum caps, and edge cases. |
| `src/components/Sidebar.tsx` | Hamburger drawer: collapsible sub-decks with chevron toggles for parent decks and folders. |
| `src/components/StudyView.tsx` | Quiz & flashcard arena: tracks max combo, provides "Reveal Answer" button that resets combo to 0. |
| `src/components/SummaryModal.tsx` | Session celebration modal: shows breakdown of base XP, streak multiplier, and combo multiplier. |
| `src/components/StudyLauncherModal.tsx` | Launcher modal UI cleanup: simplified badges, removed redundant micro-copy, removed XP noise from question chips, clean Practice Sandbox toggle. |

---

## Task 1: Collapsible Deck Tree in Hamburger Drawer

**Files to modify:** `src/components/Sidebar.tsx`

- [ ] **Step 1: Add collapse state and toggle handler**
  In `Sidebar.tsx`, add `collapsedDeckIds: Record<number, boolean>` local state:
  ```ts
  const [collapsedDeckIds, setCollapsedDeckIds] = useState<Record<number, boolean>>({});

  const toggleDeckCollapse = (deckId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    setCollapsedDeckIds((prev) => ({
      ...prev,
      [deckId]: !prev[deckId],
    }));
  };
  ```

- [ ] **Step 2: Add Chevron toggle button to parent decks with sub-decks**
  Next to each parent deck or folder that has `subDecks.length > 0`, render an accessible toggle button with rotating `ChevronDown` (`rotate-0` when expanded, `-rotate-90` when collapsed).

- [ ] **Step 3: Conditionally render sub-deck container**
  Render the indented sub-deck list only when `!collapsedDeckIds[deck.id]`, with smooth slide/opacity entrance.

- [ ] **Step 4: Verify in browser preview**
  Confirm clicking the chevron collapses and expands nested sub-decks without triggering navigation, and clicking the deck card navigates as expected.

---

## Task 2: Streak & Combo XP Multipliers in Gamification Engine

**Files to modify:** `src/lib/gamification.ts`, `src/lib/gamification.test.ts`

- [ ] **Step 1: Write failing unit tests for streak and combo multipliers**
  In `gamification.test.ts`, add test cases:
  - 0 streak days + 0 combo -> 1.0x streak, 1.0x combo -> base XP.
  - 5 streak days (+0.1x per day) -> 1.5x streak multiplier.
  - 12 streak days -> capped at 2.0x max streak multiplier.
  - 4 combo (+0.1x per combo) -> 1.4x combo multiplier.
  - 25 combo -> capped at 3.0x max combo multiplier.
  - Combined streak & combo scaling: e.g. 5 streak (1.5x) + 5 combo (1.5x) on 50 base XP -> `round(50 * 1.5 * 1.5) = 113 XP`.

- [ ] **Step 2: Implement multiplier calculations in `gamification.ts`**
  Update `StudySessionRewardParams` to include `maxCombo?: number`:
  ```ts
  export interface StudySessionRewardParams {
    currentXp: number;
    currentStreakDays: number;
    lastStudyDate?: string;
    todayIsoDate: string;
    correctAnswersCount: number;
    gameMode?: GameMode;
    maxCombo?: number;
  }
  ```
  Calculate multipliers:
  ```ts
  const streakMultiplier = Math.min(2.0, Number((1.0 + Math.max(0, currentStreakDays) * 0.1).toFixed(1)));
  const comboMultiplier = Math.min(3.0, Number((1.0 + Math.max(0, maxCombo ?? 0) * 0.1).toFixed(1)));
  const baseEarnedXp = Math.max(0, correctAnswersCount) * xpPerCorrect;
  const earnedXp = Math.round(baseEarnedXp * streakMultiplier * comboMultiplier);
  ```
  Include `streakMultiplier`, `comboMultiplier`, and `baseEarnedXp` in `StudySessionRewards`.

- [ ] **Step 3: Run unit tests**
  Execute `npm.cmd test -- --run` and verify all tests pass.

---

## Task 3: In-Session Combo Tracking & "Reveal Answer" Option

**Files to modify:** `src/components/StudyView.tsx`, `src/components/SummaryModal.tsx`, `src/App.tsx`

- [ ] **Step 1: Track `maxCombo` in `StudyView.tsx`**
  Add state `const [maxCombo, setMaxCombo] = useState(0);`.
  Whenever `currentStreak + 1 > maxCombo`, update `maxCombo`.

- [ ] **Step 2: Implement "Reveal Answer" button in `StudyView.tsx`**
  When `!isAnswerSubmitted` and question type is multiple choice, multiple select, or fill blank:
  - Render a tactile "Reveal Answer" button (`Eye` icon) in the question footer.
  - Clicking `handleRevealAnswer`:
    - Plays incorrect/notice sound.
    - Sets `currentStreak(0)` (immediately resets combo!).
    - Sets `isCurrentCorrect(false)` and `isAnswerSubmitted(true)`.
    - Stops the speed-run countdown timer.
    - Records answer with `userResponse: '(Revealed)'` and `isCorrect: false`.
    - Reveals the explanation and correct answer without immediate auto-advance so the learner can read it.

- [ ] **Step 3: Forward `maxCombo` to session completion**
  In `StudyView.tsx` and `App.tsx`, pass `maxCombo` into `calculateStudySessionRewards`.
  In `SummaryModal.tsx`, display the streak and combo multiplier badges next to earned XP.

---

## Task 4: Streamline Study Launcher Modal (Pictures 1–4)

**Files to modify:** `src/components/StudyLauncherModal.tsx`

- [ ] **Step 1: Simplify Engine Selector (Picture 1)**
  - Change badge `Instant / Offline` to `Offline`.
  - Change badge `FSRS Spaced Rep` to `Spaced Rep`.
  - Remove description strings beneath engine cards ("Instant • 0 API cost...", "Contextual questions...", "3D card flip...").

- [ ] **Step 2: Remove XP count chips & header max XP badge (Picture 2)**
  - Remove `+{maxPotentialXp} XP Max Reward` badge from section 4 header.
  - In count selector buttons, remove the `+{chipXp} XP` chip. Only display clean counts: `5 Qs`, `10 Qs`, `15 Qs`, `All (N)`.

- [ ] **Step 3: Simplify Practice Mode Toggle (Picture 3)**
  - Rename the toggle section to **"Practice Sandbox Mode"**.
  - Remove confusing inverted terminology. Show a straightforward toggle with description: "Practice freely without altering your card memory retention schedules."

- [ ] **Step 4: Clean Game Mode Cards (Picture 4)**
  - Remove description strings beneath game modes ("Relaxed pace...", "10s countdown...", "Strict zero hints...").
  - Remove the XP header badge (`10 XP / Q` / `⚡ 15 XP / Q`). Keep the mode badges (`Standard`, `⚡ 10s Blitz`, `🔥 1.5x XP`).

---

## Task 5: Quality Gate & Verification

- [ ] **Step 1: Run linter**
  Execute `npm.cmd run lint` (0 warnings, 0 errors).

- [ ] **Step 2: Run unit test suite**
  Execute `npm.cmd test -- --run` (all unit tests passing).

- [ ] **Step 3: Production web build**
  Execute `npm.cmd run build` (clean Vite bundle).

- [ ] **Step 4: Capacitor Android sync**
  Execute `npx.cmd cap sync android` to sync web assets.
