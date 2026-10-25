import { describe, it, expect } from 'vitest';
import { calculateStudySessionRewards } from './gamification';

describe('Gamification: XP and Multiplier Calculations', () => {
  it('awards 10 XP per correct answer in normal game mode with 0 streak and 0 combo', () => {
    const result = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 0,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 5,
      gameMode: 'normal',
      maxCombo: 0,
    });

    expect(result.streakMultiplier).toBe(1.0);
    expect(result.comboMultiplier).toBe(1.0);
    expect(result.baseEarnedXp).toBe(50);
    expect(result.earnedXp).toBe(50);
    expect(result.newXp).toBe(50);
  });

  it('scales XP with day streak multiplier (+0.1x per day, max 2.0x)', () => {
    // 3 days streak = 1.3x
    const result3Days = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 3,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 10,
      gameMode: 'normal',
      maxCombo: 0,
    });
    expect(result3Days.streakMultiplier).toBe(1.3);
    expect(result3Days.earnedXp).toBe(130); // 100 * 1.3

    // 15 days streak = capped at 2.0x
    const resultCapped = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 15,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 10,
      gameMode: 'normal',
      maxCombo: 0,
    });
    expect(resultCapped.streakMultiplier).toBe(2.0);
    expect(resultCapped.earnedXp).toBe(200); // 100 * 2.0
  });

  it('scales XP with combo multiplier (+0.1x per combo, max 3.0x)', () => {
    // 4 combo = 1.4x
    const result4Combo = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 0,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 10,
      gameMode: 'normal',
      maxCombo: 4,
    });
    expect(result4Combo.comboMultiplier).toBe(1.4);
    expect(result4Combo.earnedXp).toBe(140); // 100 * 1.4

    // 25 combo = capped at 3.0x
    const resultCappedCombo = calculateStudySessionRewards({
      currentXp: 0,
      currentStreakDays: 0,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 10,
      gameMode: 'normal',
      maxCombo: 25,
    });
    expect(resultCappedCombo.comboMultiplier).toBe(3.0);
    expect(resultCappedCombo.earnedXp).toBe(300); // 100 * 3.0
  });

  it('compounds streak and combo multipliers accurately', () => {
    // 5 streak days (1.5x) + 5 max combo (1.5x) in speed_run (15 XP / correct)
    // 4 correct = 60 base XP
    // 60 * 1.5 * 1.5 = 135 XP
    const result = calculateStudySessionRewards({
      currentXp: 100,
      currentStreakDays: 5,
      todayIsoDate: '2026-10-25',
      correctAnswersCount: 4,
      gameMode: 'speed_run',
      maxCombo: 5,
    });

    expect(result.streakMultiplier).toBe(1.5);
    expect(result.comboMultiplier).toBe(1.5);
    expect(result.baseEarnedXp).toBe(60);
    expect(result.earnedXp).toBe(135);
    expect(result.newXp).toBe(235);
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
