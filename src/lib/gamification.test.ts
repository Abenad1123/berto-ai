import { describe, it, expect } from 'vitest';
import { calculateStudySessionRewards } from './gamification';

describe('Gamification: XP and Daily Streak Calculations', () => {
  it('awards 10 XP per correct answer in normal game mode', () => {
    const result = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 0,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 5,
      gameMode: 'normal',
    });

    expect(result.earnedXp).toBe(50);
    expect(result.newXp).toBe(50);
  });

  it('awards 15 XP per correct answer in speed_run or hard_mode', () => {
    const speedRunResult = calculateStudySessionRewards({
      currentXp: 50,
      currentStreakDays: 1,
      lastStudyDate: '2026-10-25',
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 4,
      gameMode: 'speed_run',
    });

    expect(speedRunResult.earnedXp).toBe(60);
    expect(speedRunResult.newXp).toBe(110);

    const hardModeResult = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 0,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 2,
      gameMode: 'hard_mode',
    });

    expect(hardModeResult.earnedXp).toBe(30);
    expect(hardModeResult.newXp).toBe(30);
  });

  it('initializes a 1-day streak on user first study session', () => {
    const result = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 0,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 3,
    });

    expect(result.newStreak).toBe(1);
  });

  it('increments streak on consecutive calendar day', () => {
    const result = calculateStudySessionRewards({
      currentXp: 100,
      currentStreakDays: 3,
      lastStudyDate: '2026-10-24',
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 5,
    });

    expect(result.newStreak).toBe(4);
  });

  it('preserves current streak when studying multiple times on the same calendar day', () => {
    const result = calculateStudySessionRewards({
      currentXp: 150,
      currentStreakDays: 4,
      lastStudyDate: '2026-10-25',
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 3,
    });

    expect(result.newStreak).toBe(4);
  });

  it('resets streak to 1 when a day is skipped', () => {
    const result = calculateStudySessionRewards({
      currentXp: 200,
      currentStreakDays: 5,
      lastStudyDate: '2026-10-22',
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 5,
    });

    expect(result.newStreak).toBe(1);
  });
});
