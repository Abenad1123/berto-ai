import React from 'react';
import { Menu, Sparkles, Settings as SettingsIcon, Brain, Moon, Sun, Keyboard, Flame } from 'lucide-react';
import { sounds } from '../lib/sound';
import type { UserProfile } from '../types';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenShortcuts?: () => void;
  profile?: UserProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onOpenCreate,
  onOpenSettings,
  onOpenProfile,
  onOpenShortcuts,
  profile,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Hamburger Menu & Brand Mascot */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => {
              sounds.playTap();
              onOpenMenu();
            }}
            aria-label="Open navigation menu"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </button>

          {/* Brand Logo & Mascot */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0"
            onClick={() => {
              sounds.playTap();
              onOpenProfile();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                sounds.playTap();
                onOpenProfile();
              }
            }}
            aria-label="User Profile"
          >
            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-purple-500 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] flex items-center justify-center text-white transform -rotate-3 group-hover:rotate-6 group-hover:scale-105 transition-all shrink-0">
              <Brain className="w-5.5 h-5.5 stroke-[2.5]" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-950 dark:text-white truncate block">
                Berto<span className="text-violet-600 dark:text-violet-400">AI</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Punchy Streak Flame Pill - Compact on mobile, full on desktop */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/70 dark:to-orange-950/70 text-orange-800 dark:text-orange-300 border-[2px] sm:border-[2.5px] border-slate-900 px-2 sm:px-3 py-1 rounded-2xl font-black text-[11px] sm:text-xs shadow-[0_2px_0_0_#78350f] sm:shadow-[0_3px_0_0_#78350f] dark:shadow-[0_2px_0_0_#000] select-none hover:scale-105 transition-transform shrink-0"
            title={`${profile?.streakDays || 1}-Day Study Streak!`}
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500 stroke-orange-600 animate-bounce shrink-0" aria-hidden="true" />
            <span className="tracking-wide">{profile?.streakDays || 1}d<span className="hidden sm:inline"> Streak</span></span>
          </div>

          {/* Dark Mode Quick Toggle */}
          <button
            onClick={() => {
              sounds.playTap();
              onToggleDarkMode();
            }}
            aria-label="Toggle dark mode"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 transition-transform hover:-rotate-12" aria-hidden="true" />
            )}
          </button>

          {/* Shortcuts Button (Desktop) */}
          {onOpenShortcuts && (
            <button
              onClick={() => {
                sounds.playTap();
                onOpenShortcuts();
              }}
              aria-label="Keyboard Shortcuts"
              title="Keyboard Shortcuts (?)"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all hidden md:flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Keyboard className="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>
          )}

          {/* Settings Button (Desktop - on mobile available via bottom MobileNav) */}
          <button
            onClick={() => {
              sounds.playTap();
              onOpenSettings();
            }}
            aria-label="Settings"
            title="Settings"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all hidden sm:flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <SettingsIcon className="w-5 h-5 stroke-[2.2] transition-transform hover:rotate-45" aria-hidden="true" />
          </button>

          {/* Profile Avatar Button (Desktop - on mobile available via bottom MobileNav) */}
          <button
            onClick={() => {
              sounds.playTap();
              onOpenProfile();
            }}
            aria-label="Open profile"
            title="Profile"
            className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#1e1b4b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all hidden sm:flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-[1.5px] border-slate-900 shadow-sm" aria-hidden="true" />
          </button>

          {/* New Deck Button (Desktop - on mobile elevated in bottom MobileNav) */}
          <div className="hidden sm:block">
            <button
              onClick={() => {
                sounds.playTap();
                onOpenCreate();
              }}
              aria-label="Create new deck"
              className="tactile-btn tactile-btn-violet min-h-[44px] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-black gap-1.5 shadow-[0_3px_0_0_#2e1065] active:translate-y-0.5 active:shadow-none ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Sparkles className="w-4 h-4 fill-amber-300 stroke-amber-400" aria-hidden="true" />
              <span>New Deck</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
