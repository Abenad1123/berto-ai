import React from 'react';
import { Menu, Sparkles, Settings as SettingsIcon, Moon, Sun, Keyboard, Flame } from 'lucide-react';
import { BertoMascot } from './BertoMascot';
import { sounds } from '../lib/sound';
import type { UserProfile } from '../types';

const avatarColorGradients: Record<string, string> = {
  violet: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500',
  indigo: 'from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500',
  emerald: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500',
  amber: 'from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400',
  rose: 'from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500',
  sky: 'from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500',
};

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
    <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)] pb-2.5 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Hamburger Menu & Brand Mascot */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => {
              sounds.playTap();
              onOpenMenu();
            }}
            data-tour="sidebar-toggle"
            aria-label="Open navigation menu"
            className="group w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
          >
            <Menu className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-6 group-active:-rotate-12" aria-hidden="true" />
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
              <BertoMascot className="w-7 h-7 text-white" />
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
          {(() => {
            const streak = profile?.streakDays ?? 0;
            const isLit = streak > 0;
            return (
              <div
                data-tour="streak-tracker"
                className={`flex items-center gap-1 sm:gap-1.5 border-[2px] sm:border-[2.5px] border-slate-900 px-2 sm:px-3 py-1 rounded-2xl font-black text-[11px] sm:text-xs select-none hover:scale-105 transition-transform shrink-0 ${
                  isLit
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/70 dark:to-orange-950/70 text-orange-800 dark:text-orange-300 shadow-[0_2px_0_0_#78350f] sm:shadow-[0_3px_0_0_#78350f] dark:shadow-[0_2px_0_0_#000]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000]'
                }`}
                title={isLit ? `${streak}-Day Study Streak!` : '0-Day Streak — Complete a session today to light the flame!'}
              >
                <Flame
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    isLit
                      ? 'fill-orange-500 stroke-orange-600 animate-bounce'
                      : 'fill-slate-300 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="tracking-wide">{streak}d<span className="hidden sm:inline"> Streak</span></span>
              </div>
            );
          })()}

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
            className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-gradient-to-tr ${
              (profile?.avatarColor && avatarColorGradients[profile.avatarColor]) ||
              'from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
            } text-white font-black text-sm border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#1e1b4b] dark:shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all hidden sm:flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
          >
            <span>{profile?.avatarIcon || (profile?.name ? profile.name.charAt(0).toUpperCase() : 'A')}</span>
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
