import { fsrs, createEmptyCard, Rating, type Card as FSRSCard } from 'ts-fsrs';
import type { Card } from '../types';

const scheduler = fsrs();

export function initializeFSRSCard(): Partial<Card> {
  const empty = createEmptyCard();
  return {
    state: empty.state,
    due: empty.due,
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsed_days: empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    learning_steps: empty.learning_steps,
    last_review: empty.last_review,
  };
}

export function calculateNextReview(
  card: Card,
  isCorrect: boolean,
  grade: 'easy' | 'good' | 'hard' | 'again' = isCorrect ? 'good' : 'again'
): Partial<Card> {
  const safeDue =
    card.due && !isNaN(new Date(card.due).getTime()) ? new Date(card.due) : new Date();
  const safeLastReview =
    card.last_review && !isNaN(new Date(card.last_review).getTime())
      ? new Date(card.last_review)
      : undefined;
  const safeStability =
    typeof card.stability === 'number' && !isNaN(card.stability) ? card.stability : 0;
  const safeDifficulty =
    typeof card.difficulty === 'number' && !isNaN(card.difficulty) ? card.difficulty : 0;

  const fsrsCard: FSRSCard = {
    due: safeDue,
    stability: safeStability,
    difficulty: safeDifficulty,
    elapsed_days: Number(card.elapsed_days) || 0,
    scheduled_days: Number(card.scheduled_days) || 0,
    reps: Number(card.reps) || 0,
    lapses: Number(card.lapses) || 0,
    learning_steps: Number(card.learning_steps) || 0,
    state: Number(card.state) || 0,
    last_review: safeLastReview,
  };

  let rating = Rating.Good;
  if (grade === 'easy') rating = Rating.Easy;
  else if (grade === 'hard') rating = Rating.Hard;
  else if (grade === 'again') rating = Rating.Again;

  const now = new Date();
  const schedulingCards = scheduler.repeat(fsrsCard, now);
  const next = schedulingCards[rating].card;

  return {
    state: next.state,
    due: next.due,
    stability: next.stability,
    difficulty: next.difficulty,
    elapsed_days: next.elapsed_days,
    scheduled_days: next.scheduled_days,
    reps: next.reps,
    lapses: next.lapses,
    learning_steps: next.learning_steps,
    last_review: next.last_review,
  };
}
