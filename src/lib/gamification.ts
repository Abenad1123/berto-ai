import type { GameMode } from '../types';

export interface StudySessionRewardParams {
  currentXp: number;
  currentStreakDays: number;
  lastStudyDate?: string;
  todayIsoDate: string; // YYYY-MM-DD
  correctAnswersCount: number;
  gameMode?: GameMode;
  maxCombo?: number;
}

export interface StudySessionRewards {
  earnedXp: number;
  newXp: number;
  newStreak: number;
  streakMultiplier: number;
  comboMultiplier: number;
  baseEarnedXp: number;
}

/**
 * Calculates XP gain with daily streak and combo multipliers, updating daily streak continuity.
 */
export function calculateStudySessionRewards(
  params: StudySessionRewardParams
): StudySessionRewards {
  const {
    currentXp,
    currentStreakDays,
    lastStudyDate,
    todayIsoDate,
    correctAnswersCount,
    gameMode = 'normal',
    maxCombo = 0,
  } = params;

  let newStreak = currentStreakDays > 0 ? currentStreakDays : 1;

  if (lastStudyDate) {
    if (lastStudyDate === todayIsoDate) {
      // Studied multiple times on same calendar day: keep existing streak
      newStreak = currentStreakDays > 0 ? currentStreakDays : 1;
    } else {
      const last = new Date(lastStudyDate);
      const today = new Date(todayIsoDate);
      const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive calendar day: increment streak
        newStreak = (currentStreakDays || 0) + 1;
      } else if (diffDays > 1) {
        // Gap of 2+ days: reset streak to 1
        newStreak = 1;
      }
    }
  }

  // Multipliers:
  // Streak multiplier: each day of current streak increases XP by 0.1x, max 2.0x
  const streakMultiplier = Math.min(2.0, Math.round((1.0 + Math.max(0, currentStreakDays) * 0.1) * 10) / 10);

  // Combo multiplier: each combo point increases XP by 0.1x, max 3.0x
  const comboMultiplier = Math.min(3.0, Math.round((1.0 + Math.max(0, maxCombo) * 0.1) * 10) / 10);

  const xpPerCorrect = gameMode === 'speed_run' || gameMode === 'hard_mode' ? 15 : 10;
  const baseEarnedXp = Math.max(0, correctAnswersCount) * xpPerCorrect;
  const earnedXp = Math.round(baseEarnedXp * streakMultiplier * comboMultiplier);
  const newXp = (currentXp ?? 0) + earnedXp;

  return {
    earnedXp,
    newXp,
    newStreak,
    streakMultiplier,
    comboMultiplier,
    baseEarnedXp,
  };
}
