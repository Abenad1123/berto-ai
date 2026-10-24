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
  const fsrsCard: FSRSCard = {
    due: card.due ? new Date(card.due) : new Date(),
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    elapsed_days: card.elapsed_days ?? 0,
    scheduled_days: card.scheduled_days ?? 0,
    reps: card.reps ?? 0,
    lapses: card.lapses ?? 0,
    learning_steps: card.learning_steps ?? 0,
    state: card.state ?? 0,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
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
