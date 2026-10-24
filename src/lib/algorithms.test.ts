import { describe, it, expect } from 'vitest';
import { initializeFSRSCard, calculateNextReview } from './fsrs';
import {
  generateOfflineQuiz,
  transformToMultipleChoice,
  transformToTrueFalse,
  transformToFillBlank,
  transformToMultipleSelect,
} from './offlineQuizEngine';
import type { Card } from '../types';

describe('FSRS Scheduling Algorithm', () => {
  const baseCard: Card = {
    id: 1,
    deckId: 10,
    question: 'What is the powerhouse of the cell?',
    answer: 'Mitochondria',
    type: 'flashcard',
    createdAt: new Date(),
    ...initializeFSRSCard(),
  };

  it('initializes FSRS fields with valid defaults', () => {
    const initialized = initializeFSRSCard();
    expect(initialized.due).toBeInstanceOf(Date);
    expect(initialized.state).toBe(0); // State.New
    expect(initialized.reps).toBe(0);
    expect(initialized.lapses).toBe(0);
  });

  it('updates card state and schedules next review on "good" response', () => {
    const result = calculateNextReview(baseCard, true, 'good');
    expect(result.due).toBeInstanceOf(Date);
    expect(result.reps).toBe(1);
    expect(result.stability).toBeGreaterThan(0);
  });

  it('handles "again" (lapse) response for new and review cards', () => {
    // For a brand new card, 'again' keeps it in learning/new state
    const newResult = calculateNextReview(baseCard, false, 'again');
    expect(newResult.due).toBeInstanceOf(Date);
    expect(newResult.state).toBeDefined();

    // For a card previously in review (state: 2, reps: 3), 'again' increments lapses
    const reviewedCard: Card = {
      ...baseCard,
      state: 2, // Review state
      reps: 3,
      lapses: 0,
      stability: 5,
      difficulty: 4,
    };
    const reviewResult = calculateNextReview(reviewedCard, false, 'again');
    expect(reviewResult.lapses).toBeGreaterThanOrEqual(1);
  });

  it('handles "easy" grade', () => {
    const result = calculateNextReview(baseCard, true, 'easy');
    expect(result.due).toBeInstanceOf(Date);
    expect(result.reps).toBe(1);
    expect(result.stability).toBeGreaterThan(0);
  });
});

describe('Offline Smart Heuristic Quiz Generator', () => {
  const sampleCards: Card[] = [
    {
      id: 1,
      deckId: 1,
      question: 'What is the powerhouse of the cell?',
      answer: 'Mitochondria',
      type: 'flashcard',
      createdAt: new Date(),
    },
    {
      id: 2,
      deckId: 1,
      question: 'What organelle synthesizes proteins?',
      answer: 'Ribosome',
      type: 'flashcard',
      createdAt: new Date(),
    },
    {
      id: 3,
      deckId: 1,
      question: 'What organelle contains genetic material?',
      answer: 'Nucleus',
      type: 'flashcard',
      createdAt: new Date(),
    },
    {
      id: 4,
      deckId: 1,
      question: 'What organelle produces ATP via cellular respiration?',
      answer: 'Chloroplast',
      type: 'flashcard',
      createdAt: new Date(),
    },
  ];

  it('returns empty array when given empty cards list', () => {
    const quiz = generateOfflineQuiz([], { format: 'mixed' });
    expect(quiz).toEqual([]);
  });

  it('respects the count parameter', () => {
    const quiz = generateOfflineQuiz(sampleCards, { format: 'mixed', count: 2 });
    expect(quiz).toHaveLength(2);
  });

  it('transforms card to multiple choice with target answer in options', () => {
    const card = sampleCards[0];
    const mcCard = transformToMultipleChoice(card, sampleCards);
    expect(mcCard.type).toBe('multiple_choice');
    expect(mcCard.options).toBeDefined();
    expect(mcCard.options!.length).toBeGreaterThanOrEqual(2);
    expect(mcCard.options).toContain(card.answer);
  });

  it('transforms card to true/false question format', () => {
    const card = sampleCards[0];
    const tfCard = transformToTrueFalse(card, sampleCards);
    expect(tfCard.type).toBe('true_false');
    expect(['True', 'False']).toContain(tfCard.answer);
    expect(tfCard.options).toEqual(['True', 'False']);
    expect(tfCard.question.startsWith('True or False:')).toBe(true);
  });

  it('transforms card to fill in the blank with cloze deletion', () => {
    const card = sampleCards[0];
    const fibCard = transformToFillBlank(card);
    expect(fibCard.type).toBe('fill_blank');
    expect(fibCard.question).toContain('[______]');
  });

  it('transforms card to multiple select with correct answers', () => {
    const card = sampleCards[0];
    const msCard = transformToMultipleSelect(card, sampleCards);
    expect(msCard.type).toBe('multiple_select');
    expect(msCard.options).toBeDefined();
    expect(msCard.options!.length).toBeGreaterThanOrEqual(2);
    expect(msCard.correctAnswers).toBeDefined();
    expect(msCard.correctAnswers!.length).toBeGreaterThanOrEqual(1);
    expect(msCard.correctAnswers).toContain(card.answer);
  });

  it('generates a mixed quiz cycling question types', () => {
    const mixedQuiz = generateOfflineQuiz(sampleCards, { format: 'mixed', count: 4 });
    expect(mixedQuiz).toHaveLength(4);
    const types = mixedQuiz.map((c) => c.type);
    expect(types).toContain('multiple_choice');
    expect(types).toContain('true_false');
    expect(types).toContain('fill_blank');
    expect(types).toContain('multiple_select');
  });
});
