import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Sparkles,
  Layers,
  HelpCircle,
  RotateCw,
  CheckCircle2,
  PenTool,
  CheckSquare,
  Flame,
  Check,
  Brain,
  Sliders,
  Rocket,
  Shield,
  Award,
  BookOpen,
} from 'lucide-react';
import type { Deck, Card, QuizLauncherConfig, QuizEngine, QuizFormatPreference, GameMode, UserSettings } from '../types';
import { sounds } from '../lib/sound';
import { generateOfflineQuiz } from '../lib/offlineQuizEngine';
import { generateAIQuiz } from '../lib/aiQuizEngine';

interface StudyLauncherModalProps {
  deck: Deck;
  cards: Card[];
  userSettings?: UserSettings;
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: QuizLauncherConfig, preparedCards: Card[]) => void;
}

export const StudyLauncherModal: React.FC<StudyLauncherModalProps> = ({
  deck,
  cards,
  userSettings,
  isOpen,
  onClose,
  onStart,
}) => {
  const [engine, setEngine] = useState<QuizEngine>('offline');
  const [format, setFormat] = useState<QuizFormatPreference>(
    () => userSettings?.defaultQuizFormat || 'mixed'
  );
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [countSelection, setCountSelection] = useState<number | 'all'>(
    () => userSettings?.defaultQuestionCount || (cards.length <= 10 ? 'all' : 10)
  );
  const [dueOnly, setDueOnly] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());

  const countOptions = useMemo(() => {
    const base: (number | 'all')[] = [5, 10, 15, 'all'];
    const def = userSettings?.defaultQuestionCount;
    if (def && !base.includes(def)) {
      return [5, 10, 15, def, 'all'];
    }
    return base;
  }, [userSettings?.defaultQuestionCount]);

  const dueCards = useMemo(() => {
    return cards.filter((c) => {
      if (!c.due) return true;
      return new Date(c.due).getTime() <= sessionStartTime || (c.reps ?? 0) === 0;
    });
  }, [cards, sessionStartTime]);

  const activeCardPool = dueOnly && dueCards.length > 0 ? dueCards : cards;

  const targetCount =
    countSelection === 'all'
      ? activeCardPool.length
      : Math.min(countSelection, activeCardPool.length);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    sounds.playTap();
    setIsGenerating(true);

    const config: QuizLauncherConfig = {
      engine,
      format,
      gameMode,
      count: countSelection,
      dueOnly,
      practiceMode,
    };

    try {
      let preparedCards: Card[] = [];

      if (engine === 'classic') {
        // Standard flashcards
        preparedCards = activeCardPool.slice(0, targetCount).map((c) => ({
          ...c,
          sourceCardId: c.id,
          type: 'flashcard',
        }));
      } else if (engine === 'ai') {
        preparedCards = await generateAIQuiz({
          cards: activeCardPool,
          apiKey: userSettings?.apiKey || '',
          provider: userSettings?.aiProvider || 'gemini',
          format,
          count: countSelection,
        });
      } else {
        // Offline smart heuristic engine
        preparedCards = generateOfflineQuiz(activeCardPool, {
          format,
          count: countSelection,
        });
      }

      sounds.playCardFlip();
      setIsGenerating(false);
      onStart(config, preparedCards);
    } catch (err) {
      console.error('Failed to prepare quiz:', err);
      // Fallback to offline
      const fallback = generateOfflineQuiz(activeCardPool, {
        format,
        count: countSelection,
      });
      setIsGenerating(false);
      onStart(config, fallback);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-800 rounded-3xl shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#020617] p-4 sm:p-7 space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[2.5px] border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-400 text-slate-950 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#09090b] flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 stroke-[2.5] -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white leading-tight">
                  Study &amp; Quiz Arena
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 border border-slate-900 dark:border-indigo-700 text-[10px] font-black uppercase tracking-wider">
                  <Award className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  XP Boosted
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Configure game session for &ldquo;{deck.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close modal"
            className="w-9 h-9 rounded-xl border-[2.5px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b] active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 1. Engine Selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
              <span>1. Choose Study Engine</span>
            </label>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {activeCardPool.length} cards available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Offline Smart Engine */}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setEngine('offline');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-3 group relative ${
                engine === 'offline'
                  ? 'bg-amber-100/90 dark:bg-amber-950/60 border-slate-900 dark:border-amber-400 shadow-[0_4px_0_0_#78350f] -translate-y-0.5'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-300 dark:bg-amber-900/80 text-slate-950 dark:text-amber-200 border border-slate-900">
                  Offline
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-black text-slate-950 dark:text-white">Offline Practice</div>
                {engine === 'offline' && (
                  <Check className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 stroke-[3.5]" />
                )}
              </div>
            </button>

            {/* AI-Powered Engine */}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setEngine('ai');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-3 group relative ${
                engine === 'ai'
                  ? 'bg-indigo-100/90 dark:bg-indigo-950/60 border-slate-900 dark:border-indigo-400 shadow-[0_4px_0_0_#1e1b4b] -translate-y-0.5'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center">
                  <Brain className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-950 dark:text-indigo-200 border border-slate-900">
                  {userSettings?.aiProvider === 'groq' ? 'Groq AI' : 'Gemini AI'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-black text-slate-950 dark:text-white">AI Dynamic</div>
                {engine === 'ai' && (
                  <Check className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300 stroke-[3.5]" />
                )}
              </div>
            </button>

            {/* Classic Flashcards */}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setEngine('classic');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-3 group relative ${
                engine === 'classic'
                  ? 'bg-emerald-100/90 dark:bg-emerald-950/60 border-slate-900 dark:border-emerald-400 shadow-[0_4px_0_0_#064e3b] -translate-y-0.5'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center">
                  <Layers className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200 border border-slate-900">
                  Spaced Rep
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-black text-slate-950 dark:text-white">Flashcard Arena</div>
                {engine === 'classic' && (
                  <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 stroke-[3.5]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* 2. Format Selection (Visible unless Classic Flashcards) */}
        {engine !== 'classic' && (
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>2. Question Format Style</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {[
                { id: 'mixed', label: 'Randomized Mixed', icon: Sparkles, color: 'bg-violet-500 text-white' },
                { id: 'multiple_choice', label: 'Multiple Choice', icon: HelpCircle, color: 'bg-indigo-500 text-white' },
                { id: 'true_false', label: 'True or False', icon: CheckCircle2, color: 'bg-sky-500 text-white' },
                { id: 'fill_blank', label: 'Cloze Blank', icon: PenTool, color: 'bg-amber-500 text-white' },
                { id: 'multiple_select', label: 'Multi-Select', icon: CheckSquare, color: 'bg-emerald-500 text-white' },
              ].map((f) => {
                const Icon = f.icon;
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setFormat(f.id as QuizFormatPreference);
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border-[2.5px] text-xs font-black flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-[0_3px_0_0_#09090b] -translate-y-0.5'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-slate-900 ${
                        isSelected ? f.color : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{f.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Choose Game Mode (NEW) */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 stroke-none" />
            <span>3. Choose Game Mode</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Normal Mode */}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setGameMode('normal');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-3 group relative ${
                gameMode === 'normal'
                  ? 'bg-sky-100/90 dark:bg-sky-950/60 border-slate-900 dark:border-sky-400 shadow-[0_4px_0_0_#0369a1] -translate-y-0.5'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-sky-500 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-200 dark:bg-sky-900 text-sky-950 dark:text-sky-200 border border-slate-900">
                  Standard
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-black text-slate-950 dark:text-white">Normal Mode</div>
                {gameMode === 'normal' && (
                  <Check className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300 stroke-[3.5]" />
                )}
              </div>
            </button>

            {/* Speed Run Mode */}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setGameMode('speed_run');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-3 group relative ${
                gameMode === 'speed_run'
                  ? 'bg-amber-100/90 dark:bg-amber-950/60 border-slate-900 dark:border-amber-400 shadow-[0_4px_0_0_#78350f] -translate-y-0.5'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-300 dark:bg-amber-900 text-slate-950 dark:text-amber-200 border border-slate-900">
                  ⚡ 10s Blitz
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-black text-slate-950 dark:text-white">Speed Run</div>
                {gameMode === 'speed_run' && (
                  <Check className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 stroke-[3.5]" />
                )}
              </div>
            </button>

            {/* Hard Mode */}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setGameMode('hard_mode');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-3 group relative ${
                gameMode === 'hard_mode'
                  ? 'bg-rose-100/90 dark:bg-rose-950/60 border-slate-900 dark:border-rose-400 shadow-[0_4px_0_0_#881337] -translate-y-0.5'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-rose-500 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-white stroke-none" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-200 border border-slate-900">
                  🔥 1.5x XP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-black text-slate-950 dark:text-white">Hard Mode</div>
                {gameMode === 'hard_mode' && (
                  <Check className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300 stroke-[3.5]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* 4. Question Pool & Count options */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>4. Question Pool &amp; Count</span>
          </label>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {countOptions.map((opt) => {
              const isSelected = countSelection === opt;
              return (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setCountSelection(opt as number | 'all');
                  }}
                  className={`min-h-[40px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-black border-[2.5px] transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-[0_3px_0_0_#78350f] -translate-y-0.5'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{opt === 'all' ? `All (${activeCardPool.length})` : `${opt} Qs`}</span>
                </button>
              );
            })}

            {dueCards.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setDueOnly(!dueOnly);
                }}
                className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs font-black border-[2.5px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  dueOnly
                    ? 'bg-rose-500 text-white border-slate-900 shadow-[0_3px_0_0_#881337] -translate-y-0.5'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current text-rose-500 dark:text-rose-400" />
                <span>Due Only ({dueCards.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* 5. Practice Sandbox Mode Toggle */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-[2px] border-slate-900 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Practice Sandbox Mode</span>
                {practiceMode && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-900 bg-amber-300 text-slate-950">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Casual study without altering card memory retention schedules.
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={practiceMode}
            aria-label="Toggle practice sandbox mode"
            onClick={() => {
              sounds.playTap();
              setPracticeMode(!practiceMode);
            }}
            className={`w-14 h-8 rounded-full border-[2.5px] border-slate-900 p-0.5 transition-colors cursor-pointer shrink-0 relative ${
              practiceMode ? 'bg-amber-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]' : 'bg-slate-300 dark:bg-slate-700 shadow-inner'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white border-[2px] border-slate-900 shadow-[0_1.5px_0_0_#09090b] transition-transform ${
                practiceMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* CTA Launch Button */}
        <div className="pt-2 pb-1">
          <button
            type="button"
            disabled={isGenerating || activeCardPool.length === 0}
            onClick={handleLaunch}
            className="tactile-btn-emerald w-full min-h-[52px] py-3.5 sm:py-4 text-base sm:text-lg font-black shadow-[0_5px_0_0_#064e3b] active:translate-y-1 active:shadow-none hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#064e3b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                <span>Preparing Arena...</span>
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 stroke-[2.5] -rotate-12" />
                <span>Enter Quiz Arena</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
