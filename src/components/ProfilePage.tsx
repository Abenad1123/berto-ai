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
  Pencil,
  X,
  Palette,
  Smile,
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
  progressText: string;
  currentProgress?: number;
  maxProgress?: number;
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

const avatarIconPresets = ['🧠', '🎓', '⚡', '🚀', '👑', '🔥', '🎯', '💡', '🦉', '🦊', '⭐', '🦾'];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onOpenSettings,
  onProfileUpdated,
}) => {
  // Live queries for real metrics
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
    name: 'Student',
    age: 'University Student',
    major: 'General Studies',
    motto: 'Consistency beats intensity.',
    avatarColor: 'violet',
    avatarIcon: '🧠',
    xp: 0,
    streakDays: 0,
  });

  // Modal Dialog States
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Draft state for modal editing
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  // Trophy Filter Tab State
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'in_progress' | 'locked'>('all');

  // Modular custom academic goals/notes state
  const [academicNotes, setAcademicNotes] = useState<string>(() => {
    return (
      localStorage.getItem('berto_academic_notes') ||
      '• Master Cellular Biology Deck before midterm\n• Review daily 20 FSRS cards before bed\n• Maintain 7-day active study streak'
    );
  });

  const [notesSaved, setNotesSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing profile from DB
  useEffect(() => {
    const loadProfile = async () => {
      const p = await db.profile.toCollection().first();
      if (p) {
        setProfile(p);
        setDraftProfile(p);
      }
    };
    loadProfile();
  }, []);

  const { cardsDue, cardsLearning, cardsMature, cardsMastered, totalReviews, totalCardsCount } = metrics;
  const allTimeQuizzes = Math.floor(totalReviews / 5);

  // Gamification XP & Level calculation
  const totalXP = profile.xp ?? 0;
  const currentStreakDays = profile.streakDays ?? 0;
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

  // Save handler for full profile updates
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    sounds.playTap();
    setIsSaving(true);

    try {
      const existing = await db.profile.toCollection().first();
      const updatedData: UserProfile = {
        name: updatedProfile.name.trim() || existing?.name || 'Student',
        age: updatedProfile.age.trim() || 'University Student',
        major: updatedProfile.major.trim() || 'General Studies',
        motto: updatedProfile.motto.trim() || 'Consistency beats intensity.',
        avatarColor: updatedProfile.avatarColor || activeColorKey,
        avatarIcon: updatedProfile.avatarIcon || undefined,
        xp: profile.xp ?? existing?.xp ?? 0,
        streakDays: profile.streakDays ?? existing?.streakDays ?? 0,
      };

      if (existing?.id) {
        await db.profile.update(existing.id, updatedData);
      } else {
        await db.profile.add(updatedData);
      }

      setProfile(updatedData);
      sounds.playCorrect();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = () => {
    sounds.playTap();
    localStorage.setItem('berto_academic_notes', academicNotes);
    setNotesSaved(true);
    sounds.playCorrect();
    setTimeout(() => setNotesSaved(false), 2000);
  };

  // Modular badges configuration
  const badges: BadgeItem[] = [
    {
      id: 'streak_3',
      title: '3-Day Flame',
      iconName: 'Flame',
      description: 'Logged in and drilled for 3 consecutive days.',
      status: currentStreakDays >= 3 ? 'unlocked' : currentStreakDays > 0 ? 'in_progress' : 'locked',
      progressText: `${currentStreakDays} / 3 days`,
      currentProgress: Math.min(3, currentStreakDays),
      maxProgress: 3,
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      iconName: 'Zap',
      description: 'Conquered a speed-run quiz round with high momentum.',
      status: allTimeQuizzes >= 3 ? 'unlocked' : allTimeQuizzes > 0 ? 'in_progress' : 'locked',
      progressText: `${allTimeQuizzes} / 3 speed quizzes`,
      currentProgress: Math.min(3, allTimeQuizzes),
      maxProgress: 3,
    },
    {
      id: 'perfect_recall',
      title: 'Perfect Recall',
      iconName: 'Brain',
      description: 'Master active-recall precision with 10+ cards retained.',
      status: cardsMature >= 10 ? 'unlocked' : cardsMature > 0 ? 'in_progress' : 'locked',
      progressText: `${cardsMature} / 10 mature cards`,
      currentProgress: Math.min(10, cardsMature),
      maxProgress: 10,
    },
    {
      id: 'club_100',
      title: '100 Cards Club',
      iconName: 'BookOpen',
      description: 'Assemble and practice 100 cards across your study arena.',
      status: totalCardsCount >= 100 ? 'unlocked' : totalCardsCount > 0 ? 'in_progress' : 'locked',
      progressText: `${totalCardsCount} / 100 cards`,
      currentProgress: Math.min(100, totalCardsCount),
      maxProgress: 100,
    },
    {
      id: 'fsrs_master',
      title: 'Memory Architect',
      iconName: 'Shield',
      description: 'Review over 50 FSRS spaced-repetition schedules.',
      status: totalReviews >= 50 ? 'unlocked' : totalReviews > 0 ? 'in_progress' : 'locked',
      progressText: `${totalReviews} / 50 reviews`,
      currentProgress: Math.min(50, totalReviews),
      maxProgress: 50,
    },
    {
      id: 'grand_scholar',
      title: 'Arena Laureate',
      iconName: 'Trophy',
      description: 'Reach Level 5 Scholar in the Academic Quest.',
      status: currentLevel >= 5 ? 'unlocked' : 'in_progress',
      progressText: `Level ${currentLevel} / 5`,
      currentProgress: Math.min(5, currentLevel),
      maxProgress: 5,
    },
  ];

  const unlockedCount = badges.filter((b) => b.status === 'unlocked').length;
  const inProgressCount = badges.filter((b) => b.status === 'in_progress').length;
  const lockedCount = badges.filter((b) => b.status === 'locked').length;
  const trophyProgressPercent = Math.round((unlockedCount / badges.length) * 100);

  const filteredBadges = badges.filter((b) => {
    if (badgeFilter === 'all') return true;
    return b.status === badgeFilter;
  });

  const renderBadgeIcon = (icon: BadgeItem['iconName'], status: BadgeItem['status']) => {
    const isUnlocked = status === 'unlocked';
    switch (icon) {
      case 'Flame':
        return <Flame className={`w-6 h-6 ${isUnlocked ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />;
      case 'Zap':
        return <Zap className={`w-6 h-6 ${isUnlocked ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />;
      case 'Brain':
        return <Brain className={`w-6 h-6 ${isUnlocked ? 'text-violet-500 fill-violet-400' : 'text-slate-400'}`} />;
      case 'BookOpen':
        return <BookOpen className={`w-6 h-6 ${isUnlocked ? 'text-indigo-500' : 'text-slate-400'}`} />;
      case 'Shield':
        return <ShieldCheck className={`w-6 h-6 ${isUnlocked ? 'text-emerald-500' : 'text-slate-400'}`} />;
      case 'Trophy':
        return <Trophy className={`w-6 h-6 ${isUnlocked ? 'text-amber-500 fill-amber-300' : 'text-slate-400'}`} />;
    }
  };

  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24">
      {/* a) Top Sticky Navigation Bar / Breadcrumb */}
      <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3.5 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 transition-colors shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Back button */}
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
              <span className="truncate">Student Profile</span>
            </h1>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playTap();
                setDraftProfile(profile);
                setIsEditProfileOpen(true);
              }}
              className="tactile-btn px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black gap-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>

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
              {/* Interactive Avatar with Edit Cue */}
              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setDraftProfile(profile);
                    setIsAvatarStudioOpen(true);
                  }}
                  title="Customize Avatar & Color Theme"
                  aria-label="Customize Avatar & Color Theme"
                  className={`w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-tr ${activeTheme.bgGradient} border-[2.5px] sm:border-[3px] border-slate-900 shadow-[0_4px_0_0_#09090b] sm:shadow-[0_5px_0_0_#09090b] flex items-center justify-center font-black text-2xl sm:text-4xl text-white transform -rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all cursor-pointer relative overflow-hidden`}
                >
                  {profile.avatarIcon ? (
                    <span className="text-3xl sm:text-4xl">{profile.avatarIcon}</span>
                  ) : (
                    getInitials(profile.name)
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                    <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Customize</span>
                  </div>
                </button>

                {/* Edit Pencil Pill Badge */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setDraftProfile(profile);
                    setIsAvatarStudioOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center cursor-pointer transition-transform group-hover:scale-110 active:translate-y-0.5"
                  title="Change Avatar Icon & Theme"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Title & Level Progress */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight truncate">
                    {profile.name || 'Student Scholar'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 border-[1.5px] border-slate-900 dark:border-violet-700 text-violet-950 dark:text-violet-300 text-[10px] font-black uppercase tracking-wider shadow-[0_1px_0_0_#09090b]">
                    <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Level {currentLevel} {levelTitle}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mb-1 truncate">
                  <span>{profile.major || 'General Studies'}</span>
                  <span>•</span>
                  <span>{profile.age || 'University Student'}</span>
                </div>

                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic mb-3 line-clamp-1 sm:line-clamp-2">
                  "{profile.motto || 'Consistency beats intensity.'}"
                </p>

                {/* Animated XP Progress Bar */}
                <div className="max-w-md">
                  <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                      <span>XP Progress</span>
                    </span>
                    <span className="truncate text-right">
                      {currentLevelXP} / {xpForNextLevel} XP <span className="hidden sm:inline">to Level {currentLevel + 1}</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 sm:h-3 rounded-full bg-slate-100 dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 overflow-hidden shadow-inner p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Stat Pills */}
            <div className="grid grid-cols-3 sm:flex sm:flex-col gap-2 sm:gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-6">
              {/* Stat 1: Current Streak */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-[2px] border-slate-900 dark:border-amber-800 shadow-[0_2px_0_0_#78350f] min-w-0">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-400 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0">
                  <Flame className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-orange-500 stroke-orange-700 animate-bounce" />
                </div>
                <div className="min-w-0 w-full overflow-hidden">
                  <div className="text-xs sm:text-base font-black text-slate-950 dark:text-white leading-tight truncate">
                    {currentStreakDays} {currentStreakDays === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
                    Streak
                  </div>
                </div>
              </div>

              {/* Stat 2: Cards Mastered */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-[2px] border-slate-900 dark:border-emerald-800 shadow-[0_2px_0_0_#064e3b] min-w-0">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 border-[1.5px] border-slate-900 flex items-center justify-center text-white shrink-0">
                  <Trophy className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </div>
                <div className="min-w-0 w-full overflow-hidden">
                  <div className="text-xs sm:text-base font-black text-slate-950 dark:text-white leading-tight truncate">
                    {cardsMastered}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
                    Mastered
                  </div>
                </div>
              </div>

              {/* Stat 3: Quizzes Completed */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-[2px] border-slate-900 dark:border-indigo-800 shadow-[0_2px_0_0_#1e1b4b] min-w-0">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 border-[1.5px] border-slate-900 flex items-center justify-center text-white shrink-0">
                  <Brain className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </div>
                <div className="min-w-0 w-full overflow-hidden">
                  <div className="text-xs sm:text-base font-black text-slate-950 dark:text-white leading-tight truncate">
                    {allTimeQuizzes}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 truncate">
                    Quizzes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* c) DEDICATED FULL-WIDTH TROPHY & MILESTONE SHOWCASE */}
        <section className="tactile-card p-5 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000] space-y-5">
          {/* Section Header with Overall Progress */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-[2px] border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-400 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#09090b] flex items-center justify-center text-slate-950 shrink-0 transform -rotate-2">
                <Award className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                    Badges & Quest Milestones
                  </h3>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-[1.5px] border-slate-900 shadow-[0_1px_0_0_#09090b]">
                    {unlockedCount} / {badges.length} Unlocked
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Earn academic trophies by maintaining daily consistency and active recall
                </p>
              </div>
            </div>

            {/* Filter Tabs with tactile buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border-[2px] border-slate-900 self-start md:self-auto overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: 'All', count: badges.length },
                  { id: 'unlocked', label: 'Unlocked', count: unlockedCount },
                  { id: 'in_progress', label: 'In Progress', count: inProgressCount },
                  { id: 'locked', label: 'Locked', count: lockedCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setBadgeFilter(tab.id);
                  }}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    badgeFilter === tab.id
                      ? 'bg-amber-400 text-slate-950 border-[1.5px] border-slate-900 shadow-[0_1.5px_0_0_#09090b]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Trophy Completion Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Hall of Fame Completion</span>
              </span>
              <span>{trophyProgressPercent}% Complete</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500 transition-all duration-500"
                style={{ width: `${trophyProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Badges Grid (Full Width, 3 Columns on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {filteredBadges.map((badge) => {
              const isUnlocked = badge.status === 'unlocked';
              const isInProgress = badge.status === 'in_progress';
              const percent =
                badge.maxProgress && badge.currentProgress
                  ? Math.min(100, Math.round((badge.currentProgress / badge.maxProgress) * 100))
                  : isUnlocked
                  ? 100
                  : 0;

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border-[2.5px] flex flex-col justify-between transition-all duration-150 ${
                    isUnlocked
                      ? 'bg-gradient-to-b from-white to-amber-50/40 dark:from-slate-800 dark:to-slate-800/80 border-slate-900 dark:border-slate-700 shadow-[0_4px_0_0_#09090b] dark:shadow-[0_4px_0_0_#000] hover:-translate-y-1'
                      : isInProgress
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500/80 dark:border-amber-700/80 shadow-[0_2px_0_0_#78350f]'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 opacity-60 shadow-none'
                  }`}
                >
                  <div>
                    {/* Top row with Icon & Status Tag */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-2xl border-[2px] border-slate-900 flex items-center justify-center shrink-0 shadow-[0_2.5px_0_0_#09090b] transform -rotate-3 ${
                          isUnlocked
                            ? 'bg-gradient-to-tr from-amber-300 to-amber-400'
                            : isInProgress
                            ? 'bg-amber-100 dark:bg-amber-900/60'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        {renderBadgeIcon(badge.iconName, badge.status)}
                      </div>

                      <div>
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 border-[1.5px] border-slate-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider shadow-[0_1.5px_0_0_#09090b]">
                            <Unlock className="w-3 h-3 stroke-[3]" />
                            Unlocked
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900 border-[1.5px] border-slate-900 text-amber-950 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider shadow-[0_1.5px_0_0_#09090b]">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 border-[1.5px] border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                            <Lock className="w-3 h-3 stroke-[2.5]" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight mb-1">
                      {badge.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 leading-snug">
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                      <span>Requirement</span>
                      <span className="text-slate-900 dark:text-slate-200">{badge.progressText}</span>
                    </div>
                    {badge.maxProgress && (
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-900 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* d) SECONDARY SECTION: FSRS Stability & Academic Notes (Side-by-side in 2-Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Study Rhythm & FSRS Stability Breakdown Card */}
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

          {/* Right: Custom Academic Notes & Targets Container */}
          <div className="tactile-card p-5 sm:p-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000] flex flex-col justify-between">
            <div>
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

              <textarea
                rows={5}
                value={academicNotes}
                onChange={(e) => setAcademicNotes(e.target.value)}
                placeholder="Record target exam dates, specific chapters to conquer, or daily study rules..."
                className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            <div className="mt-3 flex items-center justify-between pt-2">
              <span className="text-[11px] font-bold text-slate-400">
                {totalDecksCount} Active Decks in Arena
              </span>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="tactile-btn px-4 py-1.5 text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#1e1b4b] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                {notesSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Notes ↵</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 1. AVATAR STUDIO MODAL: Color Theme + Emoji Picker in One Focused Pop-up */}
      {/* ========================================================================= */}
      {isAvatarStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="tactile-card w-full max-w-md bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-700 shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] p-6 space-y-5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 border-[2px] border-slate-900 flex items-center justify-center text-slate-950 shadow-[0_2px_0_0_#09090b]">
                  <Palette className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                    Avatar Studio
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">Customize your scholar appearance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarStudioOpen(false)}
                className="w-8 h-8 rounded-xl border-[2px] border-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Avatar Preview in Modal */}
            <div className="flex items-center justify-center py-2">
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${
                    colorThemes[draftProfile.avatarColor as AvatarColor]?.bgGradient || activeTheme.bgGradient
                  } border-[3px] border-slate-900 shadow-[0_5px_0_0_#09090b] flex items-center justify-center text-white text-3xl font-black transform -rotate-2`}
                >
                  {draftProfile.avatarIcon ? (
                    <span>{draftProfile.avatarIcon}</span>
                  ) : (
                    getInitials(draftProfile.name)
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 border-[2px] border-slate-900 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                </div>
              </div>
            </div>

            {/* Color Theme Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Color Theme ({colorThemes[draftProfile.avatarColor as AvatarColor]?.name || activeTheme.name})
              </label>
              <div className="flex items-center justify-between gap-2">
                {(Object.keys(colorThemes) as AvatarColor[]).map((cKey) => {
                  const theme = colorThemes[cKey];
                  const isSelected = draftProfile.avatarColor === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setDraftProfile({ ...draftProfile, avatarColor: cKey });
                      }}
                      className={`w-10 h-10 rounded-xl border-[2px] border-slate-900 bg-gradient-to-tr ${theme.bgGradient} flex items-center justify-center transition-all cursor-pointer shadow-[0_2px_0_0_#09090b] ${
                        isSelected
                          ? 'scale-115 ring-2 ring-slate-950 dark:ring-white -translate-y-1'
                          : 'opacity-70 hover:opacity-100 hover:-translate-y-0.5'
                      }`}
                      title={theme.name}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avatar Icon / Emoji Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Icon / Emoji
                </label>
                {draftProfile.avatarIcon && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setDraftProfile({ ...draftProfile, avatarIcon: undefined });
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Use Initials ({getInitials(draftProfile.name)})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-6 gap-2 mb-3">
                {avatarIconPresets.map((icon) => {
                  const isSelected = draftProfile.avatarIcon === icon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setDraftProfile({
                          ...draftProfile,
                          avatarIcon: isSelected ? undefined : icon,
                        });
                      }}
                      className={`h-10 rounded-xl border-[2px] border-slate-900 flex items-center justify-center text-lg transition-all cursor-pointer shadow-[0_2px_0_0_#09090b] ${
                        isSelected
                          ? 'bg-amber-300 scale-110 ring-2 ring-slate-950 dark:ring-white -translate-y-0.5'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Custom Emoji Input */}
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Or type any emoji (e.g. 🦊, 🚀)"
                  maxLength={4}
                  value={draftProfile.avatarIcon || ''}
                  onChange={(e) => setDraftProfile({ ...draftProfile, avatarIcon: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-xl border-[2px] border-slate-900 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAvatarStudioOpen(false)}
                className="tactile-btn flex-1 py-2 text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-[2px] border-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveProfile(draftProfile);
                  setIsAvatarStudioOpen(false);
                }}
                disabled={isSaving}
                className="tactile-btn tactile-btn-primary flex-1 py-2 text-xs font-black gap-1.5 shadow-[0_3px_0_0_#1e1b4b]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Appearance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT PROFILE MODAL: Clean form for Student Info & Target Rhythm       */}
      {/* ========================================================================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="tactile-card w-full max-w-lg bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-700 shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] p-6 space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/80 border-[2px] border-slate-900 dark:border-violet-700 flex items-center justify-center text-violet-700 dark:text-violet-300 shadow-[0_2px_0_0_#09090b]">
                  <Target className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                    Edit Student Profile
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">Update your academic track and study motto</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-xl border-[2px] border-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleSaveProfile(draftProfile);
                setIsEditProfileOpen(false);
              }}
              className="space-y-3.5"
            >
              {/* Student Name */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={draftProfile.name}
                  onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                  placeholder="e.g. Alex Henderson"
                  className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Major / Academic Track & Age/Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Major / Academic Track
                  </label>
                  <input
                    type="text"
                    value={draftProfile.major}
                    onChange={(e) => setDraftProfile({ ...draftProfile, major: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Academic Level / Year
                  </label>
                  <input
                    type="text"
                    value={draftProfile.age}
                    onChange={(e) => setDraftProfile({ ...draftProfile, age: e.target.value })}
                    placeholder="e.g. Undergraduate"
                    className="w-full px-3.5 py-2 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Academic Motto / Focus Quote */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Academic Motto / Focus Quote
                </label>
                <input
                  type="text"
                  value={draftProfile.motto}
                  onChange={(e) => setDraftProfile({ ...draftProfile, motto: e.target.value })}
                  placeholder="e.g. Consistency beats intensity."
                  className="w-full px-3.5 py-2 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="tactile-btn flex-1 py-2 text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-[2px] border-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="tactile-btn tactile-btn-primary flex-1 py-2 text-xs font-black gap-1.5 shadow-[0_3px_0_0_#1e1b4b]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
