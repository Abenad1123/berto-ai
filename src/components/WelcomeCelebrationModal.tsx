import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, Compass, X } from 'lucide-react';
import type { UserProfile } from '../types';
import { sounds } from '../lib/sound';

interface WelcomeCelebrationModalProps {
  profile: UserProfile;
  onStartTour: () => void;
  onSkip: () => void;
}

const colorGradients: Record<string, string> = {
  violet: 'from-violet-600 via-purple-600 to-indigo-600',
  indigo: 'from-indigo-600 via-blue-600 to-violet-700',
  emerald: 'from-emerald-500 via-teal-600 to-emerald-700',
  amber: 'from-amber-400 via-amber-500 to-orange-500',
  rose: 'from-rose-500 via-pink-600 to-rose-700',
  sky: 'from-sky-400 via-sky-500 to-blue-600',
};

export const WelcomeCelebrationModal: React.FC<WelcomeCelebrationModalProps> = ({
  profile,
  onStartTour,
  onSkip,
}) => {
  useEffect(() => {
    sounds.playFinish();

    // Fire a single lightweight celebratory burst for high performance on mobile devices
    try {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#fbbf24', '#f43f5e', '#8b5cf6'],
        disableForReducedMotion: true,
      });
    } catch {
      // Graceful fallback
    }

    return () => {
      try {
        confetti.reset();
      } catch {
        // Graceful cleanup
      }
    };
  }, []);

  const getInitials = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 1).toUpperCase();
  };

  const gradient = colorGradients[profile.avatarColor] || colorGradients.violet;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="tactile-card w-full max-w-md bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 p-6 sm:p-7 text-center animate-pop shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] relative">
        {/* Subtle Close/Skip X button */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSkip();
          }}
          aria-label="Skip walkthrough"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Personalized Avatar Badge */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div
            className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${gradient} border-[3px] border-slate-900 shadow-[0_4px_0_0_#09090b] flex items-center justify-center text-white text-2xl font-black transform -rotate-2 hover:rotate-2 transition-transform`}
          >
            {profile.avatarIcon ? (
              <span className="text-3xl">{profile.avatarIcon}</span>
            ) : (
              getInitials(profile.name)
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 border-[2px] border-slate-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
          </div>
        </div>

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-700 dark:text-indigo-300 mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Profile Ready</span>
        </div>

        {/* Greeting & Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Welcome, {profile.name}!
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed max-w-sm mx-auto">
          Your personal study space is ready. Would you like a quick 60-second guided tour of the key tools?
        </p>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onStartTour();
            }}
            className="tactile-btn-emerald w-full min-h-[48px] py-3 px-4 text-sm font-black flex items-center justify-center gap-2 shadow-[0_4px_0_0_#064e3b] active:translate-y-1 active:shadow-none hover:-translate-y-0.5 transition-all"
          >
            <span>Start 60s Tour</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onSkip();
            }}
            className="tactile-btn-ghost w-full min-h-[44px] py-2.5 px-4 text-xs font-black text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Skip to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
