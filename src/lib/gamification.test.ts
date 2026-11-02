import { describe, it, expect } from 'vitest';
import { calculateStudySessionRewards, getLevelInfo } from './gamification';

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

describe('Gamification: Progressive Level Thresholds', () => {
  it('starts at Level 1 Novice with 0 XP', () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe('Novice');
    expect(info.currentLevelXP).toBe(0);
    expect(info.xpForNextLevel).toBe(250);
    expect(info.xpPercent).toBe(0);
  });

  it('progresses through progressive scaling tiers', () => {
    // Level 2 (Scholar) at 250 XP
    expect(getLevelInfo(250).level).toBe(2);
    expect(getLevelInfo(250).title).toBe('Scholar');

    // Level 3 (Adept) at 750 XP
    expect(getLevelInfo(750).level).toBe(3);
    expect(getLevelInfo(750).title).toBe('Adept');

    // Level 4 (Master) at 1750 XP
    expect(getLevelInfo(1750).level).toBe(4);
    expect(getLevelInfo(1750).title).toBe('Master');

    // Level 5 (Grandmaster) at 3500 XP
    expect(getLevelInfo(3500).level).toBe(5);
    expect(getLevelInfo(3500).title).toBe('Grandmaster');

    // Level 6 (Sage) at 6000 XP
    expect(getLevelInfo(6000).level).toBe(6);
    expect(getLevelInfo(6000).title).toBe('Sage');
    expect(getLevelInfo(6000).isMaxLevel).toBe(true);
    expect(getLevelInfo(6000).xpPercent).toBe(100);
  });
});
