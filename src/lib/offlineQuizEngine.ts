import type { Card, QuestionType, QuizFormatPreference } from '../types';

/**
 * Fisher-Yates array shuffle helper
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Clean up text for prompt formatting
 */
function cleanPrompt(text: string): string {
  return text.trim().replace(/[.?]+$/, '');
}

/**
 * Extracts distinct plausible distractors from other cards in the deck pool
 */
function getDistractors(
  targetAnswer: string,
  poolCards: Card[],
  count: number = 3
): string[] {
  const normalizedTarget = targetAnswer.trim().toLowerCase();
  const candidates: string[] = [];

  // Extract from answers and options of other cards
  for (const card of poolCards) {
    if (card.answer && card.answer.trim().toLowerCase() !== normalizedTarget) {
      candidates.push(card.answer.trim());
    }
    if (card.options) {
      for (const opt of card.options) {
        if (opt && opt.trim().toLowerCase() !== normalizedTarget) {
          candidates.push(opt.trim());
        }
      }
    }
  }

  // Deduplicate case-insensitively
  const seen = new Set<string>();
  const uniqueCandidates: string[] = [];
  for (const c of shuffle(candidates)) {
    const lower = c.toLowerCase();
    if (!seen.has(lower) && lower !== normalizedTarget) {
      seen.add(lower);
      uniqueCandidates.push(c);
    }
  }

  // If pool has enough candidates, return top count
  if (uniqueCandidates.length >= count) {
    return uniqueCandidates.slice(0, count);
  }

  // Fallback defaults if deck is tiny (< 4 cards)
  const fallbackPool = [
    'None of the above',
    'All of the above',
    'Depends on environment',
    'Inconclusive evidence',
    'Secondary factor',
  ];

  for (const fb of fallbackPool) {
    if (uniqueCandidates.length >= count) break;
    const lower = fb.toLowerCase();
    if (!seen.has(lower) && lower !== normalizedTarget) {
      seen.add(lower);
      uniqueCandidates.push(fb);
    }
  }

  return uniqueCandidates.slice(0, count);
}

/**
 * Transforms card into Multiple Choice (A, B, C, D)
 */
export function transformToMultipleChoice(card: Card, pool: Card[]): Card {
  // If card already has valid options with the answer inside, keep/shuffle them
  if (
    card.options &&
    card.options.length >= 2 &&
    card.options.some((o) => o.trim().toLowerCase() === card.answer.trim().toLowerCase())
  ) {
    return {
      ...card,
      sourceCardId: card.id,
      type: 'multiple_choice',
      options: shuffle(card.options),
    };
  }

  const distractors = getDistractors(card.answer, pool, 3);
  const options = shuffle([card.answer, ...distractors]);

  return {
    ...card,
    sourceCardId: card.id,
    type: 'multiple_choice',
    options,
  };
}

/**
 * Transforms card into True or False statement
 */
export function transformToTrueFalse(card: Card, pool: Card[]): Card {
  const isTrue = Math.random() < 0.5;
  const prompt = cleanPrompt(card.question);

  if (isTrue) {
    const questionText = card.question.endsWith('?')
      ? `True or False: Regarding "${prompt}", the correct answer is ${card.answer}.`
      : `True or False: ${prompt} is ${card.answer}.`;

    return {
      ...card,
      sourceCardId: card.id,
      question: questionText,
      answer: 'True',
      options: ['True', 'False'],
      correctAnswers: ['True'],
      explanation: card.explanation || `This statement is True: ${card.answer}.`,
      type: 'true_false',
    };
  } else {
    const distractors = getDistractors(card.answer, pool, 1);
    const distractor = distractors[0] || 'Opposite result';

    const questionText = card.question.endsWith('?')
      ? `True or False: Regarding "${prompt}", the correct answer is ${distractor}.`
      : `True or False: ${prompt} is ${distractor}.`;

    return {
      ...card,
      sourceCardId: card.id,
      question: questionText,
      answer: 'False',
      options: ['True', 'False'],
      correctAnswers: ['False'],
      explanation: `False. The correct answer is actually "${card.answer}".${
        card.explanation ? ` (${card.explanation})` : ''
      }`,
      type: 'true_false',
    };
  }
}

/**
 * Transforms card into Fill in the Blank (Cloze deletion)
 */
export function transformToFillBlank(card: Card): Card {
  let questionText = card.question;

  // If already contains cloze syntax, keep it
  if (questionText.includes('[______]')) {
    return {
      ...card,
      sourceCardId: card.id,
      type: 'fill_blank',
    };
  }

  // Check if answer appears directly inside the question
  const escapedAnswer = card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const answerRegex = new RegExp(`\\b${escapedAnswer}\\b`, 'i');

  if (answerRegex.test(questionText)) {
    questionText = questionText.replace(answerRegex, '[______]');
  } else {
    // Formulate clean cloze statement
    const prompt = cleanPrompt(card.question);
    questionText = `${prompt} — The missing term is: [______]`;
  }

  return {
    ...card,
    sourceCardId: card.id,
    question: questionText,
    type: 'fill_blank',
  };
}

/**
 * Transforms card into Checkboxes (Multiple Select)
 */
export function transformToMultipleSelect(card: Card, pool: Card[]): Card {
  // If card already authored as multiple_select with correct answers, keep it
  if (
    card.type === 'multiple_select' &&
    card.correctAnswers &&
    card.correctAnswers.length > 0 &&
    card.options &&
    card.options.length >= 2
  ) {
    return {
      ...card,
      sourceCardId: card.id,
      type: 'multiple_select',
      options: shuffle(card.options),
    };
  }

  // Build multi-select options
  // Try to find a second related true item from pool, or formulate a multiple true/false challenge
  const otherCards = pool.filter(
    (c) => c.id !== card.id && c.answer.trim().toLowerCase() !== card.answer.trim().toLowerCase()
  );

  const correctAnswers: string[] = [card.answer.trim()];
  let distractors: string[] = [];

  if (otherCards.length >= 3) {
    // 2 correct facts + 2 distractors
    const companionCard = otherCards[0];
    correctAnswers.push(companionCard.answer.trim());
    distractors = getDistractors(card.answer, otherCards.slice(1), 2);
  } else {
    // 1 correct answer + 3 distractors
    distractors = getDistractors(card.answer, pool, 3);
  }

  const prompt = cleanPrompt(card.question);
  const questionText = `Which of the following are true regarding "${prompt}"?`;
  const options = shuffle([...correctAnswers, ...distractors]);

  return {
    ...card,
    sourceCardId: card.id,
    question: questionText,
    answer: correctAnswers.join(', '),
    options,
    correctAnswers,
    explanation: card.explanation || `Correct items: ${correctAnswers.join(', ')}`,
    type: 'multiple_select',
  };
}

export interface OfflineQuizOptions {
  format: QuizFormatPreference;
  count?: number | 'all';
  poolCards?: Card[];
}

/**
 * Main Offline Smart Heuristic Generator
 * Takes any set of cards and transforms them into the requested format dynamically!
 */
export function generateOfflineQuiz(
  cards: Card[],
  options: OfflineQuizOptions
): Card[] {
  if (!cards || cards.length === 0) return [];

  const pool = options.poolCards && options.poolCards.length > 0 ? options.poolCards : cards;
  const targetCount =
    typeof options.count === 'number' && options.count > 0
      ? Math.min(options.count, cards.length)
      : cards.length;

  // Shuffle input cards and take requested count
  const selectedCards = shuffle(cards).slice(0, targetCount);

  const formatsPool: QuestionType[] = [
    'multiple_choice',
    'true_false',
    'fill_blank',
    'multiple_select',
  ];

  return selectedCards.map((card, idx) => {
    let chosenFormat: QuestionType;

    if (options.format === 'mixed') {
      chosenFormat = formatsPool[idx % formatsPool.length];
    } else if (options.format === 'flashcard') {
      chosenFormat = 'flashcard';
    } else {
      chosenFormat = options.format as QuestionType;
    }

    switch (chosenFormat) {
      case 'multiple_choice':
        return transformToMultipleChoice(card, pool);
      case 'true_false':
        return transformToTrueFalse(card, pool);
      case 'fill_blank':
        return transformToFillBlank(card);
      case 'multiple_select':
        return transformToMultipleSelect(card, pool);
      case 'flashcard':
      default:
        return {
          ...card,
          sourceCardId: card.id,
          type: 'flashcard',
        };
    }
  });
}
