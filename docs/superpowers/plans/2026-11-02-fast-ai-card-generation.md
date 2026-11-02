# Implementation Plan: Ultra-Fast AI Card & Deck Generation

**Goal:** Accelerate AI flashcard and quiz generation by 3x–4x using prompt token trimming, parallel batch requests, and progressive card streaming with immediate study readiness.
**Architecture:** Chunk requested card counts into parallel sub-batches (size $\le 5$) dispatched concurrently via `Promise.allSettled()`; trim output tokens by capping explanations to $\le 15$ words; emit cards progressively via an `onBatch` callback into a live UI reveal tray in `CreateDeckPage`.
**Tech Stack:** TypeScript, React, Vitest, Dexie (IndexedDB), Google Gemini API, Groq Cloud API.
**Global Constraints:** Zero new external dependencies, backwards compatibility with existing Gemini & Groq keys, mobile-responsive layout, graceful partial recovery on API failures.
**Review Focus:** Concurrent rate limiting / quota safety, Dexie transaction integrity, progressive UI responsiveness, error handling when 1 of $N$ batches fails.

---

## User Review Required

> [!IMPORTANT]
> **API Rate Limits:** Running 2–4 parallel requests per generation consumes 2–4 API calls simultaneously. Both Groq (free tier: 30 RPM) and Gemini (free tier: 15 RPM) comfortably support 2–4 concurrent requests for a single generation. If one batch times out or fails, we aggregate all succeeded batches so the user never loses generated cards.

---

## Proposed Changes

### AI Subsystem

#### [MODIFY] [`src/lib/ai.ts`](file:///c:/Users/abena/Downloads/New%20folder/berto-ai/src/lib/ai.ts)

1. **Token Trimming (Prompt Optimization):**
   - Tighten prompt instructions: `Explanation must be 1 concise sentence (maximum 15 words) explaining why the answer is correct.`
   - Strip redundant preambles and instructions from the prompt to reduce input and output tokens by ~35%.
2. **Batch Chunking Helper:**
   - Implement `chunkCardCount(total: number, maxBatchSize = 5): number[]` (e.g., 20 $\rightarrow$ `[5, 5, 5, 5]`, 10 $\rightarrow$ `[5, 5]`, 7 $\rightarrow$ `[5, 2]`, 5 $\rightarrow$ `[5]`).
3. **Concurrent Parallel Dispatch:**
   - Refactor `generateCardsFromText` to accept:
     ```ts
     onBatch?: (batchCards: GeneratedCardData[], progress: { loaded: number; total: number }) => void
     ```
   - If `count <= 5`, execute a single request.
   - If `count > 5`, partition into batches and dispatch concurrently via `Promise.allSettled()`.
   - As each batch resolves, fire `onBatch` immediately to stream cards into the UI without waiting for sibling batches.
   - Flatten and deduplicate/validate questions before final return. If at least one batch succeeds, return the cards (fail only if all batches fail).

#### [NEW] [`src/lib/ai.test.ts`](file:///c:/Users/abena/Downloads/New%20folder/berto-ai/src/lib/ai.test.ts)

- Unit test `chunkCardCount` for edge cases (1, 5, 6, 10, 15, 20).
- Mock `fetch` calls to verify:
  - Parallel execution: multiple batch requests run concurrently.
  - Progressive callback: `onBatch` fires sequentially as promises settle.
  - Partial failure resilience: returns successful cards even if 1 batch fails.

---

### UI & Creation Flow

#### [MODIFY] [`src/components/CreateDeckPage.tsx`](file:///c:/Users/abena/Downloads/New%20folder/berto-ai/src/components/CreateDeckPage.tsx)

1. **Progressive Streaming State:**
   - Track `streamingCards: GeneratedCardData[]`, `progressPercent: number`, and `isStreaming: boolean`.
2. **Live Progressive Card Reveal Drawer / Tray:**
   - Replace the blocking full-screen loader button with a dynamic progress card tray:
     - Real-time progress bar: `"Generated X of Y cards..."`
     - Live card preview feed where newly generated cards animate in with smooth staggered slide-ins.
     - Early action pill: `"Ready to study now (X cards)"` allowing impatient users to jump straight into studying or reviewing without waiting for remaining batches.
3. **Progressive Database Save:**
   - Once all batches complete (or user clicks finish early), bulk-insert generated cards and navigate to the created deck.

---

## Verification Plan

### Automated Tests
Run Vitest to verify all unit tests and concurrency behavior:
```powershell
npm.cmd test
```

### Manual Verification
1. **Parallel Speed Check:**
   - Open AI Deck Generator, select 15 cards, click Generate.
   - Observe 3 concurrent batches dispatched in network tab.
   - Verify total completion drops from ~22s down to ~6–8s.
2. **Progressive Stream Verification:**
   - Verify that the first 5 cards display on screen within ~3 seconds while the next batches continue.
3. **Word Count & Explanation Check:**
   - Inspect generated explanations to verify concise 1-sentence format ($\le 15$ words).
4. **Resilience / Partial Fallback:**
   - Disconnect / simulate single batch failure and confirm partial card generation does not crash the app.
