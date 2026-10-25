import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  Key,
  FileCheck,
  Code2,
  Heart,
} from 'lucide-react';
import { sounds } from '../lib/sound';

interface AboutPrivacyPageProps {
  onBack: () => void;
}

export function AboutPrivacyPage({ onBack }: AboutPrivacyPageProps) {
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
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span>About & Privacy</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
                Local-first architecture and privacy guarantee
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            v1.0.0
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_4px_0_0_#09090b] dark:shadow-[0_4px_0_0_#000]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 border-[2px] border-slate-900 flex items-center justify-center shadow-[0_2px_0_0_#09090b]">
              <Zap className="w-5 h-5 text-slate-950 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Berto AI</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Active Recall & Spaced Repetition Flashcards
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Berto AI is designed for students, researchers, and lifelong learners who want high-efficiency memory retention without subscriptions, advertisements, or cloud telemetry.
          </p>
        </div>

        {/* Privacy Manifesto */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Privacy & Data Security Commitment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_2.5px_0_0_#09090b]">
              <div className="flex items-center gap-2 mb-2 font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                <Database className="w-4 h-4 shrink-0" />
                <span>100% On-Device Storage</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your flashcards, study schedules, answers, and profile stats live in your browser's local IndexedDB. They are never sent to a cloud database.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_2.5px_0_0_#09090b]">
              <div className="flex items-center gap-2 mb-2 font-black text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                <Key className="w-4 h-4 shrink-0" />
                <span>Direct Client-Side Keys</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your AI provider API keys (Groq, Gemini, etc.) are saved in local device storage and used directly in client-to-provider HTTPS calls. No middleman proxy.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_2.5px_0_0_#09090b]">
              <div className="flex items-center gap-2 mb-2 font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Local Document Parsing</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When you import PDF slides, PPTX files, or notes, text extraction happens entirely in your local browser runtime.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_2.5px_0_0_#09090b]">
              <div className="flex items-center gap-2 mb-2 font-black text-xs sm:text-sm text-rose-600 dark:text-rose-400">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Zero Trackers or Telemetry</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No Google Analytics, no Facebook Pixels, no behavioral fingerprinting, and no data broker cookies. Ever.
              </p>
            </div>
          </div>
        </div>

        {/* Open Source & Tech Stack */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_3px_0_0_#09090b] space-y-3">
          <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-900 dark:text-white">
            <Code2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Built with Modern Open Web Technologies</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Crafted with React, TypeScript, Dexie.js (IndexedDB), FSRS algorithm, Tailwind CSS, Lucide Icons, and Capacitor for native Android builds.
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>License: MIT (Free Educational Software)</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for lifelong learners
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
