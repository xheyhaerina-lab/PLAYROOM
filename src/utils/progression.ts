import type { Difficulty } from '../types/playroom.ts';

/**
 * Total cumulative XP required to reach a given level (Level 1 = 0 XP).
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Smooth quadratic progression: L2=150, L3=375, L4=675, L5=1050...
  return Math.floor(75 * (level - 1) * level);
}

/**
 * Derive current level from cumulative XP.
 */
export function computeLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= safeXp && level < 100) {
    level += 1;
  }
  return level;
}

export function getLevelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpNeededForNext: number;
  percent: number;
} {
  const level = computeLevelFromXp(xp);
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xp - currentLevelXp);
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelXp);
  const percent = Math.min(100, Math.round((xpIntoLevel / xpNeededForNext) * 100));
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForNext,
    percent,
  };
}

export function difficultyMultiplier(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 1.0;
    case 'medium':
      return 1.25;
    case 'hard':
      return 1.6;
  }
}

export function calculateQuizRoundPoints(params: {
  isCorrect: boolean;
  difficulty: Difficulty;
  responseMs: number;
  maxTimeMs: number;
}): number {
  if (!params.isCorrect) return 0;
  const base = 100;
  const clampedMs = Math.max(0, Math.min(params.maxTimeMs, params.responseMs));
  const speedRatio = 1 - clampedMs / Math.max(1, params.maxTimeMs);
  const speedBonus = Math.round(speedRatio * 50);
  return Math.round((base + speedBonus) * difficultyMultiplier(params.difficulty));
}

export function calculateWordChallengeScore(params: {
  solved: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  hintsUsed: number;
  elapsedSeconds: number;
  difficulty: Difficulty;
}): number {
  if (!params.solved) return 20; // Participation credit
  const remainingAttempts = Math.max(0, params.maxAttempts - params.attemptsUsed);
  const base = 160 + remainingAttempts * 35;
  const timeBonus = Math.max(0, 80 - Math.floor(params.elapsedSeconds / 2));
  const hintPenalty = params.hintsUsed * 30;
  return Math.max(40, Math.round((base + timeBonus - hintPenalty) * difficultyMultiplier(params.difficulty)));
}

export function calculateBrainTestScore(params: {
  correctCount: number;
  totalCount: number;
  hintsUsed: number;
  elapsedSeconds: number;
  difficulty: Difficulty;
}): number {
  const accuracyPoints = params.correctCount * 90;
  const speedBonus = params.correctCount > 0 ? Math.max(0, 100 - Math.floor(params.elapsedSeconds / 3)) : 0;
  const penalty = params.hintsUsed * 20;
  return Math.max(
    0,
    Math.round((accuracyPoints + speedBonus - penalty) * difficultyMultiplier(params.difficulty))
  );
}

export function calculateMysteryScore(params: {
  correctDeductions: number;
  totalQuestions: number;
  solvedCulprit: boolean;
  cluesInspected: number;
  difficulty: Difficulty;
}): number {
  const questionPoints = params.correctDeductions * 80;
  const culpritBonus = params.solvedCulprit ? 220 : 0;
  const thoroughnessBonus = Math.min(80, params.cluesInspected * 15);
  return Math.round((questionPoints + culpritBonus + thoroughnessBonus) * difficultyMultiplier(params.difficulty));
}
