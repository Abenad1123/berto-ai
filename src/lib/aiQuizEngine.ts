import type { Card, QuestionType, QuizFormatPreference } from '../types';
import { generateOfflineQuiz } from './offlineQuizEngine';
import { callGeminiGenerateContent } from './ai';

export interface AIQuizParams {
  cards: Card[];
  apiKey: string;
  provider: 'gemini' | 'groq';
  format: QuizFormatPreference;
  count?: number | 'all';
}

interface AIQuizOutputItem {
  sourceCardId?: number;
  question: string;
  answer: string;
  options?: string[];
  correctAnswers?: string[];
  explanation?: string;
  type: QuestionType;
}

/**
 * Transforms deck cards into a dynamic quiz using Gemini or Groq
 * With automatic fallback to the offline smart engine if API fails or offline.
 */
export async function generateAIQuiz(params: AIQuizParams): Promise<Card[]> {
  const { cards, apiKey, provider, format, count } = params;

  if (!cards || cards.length === 0) return [];

  const targetCount =
    typeof count === 'number' && count > 0 ? Math.min(count, cards.length) : cards.length;

  // Pick target cards
  const selectedCards = [...cards].sort(() => Math.random() - 0.5).slice(0, targetCount);

  if (!apiKey || apiKey.trim() === '') {
    // Graceful offline fallback
    return generateOfflineQuiz(selectedCards, { format, count: targetCount });
  }

  const cardsPayload = selectedCards.map((c) => ({
    id: c.id,
    question: c.question,
    answer: c.answer,
    explanation: c.explanation || '',
  }));

  const formatInstructions =
    format === 'mixed'
      ? `Randomly distribute questions across the following formats:
- "multiple_choice": 4 options, 1 correct answer.
- "multiple_select": 4 options with 2+ correct answers listed in "correctAnswers".
- "fill_blank": Use "[______]" for the missing keyword, with "answer" as the missing word.
- "true_false": Evaluative statement where "answer" is strictly "True" or "False".`
      : format === 'multiple_choice'
      ? `Every question must be "multiple_choice" with 4 options and 1 correct answer.`
      : format === 'multiple_select'
      ? `Every question must be "multiple_select" with 4 options and a "correctAnswers" array containing all correct options.`
      : format === 'fill_blank'
      ? `Every question must be "fill_blank" with "[______]" marking the blank, and "answer" containing the missing term.`
      : format === 'true_false'
      ? `Every question must be "true_false" with "options": ["True", "False"] and "answer" as "True" or "False".`
      : `Every question must be a standard "flashcard".`;

  const prompt = `You are an active-recall assessment generator.
Transform the following knowledge cards into an engaging quiz of exactly ${selectedCards.length} questions.
Base each question strictly on one of the provided cards and include its "sourceCardId".

Source Knowledge Cards:
${JSON.stringify(cardsPayload, null, 2)}

Format Instructions:
1. ${formatInstructions}
2. Ensure realistic, educational distractors.
3. Every question must include a 1-sentence "explanation".
4. You must include "sourceCardId" matching the original card id.
5. Return ONLY a valid JSON array, with no markdown code fences and no preamble:

[
  {
    "sourceCardId": number,
    "question": "string",
    "answer": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswers": ["string", "string"],
    "explanation": "string",
    "type": "multiple_choice" | "multiple_select" | "fill_blank" | "true_false" | "flashcard"
  }
]`;

  try {
    let generatedItems: AIQuizOutputItem[] = [];

    if (provider === 'gemini') {
      const cleaned = await callGeminiGenerateContent(apiKey, prompt, 0.4);
      const parsed = JSON.parse(cleaned);
      generatedItems = Array.isArray(parsed) ? parsed : parsed.questions || parsed.cards || [];
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
            {
              role: 'system',
              content: 'You generate structured JSON assessment questions for spaced repetition.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty Groq response');

      const parsed = JSON.parse(content);
      generatedItems = Array.isArray(parsed) ? parsed : parsed.questions || parsed.cards || [];
    }

    if (!generatedItems || generatedItems.length === 0) {
      throw new Error('No questions returned by AI');
    }

    // Merge generated questions with original card metadata (deckId, FSRS properties)
    return generatedItems.map((item, idx) => {
      const matchingSource =
        selectedCards.find((c) => c.id === item.sourceCardId) || selectedCards[idx] || selectedCards[0];

      return {
        ...matchingSource,
        sourceCardId: matchingSource.id,
        question: item.question,
        answer: item.answer,
        options: item.options,
        correctAnswers: item.correctAnswers,
        explanation: item.explanation || matchingSource.explanation,
        type: item.type,
      };
    });
  } catch (error) {
    console.warn('AI Quiz generation failed, falling back to smart offline engine:', error);
    return generateOfflineQuiz(selectedCards, { format, count: targetCount });
  }
}
