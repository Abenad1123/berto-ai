import type { GameMode } from '../types';

export interface StudySessionRewardParams {
  currentXp: number;
  currentStreakDays: number;
  lastStudyDate?: string;
  todayIsoDate: string; // YYYY-MM-DD
  correctAnswersCount: number;
  gameMode?: GameMode;
}

export interface StudySessionRewards {
  earnedXp: number;
  newXp: number;
  newStreak: number;
}

/**
 * Calculates XP gain and updates daily streak continuity based on study performance.
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
  } = params;

  const xpPerCorrect = gameMode === 'speed_run' || gameMode === 'hard_mode' ? 15 : 10;
  const earnedXp = Math.max(0, correctAnswersCount) * xpPerCorrect;
  const newXp = (currentXp ?? 0) + earnedXp;

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

  return {
    earnedXp,
    newXp,
    newStreak,
  };
}
