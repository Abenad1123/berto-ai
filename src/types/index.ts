export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'fill_blank'
  | 'true_false'
  | 'flashcard';

export interface Card {
  id?: number;
  sourceCardId?: number; // References the original card in the deck when dynamically transformed
  deckId: number;
  question: string;
  answer: string;
  options?: string[]; // Choices for multiple_choice and multiple_select
  correctAnswers?: string[]; // Array of correct options for multiple_select (checkboxes)
  explanation?: string;
  hint?: string;
  type: QuestionType;
  state?: number; // FSRS state: 0=New, 1=Learning, 2=Review, 3=Relearning
  due?: Date;
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  learning_steps?: number;
  last_review?: Date;
  createdAt: Date;
}

export interface Deck {
  id?: number;
  title: string;
  description: string;
  category: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  icon: string;
  cardCount?: number;
  parentId?: number | null; // Supports nested sub-decks!
  isFolder?: boolean; // Folder deck with no direct study cards (serves as container for sub-decks)
  tags?: string[]; // e.g. ['#exam', '#bio', '#ch1']
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id?: number;
  name: string;
  age: string;
  major: string;
  motto: string;
  avatarColor: string;
  avatarIcon?: string;
  dailyGoalCards?: number;
  xp?: number;
  streakDays?: number;
  lastStudyDate?: string;
  tosAcceptedAt?: string;
}

export type AccentColor = 'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
export type CardStylePreference = 'tactile' | 'modern' | 'compact';
export type AutoAdvanceSpeed = 'off' | 'fast' | 'normal';
export type AIDifficulty = 'balanced' | 'challenging' | 'beginner';
export type TextSizePreference = 'normal' | 'large';

export interface UserSettings {
  id?: number;
  apiKey?: string;
  aiProvider: 'gemini' | 'groq';
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  hapticsEnabled: boolean;
  darkMode: boolean;
  accentColor?: AccentColor;
  cardStyle?: CardStylePreference;
  autoAdvance?: AutoAdvanceSpeed;
  defaultQuizFormat?: QuizFormatPreference;
  defaultQuestionCount?: number | 'all';
  confettiEnabled?: boolean;
  textSize?: TextSizePreference;
  aiDifficulty?: AIDifficulty;
}

export interface QuizAnswer {
  cardId: number;
  sourceCardId?: number;
  userAnswer: string;
  isCorrect: boolean;
  questionType?: QuestionType;
  questionText?: string;
  correctAnswerText?: string;
  timeSpentMs?: number;
}

export type QuizEngine = 'offline' | 'ai' | 'classic';
export type QuizFormatPreference =
  | 'mixed'
  | 'multiple_choice'
  | 'multiple_select'
  | 'fill_blank'
  | 'true_false'
  | 'flashcard';

export type GameMode = 'normal' | 'speed_run' | 'hard_mode';

export interface QuizLauncherConfig {
  engine: QuizEngine;
  format: QuizFormatPreference;
  gameMode?: GameMode;
  count: number | 'all';
  dueOnly: boolean;
  practiceMode: boolean; // When true, answers do not alter FSRS spaced-repetition schedules
}
