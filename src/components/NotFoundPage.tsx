import React from 'react';
import { Home, Sparkles, Compass, ArrowLeft } from 'lucide-react';
import { BertoMascot } from './BertoMascot';
import { sounds } from '../lib/sound';

interface NotFoundPageProps {
  onHome: () => void;
  onCreateDeck?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onHome, onCreateDeck }) => {
  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)] pb-2.5 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              sounds.playTap();
              onHome();
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#09090b] flex items-center justify-center text-white transform -rotate-3 group-hover:rotate-3 transition-transform">
              <BertoMascot className="w-7 h-7 text-white" />
            </div>
            <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-950 dark:text-white">
              Berto<span className="text-violet-600 dark:text-violet-400">AI</span>
            </span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onHome();
            }}
            className="tactile-btn-ghost px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>
      </header>

      {/* Main 404 Hero Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="tactile-card w-full max-w-lg bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 p-6 sm:p-10 text-center animate-pop shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000]">
          {/* Big 404 Visual Badge */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 border-[3px] border-slate-900 shadow-[0_5px_0_0_#78350f] flex items-center justify-center text-slate-950 transform -rotate-3 hover:rotate-3 transition-transform">
              <Compass className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2] animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-xs border-[2px] border-slate-900 shadow-[0_2px_0_0_#881337]">
              404
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Lost in the Stacks?
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
            The flashcard deck, page, or study arena you were looking for doesn't exist, has been deleted, or was moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onHome();
              }}
              className="tactile-btn-emerald min-h-[46px] px-5 py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[0_4px_0_0_#064e3b] active:translate-y-1 active:shadow-none hover:-translate-y-0.5 transition-all"
            >
              <Home className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Dashboard</span>
            </button>

            {onCreateDeck && (
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onCreateDeck();
                }}
                className="tactile-btn-secondary min-h-[46px] px-5 py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[0_4px_0_0_#09090b] active:translate-y-1 active:shadow-none hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
                <span>Create New Deck</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
