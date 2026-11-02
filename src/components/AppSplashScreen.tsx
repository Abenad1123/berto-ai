import React, { useEffect, useState } from 'react';
import { BertoMascot } from './BertoMascot';
import { Zap } from 'lucide-react';

interface AppSplashScreenProps {
  onFinish?: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [mascotVariant, setMascotVariant] = useState<'happy' | 'winking' | 'sparkle'>('happy');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Lock body and root scroll completely while splash is visible to eliminate scrollbars
    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Playful mascot eye animations during load
    const winkTimer = setTimeout(() => {
      setMascotVariant('winking');
    }, prefersReducedMotion ? 150 : 350);

    const sparkleTimer = setTimeout(() => {
      setMascotVariant('sparkle');
    }, prefersReducedMotion ? 300 : 700);

    // Fade-out trigger (bar is 100% full via GPU keyframe animation)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, prefersReducedMotion ? 400 : 900);

    // Complete transition and unmount
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onFinish) onFinish();
    }, prefersReducedMotion ? 650 : 1200);

    return () => {
      clearTimeout(winkTimer);
      clearTimeout(sparkleTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevDocOverflow;
    };
  }, [onFinish]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbfaf8] dark:bg-[#090d16] bg-playful-grid select-none overflow-hidden touch-none overscroll-none ${
        isFadingOut ? 'animate-splash-out' : 'animate-fade-in'
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center text-center p-6 gap-8">
        {/* Top-Tier Mascot Showcase */}
        <div className="relative animate-mascot-in">
          {/* Ambient luminous glow aura */}
          <div className="absolute -inset-6 bg-gradient-to-tr from-violet-500/25 via-indigo-500/30 to-amber-400/20 rounded-full blur-2xl animate-pulse-subtle pointer-events-none" />

          {/* Floating mascot container */}
          <div className="relative animate-mascot-float">
            {/* Tactile Mascot Badge */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 border-[3.5px] border-slate-900 shadow-[0_8px_0_0_#09090b] flex items-center justify-center text-white transform -rotate-2">
              <BertoMascot
                className="w-14 h-14 sm:w-16 sm:h-16 text-white"
                variant={mascotVariant}
                animated={true}
              />
            </div>

            {/* Mini Tactile Lightning Bolt Badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-400 border-[2px] border-slate-900 flex items-center justify-center shadow-[0_2px_0_0_#09090b] animate-bounce">
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950 stroke-none" />
            </div>
          </div>

          {/* Responsive Ground Shadow beneath floating mascot */}
          <div className="w-16 h-2.5 rounded-full bg-slate-900/30 dark:bg-black/60 blur-[2px] mx-auto mt-4 animate-shadow-pulse" />
        </div>

        {/* Tactile 0% -> 100% Zero-Lag GPU-Accelerated Progress Bar */}
        <div className="w-44 sm:w-52 h-3.5 rounded-full border-[2px] border-slate-900 dark:border-slate-700 bg-slate-200/90 dark:bg-slate-800/90 overflow-hidden relative shadow-[0_2.5px_0_0_#09090b] p-0.5">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-amber-400 relative overflow-hidden animate-splash-fill">
            {/* Shimmer gloss sweep across the active progress fill */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-bar-shine pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
