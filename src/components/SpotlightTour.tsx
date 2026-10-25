import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  PlusCircle,
  BookOpen,
  Flame,
  Menu,
} from 'lucide-react';
import { sounds } from '../lib/sound';

export interface SpotlightStep {
  selector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: SpotlightStep[] = [
  {
    selector: '[data-tour="create-deck"]',
    title: 'Create & Import Decks',
    description:
      'Tap here to create custom flashcard sets, generate full quizzes with AI from your notes or PDFs, or import CSV files.',
    icon: <PlusCircle className="w-5 h-5 text-indigo-500" />,
  },
  {
    selector: '[data-tour="deck-cards"]',
    title: 'Study Arenas & Game Modes',
    description:
      'Select any deck to enter the Quiz Arena. Choose Offline Practice, AI Dynamic Quizzes, or Spaced Repetition.',
    icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
  },
  {
    selector: '[data-tour="streak-tracker"]',
    title: 'Streaks & XP Multipliers',
    description:
      'Study every day to build your streak. Each day gives +0.1x XP (up to 2x), and in-session combos add up to 3x bonus XP!',
    icon: <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />,
  },
  {
    selector: '[data-tour="sidebar-toggle"]',
    title: 'Deck Tree & Nested Folders',
    description:
      'Open the hamburger menu to organize decks, nest sub-decks, search materials, or quickly collapse folders.',
    icon: <Menu className="w-5 h-5 text-violet-500" />,
  },
];

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleClose = useCallback(() => {
    setCurrentStepIndex(0);
    setTargetRect(null);
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    sounds.playTap();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      sounds.playFinish();
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      handleClose();
    }
  }, [currentStepIndex, handleClose]);

  const handlePrev = useCallback(() => {
    sounds.playTap();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTargetRect(el.getBoundingClientRect());
      // Re-measure after scroll animation completes to ensure frame accuracy
      setTimeout(() => {
        const updatedEl = document.querySelector(currentStep.selector);
        if (updatedEl) {
          setTargetRect(updatedEl.getBoundingClientRect());
        }
      }, 350);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;

    const rafId = requestAnimationFrame(() => {
      updateTargetPosition();
    });

    const handleResizeOrScroll = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Tooltip positioning logic with screen boundary clamping
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const margin = 16;
    const tooltipWidth = Math.min(340, window.innerWidth - 32);
    const bottomNavOffset = window.innerWidth < 640 ? 72 : 0;
    const spaceAbove = targetRect.top;
    const spaceBelow = window.innerHeight - bottomNavOffset - targetRect.bottom;
    const preferBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;

    let top = preferBelow ? targetRect.bottom + margin : targetRect.top - 200 - margin;
    if (top < margin) top = margin;
    if (top + 210 > window.innerHeight - bottomNavOffset - margin) {
      top = Math.max(margin, window.innerHeight - bottomNavOffset - 210 - margin);
    }

    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }

    return {
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${tooltipWidth}px`,
    };
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Dimmed backdrop with transparent cutout hole */}
      <svg
        className="fixed inset-0 w-full h-full z-40 pointer-events-auto"
        onClick={() => {
          sounds.playTap();
          handleClose();
        }}
      >
        <defs>
          <mask id="spotlight-tour-mask">
            {/* White area = dimmed overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black area = crystal clear transparent cutout */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - 8)}
                y={Math.max(0, targetRect.top - 8)}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="18"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.75)"
          mask="url(#spotlight-tour-mask)"
        />
      </svg>

      {/* Target Glowing Highlighter Frame */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl transition-all duration-300 border-[3.5px] border-amber-400 dark:border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.8),inset_0_0_12px_rgba(251,191,36,0.15)] z-40"
          style={{
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        style={getTooltipStyle()}
        className="fixed z-50 animate-pop tactile-card bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-700 p-4 sm:p-5 shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000]"
      >
        {/* Header & Step Counter */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shrink-0">
              {currentStep.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              handleClose();
            }}
            aria-label="Skip tour"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white tracking-tight">
          {currentStep.title}
        </h3>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1.5 mb-4 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              handleClose();
            }}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="tactile-btn-ghost min-h-[34px] px-2.5 py-1 text-xs font-black flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`min-h-[34px] px-3.5 py-1 text-xs font-black rounded-xl border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center gap-1.5 transition-all ${
                isLastStep
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_2px_0_0_#064e3b]'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_2px_0_0_#78350f]'
              }`}
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {isLastStep ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
