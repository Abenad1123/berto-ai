import type { QuestionType } from '../types';

export interface GeneratedCardData {
  question: string;
  answer: string;
  options?: string[];
  correctAnswers?: string[];
  explanation: string;
  type: QuestionType;
}

export interface GenerateCardsProgress {
  newCards: GeneratedCardData[];
  totalReceived: number;
  targetCount: number;
  batchIndex: number;
  totalBatches: number;
}

/**
 * Splits a total card count into parallel chunk batches.
 * Limits concurrency to at most 2 balanced batches to prevent free-tier 503 / 429 concurrency throttles.
 * e.g. 5 -> [5], 10 -> [5, 5], 15 -> [8, 7], 20 -> [10, 10]
 */
export function chunkCardCount(total: number): number[] {
  if (total <= 0) return [];
  if (total <= 5) return [total];
  // Split into 2 balanced batches for optimal throughput without burst locks
  const firstHalf = Math.ceil(total / 2);
  const secondHalf = total - firstHalf;
  return secondHalf > 0 ? [firstHalf, secondHalf] : [firstHalf];
}

/**
 * Robust JSON parser for AI outputs that strips fences and extracts array payloads.
 */
export function parseGeneratedCards(rawText: string): GeneratedCardData[] {
  if (!rawText || typeof rawText !== 'string') return [];
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as GeneratedCardData[];
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.cards)) return parsed.cards as GeneratedCardData[];
      if (Array.isArray(parsed.questions)) return parsed.questions as GeneratedCardData[];
    }
  } catch {
    // If direct parse fails, try extracting array with regex: [ ... ]
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) return parsed as GeneratedCardData[];
      } catch {
        // Fall through
      }
    }
  }
  return [];
}

/**
 * Resilient caller for Google Gemini API
 * Automatically handles 503 (high demand), 429 (rate limits), and model deprecations (404)
 * by falling back across Google's available models.
 */
export async function callGeminiGenerateContent(
  apiKey: string,
  prompt: string,
  temperature: number = 0.3,
  signal?: AbortSignal
): Promise<string> {
  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
  ];

  let lastError: Error | null = null;
  const tried = new Set<string>();

  for (let i = 0; i < candidateModels.length; i++) {
    if (signal?.aborted) {
      throw new Error('Generation cancelled');
    }

    const model = candidateModels[i];
    if (tried.has(model)) continue;
    tried.add(model);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const requestSignal = signal
        ? (typeof AbortSignal.any === 'function'
            ? AbortSignal.any([signal, AbortSignal.timeout(45000)])
            : signal)
        : AbortSignal.timeout(45000);

      const response = await fetch(url, {
        method: 'POST',
        signal: requestSignal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        }
      }

      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || response.statusText;
      lastError = new Error(`Gemini API Error (${response.status}): ${msg}`);

      // Permanent client errors (Invalid API Key) should fail immediately
      const isAuthError =
        response.status === 401 ||
        response.status === 403 ||
        (response.status === 400 && typeof msg === 'string' && msg.toUpperCase().includes('API_KEY'));

      if (isAuthError) {
        throw lastError;
      }

      // If model not found (404), check recommended replacement
      if (response.status === 404 && typeof msg === 'string') {
        const matches = Array.from(msg.matchAll(/models\/([a-zA-Z0-9_.-]+)/g)).map((m) => m[1]);
        for (const rec of matches) {
          if (!tried.has(rec) && !candidateModels.includes(rec)) {
            candidateModels.splice(i + 1, 0, rec);
          }
        }
        continue;
      }

      // If 503 (high demand), 429 (quota/rate limit), or 500+ (server error),
      // wait a short delay and fall back to next model!
      if (response.status === 503 || response.status === 429 || response.status >= 500) {
        console.warn(`[Gemini] ${model} returned ${response.status} (${msg}). Trying fallback model...`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      // For any other non-auth error, try the next model
      continue;
    } catch (err: any) {
      if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('API_KEY'))) {
        throw err;
      }
      lastError = err;
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  throw lastError || new Error('All candidate Gemini models are currently busy. Please try again in a few moments.');
}

/**
 * Builds a lean, token-optimized prompt instructing the model to produce concise explanations (<= 15 words)
 */
function buildLeanPrompt(params: {
  content: string;
  count: number;
  type: QuestionType | 'mixed';
  batchIndex: number;
  totalBatches: number;
}): string {
  const { content, count, type, batchIndex, totalBatches } = params;

  const typeRules =
    type === 'mixed'
      ? `Mix types: "multiple_choice" (4 options, 1 answer), "multiple_select" (4 options, 2+ in correctAnswers), "fill_blank" (use [______], answer is keyword), "true_false" (answer is True/False).`
      : type === 'multiple_choice'
      ? `All questions must be "multiple_choice" with 4 options and 1 answer.`
      : type === 'multiple_select'
      ? `All questions must be "multiple_select" with 4 options and 2+ in "correctAnswers".`
      : type === 'fill_blank'
      ? `All questions must be "fill_blank" containing "[______]" with "answer" as the missing term.`
      : type === 'true_false'
      ? `All questions must be "true_false" with "answer" either "True" or "False".`
      : `All questions must be "flashcard" with active recall prompt and answer.`;

  const batchFocus =
    totalBatches > 1
      ? `Batch ${batchIndex + 1} of ${totalBatches}: Focus on concepts in segment ${batchIndex + 1} of this material without duplicating questions from other parts.\n`
      : '';

  return `Create exactly ${count} study questions from this text:
"""
${content}
"""

${batchFocus}Rules:
1. ${typeRules}
2. Strict constraint: "explanation" MUST be 1 concise sentence (maximum 15 words).
3. Output ONLY a valid JSON array matching this format (no markdown fences, no preamble):
[
  {
    "question": "string",
    "answer": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswers": ["string", "string"],
    "explanation": "string (max 15 words)",
    "type": "multiple_choice" | "multiple_select" | "fill_blank" | "true_false" | "flashcard"
  }
]`;
}

/**
 * Dispatches a single API prompt request to either Gemini or Groq
 */
async function requestCardsFromProvider(params: {
  apiKey: string;
  provider: 'gemini' | 'groq';
  prompt: string;
  signal?: AbortSignal;
}): Promise<GeneratedCardData[]> {
  const { apiKey, provider, prompt, signal } = params;

  if (signal?.aborted) {
    throw new Error('Generation cancelled');
  }

  if (provider === 'gemini') {
    const raw = await callGeminiGenerateContent(apiKey, prompt, 0.3, signal);
    return parseGeneratedCards(raw);
  } else {
    // Groq OpenAI-compatible endpoint
    const requestSignal = signal
      ? (typeof AbortSignal.any === 'function'
          ? AbortSignal.any([signal, AbortSignal.timeout(45000)])
          : signal)
      : AbortSignal.timeout(45000);

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      signal: requestSignal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a high-speed JSON study question generator. Always output valid JSON array only with explanations strictly under 15 words.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || response.statusText;
      throw new Error(`Groq API Error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('No content returned by Groq.');

    return parseGeneratedCards(rawText);
  }
}

/**
 * Generates cards from text with parallel batching and progressive callback streaming.
 * Splits requests into 2 balanced parallel batches with staggered dispatch and automatic remainder refill.
 */
export async function generateCardsFromText(params: {
  apiKey: string;
  provider: 'gemini' | 'groq';
  content: string;
  count: number;
  type: QuestionType | 'mixed';
  signal?: AbortSignal;
  onProgress?: (progress: GenerateCardsProgress) => void;
}): Promise<GeneratedCardData[]> {
  const { apiKey, provider, content, count, type, signal, onProgress } = params;

  if (signal?.aborted) {
    throw new Error('Generation cancelled');
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Please enter your API Key in Settings to generate cards with AI.');
  }

  // Chunk total into 2 balanced batches (e.g. 20 -> [10, 10], 15 -> [8, 7])
  const batches = chunkCardCount(count);
  if (batches.length === 0) return [];

  const allCards: GeneratedCardData[] = [];
  const seenQuestions = new Set<string>();
  let totalReceived = 0;
  let firstError: Error | null = null;

  // Dispatch batches concurrently using Promise.allSettled with slight stagger
  const batchPromises = batches.map(async (batchCount, batchIndex) => {
    try {
      if (signal?.aborted) {
        throw new Error('Generation cancelled');
      }

      if (batchIndex > 0) {
        await new Promise((r) => setTimeout(r, batchIndex * 200));
      }

      if (signal?.aborted) {
        throw new Error('Generation cancelled');
      }

      const prompt = buildLeanPrompt({
        content,
        count: batchCount,
        type,
        batchIndex,
        totalBatches: batches.length,
      });

      const cards = await requestCardsFromProvider({ apiKey, provider, prompt, signal });

      if (signal?.aborted) {
        throw new Error('Generation cancelled');
      }

      // Deduplicate against already collected cards
      const newValidCards: GeneratedCardData[] = [];
      for (const card of cards) {
        if (!card || !card.question || typeof card.question !== 'string') continue;
        const normQ = card.question.trim().toLowerCase();
        if (!seenQuestions.has(normQ)) {
          seenQuestions.add(normQ);
          newValidCards.push(card);
        }
      }

      if (newValidCards.length > 0) {
        allCards.push(...newValidCards);
        totalReceived += newValidCards.length;
        if (onProgress && !signal?.aborted) {
          onProgress({
            newCards: newValidCards,
            totalReceived,
            targetCount: count,
            batchIndex,
            totalBatches: batches.length,
          });
        }
      }
      return newValidCards;
    } catch (err: any) {
      if (signal?.aborted || err?.message === 'Generation cancelled') {
        throw err;
      }
      if (!firstError) firstError = err;
      console.warn(`[AI] Batch ${batchIndex + 1}/${batches.length} failed:`, err);
      return [];
    }
  });

  await Promise.allSettled(batchPromises);

  if (signal?.aborted) {
    throw new Error('Generation cancelled');
  }

  // Remainder refill: if a batch had a deficit or model returned fewer cards,
  // execute a quick single-call refill for the remaining missing cards
  if (!signal?.aborted && allCards.length > 0 && allCards.length < count) {
    const missing = count - allCards.length;
    try {
      const refillPrompt = buildLeanPrompt({
        content,
        count: missing,
        type,
        batchIndex: batches.length,
        totalBatches: batches.length + 1,
      });
      const refillCards = await requestCardsFromProvider({ apiKey, provider, prompt: refillPrompt, signal });
      const addedRefillCards: GeneratedCardData[] = [];
      for (const card of refillCards) {
        if (!card || !card.question || typeof card.question !== 'string') continue;
        const normQ = card.question.trim().toLowerCase();
        if (!seenQuestions.has(normQ) && allCards.length < count) {
          seenQuestions.add(normQ);
          addedRefillCards.push(card);
          allCards.push(card);
          totalReceived++;
        }
      }
      if (addedRefillCards.length > 0 && onProgress && !signal?.aborted) {
        onProgress({
          newCards: addedRefillCards,
          totalReceived: allCards.length,
          targetCount: count,
          batchIndex: batches.length,
          totalBatches: batches.length + 1,
        });
      }
    } catch (refillErr) {
      if (signal?.aborted) throw refillErr;
      console.warn('[AI] Remainder refill attempt had an issue:', refillErr);
    }
  }

  if (signal?.aborted) {
    throw new Error('Generation cancelled');
  }

  // If no cards were generated at all, rethrow error
  if (allCards.length === 0) {
    throw firstError || new Error('AI could not generate questions from this text. Try adding more detail.');
  }

  return allCards;
}
