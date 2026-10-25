import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Sparkles,
  Flame,
  Trophy,
  Brain,
  BookOpen,
  Check,
  Settings as SettingsIcon,
  Award,
  Zap,
  Target,
  GraduationCap,
  Lock,
  Unlock,
  Calendar,
  Activity,
  ShieldCheck,
  Minus,
  Plus,
} from 'lucide-react';
import { db } from '../lib/db';
import { sounds } from '../lib/sound';
import type { UserProfile } from '../types';

export interface ProfilePageProps {
  onBack: () => void;
  onOpenSettings?: () => void;
  onProfileUpdated?: () => void;
}

export type AvatarColor = 'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';

interface BadgeItem {
  id: string;
  title: string;
  iconName: 'Flame' | 'Zap' | 'Brain' | 'BookOpen' | 'Shield' | 'Trophy';
  description: string;
  status: 'unlocked' | 'in_progress' | 'locked';
  progressText?: string;
}

const colorThemes: Record<
  AvatarColor,
  {
    name: string;
    bgGradient: string;
    borderClass: string;
    shadowColor: string;
    accentHex: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  violet: {
    name: 'Arcane Violet',
    bgGradient: 'from-violet-600 via-purple-600 to-indigo-600',
    borderClass: 'border-violet-950 dark:border-violet-600',
    shadowColor: '#2e1065',
    accentHex: '#7c3aed',
    badgeBg: 'bg-violet-100 dark:bg-violet-950/80',
    badgeText: 'text-violet-900 dark:text-violet-300',
  },
  indigo: {
    name: 'Cosmic Indigo',
    bgGradient: 'from-indigo-600 via-blue-600 to-violet-700',
    borderClass: 'border-indigo-950 dark:border-indigo-600',
    shadowColor: '#1e1b4b',
    accentHex: '#4f46e5',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-900 dark:text-indigo-300',
  },
  emerald: {
    name: 'Forest Emerald',
    bgGradient: 'from-emerald-500 via-teal-600 to-emerald-700',
    borderClass: 'border-emerald-950 dark:border-emerald-600',
    shadowColor: '#064e3b',
    accentHex: '#059669',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-900 dark:text-emerald-300',
  },
  amber: {
    name: 'Solar Amber',
    bgGradient: 'from-amber-400 via-amber-500 to-orange-500',
    borderClass: 'border-amber-950 dark:border-amber-600',
    shadowColor: '#78350f',
    accentHex: '#d97706',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-950 dark:text-amber-200',
  },
  rose: {
    name: 'Ruby Rose',
    bgGradient: 'from-rose-500 via-pink-600 to-rose-700',
    borderClass: 'border-rose-950 dark:border-rose-600',
    shadowColor: '#881337',
    accentHex: '#e11d48',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
    badgeText: 'text-rose-900 dark:text-rose-300',
  },
  sky: {
    name: 'Aero Sky',
    bgGradient: 'from-sky-400 via-sky-500 to-blue-600',
    borderClass: 'border-sky-950 dark:border-sky-600',
    shadowColor: '#082f49',
    accentHex: '#0284c7',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80',
    badgeText: 'text-sky-900 dark:text-sky-300',
  },
};

const dailyGoalPresets = [10, 20, 30, 50];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onOpenSettings,
  onProfileUpdated,
}) => {
  // Live queries for real card and deck metrics without full table memory loads
  const metrics = useLiveQuery(
    async () => {
      const now = new Date();
      const total = await db.cards.count();
      const dueCount = await db.cards.where('due').belowOrEqual(now).count();
      const learningCount = await db.cards.where('state').anyOf([1, 3]).count();
      const matureCount = await db.cards.where('state').equals(2).count();

      let reviewCount = 0;
      let masteredCount = 0;
      await db.cards.each((c) => {
        if (c.reps && c.reps > 0) {
          reviewCount += c.reps;
          masteredCount++;
        } else if (c.state === 2) {
          masteredCount++;
        }
      });

      return {
        cardsDue: dueCount,
        cardsLearning: learningCount,
        cardsMature: matureCount,
        cardsMastered: masteredCount,
        totalReviews: reviewCount,
        totalCardsCount: total,
      };
    },
    [],
    { cardsDue: 0, cardsLearning: 0, cardsMature: 0, cardsMastered: 0, totalReviews: 0, totalCardsCount: 0 }
  );
  const totalDecksCount = useLiveQuery(async () => await db.decks.count(), [], 0);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alex',
    age: 'University Student',
    major: 'Computer Science & Pre-Med',
    motto: 'Consistency beats intensity.',
    avatarColor: 'violet',
    dailyGoalCards: 20,
  });

  // Modular custom academic goals/notes state
  const [academicNotes, setAcademicNotes] = useState<string>(() => {
    return (
      localStorage.getItem('berto_academic_notes') ||
      '• Master Cellular Biology Deck before midterm\n• Review daily 20 FSRS cards before bed\n• Maintain 7-day active study streak'
    );
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing profile from DB
  useEffect(() => {
    const loadProfile = async () => {
      const p = await db.profile.toCollection().first();
      if (p) {
        setProfile(p);
      }
    };
    loadProfile();
  }, []);

  const { cardsDue, cardsLearning, cardsMature, cardsMastered, totalReviews, totalCardsCount } = metrics;
  const allTimeQuizzes = Math.max(1, Math.floor(totalReviews / 5) || 3);

  // Gamification XP & Level calculation
  const totalXP = profile.xp ?? (340 + totalReviews * 12 + cardsMastered * 18);
  const currentStreakDays = profile.streakDays ?? 3;
  const currentLevel = Math.max(1, Math.floor(totalXP / 500) + 1);
  const levelTitles = ['Novice', 'Scholar', 'Adept', 'Master', 'Grandmaster', 'Sage'];
  const levelTitle = levelTitles[Math.min(currentLevel - 1, levelTitles.length - 1)];
  const currentLevelXP = totalXP % 500;
  const xpForNextLevel = 500;
  const xpPercent = Math.min(100, Math.round((currentLevelXP / xpForNextLevel) * 100));

  // Current active color configuration
  const activeColorKey = (profile.avatarColor as AvatarColor) in colorThemes
    ? (profile.avatarColor as AvatarColor)
    : 'violet';
  const activeTheme = colorThemes[activeColorKey];

  // Helper for dynamic initials from student name
  const getInitials = (nameStr: string) => {
    const trimmed = nameStr.trim();
    if (!trimmed) return 'A';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 1).toUpperCase();
  };

  // Stepper handlers for daily goal
  const adjustDailyGoal = (delta: number) => {
    sounds.playTap();
    const current = profile.dailyGoalCards || 20;
    const nextVal = Math.max(5, Math.min(100, current + delta));
    setProfile({ ...profile, dailyGoalCards: nextVal });
  };

  // Save handler with tactile feedback
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playTap();
    setIsSaving(true);

    try {
      const existing = await db.profile.toCollection().first();
      const updatedData: UserProfile = {
        name: profile.name.trim() || 'Alex',
        age: profile.age.trim() || 'University Student',
        major: profile.major.trim() || 'General Studies',
        motto: profile.motto.trim() || 'Consistency beats intensity.',
        avatarColor: activeColorKey,
        dailyGoalCards: profile.dailyGoalCards || 20,
      };

      if (existing?.id) {
        await db.profile.update(existing.id, updatedData);
      } else {
        await db.profile.add(updatedData);
      }

      // Persist modular academic notes
      localStorage.setItem('berto_academic_notes', academicNotes);

      sounds.playCorrect();
      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();

      setTimeout(() => {
        setIsSaved(false);
      }, 2200);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Modular badges configuration
  const badges: BadgeItem[] = [
    {
      id: 'streak_3',
      title: '3-Day Flame',
      iconName: 'Flame',
      description: 'Logged in and drilled for 3 consecutive days.',
      status: 'unlocked',
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      iconName: 'Zap',
      description: 'Conquered a speed-run quiz round with zero errors.',
      status: 'unlocked',
    },
    {
      id: 'perfect_recall',
      title: 'Perfect Recall',
      iconName: 'Brain',
      description: 'Achieve 100% accuracy on a 15+ card active-recall session.',
      status: 'in_progress',
      progressText: '88% of target reached',
    },
    {
      id: 'club_100',
      title: '100 Cards Club',
      iconName: 'BookOpen',
      description: 'Master and retain 100 cards across your study arena.',
      status: totalCardsCount >= 100 ? 'unlocked' : 'locked',
      progressText: `${totalCardsCount} / 100 cards`,
    },
    {
      id: 'fsrs_master',
      title: 'Memory Architect',
      iconName: 'Shield',
      description: 'Review over 50 FSRS spaced-repetition schedules.',
      status: totalReviews >= 50 ? 'unlocked' : 'in_progress',
      progressText: `${totalReviews} / 50 reviews`,
    },
    {
      id: 'grand_scholar',
      title: 'Arena Laureate',
      iconName: 'Trophy',
      description: 'Reach Level 5 Scholar in the Academic Quest.',
      status: currentLevel >= 5 ? 'unlocked' : 'locked',
      progressText: `Level ${currentLevel} / 5`,
    },
  ];

  const renderBadgeIcon = (icon: BadgeItem['iconName'], status: BadgeItem['status']) => {
    const isUnlocked = status === 'unlocked';
    switch (icon) {
      case 'Flame':
        return <Flame className={`w-5 h-5 ${isUnlocked ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />;
      case 'Zap':
        return <Zap className={`w-5 h-5 ${isUnlocked ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />;
      case 'Brain':
        return <Brain className={`w-5 h-5 ${isUnlocked ? 'text-violet-500 fill-violet-400' : 'text-slate-400'}`} />;
      case 'BookOpen':
        return <BookOpen className={`w-5 h-5 ${isUnlocked ? 'text-indigo-500' : 'text-slate-400'}`} />;
      case 'Shield':
        return <ShieldCheck className={`w-5 h-5 ${isUnlocked ? 'text-emerald-500' : 'text-slate-400'}`} />;
      case 'Trophy':
        return <Trophy className={`w-5 h-5 ${isUnlocked ? 'text-amber-500 fill-amber-300' : 'text-slate-400'}`} />;
    }
  };

  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-20">
      {/* a) Top Sticky Navigation Bar / Breadcrumb */}
      <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3.5 py-3 sm:px-6 transition-colors shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Back button with neo-brutalist tactile styling */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                sounds.playTap();
                onBack();
              }}
              className="tactile-btn tactile-btn-secondary px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black gap-1.5 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none shrink-0"
              aria-label="Back to Arena"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">← Back to Arena</span>
              <span className="sm:hidden">← Back</span>
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block shrink-0" />
            <h1 className="text-sm sm:text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-400 hidden sm:inline shrink-0" />
              <span className="hidden sm:inline truncate">Student Profile & Academic Quest</span>
              <span className="sm:hidden font-black">Profile</span>
            </h1>
          </div>

          {/* Quick Actions (Settings Shortcut & Save Button) */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSettings && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenSettings();
                }}
                title="Settings"
                aria-label="Settings"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2.5px_0_0_#09090b] sm:shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none flex items-center justify-center cursor-pointer transition-all shrink-0"
              >
                <SettingsIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </button>
            )}

            <button
              onClick={() => handleSaveProfile()}
              disabled={isSaving}
              className={`tactile-btn px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-black gap-1.5 transition-all cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-emerald-500 text-white border-slate-900 shadow-[0_3px_0_0_#064e3b]'
                  : 'tactile-btn-primary shadow-[0_3px_0_0_#1e1b4b]'
              }`}
              aria-label="Save Changes"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">{isSaved ? 'Changes Saved!' : 'Save Changes'}</span>
              <span className="sm:hidden">{isSaved ? 'Saved!' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 pt-6 space-y-6">
        {/* b) Hero Profile Banner */}
        <section className="tactile-card p-5 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000] relative overflow-hidden">
          {/* Ambient Decorative Accents */}
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: activeTheme.accentHex }}
          />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-violet-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left: Avatar Display + Student Bio & Level Badge */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              {/* Large Avatar Badge */}
              <div className="relative shrink-0">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr ${activeTheme.bgGradient} border-[3px] border-slate-900 shadow-[0_5px_0_0_#09090b] flex items-center justify-center font-black text-2xl sm:text-3xl text-white transform -rotate-2 hover:rotate-0 transition-transform`}
                >
                  {getInitials(profile.name)}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-400 text-slate-950 border-[2px] border-slate-900 shadow-[0_1.5px_0_0_#09090b] flex items-center justify-center text-xs font-black"
                  title="Active Scholar Status"
                >
                  <Sparkles className="w-4 h-4 fill-amber-300 stroke-none" />
                </div>
              </div>

              {/* Title & Level Progress */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight truncate">
                    {profile.name || 'Student Scholar'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 border-[1.5px] border-slate-900 dark:border-violet-700 text-violet-950 dark:text-violet-300 text-[10px] font-black uppercase tracking-wider shadow-[0_1px_0_0_#09090b]">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Level {currentLevel} {levelTitle}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mb-1 truncate">
                  {profile.major || 'Computer Science & Pre-Med'}
                </p>

                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic mb-3 line-clamp-2">
                  "{profile.motto || 'Consistency beats intensity.'}"
                </p>

                {/* Animated XP Progress Bar */}
                <div className="max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Academic XP
                    </span>
                    <span>
                      {currentLevelXP} / {xpForNextLevel} XP to Level {currentLevel + 1}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 overflow-hidden shadow-inner p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Stat Pills */}
            <div className="grid grid-cols-3 sm:flex sm:flex-col gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-6">
              {/* Stat 1: Current Streak */}
              <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-[2px] border-slate-900 dark:border-amber-800 shadow-[0_2px_0_0_#78350f]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-400 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0">
                  <Flame className="w-4.5 h-4.5 fill-orange-500 stroke-orange-700 animate-bounce" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-none">
                    {currentStreakDays} {currentStreakDays === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Streak
                  </div>
                </div>
              </div>

              {/* Stat 2: Cards Mastered */}
              <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-[2px] border-slate-900 dark:border-emerald-800 shadow-[0_2px_0_0_#064e3b]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 border-[1.5px] border-slate-900 flex items-center justify-center text-white shrink-0">
                  <Trophy className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-none">
                    {cardsMastered}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Mastered
                  </div>
                </div>
              </div>

              {/* Stat 3: Quizzes Completed */}
              <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-[2px] border-slate-900 dark:border-indigo-800 shadow-[0_2px_0_0_#1e1b4b]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 border-[1.5px] border-slate-900 flex items-center justify-center text-white shrink-0">
                  <Brain className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-none">
                    {allTimeQuizzes}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Quizzes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid: Left Form + Right Modular Expansion Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* c) Editable Profile Form (7 cols on desktop) */}
          <section className="lg:col-span-7 space-y-6">
            <div className="tactile-card p-5 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000]">
              <div className="flex items-center justify-between pb-4 mb-5 border-b-[2px] border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/80 border-[2px] border-slate-900 dark:border-violet-700 flex items-center justify-center text-violet-700 dark:text-violet-300">
                    <Target className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      Edit Profile & Target Rhythm
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">
                      Configure your name, avatar, and daily active-recall goals
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Color Theme Picker */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5">
                        Avatar Color Theme
                      </label>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Selected: <span className="font-bold text-slate-800 dark:text-slate-200">{activeTheme.name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(Object.keys(colorThemes) as AvatarColor[]).map((themeKey) => {
                        const theme = colorThemes[themeKey];
                        const isSelected = activeColorKey === themeKey;
                        return (
                          <button
                            key={themeKey}
                            type="button"
                            onClick={() => {
                              sounds.playTap();
                              setProfile({ ...profile, avatarColor: themeKey });
                            }}
                            className={`w-9 h-9 rounded-xl border-[2px] border-slate-900 bg-gradient-to-tr ${theme.bgGradient} flex items-center justify-center transition-all cursor-pointer shadow-[0_2px_0_0_#09090b] ${
                              isSelected
                                ? 'scale-115 ring-2 ring-slate-950 dark:ring-white -translate-y-0.5'
                                : 'opacity-70 hover:opacity-100 hover:-translate-y-0.5'
                            }`}
                            title={`Select ${theme.name}`}
                            aria-label={`Select ${theme.name}`}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white stroke-[3.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Alex Henderson"
                    className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>

                {/* Major / Academic Track & Age/Grade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                      Major / Academic Track
                    </label>
                    <input
                      type="text"
                      value={profile.major}
                      onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                      placeholder="e.g. Computer Science & Pre-Med"
                      className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                      Academic Level / Year
                    </label>
                    <input
                      type="text"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      placeholder="e.g. 2nd Year / Undergraduate"
                      className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>

                {/* Academic Motto / Focus Quote */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Academic Motto / Focus Quote
                  </label>
                  <input
                    type="text"
                    value={profile.motto}
                    onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                    placeholder="e.g. Consistency beats intensity."
                    className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>

                {/* Daily Goal Cards Stepper & Presets */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-[2px] border-slate-900 dark:border-amber-800 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Daily Card Review Goal
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustDailyGoal(-5)}
                        className="w-7 h-7 rounded-lg border-[1.5px] border-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center font-black shadow-[0_1.5px_0_0_#09090b] active:translate-y-0.5"
                        title="Decrease goal by 5"
                        aria-label="Decrease daily card goal by 5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400 px-1">
                        {profile.dailyGoalCards || 20} cards / day
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustDailyGoal(5)}
                        className="w-7 h-7 rounded-lg border-[1.5px] border-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center font-black shadow-[0_1.5px_0_0_#09090b] active:translate-y-0.5"
                        title="Increase goal by 5"
                        aria-label="Increase daily card goal by 5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {dailyGoalPresets.map((goal) => {
                      const isActive = profile.dailyGoalCards === goal;
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setProfile({ ...profile, dailyGoalCards: goal });
                          }}
                          className={`tactile-btn py-2 text-xs font-black rounded-xl border-[2px] border-slate-900 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 shadow-[0_2.5px_0_0_#78350f]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-[0_2px_0_0_#09090b] hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {goal} Cards
                        </button>
                      );
                    })}
                  </div>

                  {/* Range Slider for fine tuning */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500">5</span>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={profile.dailyGoalCards || 20}
                      onChange={(e) =>
                        setProfile({ ...profile, dailyGoalCards: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-500">100</span>
                  </div>
                </div>

                {/* Save Profile Changes Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`tactile-btn px-6 py-2.5 text-xs sm:text-sm font-black gap-2 transition-all cursor-pointer w-full sm:w-auto ${
                      isSaved
                        ? 'bg-emerald-500 text-white border-slate-900 shadow-[0_3px_0_0_#064e3b]'
                        : 'tactile-btn-primary shadow-[0_3px_0_0_#1e1b4b]'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Profile Changes Saved!</span>
                      </>
                    ) : (
                      <span>Save Profile Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Custom Academic Notes / Goals Modular Container */}
            <div className="tactile-card p-5 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-[2px] border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border-[2px] border-slate-900 dark:border-indigo-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                    <Calendar className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      Custom Academic Notes & Targets
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">
                      Personalized focus list, exam countdowns, or study reminders
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={academicNotes}
                  onChange={(e) => setAcademicNotes(e.target.value)}
                  placeholder="Record target exam dates, specific chapters to conquer, or daily study rules..."
                  className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    Auto-persists with profile updates
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Quick Save Notes ↵
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* d) Modular Future-Expansion Sections (5 cols on desktop) */}
          <section className="lg:col-span-5 space-y-6">
            {/* 1. Study Rhythm & FSRS Stability Breakdown Card */}
            <div className="tactile-card p-5 sm:p-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000]">
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b-[2px] border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border-[2px] border-slate-900 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                    FSRS Memory Stability
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">Cognitive retention breakdown</p>
                </div>
              </div>

              {/* FSRS Stats Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-[2px] border-slate-900 dark:border-rose-900/60 shadow-[0_2px_0_0_#09090b]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Cards Due
                  </div>
                  <div className="text-xl font-black text-slate-950 dark:text-white mt-0.5">
                    {cardsDue}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Scheduled for today</div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-[2px] border-slate-900 dark:border-amber-900/60 shadow-[0_2px_0_0_#09090b]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Learning
                  </div>
                  <div className="text-xl font-black text-slate-950 dark:text-white mt-0.5">
                    {cardsLearning}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Short intervals</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-[2px] border-slate-900 dark:border-emerald-900/60 shadow-[0_2px_0_0_#09090b]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Mature
                  </div>
                  <div className="text-xl font-black text-slate-950 dark:text-white mt-0.5">
                    {cardsMature}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Long-term memory</div>
                </div>

                <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border-[2px] border-slate-900 dark:border-violet-900/60 shadow-[0_2px_0_0_#09090b]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">
                    Est. Retention
                  </div>
                  <div className="text-xl font-black text-slate-950 dark:text-white mt-0.5">
                    91%
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">FSRS Target Recall</div>
                </div>
              </div>

              {/* Memory Consolidation Bar */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-[1.5px] border-slate-900 dark:border-slate-700">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                  <span>Library Mastery ({cardsMastered}/{totalCardsCount})</span>
                  <span>{totalCardsCount > 0 ? Math.round((cardsMastered / totalCardsCount) * 100) : 0}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex border border-slate-900">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${totalCardsCount > 0 ? (cardsMature / totalCardsCount) * 100 : 0}%` }}
                    title="Mature"
                  />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${totalCardsCount > 0 ? (cardsLearning / totalCardsCount) * 100 : 0}%` }}
                    title="Learning"
                  />
                  <div
                    className="bg-rose-400 h-full"
                    style={{ width: `${totalCardsCount > 0 ? (cardsDue / totalCardsCount) * 100 : 0}%` }}
                    title="Due"
                  />
                </div>
              </div>
            </div>

            {/* 2. Badges & Milestones Preview Card */}
            <div className="tactile-card p-5 sm:p-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-[2px] border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 border-[2px] border-slate-900 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-300">
                    <Award className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      Badges & Milestones
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">Track your academic achievements</p>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                  {totalDecksCount} Decks Active
                </span>
              </div>

              {/* Badges List */}
              <div className="space-y-2.5">
                {badges.map((badge) => {
                  const isUnlocked = badge.status === 'unlocked';
                  const isInProgress = badge.status === 'in_progress';

                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-2xl border-[2px] border-slate-900 flex items-center justify-between gap-3 transition-all ${
                        isUnlocked
                          ? 'bg-slate-50 dark:bg-slate-800/80 shadow-[0_2px_0_0_#09090b]'
                          : isInProgress
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-600/70 shadow-none'
                          : 'bg-slate-100/60 dark:bg-slate-800/30 opacity-60 shadow-none'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 ${
                            isUnlocked
                              ? 'bg-white dark:bg-slate-800 shadow-[0_1.5px_0_0_#09090b]'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {renderBadgeIcon(badge.iconName, badge.status)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-950 dark:text-white truncate">
                              {badge.title}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator tag */}
                      <div className="shrink-0">
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border-[1.5px] border-slate-900 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider shadow-[0_1px_0_0_#09090b]">
                            <Unlock className="w-2.5 h-2.5 stroke-[3]" />
                            Unlocked
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 border-[1.5px] border-slate-900 text-amber-800 dark:text-amber-300 text-[9px] font-black uppercase tracking-wider shadow-[0_1px_0_0_#09090b]">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 border-[1.5px] border-slate-700 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider">
                            <Lock className="w-2.5 h-2.5 stroke-[3]" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Modular Future Expansion Hub */}
            <div className="tactile-card p-4 sm:p-5 bg-gradient-to-tr from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/30 border-[2px] border-dashed border-slate-400 dark:border-slate-700 rounded-3xl">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Expansion Slot • Future Modules
                </h4>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Ready for upcoming features: Heatmap streak visualizations, custom avatar unlocks, audio voice notes, and deck export archives.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
