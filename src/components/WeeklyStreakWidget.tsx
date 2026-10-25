import React, { useState } from 'react';
import { Flame, Check, Sparkles } from 'lucide-react';

interface WeeklyStreakWidgetProps {
  streakDays?: number;
  totalCardsStudied?: number;
}

export const WeeklyStreakWidget: React.FC<WeeklyStreakWidgetProps> = ({
  streakDays = 0,
  totalCardsStudied = 0,
}) => {
  // Determine actual day of week (Monday = index 0, Sunday = index 6)
  const [todayDow] = useState(() => (new Date().getDay() + 6) % 7);
  const dayLabels = [
    { label: 'M', full: 'Mon' },
    { label: 'T', full: 'Tue' },
    { label: 'W', full: 'Wed' },
    { label: 'T', full: 'Thu' },
    { label: 'F', full: 'Fri' },
    { label: 'S', full: 'Sat' },
    { label: 'S', full: 'Sun' },
  ];

  const days = dayLabels.map((d, idx) => {
    const isToday = idx === todayDow;
    const daysAgo = todayDow - idx;
    const completed = streakDays > 0 && daysAgo >= 0 && daysAgo < streakDays;
    return {
      ...d,
      completed,
      isToday,
    };
  });

  return (
    <div className="tactile-card p-4 sm:p-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#000] mb-6 relative overflow-hidden transition-colors">
      {/* Decorative Celebration Aura */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-violet-400/15 via-indigo-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 relative z-0">
        {/* Left: Streak headline & level micro-copy */}
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-[1.5px] border-slate-900 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider shadow-[0_1px_0_0_#09090b]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Active Rhythm</span>
            </span>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              • {totalCardsStudied} Active Cards Mastered
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              {streakDays > 0 ? `${streakDays} Day Study Streak!` : 'Start Your Study Streak!'}
            </h3>
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform shrink-0 ${
                streakDays > 0
                  ? 'bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 border-[2px] border-slate-900 shadow-[0_2.5px_0_0_#78350f]'
                  : 'bg-slate-200 dark:bg-slate-800 border-[2px] border-slate-400 dark:border-slate-700 shadow-none'
              }`}
            >
              <Flame
                className={`w-4.5 h-4.5 ${
                  streakDays > 0
                    ? 'fill-orange-500 stroke-orange-700 animate-bounce'
                    : 'fill-slate-300 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500'
                }`}
                aria-hidden="true"
              />
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
            {streakDays > 0
              ? "You're building unstoppable momentum! Practice today to keep your streak glowing."
              : 'Complete a study session today to light your first daily streak flame!'}
          </p>
        </div>

        {/* Right: 7-Day Matrix Pills with Rewarding Checkmarks */}
        <div className="flex items-center gap-1 sm:gap-2 justify-between sm:justify-start w-full sm:w-auto">
          {days.map((day, idx) => {
            return (
              <div key={idx} className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border-[2px] sm:border-[2.5px] flex items-center justify-center font-black text-xs transition-all ${
                    day.completed
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white border-slate-900 shadow-[0_2.5px_0_0_#064e3b] sm:shadow-[0_3px_0_0_#064e3b] hover:-translate-y-0.5'
                      : day.isToday
                      ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 border-slate-900 shadow-[0_2.5px_0_0_#78350f] sm:shadow-[0_3px_0_0_#78350f] ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900 animate-pulse hover:-translate-y-0.5'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 shadow-[0_1.5px_0_0_#cbd5e1] dark:shadow-none'
                  }`}
                  title={`${day.full}: ${day.completed ? 'Studied' : day.isToday ? 'Today (Active)' : 'Upcoming'}`}
                >
                  {day.completed ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3.5] drop-shadow-xs" />
                  ) : day.isToday ? (
                    <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-slate-950 stroke-none" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] font-black uppercase ${
                    day.isToday ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
