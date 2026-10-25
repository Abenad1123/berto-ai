import { ArrowLeft, History, CheckCircle2 } from 'lucide-react';
import { sounds } from '../lib/sound';

interface ChangelogPageProps {
  onBack: () => void;
}

interface Release {
  version: string;
  date: string;
  badge: string;
  badgeColor: string;
  highlights: string[];
}

const RELEASES: Release[] = [
  {
    version: 'v1.0.0',
    date: 'Official Release',
    badge: 'Latest',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-600',
    highlights: [
      '🚀 Official Release: Berto AI offline-first active recall flashcard platform with local AI forge.',
      '🧠 FSRS Spaced Repetition Scheduler: Full active recall spaced repetition calculation engine based on retrievability and memory stability.',
      '⚡ 60 FPS Performance Boost: Eliminated continuous RAF loops for smooth animations and instant navigation on all devices.',
      '📱 Native Android App: Built with Capacitor, custom adaptive launcher icons, and local IndexedDB persistence.',
      '🎯 Smart Tutorial Centering: The spotlight onboarding tour automatically centers targets into view with bottom navigation clearance.',
      '🚨 Floating Error Snackbar: Instant auto-scroll to top and floating bottom banner on deck creation errors.',
      '🧹 Simplified Deck Creator: Clean, distraction-free deck creation form with local PDF, PPTX, and TXT parsing.',
      '🔥 Dynamic Streak Flame: Responsive daily streak tracking that lights up with study momentum.',
      '📄 Dedicated Core Pages: Built-in Help & FAQ, About & Privacy, Feedback & Bug Report, and Changelog pages.',
      '🔊 Tactile Sound Engine: Satisfying audio feedback for card flips, correct recall, taps, and achievements.',
    ],
  },
];

export function ChangelogPage({ onBack }: ChangelogPageProps) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b-[2.5px] border-slate-900 dark:border-slate-800 px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playTap();
                onBack();
              }}
              className="tactile-btn-secondary px-3 py-1.5 text-xs font-black gap-1.5 shadow-[0_2px_0_0_#09090b]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                <span>Changelog & Updates</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
                Recent features, performance optimizations, and version history
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-6">
          {RELEASES.map((release) => (
            <div
              key={release.version}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono">
                    {release.version}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-[1.5px] ${release.badgeColor}`}
                  >
                    {release.badge}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {release.date}
                </span>
              </div>

              <ul className="space-y-2.5">
                {release.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
