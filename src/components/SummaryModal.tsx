import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  Target,
  Zap,
  Sparkles,
  HelpCircle,
  PenTool,
  CheckCircle2,
  CheckSquare,
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  Check,
} from 'lucide-react';
import type { Deck, QuizAnswer, QuestionType, QuizLauncherConfig } from '../types';
import { sounds } from '../lib/sound';

interface SummaryModalProps {
  deck: Deck;
  answers: QuizAnswer[];
  launcherConfig?: QuizLauncherConfig;
  onRestart: () => void;
  onHome: () => void;
  onRetryMissed?: (missedCardIds: number[]) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  deck,
  answers,
  launcherConfig,
  onRestart,
  onHome,
  onRetryMissed,
}) => {
  const [showReviewList, setShowReviewList] = useState(false);
  const gameMode = launcherConfig?.gameMode || 'normal';
  const xpPerCorrect = gameMode === 'normal' ? 10 : 15;
  const total = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const xpEarned = correctCount * xpPerCorrect;
  const missedAnswers = answers.filter((a) => !a.isCorrect);

  useEffect(() => {
    sounds.playFinish();

    // Trigger celebratory confetti if score is >= 60%
    if (accuracy >= 60) {
      const end = Date.now() + 1.2 * 1000;
      const colors = ['#6366f1', '#10b981', '#fbbf24', '#f43f5e'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [accuracy]);

  // Letter Grade evaluation
  const getGrade = (acc: number) => {
    if (acc >= 95) return { grade: 'A+', label: 'Mastery', color: 'text-amber-500' };
    if (acc >= 85) return { grade: 'A', label: 'Proficient', color: 'text-emerald-500' };
    if (acc >= 70) return { grade: 'B', label: 'Solid', color: 'text-indigo-500' };
    if (acc >= 50) return { grade: 'C', label: 'Developing', color: 'text-sky-500' };
    return { grade: 'D', label: 'Needs Practice', color: 'text-rose-500' };
  };

  const gradeInfo = getGrade(accuracy);

  // Group answers by Question Type for format-by-format breakdown
  const formatStats: Record<
    string,
    { total: number; correct: number; type: QuestionType }
  > = {};

  for (const a of answers) {
    const qType = a.questionType || 'multiple_choice';
    if (!formatStats[qType]) {
      formatStats[qType] = { total: 0, correct: 0, type: qType };
    }
    formatStats[qType].total += 1;
    if (a.isCorrect) formatStats[qType].correct += 1;
  }

  const getFormatIcon = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />;
      case 'true_false':
        return <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />;
      case 'fill_blank':
        return <PenTool className="w-3.5 h-3.5 text-amber-500" />;
      case 'multiple_select':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'flashcard':
      default:
        return <Layers className="w-3.5 h-3.5 text-violet-500" />;
    }
  };

  const getFormatTitle = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True / False';
      case 'fill_blank':
        return 'Fill in Blank';
      case 'multiple_select':
        return 'Checkboxes';
      case 'flashcard':
      default:
        return 'Flashcard';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="tactile-card w-full max-w-lg bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 p-4 sm:p-7 text-center animate-in zoom-in-95 duration-150 shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#000] my-auto max-h-[90vh] overflow-y-auto">
        {/* Celebratory Trophy & Star Badge */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2.5 sm:mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 border-[3px] border-slate-900 shadow-[0_3px_0_0_#78350f] sm:shadow-[0_4px_0_0_#78350f] flex items-center justify-center text-slate-950 transform -rotate-3 hover:rotate-3 transition-transform">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white border-[1.5px] border-slate-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 stroke-none" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Session Complete!
        </h2>
        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 shadow-[0_1px_0_0_#09090b]">
            <span>{deck.title}</span>
          </div>
          {gameMode === 'speed_run' ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-300 dark:bg-amber-400 text-slate-950 border-[1.5px] border-slate-900 text-xs font-black uppercase tracking-wider shadow-[0_1px_0_0_#78350f]">
              <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
              <span>Speed Run (+15 XP)</span>
            </div>
          ) : gameMode === 'hard_mode' ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500 text-white border-[1.5px] border-slate-900 text-xs font-black uppercase tracking-wider shadow-[0_1px_0_0_#881337]">
              <span>🔥 Hard Mode (1.5x XP)</span>
            </div>
          ) : null}
        </div>

        {/* Big Accuracy & Grade Banner */}
        <div className="my-3.5 sm:my-5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-50 via-violet-50/60 to-purple-50 dark:from-slate-800 dark:to-indigo-950/60 border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_4px_0_0_#1e1b4b] dark:shadow-[0_4px_0_0_#000] flex items-center justify-around relative overflow-hidden">
          <div className="text-center">
            <div className="text-3xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {accuracy}%
            </div>
            <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1">
              Accuracy Score
            </div>
          </div>

          <div className="h-12 w-[2.5px] bg-slate-300 dark:bg-slate-700 rounded-full" />

          <div className="text-center">
            <div className={`text-3xl sm:text-5xl font-black tracking-tight ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </div>
            <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1">
              {gradeInfo.label}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid with Vibrant Accent Rings */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5 sm:mb-4">
          <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-800/90 border-[2.5px] border-slate-900 dark:border-slate-700 rounded-2xl flex items-center gap-2 sm:gap-3 text-left shadow-[0_3px_0_0_#064e3b] dark:shadow-[0_3px_0_0_#000] ring-2 ring-emerald-400/30">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Score</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 dark:text-white truncate">
                {correctCount} / {total} Correct
              </div>
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-800/90 border-[2.5px] border-slate-900 dark:border-slate-700 rounded-2xl flex items-center gap-2 sm:gap-3 text-left shadow-[0_3px_0_0_#78350f] dark:shadow-[0_3px_0_0_#000] ring-2 ring-amber-400/30">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 dark:text-amber-400 fill-amber-400 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">XP Gained</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 dark:text-white truncate">
                +{xpEarned} XP
              </div>
            </div>
          </div>
        </div>

        {/* Performance by Question Format */}
        {Object.keys(formatStats).length > 0 && (
          <div className="mb-3.5 sm:mb-4 text-left p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-[2px] border-slate-900 dark:border-slate-700 space-y-2 sm:space-y-2.5 shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000]">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Performance by Question Format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(formatStats).map(([qType, stat]) => {
                const typeAcc = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div
                    key={qType}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-between text-xs shadow-[0_1.5px_0_0_#09090b]"
                  >
                    <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200 truncate">
                      {getFormatIcon(stat.type)}
                      <span className="truncate">{getFormatTitle(stat.type)}</span>
                    </div>
                    <div className="font-black text-slate-950 dark:text-white ml-2 shrink-0">
                      {stat.correct}/{stat.total} <span className="text-indigo-600 dark:text-indigo-400">({typeAcc}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missed Questions Review */}
        {missedAnswers.length > 0 && (
          <div className="mb-4 text-left">
            <button
              type="button"
              onClick={() => setShowReviewList(!showReviewList)}
              className="w-full flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 p-2.5 rounded-2xl border-[2px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>Review Missed Questions ({missedAnswers.length})</span>
              </span>
              {showReviewList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showReviewList && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {missedAnswers.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border-[2px] border-rose-300 dark:border-rose-800/80 text-xs space-y-1.5 shadow-[0_1.5px_0_0_#f43f5e]"
                  >
                    <div className="font-black text-slate-900 dark:text-white">
                      {m.questionText || `Question #${idx + 1}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
                      <XCircle className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>You answered: {m.userAnswer || 'Skipped'}</span>
                    </div>
                    {m.correctAnswerText && (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-black">
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                        <span>Correct answer: {m.correctAnswerText}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1 pb-1">
          {/* Retry Missed Questions Button if any missed */}
          {missedAnswers.length > 0 && onRetryMissed && (
            <button
              onClick={() => {
                sounds.playTap();
                const missedIds = missedAnswers.map((a) => a.sourceCardId || a.cardId);
                onRetryMissed(missedIds);
              }}
              className="tactile-btn tactile-btn-amber w-full min-h-[48px] py-3 px-4 text-xs sm:text-sm font-black gap-2 shadow-[0_4px_0_0_#78350f] active:translate-y-1 active:shadow-none rounded-2xl flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Retry Missed Questions ({missedAnswers.length})</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
            <button
              onClick={() => {
                sounds.playTap();
                onRestart();
              }}
              className="tactile-btn tactile-btn-emerald w-full sm:flex-1 min-h-[48px] py-3 px-4 text-xs sm:text-sm font-black gap-2 shadow-[0_4px_0_0_#064e3b] active:translate-y-1 active:shadow-none rounded-2xl flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Fresh Quiz</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                onHome();
              }}
              className="tactile-btn tactile-btn-secondary w-full sm:flex-1 min-h-[48px] py-3 px-4 text-xs sm:text-sm font-black gap-2 shadow-[0_4px_0_0_#09090b] dark:shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none rounded-2xl flex items-center justify-center"
            >
              <Home className="w-4 h-4 stroke-[2.5]" />
              <span>All Decks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
