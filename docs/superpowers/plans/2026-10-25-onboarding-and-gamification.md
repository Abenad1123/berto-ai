# Onboarding & Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate new users behind an onboarding screen (name, avatar, ToS acceptance) instead of auto-seeding a "Alex" profile, and make XP/levels/streaks respond to real study activity.

**Architecture:** The app is a local-first PWA with no server — "account creation" means writing a `UserProfile` row to IndexedDB. On mount, `App.tsx` checks if a profile exists; if not, it renders `<OnboardingScreen>` instead of the main shell. XP is already earned and persisted in `handleFinishStudy` (App.tsx:276-310); streaks are already computed there too. The remaining work is: (1) remove the hardcoded seed profile, (2) add the onboarding gate, (3) remove fallback formulas in ProfilePage so displayed values match stored values, (4) make badges dynamic from real data.

**Tech Stack:** React 18, Dexie 4 (IndexedDB), TypeScript, Tailwind CSS, Lucide icons

**Spec:** User request — no separate spec doc. Requirements are captured in this plan.

## Global Constraints

- Local-first only — no server, no auth, no network calls for onboarding
- Dexie schema version stays at 2 (new fields are optional on `UserProfile`, no migration needed)
- All UI must support dark mode and match the existing tactile/neo-brutalist design language
- Mobile-first responsive (the app is a PWA)
- Existing data for current users must not be wiped — only new installs get onboarding
- No new dependencies

## Review Focus

1. **Returning user with existing profile:** `seedInitialData()` currently auto-creates the Alex profile. After changes, a user who already has a profile row must never see the onboarding screen — the gate checks `db.profile.count() > 0`.
2. **Factory reset flow:** `handleFactoryReset` in SettingsModal clears decks and cards but keeps the profile. After reset, the user should NOT re-enter onboarding — only a full data wipe (or manual profile delete) triggers it.
3. **XP starting at 0 vs legacy 340:** New users start at 0 XP. Existing users who already have `xp: 340` keep their value. ProfilePage must not add phantom XP via the fallback formula.
4. **Streak across midnight:** If a user studies at 11:55 PM and again at 12:05 AM, that's two calendar days — streak should increment. The existing `handleFinishStudy` logic handles this correctly via `toISOString().slice(0, 10)` comparison.
5. **Empty profile fields:** If user submits onboarding with whitespace-only name, it should be trimmed and rejected (require non-empty name).

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `tosAcceptedAt` field to `UserProfile` |
| `src/lib/db.ts` | Modify | Remove auto-seeded Alex profile from `seedInitialData()`, keep settings + deck seeding |
| `src/components/OnboardingScreen.tsx` | Create | Full-screen onboarding: name, avatar color, daily goal, ToS checkbox, submit |
| `src/App.tsx` | Modify | Add onboarding gate before main shell; pass `onComplete` callback that creates profile + seeds starter decks |
| `src/components/ProfilePage.tsx` | Modify | Remove XP/streak fallback formulas; make badges dynamic from real data |
| `src/components/SummaryModal.tsx` | Modify | Show XP earned badge with animation after session (already displays `xpEarned`, no change needed — verify only) |

---

### Task 1: Onboarding Types & Database Changes

**Files:**
- Modify: `src/types/index.ts:47-58` (UserProfile interface)
- Modify: `src/lib/db.ts:63-77` (remove Alex profile seed)

**Interfaces:**
- Consumes: nothing
- Produces: `UserProfile.tosAcceptedAt?: string` (ISO date string), updated `seedInitialData()` that no longer creates a profile row

- [ ] **Step 1: Add `tosAcceptedAt` to `UserProfile` in `src/types/index.ts`**

Add one optional field after `lastStudyDate`:
```ts
tosAcceptedAt?: string; // ISO date string
```

- [ ] **Step 2: Remove the profile auto-seed block from `seedInitialData()` in `src/lib/db.ts`**

Delete lines 63-77 (the `if (profileCount === 0) { await db.profile.add({...}) }` block). Keep the settings seed and deck seed intact. The profile will now only be created by the onboarding screen.

- [ ] **Step 3: Verify the app still builds**

Run: `npm run build`
Expected: Clean build with no type errors. The app will currently show the home screen with no profile data (some profile-dependent UI may show defaults) — this is expected and will be fixed in Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/db.ts
git commit -m "feat(onboarding): add tosAcceptedAt to UserProfile, remove auto-seeded Alex profile"
```

---

### Task 2: Onboarding Screen Component

**Files:**
- Create: `src/components/OnboardingScreen.tsx`

**Interfaces:**
- Consumes: `UserProfile` type from `src/types/index.ts`, `AvatarColor` type and `colorThemes` map from `ProfilePage.tsx` design reference
- Produces: `OnboardingScreen` component with props:
  ```ts
  interface OnboardingScreenProps {
    onComplete: (profile: Omit<UserProfile, 'id'>) => void;
  }
  ```

- [ ] **Step 1: Create `src/components/OnboardingScreen.tsx`**

A single full-screen component with:
- **Step indicator** (3 steps: Welcome → Profile → Ready)
- **Step 1 — Welcome:** App logo/name, tagline, "Get Started" button
- **Step 2 — Profile Setup:** Name input (required, trim whitespace, reject empty), avatar color picker (6 colors from `colorThemes`), daily goal stepper (default 20, range 5-100), optional subtitle/major field
- **Step 3 — Terms & Launch:** ToS text (short paragraph about local-only data storage), checkbox "I accept the Terms of Service" (required), "Start Learning" button (disabled until checkbox is checked)

On submit, calls `onComplete` with:
```ts
{
  name: trimmedName,
  age: ageField || 'Student',
  major: majorField || 'General Studies',
  motto: 'Consistency beats intensity.',
  avatarColor: selectedColor,
  dailyGoalCards: dailyGoal,
  xp: 0,
  streakDays: 0,
  lastStudyDate: undefined,
  tosAcceptedAt: new Date().toISOString(),
}
```

Style: Match existing tactile/neo-brutalist design — `tactile-card` class, bold borders, gradient accents, dark mode support. Use existing Lucide icons (`Sparkles`, `BookOpen`, `GraduationCap`, `ShieldCheck`).

- [ ] **Step 2: Verify the component builds in isolation**

Run: `npm run build`
Expected: Clean build. Component is created but not yet mounted anywhere.

- [ ] **Step 3: Commit**

```bash
git add src/components/OnboardingScreen.tsx
git commit -m "feat(onboarding): create OnboardingScreen component with 3-step flow"
```

---

### Task 3: Wire Onboarding Gate into App Shell

**Files:**
- Modify: `src/App.tsx:22-27` (AppView type), `src/App.tsx:107-108` (seedInitialData call), `src/App.tsx:176-178` (userProfile query), and the render section

**Interfaces:**
- Consumes: `OnboardingScreen` from Task 2, `seedInitialData()` from `src/lib/db.ts`
- Produces: App now renders `<OnboardingScreen>` when `db.profile.count() === 0`, and the main shell otherwise

- [ ] **Step 1: Add onboarding state and gate logic in `App.tsx`**

1. Import `OnboardingScreen`.
2. Add a `useLiveQuery` for profile count:
   ```ts
   const profileCount = useLiveQuery(() => db.profile.count(), []);
   ```
3. Create `handleOnboardingComplete` callback:
   ```ts
   const handleOnboardingComplete = async (profile: Omit<UserProfile, 'id'>) => {
     await db.profile.add(profile);
     await seedInitialData(); // seeds starter decks + settings if missing
   };
   ```
4. At the top of the render, before any other view routing, add:
   ```tsx
   if (profileCount === 0) {
     return <OnboardingScreen onComplete={handleOnboardingComplete} />;
   }
   ```
   Handle `profileCount === undefined` (loading) by showing a minimal loading spinner or nothing.

- [ ] **Step 2: Verify onboarding flow end-to-end**

Run: `npm run build && npm run preview -- --port 5173`
Open in browser. Clear IndexedDB (`Application > Storage > Clear site data`).
Expected: Onboarding screen appears. Fill in name, pick color, accept ToS, click "Start Learning". Main dashboard loads with starter decks, profile has 0 XP and 0 streak.

- [ ] **Step 3: Verify existing users bypass onboarding**

Without clearing data, reload the page.
Expected: Main dashboard loads directly (no onboarding).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(onboarding): gate app shell behind onboarding for new users"
```

---

### Task 4: Fix ProfilePage Gamification Display

**Files:**
- Modify: `src/components/ProfilePage.tsx:189-197` (XP/streak fallbacks), `src/components/ProfilePage.tsx:264-311` (badges)

**Interfaces:**
- Consumes: `UserProfile` with real `xp`, `streakDays`, `lastStudyDate` values (no more fallbacks)
- Produces: ProfilePage displays actual stored values; badges computed from real data

- [ ] **Step 1: Remove XP and streak fallback formulas in ProfilePage**

Change line 190-191 from:
```ts
const totalXP = profile.xp ?? (340 + totalReviews * 12 + cardsMastered * 18);
const currentStreakDays = profile.streakDays ?? 3;
```
To:
```ts
const totalXP = profile.xp ?? 0;
const currentStreakDays = profile.streakDays ?? 0;
```

- [ ] **Step 2: Make badges dynamic based on real data**

Update the badges array (lines 265-311):
- `streak_3`: status is `currentStreakDays >= 3 ? 'unlocked' : currentStreakDays > 0 ? 'in_progress' : 'locked'`, progressText `${currentStreakDays} / 3 days`
- `speed_demon`: Keep as `'locked'` by default (requires a stored achievement record — out of scope for this plan, note as future work)
- `perfect_recall`: Keep as `'locked'` by default (same — needs achievement tracking)
- `club_100`: Already dynamic ✓ (uses `totalCardsCount`)
- `fsrs_master`: Already dynamic ✓ (uses `totalReviews`)
- `grand_scholar`: Already dynamic ✓ (uses `currentLevel`)

- [ ] **Step 3: Verify profile page displays correct values**

Run: `npm run build`
Expected: Clean build. Profile page shows 0 XP and 0 streak for new users, real values for existing users.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProfilePage.tsx
git commit -m "fix(profile): remove hardcoded XP/streak fallbacks, make badges dynamic"
```

---

### Task 5: Verify XP & Streak Pipeline End-to-End

**Files:**
- Verify (no changes expected): `src/App.tsx:276-310` (`handleFinishStudy`), `src/components/SummaryModal.tsx:42-46`

**Interfaces:**
- Consumes: All prior tasks
- Produces: Verified working pipeline: study → XP earned → profile updated → profile page reflects new XP/level/streak

- [ ] **Step 1: Verify `handleFinishStudy` XP logic**

Read `src/App.tsx:276-310`. Confirm:
- XP per correct answer: 10 (normal), 15 (speed_run/hard_mode) ✓
- Streak logic: compares `lastStudyDate` to today, increments on consecutive days, resets on gap > 1 day ✓
- Persists via `db.profile.update()` ✓
- One issue: line 302 uses `(prof.xp || 340)` — this needs to change to `(prof.xp || 0)` to match the new 0-start XP.

- [ ] **Step 2: Fix the XP base in `handleFinishStudy`**

Change line 302 in `src/App.tsx` from:
```ts
xp: (prof.xp || 340) + earnedXp,
```
To:
```ts
xp: (prof.xp || 0) + earnedXp,
```

- [ ] **Step 3: Verify SummaryModal XP display**

Read `src/components/SummaryModal.tsx:42-46`. The `xpEarned` display is already correct — it shows `correctCount * xpPerCorrect` based on game mode. No changes needed.

- [ ] **Step 4: End-to-end manual test**

Run: `npm run build && npm run preview -- --port 5173`
1. Clear site data, go through onboarding (new user with 0 XP).
2. Study a deck, answer some questions correctly.
3. SummaryModal shows XP earned.
4. Go to Profile page — XP, level, and streak reflect the study session.
5. Study again on the same day — streak stays the same, XP increases.

- [ ] **Step 5: Run existing test suite**

Run: `npm test -- --run`
Expected: All 12 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "fix(gamification): start XP from 0 instead of hardcoded 340 base"
```

---

### Task 6: Final Polish & Edge Cases

**Files:**
- Modify: `src/components/SettingsModal.tsx:514-523` (factory reset behavior)
- Verify: `src/components/ProfilePage.tsx:230-244` (profile save doesn't wipe XP)

**Interfaces:**
- Consumes: All prior tasks
- Produces: Clean edge case handling for factory reset, profile save, and data integrity

- [ ] **Step 1: Ensure factory reset preserves profile**

Read `src/components/SettingsModal.tsx:514-523`. Current behavior: clears decks + cards, then calls `seedInitialData()`. Since we removed the profile auto-seed from `seedInitialData()`, the profile will survive the reset. Starter decks get re-seeded. This is correct behavior — verify no changes needed.

- [ ] **Step 2: Ensure profile save preserves XP/streak fields**

Read `src/components/ProfilePage.tsx:230-244`. The `handleSaveProfile` currently saves:
```ts
{ name, age, major, motto, avatarColor, dailyGoalCards }
```
This does NOT include `xp`, `streakDays`, `lastStudyDate`, or `tosAcceptedAt`. Since it uses `db.profile.update()`, unmentioned fields are preserved. This is correct. Verify no changes needed.

- [ ] **Step 3: Build and run full test suite**

Run: `npm run build && npm test -- --run`
Expected: Clean build, all tests pass.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(onboarding): verify edge cases — factory reset, profile save integrity"
```
Only commit if any files actually changed. If verification-only, skip this commit.
