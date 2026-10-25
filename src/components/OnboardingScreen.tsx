import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Flame,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { sounds } from '../lib/sound';

export interface OnboardingScreenProps {
  onComplete: (profile: Omit<UserProfile, 'id'>) => void;
}

export type AvatarColor = 'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';

const colorThemes: Record<
  AvatarColor,
  {
    name: string;
    bgGradient: string;
    borderClass: string;
    accentHex: string;
  }
> = {
  violet: {
    name: 'Arcane Violet',
    bgGradient: 'from-violet-600 via-purple-600 to-indigo-600',
    borderClass: 'border-violet-950 dark:border-violet-600',
    accentHex: '#7c3aed',
  },
  indigo: {
    name: 'Cosmic Indigo',
    bgGradient: 'from-indigo-600 via-blue-600 to-violet-700',
    borderClass: 'border-indigo-950 dark:border-indigo-600',
    accentHex: '#4f46e5',
  },
  emerald: {
    name: 'Forest Emerald',
    bgGradient: 'from-emerald-500 via-teal-600 to-emerald-700',
    borderClass: 'border-emerald-950 dark:border-emerald-600',
    accentHex: '#059669',
  },
  amber: {
    name: 'Solar Amber',
    bgGradient: 'from-amber-400 via-amber-500 to-orange-500',
    borderClass: 'border-amber-950 dark:border-amber-600',
    accentHex: '#d97706',
  },
  rose: {
    name: 'Ruby Rose',
    bgGradient: 'from-rose-500 via-pink-600 to-rose-700',
    borderClass: 'border-rose-950 dark:border-rose-600',
    accentHex: '#e11d48',
  },
  sky: {
    name: 'Aero Sky',
    bgGradient: 'from-sky-400 via-sky-500 to-blue-600',
    borderClass: 'border-sky-950 dark:border-sky-600',
    accentHex: '#0284c7',
  },
};

const dailyGoalPresets = [10, 20, 30, 50];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('University Student');
  const [major, setMajor] = useState('');
  const [motto, setMotto] = useState('Consistency beats intensity.');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('violet');
  const [dailyGoalCards, setDailyGoalCards] = useState<number>(20);
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [nameError, setNameError] = useState('');

  const activeTheme = colorThemes[avatarColor];

  const getInitials = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 1).toUpperCase();
  };

  const handleNextFromWelcome = () => {
    sounds.playTap();
    setStep(2);
  };

  const handleNextFromProfile = () => {
    sounds.playTap();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please enter your name or student alias to continue');
      return;
    }
    setNameError('');
    setStep(3);
  };

  const handleBackToStep = (targetStep: 1 | 2) => {
    sounds.playTap();
    setStep(targetStep);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!acceptedTos) return;

    sounds.playCorrect();

    const newProfile: Omit<UserProfile, 'id'> = {
      name: name.trim(),
      age: age.trim() || 'Student',
      major: major.trim() || 'General Studies',
      motto: motto.trim() || 'Consistency beats intensity.',
      avatarColor,
      dailyGoalCards: Math.max(5, Math.min(100, dailyGoalCards)),
      xp: 0,
      streakDays: 0,
      lastStudyDate: undefined,
      tosAcceptedAt: new Date().toISOString(),
    };

    onComplete(newProfile);
  };

  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-black flex items-center justify-center border-2 border-slate-900 dark:border-white shadow-[0_2px_0_0_#09090b]">
              B
            </div>
            <span className="font-black text-lg tracking-tight text-slate-950 dark:text-white">
              Berto AI
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-8 bg-violet-600 dark:bg-violet-400'
                    : step > s
                    ? 'w-2.5 bg-emerald-500'
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="tactile-card bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border-[2.5px] border-slate-900 dark:border-white text-white flex items-center justify-center shadow-[0_4px_0_0_#1e1b4b] mb-5">
              <Sparkles className="w-8 h-8 fill-amber-300 stroke-amber-100" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight mb-2">
              Welcome to Berto AI
            </h1>
            <p className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Your offline-first, intelligent study companion. Master complex subjects with FSRS spaced repetition, dynamic quizzes, and customizable AI deck generation.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-900/10 dark:border-slate-700">
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0 font-bold border border-violet-200 dark:border-violet-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    100% Local &amp; Private
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Your flashcards, study schedules, and notes stay completely in your browser's private database.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-900/10 dark:border-slate-700">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold border border-amber-200 dark:border-amber-800">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Gamified Mastery
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Level up from Novice to Sage, build daily study streaks, and unlock academic badges as you retain cards.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleNextFromWelcome}
              className="w-full tactile-btn py-3.5 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm sm:text-base border-2 border-slate-900 shadow-[0_4px_0_0_#1e1b4b] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PROFILE SETUP */}
        {step === 2 && (
          <div className="tactile-card bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                  Set Up Your Profile
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Personalize your student identity and study targets
                </p>
              </div>

              {/* Avatar Preview */}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activeTheme.bgGradient} border-[2.5px] ${activeTheme.borderClass} text-white font-black text-xl flex items-center justify-center shadow-[0_3px_0_0_#09090b] shrink-0`}
              >
                {getInitials(name)}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Name / Alias <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g. Jordan Rivera"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 font-bold text-sm bg-white dark:bg-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
                    nameError
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-900 dark:border-slate-700'
                  }`}
                  autoFocus
                />
                {nameError && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{nameError}</p>
                )}
              </div>

              {/* Major / Focus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Field / Subject
                  </label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Biology &amp; CS"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-900 dark:border-slate-700 font-bold text-sm bg-white dark:bg-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Stage
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. University Student"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-900 dark:border-slate-700 font-bold text-sm bg-white dark:bg-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                  />
                </div>
              </div>

              {/* Study Motto */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Study Motto
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="e.g. Consistency beats intensity."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-900 dark:border-slate-700 font-bold text-sm bg-white dark:bg-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Avatar Theme
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {(Object.keys(colorThemes) as AvatarColor[]).map((c) => {
                    const theme = colorThemes[c];
                    const isSelected = avatarColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setAvatarColor(c);
                        }}
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.bgGradient} border-2 border-slate-900 flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'scale-110 shadow-[0_3px_0_0_#09090b] ring-2 ring-violet-500'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        title={theme.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Target Stepper */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Daily Card Goal
                  </label>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    {dailyGoalCards} cards / day
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setDailyGoalCards((g) => Math.max(5, g - 5));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex gap-1.5 justify-center">
                    {dailyGoalPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setDailyGoalCards(preset);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                          dailyGoalCards === preset
                            ? 'bg-violet-600 text-white border-slate-900 shadow-[0_2px_0_0_#1e1b4b]'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-900'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setDailyGoalCards((g) => Math.min(100, g + 5));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleBackToStep(1)}
                className="tactile-btn py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm border-2 border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextFromProfile}
                className="flex-1 tactile-btn py-3 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm sm:text-base border-2 border-slate-900 shadow-[0_4px_0_0_#1e1b4b] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TERMS OF SERVICE & LAUNCH */}
        {step === 3 && (
          <div className="tactile-card bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-2 border-slate-900 dark:border-emerald-700 flex items-center justify-center shadow-[0_2px_0_0_#064e3b]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                  Terms &amp; Data Privacy
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Your privacy commitment before entering the arena
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-900/10 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-6 max-h-56 overflow-y-auto leading-relaxed font-medium">
              <p className="font-bold text-slate-900 dark:text-white">
                1. Local-First Architecture
              </p>
              <p>
                Berto AI runs directly inside your web browser. All decks, cards, flashcards, study schedules, and profile metrics are stored securely within your device's IndexedDB. We do not operate a remote user account database.
              </p>

              <p className="font-bold text-slate-900 dark:text-white pt-1">
                2. Data Ownership &amp; Export
              </p>
              <p>
                You retain complete ownership of all created and imported study materials. You can create complete backups or export JSON flashcard decks at any time in Settings.
              </p>

              <p className="font-bold text-slate-900 dark:text-white pt-1">
                3. Third-Party AI Services
              </p>
              <p>
                If you configure optional AI keys (e.g. Google Gemini or Groq), API calls communicate directly between your browser and the respective AI provider under their standard terms. Your API keys are kept strictly in your local storage.
              </p>

              <p className="font-bold text-slate-900 dark:text-white pt-1">
                4. Academic Fair Use
              </p>
              <p>
                Berto AI is engineered as an active-recall study aid to enhance your retention and understanding. Please adhere to your academic institution's honor code and guidelines when generating study materials.
              </p>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800/90 cursor-pointer mb-6 select-none shadow-[0_2px_0_0_#09090b]">
              <input
                type="checkbox"
                checked={acceptedTos}
                onChange={(e) => {
                  sounds.playTap();
                  setAcceptedTos(e.target.checked);
                }}
                className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-900 text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                I have read and agree to the Terms of Service &amp; Local Privacy Agreement
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleBackToStep(2)}
                className="tactile-btn py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm border-2 border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!acceptedTos}
                onClick={handleSubmit}
                className={`flex-1 tactile-btn py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base border-2 border-slate-900 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  acceptedTos
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_0_0_#064e3b]'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-400 dark:border-slate-600'
                }`}
              >
                <span>Create Account &amp; Launch</span>
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
