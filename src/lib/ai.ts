import type { QuestionType } from '../types';

export interface GeneratedCardData {
  question: string;
  answer: string;
  options?: string[];
  correctAnswers?: string[];
  explanation: string;
  type: QuestionType;
}

/**
 * Resilient caller for Google Gemini API
 * Automatically handles model deprecations (404) and switches to active models.
 */
export async function callGeminiGenerateContent(
  apiKey: string,
  prompt: string,
  temperature: number = 0.3
): Promise<string> {
  const candidateModels = [
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
  ];

  let lastError: Error | null = null;
  const tried = new Set<string>();

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    if (tried.has(model)) continue;
    tried.add(model);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      // If model is no longer available (404), check if Google recommended a specific replacement in the error message
      if (response.status === 404 && typeof msg === 'string') {
        const matches = Array.from(msg.matchAll(/models\/([a-zA-Z0-9_.-]+)/g)).map((m) => m[1]);
        for (const rec of matches) {
          if (!tried.has(rec) && !candidateModels.includes(rec)) {
            candidateModels.splice(i + 1, 0, rec);
          }
        }
        // Continue to try the next model in the candidate list
        continue;
      } else {
        // If not a 404 (e.g. invalid key 400/403, quota exceeded 429), throw immediately
        throw lastError;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('404')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

export async function generateCardsFromText(params: {
  apiKey: string;
  provider: 'gemini' | 'groq';
  content: string;
  count: number;
  type: QuestionType | 'mixed';
}): Promise<GeneratedCardData[]> {
  const { apiKey, provider, content, count, type } = params;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Please enter your API Key in Settings to generate cards with AI.');
  }

  const typeInstructions =
    type === 'mixed'
      ? `Create a dynamic mix of the following types:
- "multiple_choice": Standard 4 choices, 1 correct answer.
- "multiple_select": Question with multiple correct answers (e.g. "Which of the following are true?"), provide 4 options and a "correctAnswers" array of strings.
- "fill_blank": Use "[______]" in the question for the missing keyword, and set "answer" to the missing word/phrase.
- "true_false": Conceptual statement, with "answer" as either "True" or "False".`
      : type === 'multiple_choice'
      ? `All questions must be "multiple_choice" with 4 options and 1 correct answer.`
      : type === 'multiple_select'
      ? `All questions must be "multiple_select" with 4 options and a "correctAnswers" array of strings containing 2 or more correct options.`
      : type === 'fill_blank'
      ? `All questions must be "fill_blank" containing "[______]" where the key term was removed, with "answer" containing the exact missing term.`
      : type === 'true_false'
      ? `All questions must be "true_false" evaluating a statement, with "answer" being either "True" or "False".`
      : `All questions must be "flashcard" with a clear active recall prompt and answer.`;

  const prompt = `You are an expert exam tutor and active-recall specialist for students.
Create exactly ${count} high-yield, engaging study questions based strictly on the following material:

"""
${content}
"""

Instructions:
1. ${typeInstructions}
2. For multiple choice / multiple select: plausible distractors based on common student misconceptions.
3. Every question must include a crisp 1-2 sentence explanation clarifying why the correct answer is true.
4. Output ONLY valid JSON in the exact structure below, with no markdown code fences and no preamble:

[
  {
    "question": "string",
    "answer": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswers": ["string", "string"],
    "explanation": "string",
    "type": "multiple_choice" | "multiple_select" | "fill_blank" | "true_false" | "flashcard"
  }
]`;

  if (provider === 'gemini') {
    const cleaned = await callGeminiGenerateContent(apiKey, prompt, 0.3);
    return JSON.parse(cleaned) as GeneratedCardData[];
  } else {
    // Groq OpenAI-compatible endpoint
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a structured JSON output generator for educational active recall.' },
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

    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) return parsed as GeneratedCardData[];
    if (parsed.cards && Array.isArray(parsed.cards)) return parsed.cards as GeneratedCardData[];
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions as GeneratedCardData[];

    return [];
  }
}
