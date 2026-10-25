import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCw,
  Sparkles,
  Flame,
  Brain,
  Timer,
  Lightbulb,
  PenTool,
  Check,
  HelpCircle,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Deck, Card, QuizAnswer, QuizLauncherConfig, UserSettings } from '../types';
import { sounds } from '../lib/sound';
import { calculateNextReview } from '../lib/fsrs';
import { db } from '../lib/db';

interface StudyViewProps {
  deck: Deck;
  cards: Card[];
  launcherConfig?: QuizLauncherConfig;
  userSettings?: UserSettings;
  onExit: () => void;
  onFinish: (answers: QuizAnswer[]) => void;
}

const letterThemes = [
  {
    bg: 'bg-violet-100 dark:bg-violet-950/70 text-violet-950 dark:text-violet-300 border-violet-900 dark:border-violet-600 shadow-[0_1.5px_0_0_#2e1065]',
    badge: 'bg-violet-500 text-white',
  },
  {
    bg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-950 dark:text-sky-300 border-sky-900 dark:border-sky-600 shadow-[0_1.5px_0_0_#082f49]',
    badge: 'bg-sky-500 text-white',
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border-amber-900 dark:border-amber-600 shadow-[0_1.5px_0_0_#78350f]',
    badge: 'bg-amber-500 text-white',
  },
  {
    bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-950 dark:text-rose-300 border-rose-900 dark:border-rose-600 shadow-[0_1.5px_0_0_#881337]',
    badge: 'bg-rose-500 text-white',
  },
];

export const StudyView: React.FC<StudyViewProps> = ({
  deck,
  cards,
  launcherConfig,
  userSettings,
  onExit,
  onFinish,
}) => {
  const gameMode = launcherConfig?.gameMode || 'normal';
  const xpPerCorrect = gameMode === 'normal' ? 10 : 15;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedMultipleOptions, setSelectedMultipleOptions] = useState<string[]>([]);
  const [typedBlankAnswer, setTypedBlankAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [isCurrentTimedOut, setIsCurrentTimedOut] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const blankInputRef = useRef<HTMLInputElement>(null);

  // Speed Run Mode timer (10s countdown per question)
  const [speedRunTimeRemainingMs, setSpeedRunTimeRemainingMs] = useState(10000);
  const speedRunIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance state & timers
  const [autoAdvanceRemainingMs, setAutoAdvanceRemainingMs] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSpeedRunTimer = useCallback(() => {
    if (speedRunIntervalRef.current) {
      clearInterval(speedRunIntervalRef.current);
      speedRunIntervalRef.current = null;
    }
  }, []);

  const stopTimers = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }
  }, []);

  const clearAutoAdvance = useCallback(() => {
    stopTimers();
    setAutoAdvanceRemainingMs(null);
  }, [stopTimers]);

  useEffect(() => {
    return () => {
      stopTimers();
      stopSpeedRunTimer();
    };
  }, [stopTimers, stopSpeedRunTimer]);

  const triggerMiniConfetti = useCallback(() => {
    if (userSettings?.confettiEnabled === false) return;
    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#6366f1', '#fbbf24', '#f43f5e', '#a855f7'],
        disableForReducedMotion: true,
        zIndex: 100,
      });
    } catch {
      // Graceful fallback
    }
  }, [userSettings?.confettiEnabled]);

  const triggerFinishConfetti = useCallback(() => {
    if (userSettings?.confettiEnabled === false) return;
    try {
      confetti({
        particleCount: 60,
        spread: 90,
        origin: { y: 0.65 },
        colors: ['#10b981', '#6366f1', '#fbbf24', '#f43f5e', '#ec4899'],
        disableForReducedMotion: true,
        zIndex: 100,
      });
    } catch {
      // Graceful fallback
    }
  }, [userSettings?.confettiEnabled]);

  const isAutoAdvanceEnabled =
    userSettings?.autoAdvance === 'fast' || userSettings?.autoAdvance === 'normal';
  const autoAdvanceDelay =
    userSettings?.autoAdvance === 'fast' ? 1000 : userSettings?.autoAdvance === 'normal' ? 1800 : 0;


  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;
  const isLargeText = userSettings?.textSize === 'large';

  const isAutoAdvanceActive =
    isAnswerSubmitted &&
    isCurrentCorrect &&
    currentCard?.type !== 'flashcard' &&
    isAutoAdvanceEnabled;

  const displayRemainingMs = isAutoAdvanceActive ? (autoAdvanceRemainingMs ?? autoAdvanceDelay) : null;
  const autoAdvancePercent =
    displayRemainingMs !== null && autoAdvanceDelay > 0
      ? Math.max(0, Math.min(100, ((autoAdvanceDelay - displayRemainingMs) / autoAdvanceDelay) * 100))
      : 0;
  const autoAdvanceSeconds =
    displayRemainingMs !== null ? (displayRemainingMs / 1000).toFixed(1) : null;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  // Auto-focus blank input when question changes
  useEffect(() => {
    if (currentCard?.type === 'fill_blank' && !isAnswerSubmitted) {
      setTimeout(() => blankInputRef.current?.focus(), 100);
    }
  }, [currentIndex, currentCard?.type, isAnswerSubmitted]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Safe FSRS spaced repetition update (respects practiceMode)
  const updateCardFSRS = useCallback(
    async (isCorrect: boolean, grade?: 'again' | 'hard' | 'good' | 'easy') => {
      if (launcherConfig?.practiceMode) return; // Practice mode: skip FSRS writes
      const targetId = currentCard?.sourceCardId || currentCard?.id;
      if (!targetId) return;

      try {
        const originalCard = await db.cards.get(targetId);
        const cardForCalculation = originalCard || currentCard;
        const updatedFSRS = calculateNextReview(cardForCalculation, isCorrect, grade);
        await db.cards.update(targetId, updatedFSRS);
      } catch (e) {
        console.warn('FSRS update skipped for ephemeral card:', e);
      }
    },
    [currentCard, launcherConfig?.practiceMode]
  );

  // Speed Run Timeout: automatically marks as incorrect/timeout and reveals answer
  const handleSpeedRunTimeout = useCallback(async () => {
    if (isAnswerSubmitted || !currentCard) return;

    stopSpeedRunTimer();
    sounds.playWrong();
    setIsAnswerSubmitted(true);
    setIsCurrentCorrect(false);
    setIsCurrentTimedOut(true);
    setCurrentStreak(0);

    if (currentCard.type === 'flashcard') {
      setIsFlipped(true);
      await updateCardFSRS(false, 'again');
    } else {
      await updateCardFSRS(false);
    }

    setAnswers((prev) => [
      ...prev,
      {
        cardId: currentCard.id || 0,
        sourceCardId: currentCard.sourceCardId || currentCard.id || 0,
        userAnswer: 'Timed Out',
        isCorrect: false,
        questionType: currentCard.type,
        questionText: currentCard.question,
        correctAnswerText:
          currentCard.type === 'multiple_select'
            ? (currentCard.correctAnswers || [currentCard.answer]).join(', ')
            : currentCard.answer,
      },
    ]);
  }, [isAnswerSubmitted, currentCard, stopSpeedRunTimer, updateCardFSRS]);

  const handleSpeedRunTimeoutRef = useRef(handleSpeedRunTimeout);
  useEffect(() => {
    handleSpeedRunTimeoutRef.current = handleSpeedRunTimeout;
  });

  // Speed Run Countdown Timer effect (10-second per-question countdown)
  useEffect(() => {
    if (gameMode !== 'speed_run' || isAnswerSubmitted) {
      stopSpeedRunTimer();
      return;
    }

    const startTime = Date.now();
    const duration = 10000;

    speedRunIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setSpeedRunTimeRemainingMs(remaining);

      if (remaining <= 0) {
        stopSpeedRunTimer();
        handleSpeedRunTimeoutRef.current();
      }
    }, 50);

    return () => {
      stopSpeedRunTimer();
    };
  }, [currentIndex, isAnswerSubmitted, gameMode, stopSpeedRunTimer]);

  // Submit Single Choice or True/False
  const handleSubmitAnswer = useCallback(
    async (chosenAnswer: string) => {
      if (isAnswerSubmitted || !currentCard) return;

      stopSpeedRunTimer();
      setSelectedOption(chosenAnswer);
      setIsAnswerSubmitted(true);
      setIsCurrentTimedOut(false);

      const isCorrect = chosenAnswer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
      setIsCurrentCorrect(isCorrect);

      if (isCorrect) {
        sounds.playCorrect();
        setCurrentStreak((s) => s + 1);
        triggerMiniConfetti();
      } else {
        sounds.playWrong();
        setCurrentStreak(0);
      }

      await updateCardFSRS(isCorrect);

      setAnswers((prev) => [
        ...prev,
        {
          cardId: currentCard.id || 0,
          sourceCardId: currentCard.sourceCardId || currentCard.id || 0,
          userAnswer: chosenAnswer,
          isCorrect,
          questionType: currentCard.type,
          questionText: currentCard.question,
          correctAnswerText: currentCard.answer,
        },
      ]);
    },
    [isAnswerSubmitted, currentCard, updateCardFSRS, triggerMiniConfetti, stopSpeedRunTimer]
  );

  // Toggle option for Multiple Select
  const toggleMultipleOption = useCallback(
    (option: string) => {
      if (isAnswerSubmitted) return;
      sounds.playTap();
      setSelectedMultipleOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    },
    [isAnswerSubmitted]
  );

  // Submit Multiple Select (Checkboxes)
  const handleSubmitMultipleSelect = useCallback(async () => {
    if (isAnswerSubmitted || !currentCard || selectedMultipleOptions.length === 0) return;

    stopSpeedRunTimer();
    setIsAnswerSubmitted(true);
    setIsCurrentTimedOut(false);
    const targetAnswers = (currentCard.correctAnswers || [currentCard.answer]).map((a) =>
      a.trim().toLowerCase()
    );
    const userSelected = selectedMultipleOptions.map((a) => a.trim().toLowerCase());

    const isCorrect =
      targetAnswers.length === userSelected.length &&
      targetAnswers.every((t) => userSelected.includes(t));

    setIsCurrentCorrect(isCorrect);

    if (isCorrect) {
      sounds.playCorrect();
      setCurrentStreak((s) => s + 1);
      triggerMiniConfetti();
    } else {
      sounds.playWrong();
      setCurrentStreak(0);
    }

    await updateCardFSRS(isCorrect);

    setAnswers((prev) => [
      ...prev,
      {
        cardId: currentCard.id || 0,
        sourceCardId: currentCard.sourceCardId || currentCard.id || 0,
        userAnswer: selectedMultipleOptions.join(', '),
        isCorrect,
        questionType: currentCard.type,
        questionText: currentCard.question,
        correctAnswerText: (currentCard.correctAnswers || [currentCard.answer]).join(', '),
      },
    ]);
  }, [isAnswerSubmitted, currentCard, selectedMultipleOptions, updateCardFSRS, triggerMiniConfetti, stopSpeedRunTimer]);

  // Submit Fill in the Blank
  const handleSubmitBlank = useCallback(async () => {
    if (isAnswerSubmitted || !currentCard || !typedBlankAnswer.trim()) return;

    stopSpeedRunTimer();
    setIsAnswerSubmitted(true);
    setIsCurrentTimedOut(false);
    const cleanTyped = typedBlankAnswer.trim().toLowerCase();
    const cleanTarget = currentCard.answer.trim().toLowerCase();
    const isCorrect = cleanTyped === cleanTarget;
    setIsCurrentCorrect(isCorrect);

    if (isCorrect) {
      sounds.playCorrect();
      setCurrentStreak((s) => s + 1);
      triggerMiniConfetti();
    } else {
      sounds.playWrong();
      setCurrentStreak(0);
    }

    await updateCardFSRS(isCorrect);

    setAnswers((prev) => [
      ...prev,
      {
        cardId: currentCard.id || 0,
        sourceCardId: currentCard.sourceCardId || currentCard.id || 0,
        userAnswer: typedBlankAnswer,
        isCorrect,
        questionType: currentCard.type,
        questionText: currentCard.question,
        correctAnswerText: currentCard.answer,
      },
    ]);
  }, [isAnswerSubmitted, currentCard, typedBlankAnswer, updateCardFSRS, triggerMiniConfetti, stopSpeedRunTimer]);

  // Override correct for close typo in fill_blank (disabled in Hard Mode)
  const handleOverrideCorrect = async () => {
    if (!currentCard || gameMode === 'hard_mode') return;
    sounds.playCorrect();
    setIsCurrentCorrect(true);
    setCurrentStreak((s) => s + 1);
    triggerMiniConfetti();

    if (!launcherConfig?.practiceMode) {
      const targetId = currentCard.sourceCardId || currentCard.id;
      if (targetId) {
        try {
          const originalCard = await db.cards.get(targetId);
          const cardForCalculation = originalCard || currentCard;
          const updatedFSRS = calculateNextReview(cardForCalculation, true);
          await db.cards.update(targetId, updatedFSRS);
        } catch {}
      }
    }

    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, isCorrect: true } : a))
    );
  };

  const handleNextQuestion = useCallback(() => {
    clearAutoAdvance();
    stopSpeedRunTimer();
    sounds.playCardFlip();
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSelectedMultipleOptions([]);
      setTypedBlankAnswer('');
      setIsAnswerSubmitted(false);
      setIsCurrentCorrect(false);
      setIsCurrentTimedOut(false);
      setShowHint(false);
      setIsFlipped(false);
      setSpeedRunTimeRemainingMs(10000);
    } else {
      triggerFinishConfetti();
      onFinish(answers);
    }
  }, [currentIndex, cards.length, answers, onFinish, clearAutoAdvance, stopSpeedRunTimer, triggerFinishConfetti]);

  const handleFlashcardGrade = useCallback(
    async (grade: 'again' | 'hard' | 'good' | 'easy') => {
      clearAutoAdvance();
      stopSpeedRunTimer();
      if (!currentCard) return;
      const isCorrect = grade !== 'again';
      if (isCorrect) {
        sounds.playCorrect();
        setCurrentStreak((s) => s + 1);
        if (grade === 'easy' || currentStreak + 1 >= 3) {
          triggerMiniConfetti();
        }
      } else {
        sounds.playWrong();
        setCurrentStreak(0);
      }

      await updateCardFSRS(isCorrect, grade);

      const updatedAnswers = [
        ...answers,
        {
          cardId: currentCard.id || 0,
          sourceCardId: currentCard.sourceCardId || currentCard.id || 0,
          userAnswer: grade,
          isCorrect,
          questionType: 'flashcard' as const,
          questionText: currentCard.question,
          correctAnswerText: currentCard.answer,
        },
      ];
      setAnswers(updatedAnswers);

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setSelectedMultipleOptions([]);
        setTypedBlankAnswer('');
        setIsAnswerSubmitted(false);
        setIsCurrentCorrect(false);
        setIsCurrentTimedOut(false);
        setShowHint(false);
        setIsFlipped(false);
        setSpeedRunTimeRemainingMs(10000);
      } else {
        triggerFinishConfetti();
        onFinish(updatedAnswers);
      }
    },
    [
      currentCard,
      currentIndex,
      cards.length,
      answers,
      onFinish,
      updateCardFSRS,
      clearAutoAdvance,
      stopSpeedRunTimer,
      currentStreak,
      triggerMiniConfetti,
      triggerFinishConfetti,
    ]
  );

  const handleNextQuestionRef = useRef(handleNextQuestion);
  useEffect(() => {
    handleNextQuestionRef.current = handleNextQuestion;
  });

  // Auto-advance timer management
  useEffect(() => {
    if (!isAutoAdvanceActive) {
      stopTimers();
      return;
    }

    const duration = autoAdvanceDelay;
    const endTime = Date.now() + duration;

    autoAdvanceIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setAutoAdvanceRemainingMs(remaining);
      if (remaining <= 0 && autoAdvanceIntervalRef.current) {
        clearInterval(autoAdvanceIntervalRef.current);
        autoAdvanceIntervalRef.current = null;
      }
    }, 50);

    autoAdvanceTimerRef.current = setTimeout(() => {
      clearAutoAdvance();
      handleNextQuestionRef.current();
    }, duration);

    return () => {
      stopTimers();
    };
  }, [
    isAutoAdvanceActive,
    autoAdvanceDelay,
    currentIndex,
    stopTimers,
    clearAutoAdvance,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // When typing in input field, allow Enter to submit blank
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter' && !isAnswerSubmitted && currentCard?.type === 'fill_blank' && typedBlankAnswer.trim()) {
          e.preventDefault();
          handleSubmitBlank();
        }
        return;
      }

      if (currentCard?.type === 'flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          sounds.playCardFlip();
          setIsFlipped((prev) => !prev);
        } else if (isFlipped) {
          if (e.key === '1') handleFlashcardGrade('again');
          else if (e.key === '2') handleFlashcardGrade('hard');
          else if (e.key === '3') handleFlashcardGrade('good');
          else if (e.key === '4') handleFlashcardGrade('easy');
        }
      } else if (isAnswerSubmitted) {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          clearAutoAdvance();
          handleNextQuestion();
        }
      } else if (currentCard?.type === 'multiple_choice' && currentCard.options) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentCard.options.length) {
          e.preventDefault();
          handleSubmitAnswer(currentCard.options[num - 1]);
        }
      } else if (currentCard?.type === 'true_false') {
        if (e.key === '1' || e.key.toLowerCase() === 't') {
          e.preventDefault();
          handleSubmitAnswer('True');
        } else if (e.key === '2' || e.key.toLowerCase() === 'f') {
          e.preventDefault();
          handleSubmitAnswer('False');
        }
      } else if (currentCard?.type === 'multiple_select' && currentCard.options) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentCard.options.length) {
          e.preventDefault();
          toggleMultipleOption(currentCard.options[num - 1]);
        } else if (e.key === 'Enter' && selectedMultipleOptions.length > 0) {
          e.preventDefault();
          handleSubmitMultipleSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentCard,
    isFlipped,
    isAnswerSubmitted,
    selectedMultipleOptions,
    typedBlankAnswer,
    handleSubmitAnswer,
    handleSubmitMultipleSelect,
    handleSubmitBlank,
    handleFlashcardGrade,
    toggleMultipleOption,
    handleNextQuestion,
    clearAutoAdvance,
  ]);

  if (!currentCard) return null;

  // Helper to render Cloze deletion prompt
  const renderClozeQuestion = (text: string) => {
    const parts = text.split(/(\[______\]|\[blank\]|\[___+\])/gi);
    return parts.map((part, i) => {
      if (/^\[(_+|blank)\]$/i.test(part)) {
        return (
          <span
            key={i}
            className="inline-block px-3.5 py-1 mx-1.5 rounded-2xl bg-amber-200 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-[2.5px] border-amber-600 dark:border-amber-500 font-mono tracking-widest text-lg font-black shadow-[0_2px_0_0_#78350f]"
          >
            [ ? ]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col justify-between pb-44 sm:pb-36 transition-colors">
      {/* Top Header & Glowing Segmented Progress Bar */}
      <div className="sticky top-0 z-20 bg-[#fbfaf8]/95 dark:bg-slate-900/95 backdrop-blur-md border-b-[2.5px] border-slate-900 dark:border-slate-800 px-3 py-2.5 sm:px-6 sm:py-3 transition-colors shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={() => {
              clearAutoAdvance();
              sounds.playTap();
              if (confirm('Exit study session? Answered cards are saved to your schedule.')) {
                onExit();
              }
            }}
            aria-label="Exit session"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border-[2.5px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 shadow-[0_2.5px_0_0_#09090b] sm:shadow-[0_3px_0_0_#09090b] active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Thick Segmented Progress Bar with Glowing Tip */}
          <div className="flex-1 min-w-[60px]">
            <div className="h-3.5 sm:h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full border-[2px] sm:border-[2.5px] border-slate-900 dark:border-slate-700 overflow-hidden relative shadow-inner p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(16,185,129,0.7)] relative"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/80 rounded-full shadow-[0_0_6px_#ffffff]" />
              </div>
            </div>
          </div>

          {/* Game Mode Badge & Engine Indicator */}
          {gameMode === 'speed_run' ? (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-amber-300 dark:bg-amber-400 text-slate-950 border-[2px] border-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 shadow-[0_2px_0_0_#78350f] animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
              <span>SPEED RUN</span>
            </span>
          ) : gameMode === 'hard_mode' ? (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-rose-500 text-white border-[2px] border-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 shadow-[0_2px_0_0_#881337]">
              <Flame className="w-3.5 h-3.5 fill-amber-300 stroke-none" />
              <span>HARD MODE (1.5x XP)</span>
            </span>
          ) : launcherConfig?.practiceMode ? (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-200 dark:bg-amber-950 text-slate-950 dark:text-amber-300 border-[2px] border-slate-900 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-[0_2px_0_0_#09090b]">
              Practice Sandbox
            </span>
          ) : launcherConfig?.engine === 'offline' ? (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border-[2px] border-slate-900 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-[0_2px_0_0_#09090b]">
              <Zap className="w-3 h-3 fill-current" />
              Offline Quiz
            </span>
          ) : launcherConfig?.engine === 'ai' ? (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-950 dark:text-indigo-300 border-[2px] border-slate-900 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-[0_2px_0_0_#09090b]">
              <Brain className="w-3 h-3" />
              AI Arena
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[2px] border-slate-900 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-[0_2px_0_0_#09090b]">
              Normal Mode
            </span>
          )}

          {/* Stopwatch Timer - hidden on small mobile to guarantee no-clip fit */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 shadow-[0_2px_0_0_#09090b] shrink-0">
            <Timer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 stroke-[2.5]" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>

          {/* Combo / Streak Counter */}
          {currentStreak > 1 && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 border-[2px] sm:border-[2.5px] border-slate-900 px-2 py-0.5 sm:px-3 sm:py-1 rounded-xl text-xs font-black shadow-[0_2px_0_0_#78350f] sm:shadow-[0_2.5px_0_0_#78350f] animate-bounce shrink-0 whitespace-nowrap">
              <span className="inline sm:hidden">🔥 {currentStreak}</span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-orange-600 stroke-orange-700 animate-pulse" />
                <span>🔥 {currentStreak} Combo!</span>
              </span>
            </div>
          )}

          {/* Step Counter Badge */}
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2px_0_0_#09090b] tracking-tight shrink-0 whitespace-nowrap">
            <span>{currentIndex + 1}</span>
            <span className="text-slate-400 dark:text-slate-500"> / {cards.length}</span>
          </div>
        </div>
      </div>

      {/* Speed Run Mode Active Countdown Bar */}
      {gameMode === 'speed_run' && !isAnswerSubmitted && (
        <div className="sticky top-[53px] sm:top-[57px] z-10 w-full bg-amber-400/20 dark:bg-amber-950/70 backdrop-blur-md border-b-[2.5px] border-slate-900 px-3 sm:px-6 py-2 transition-colors">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 text-xs font-black">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Zap
                className={`w-4 h-4 ${
                  speedRunTimeRemainingMs <= 3000
                    ? 'text-rose-500 fill-rose-500 animate-bounce'
                    : 'text-amber-500 fill-amber-500'
                }`}
              />
              <span className="uppercase tracking-wider">Speed Run 10s Blitz</span>
            </div>
            <span
              className={`font-mono text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] transition-all ${
                speedRunTimeRemainingMs <= 3000
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-300 text-slate-950'
              }`}
            >
              {(speedRunTimeRemainingMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="max-w-2xl mx-auto mt-1.5 h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full border-[2px] border-slate-900 overflow-hidden relative p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-75 ease-linear ${
                speedRunTimeRemainingMs <= 3000
                  ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (speedRunTimeRemainingMs / 10000) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Main Arena */}
      <main className="max-w-2xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8 flex-1 flex flex-col justify-center">
        {/* FLASHCARD MODE */}
        {currentCard.type === 'flashcard' && (
          <div className="flex flex-col items-center w-full">
            <div
              className="perspective-1000 w-full min-h-[260px] sm:min-h-[320px] cursor-pointer select-none"
              onClick={() => {
                sounds.playCardFlip();
                setIsFlipped(!isFlipped);
              }}
            >
              <div
                className={`relative w-full min-h-[260px] sm:min-h-[320px] transform-style-preserve-3d transition-transform duration-300 ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Face: Question */}
                <div className="absolute inset-0 backface-hidden tactile-card p-4 sm:p-8 flex flex-col justify-between bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] sm:shadow-[0_8px_0_0_#09090b] dark:shadow-[0_6px_0_0_#020617] sm:dark:shadow-[0_8px_0_0_#020617]">
                  <div className="flex items-center justify-between text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300 border-[2px] border-slate-900 dark:border-indigo-700 shadow-[0_2px_0_0_#09090b]">
                      <Brain className="w-3.5 h-3.5" />
                      Question
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                      <RotateCw className="w-3.5 h-3.5" /> Tap card to flip
                    </span>
                  </div>

                  <div className="my-auto text-center py-4 sm:py-6">
                    <p className={`${isLargeText ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black text-slate-950 dark:text-white leading-snug`}>
                      {currentCard.question}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="px-3 sm:px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider shadow-sm">
                      Tap card or press Space
                    </span>
                  </div>
                </div>

                {/* Back Face: Answer */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 tactile-card p-4 sm:p-8 flex flex-col justify-between bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] sm:shadow-[0_8px_0_0_#09090b] dark:shadow-[0_6px_0_0_#020617] sm:dark:shadow-[0_8px_0_0_#020617]">
                  <div className="flex items-center justify-between text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-[2px] border-slate-900 dark:border-emerald-700 shadow-[0_2px_0_0_#09090b]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Target Answer
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                      <RotateCw className="w-3.5 h-3.5" /> Tap to flip back
                    </span>
                  </div>

                  <div className="my-auto text-center py-3 sm:py-4">
                    <p className={`${isLargeText ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black text-emerald-600 dark:text-emerald-400 leading-snug`}>
                      {currentCard.answer}
                    </p>
                    {currentCard.explanation && gameMode !== 'hard_mode' && (
                      <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-950/50 border-[2px] border-slate-900 dark:border-amber-700/60 rounded-2xl p-3 sm:p-4 text-left shadow-[0_3px_0_0_#09090b] flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{currentCard.explanation}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rate recall below to schedule with FSRS
                  </div>
                </div>
              </div>
            </div>

            {/* FSRS Rating Buttons (4 tactile options: Again, Hard, Good, Easy) */}
            {isFlipped && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full mt-4 sm:mt-6 pb-2 py-1">
                <button
                  type="button"
                  onClick={() => handleFlashcardGrade('again')}
                  className="tactile-btn-rose min-h-[52px] py-3 sm:py-3.5 text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_0_0_#881337] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#881337] active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-rose-400"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Again</span>
                    <kbd className="text-[9px] font-mono font-bold bg-white/20 rounded px-1">[1]</kbd>
                  </div>
                  <span className="text-[10px] font-bold opacity-90">&lt;10m</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFlashcardGrade('hard')}
                  className="tactile-btn-amber min-h-[52px] py-3 sm:py-3.5 text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_0_0_#78350f] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#78350f] active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-amber-400"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hard</span>
                    <kbd className="text-[9px] font-mono font-bold bg-black/15 rounded px-1">[2]</kbd>
                  </div>
                  <span className="text-[10px] font-bold opacity-90">1 day</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFlashcardGrade('good')}
                  className="tactile-btn-emerald min-h-[52px] py-3 sm:py-3.5 text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_0_0_#064e3b] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#064e3b] active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-emerald-400"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Good</span>
                    <kbd className="text-[9px] font-mono font-bold bg-white/20 rounded px-1">[3]</kbd>
                  </div>
                  <span className="text-[10px] font-bold opacity-90">3 days</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFlashcardGrade('easy')}
                  className="tactile-btn bg-gradient-to-b from-sky-400 to-sky-600 text-white border-[2.5px] border-slate-900 min-h-[52px] py-3 sm:py-3.5 text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_0_0_#0369a1] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#0369a1] active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-sky-400"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Easy</span>
                    <kbd className="text-[9px] font-mono font-bold bg-white/20 rounded px-1">[4]</kbd>
                  </div>
                  <span className="text-[10px] font-bold opacity-90">5 days</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* MULTIPLE CHOICE MODE */}
        {currentCard.type === 'multiple_choice' && (
          <div>
            <div className="tactile-card p-4 sm:p-8 mb-4 sm:mb-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#020617] relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-300 border-[2px] border-slate-900 dark:border-indigo-700 shadow-[0_2px_0_0_#09090b] transform -rotate-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                  <span>{deck.category}</span>
                </span>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                  Concept #{currentIndex + 1}
                </span>
              </div>

              <h2 className={`${isLargeText ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black text-slate-950 dark:text-white leading-tight`}>
                {currentCard.question}
              </h2>

              {/* Dynamic Hint Toggle (Disabled in Hard Mode) */}
              {currentCard.hint && gameMode !== 'hard_mode' && (
                <div className="mt-3">
                  {showHint ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Hint: {currentCard.hint}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Need a hint?</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pb-4 py-1">
              {currentCard.options?.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const theme = letterThemes[idx % letterThemes.length];
                const isSelected = selectedOption === option;
                const isThisAnswer = option.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();

                let buttonClasses =
                  'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_4px_0_0_#09090b] dark:shadow-[0_4px_0_0_#020617] hover:bg-slate-50 dark:hover:bg-slate-750 hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#09090b] active:translate-y-0.5 active:shadow-none';

                if (isAnswerSubmitted) {
                  if (isThisAnswer) {
                    buttonClasses =
                      'bg-emerald-500 dark:bg-emerald-600 text-white border-[2.5px] border-slate-900 dark:border-emerald-700 shadow-[0_4px_0_0_#064e3b] scale-[1.01] animate-pop';
                  } else if (isSelected && !isThisAnswer) {
                    buttonClasses =
                      'bg-rose-500 dark:bg-rose-600 text-white border-[2.5px] border-slate-900 dark:border-rose-700 shadow-[0_4px_0_0_#881337] animate-shake';
                  } else {
                    buttonClasses =
                      'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-[2px] border-slate-200 dark:border-slate-800 opacity-40 shadow-none';
                  }
                } else if (isSelected) {
                  buttonClasses =
                    'bg-indigo-100 dark:bg-indigo-950 border-[2.5px] border-indigo-900 dark:border-indigo-600 text-indigo-950 dark:text-white shadow-[0_4px_0_0_#1e1b4b]';
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSubmitAnswer(option)}
                    className={`tactile-btn min-h-[52px] p-3.5 sm:p-4 text-left justify-start gap-3 sm:gap-4 rounded-2xl w-full text-sm sm:text-base font-black transition-all cursor-pointer ${buttonClasses}`}
                  >
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-[2px] flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-[0_1.5px_0_0_#09090b] ${
                        isAnswerSubmitted && isThisAnswer
                          ? 'bg-white text-emerald-700 border-emerald-950'
                          : isAnswerSubmitted && isSelected
                          ? 'bg-white text-rose-700 border-rose-950'
                          : theme.bg
                      }`}
                    >
                      {letter}
                    </span>

                    <span className="leading-snug flex-1 font-bold text-sm sm:text-base">{option}</span>

                    <kbd className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 opacity-70 bg-slate-100 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 hidden sm:inline-block">
                      [{idx + 1}]
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MULTIPLE SELECT (CHECKBOXES) MODE */}
        {currentCard.type === 'multiple_select' && (
          <div>
            <div className="tactile-card p-4 sm:p-8 mb-4 sm:mb-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#020617] relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950/70 text-violet-950 dark:text-violet-300 border-[2px] border-slate-900 dark:border-violet-700 shadow-[0_2px_0_0_#09090b]">
                  <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span>Select all correct answers</span>
                </span>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                  Concept #{currentIndex + 1}
                </span>
              </div>

              <h2 className={`${isLargeText ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black text-slate-950 dark:text-white leading-tight`}>
                {currentCard.question}
              </h2>

              {/* Dynamic Hint Toggle (Disabled in Hard Mode) */}
              {currentCard.hint && gameMode !== 'hard_mode' && (
                <div className="mt-3">
                  {showHint ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Hint: {currentCard.hint}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Need a hint?</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pb-4 py-1">
              {currentCard.options?.map((option, idx) => {
                const isSelected = selectedMultipleOptions.includes(option);
                const targetAnswers = (currentCard.correctAnswers || [currentCard.answer]).map((a) =>
                  a.trim().toLowerCase()
                );
                const isTarget = targetAnswers.includes(option.trim().toLowerCase());

                let buttonClasses =
                  'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_4px_0_0_#09090b] dark:shadow-[0_4px_0_0_#020617] hover:bg-slate-50 dark:hover:bg-slate-750 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none';

                if (isAnswerSubmitted) {
                  if (isTarget && isSelected) {
                    buttonClasses =
                      'bg-emerald-500 text-white border-[2.5px] border-slate-900 shadow-[0_4px_0_0_#064e3b] scale-[1.01] animate-pop';
                  } else if (!isTarget && isSelected) {
                    buttonClasses =
                      'bg-rose-500 text-white border-[2.5px] border-slate-900 shadow-[0_4px_0_0_#881337] animate-shake';
                  } else if (isTarget && !isSelected) {
                    buttonClasses =
                      'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-[2.5px] border-dashed border-amber-600 shadow-none';
                  } else {
                    buttonClasses =
                      'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-[2px] border-slate-200 dark:border-slate-800 opacity-40 shadow-none';
                  }
                } else if (isSelected) {
                  buttonClasses =
                    'bg-indigo-50 dark:bg-indigo-950/60 border-[2.5px] border-indigo-900 dark:border-indigo-500 text-indigo-950 dark:text-white shadow-[0_4px_0_0_#1e1b4b] -translate-y-0.5';
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => toggleMultipleOption(option)}
                    className={`tactile-btn min-h-[52px] p-3.5 sm:p-4 text-left justify-start gap-3 sm:gap-4 rounded-2xl w-full text-sm sm:text-base font-black transition-all cursor-pointer ${buttonClasses}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl border-[2px] border-slate-900 flex items-center justify-center shrink-0 transition-transform ${
                        isSelected
                          ? 'bg-emerald-500 text-white scale-110 shadow-[0_1.5px_0_0_#064e3b]'
                          : 'bg-slate-100 dark:bg-slate-700 text-transparent'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3.5]" /> : null}
                    </span>

                    <span className="leading-snug flex-1 font-bold">{option}</span>

                    <kbd className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 opacity-70 bg-slate-100 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 hidden sm:inline-block">
                      [{idx + 1}]
                    </kbd>
                  </button>
                );
              })}
            </div>

            {!isAnswerSubmitted && (
              <div className="flex sm:justify-end pt-2">
                <button
                  type="button"
                  disabled={selectedMultipleOptions.length === 0}
                  onClick={handleSubmitMultipleSelect}
                  className="tactile-btn-primary w-full sm:w-auto min-h-[52px] justify-center px-6 sm:px-8 py-3.5 text-base font-black shadow-[0_4px_0_0_#1e1b4b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#1e1b4b] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                >
                  <span>Submit Answer ({selectedMultipleOptions.length} selected)</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* FILL IN THE BLANK (CLOZE) MODE */}
        {currentCard.type === 'fill_blank' && (
          <div>
            <div className="tactile-card p-4 sm:p-8 mb-4 sm:mb-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#020617] relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border-[2px] border-slate-900 dark:border-amber-700 shadow-[0_2px_0_0_#09090b]">
                  <PenTool className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Fill in the blank</span>
                </span>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                  Concept #{currentIndex + 1}
                </span>
              </div>

              <h2 className={`${isLargeText ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black text-slate-950 dark:text-white leading-relaxed`}>
                {renderClozeQuestion(currentCard.question)}
              </h2>
            </div>

            {/* Input Box for typing missing answer */}
            <div className="space-y-4">
              <div className="relative">
                <PenTool className="w-5 h-5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={blankInputRef}
                  type="text"
                  disabled={isAnswerSubmitted}
                  placeholder="Type the missing word or answer..."
                  value={typedBlankAnswer}
                  onChange={(e) => setTypedBlankAnswer(e.target.value)}
                  className={`w-full pl-11 sm:pl-12 pr-20 sm:pr-24 py-3.5 sm:py-4 rounded-2xl border-[2.5px] text-base sm:text-lg font-black shadow-inner focus:outline-none transition-all ${
                    isAnswerSubmitted
                      ? isCurrentCorrect
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                        : 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100'
                      : 'border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-white focus:ring-4 focus:ring-amber-400/50 focus:border-amber-500'
                  }`}
                />
                {!isAnswerSubmitted && typedBlankAnswer.trim() && (
                  <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-black px-2 py-1 rounded-lg bg-amber-300 text-slate-950 border border-slate-900 shadow-[0_1.5px_0_0_#09090b] animate-in fade-in">
                    Enter ↵
                  </kbd>
                )}
              </div>

              {!isAnswerSubmitted && (
                <div className="flex sm:justify-end pt-1">
                  <button
                    type="button"
                    disabled={!typedBlankAnswer.trim()}
                    onClick={handleSubmitBlank}
                    className="tactile-btn-amber w-full sm:w-auto min-h-[52px] justify-center px-6 sm:px-8 py-3.5 text-base font-black shadow-[0_4px_0_0_#78350f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#78350f] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    <span>Submit Answer</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRUE OR FALSE MODE */}
        {currentCard.type === 'true_false' && (
          <div>
            <div className="tactile-card p-4 sm:p-8 mb-4 sm:mb-6 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] dark:shadow-[0_6px_0_0_#020617] relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/70 text-sky-950 dark:text-sky-300 border-[2px] border-slate-900 dark:border-sky-700 shadow-[0_2px_0_0_#09090b]">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>True or False</span>
                </span>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                  Concept #{currentIndex + 1}
                </span>
              </div>

              <h2 className={`${isLargeText ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black text-slate-950 dark:text-white leading-tight`}>
                {currentCard.question}
              </h2>

              {/* Dynamic Hint Toggle (Disabled in Hard Mode) */}
              {currentCard.hint && gameMode !== 'hard_mode' && (
                <div className="mt-3">
                  {showHint ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Hint: {currentCard.hint}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Need a hint?</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-4 py-1">
              {['True', 'False'].map((val) => {
                const isSelected = selectedOption === val;
                const isThisAnswer = val.toLowerCase() === currentCard.answer.trim().toLowerCase();

                let buttonClasses =
                  val === 'True'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 border-[2.5px] border-slate-900 dark:border-emerald-700 shadow-[0_5px_0_0_#064e3b] hover:-translate-y-1 hover:shadow-[0_7px_0_0_#064e3b]'
                    : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-950 dark:text-rose-200 border-[2.5px] border-slate-900 dark:border-rose-700 shadow-[0_5px_0_0_#881337] hover:-translate-y-1 hover:shadow-[0_7px_0_0_#881337]';

                if (isAnswerSubmitted) {
                  if (isThisAnswer) {
                    buttonClasses =
                      'bg-emerald-500 text-white border-[2.5px] border-slate-900 shadow-[0_5px_0_0_#064e3b] scale-[1.02] animate-pop';
                  } else if (isSelected && !isThisAnswer) {
                    buttonClasses =
                      'bg-rose-500 text-white border-[2.5px] border-slate-900 shadow-[0_5px_0_0_#881337] animate-shake';
                  } else {
                    buttonClasses = 'opacity-30 border-[2px] border-slate-300 dark:border-slate-700 shadow-none';
                  }
                }

                return (
                  <button
                    key={val}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSubmitAnswer(val)}
                    className={`tactile-btn min-h-[54px] sm:min-h-[140px] py-4 sm:py-8 rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 text-lg sm:text-2xl font-black transition-all cursor-pointer active:translate-y-1 active:shadow-none ${buttonClasses}`}
                  >
                    {val === 'True' ? (
                      <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.5]" />
                    ) : (
                      <XCircle className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.5]" />
                    )}
                    <span>{val}</span>
                    <kbd className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 border border-current/20">
                      [{val === 'True' ? '1 or T' : '2 or F'}]
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Signature High-Energy Bottom Drawer for Interactive Modes */}
      {isAnswerSubmitted && (currentCard.type !== 'flashcard' || isCurrentTimedOut) && (
        <div
          className={`fixed bottom-0 inset-x-0 z-30 p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t-[3.5px] border-slate-900 dark:border-slate-800 transition-all duration-200 animate-in slide-in-from-bottom shadow-2xl ${
            isCurrentCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 shadow-[0_-8px_30px_rgba(16,185,129,0.25)]'
              : 'bg-rose-50 dark:bg-rose-950 text-rose-950 dark:text-rose-100 shadow-[0_-8px_30px_rgba(244,63,94,0.25)]'
          }`}
        >
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {isCurrentCorrect ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#064e3b] transform -rotate-3">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                </div>
              ) : isCurrentTimedOut ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#881337] transform rotate-3">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-white stroke-none animate-pulse" />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#881337] transform rotate-3">
                  <XCircle className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-lg sm:text-xl leading-tight text-slate-950 dark:text-white flex items-center gap-1.5">
                    {isCurrentCorrect ? (
                      <>
                        <span>Boom! Spot on!</span>
                        <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400 stroke-[2.5]" aria-hidden="true" />
                      </>
                    ) : isCurrentTimedOut ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-black">
                        <Zap className="w-5 h-5 fill-current" />
                        <span>Time's Up! (10s Speed Run Limit)</span>
                      </span>
                    ) : (
                      <span>
                        Correct:{' '}
                        <span className="underline decoration-2">
                          {currentCard.type === 'multiple_select'
                            ? (currentCard.correctAnswers || [currentCard.answer]).join(', ')
                            : currentCard.answer}
                        </span>
                      </span>
                    )}
                  </h4>
                  {isCurrentCorrect && (
                    <span className="bg-amber-300 text-slate-950 border border-slate-900 text-xs font-black px-2.5 py-0.5 rounded-full shadow-[0_1px_0_0_#09090b] flex items-center gap-1">
                      {gameMode === 'speed_run' && <Zap className="w-3 h-3 fill-slate-950 stroke-none" />}
                      {gameMode === 'hard_mode' && <Flame className="w-3 h-3 fill-rose-600 stroke-none" />}
                      <span>+{xpPerCorrect} XP</span>
                      {gameMode === 'speed_run' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">(Speed Bonus)</span>
                      )}
                      {gameMode === 'hard_mode' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">(1.5x Boost)</span>
                      )}
                    </span>
                  )}
                </div>

                {isCurrentTimedOut && (
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                    Correct answer:{' '}
                    <span className="underline decoration-2 text-slate-950 dark:text-white font-black">
                      {currentCard.type === 'multiple_select'
                        ? (currentCard.correctAnswers || [currentCard.answer]).join(', ')
                        : currentCard.answer}
                    </span>
                  </p>
                )}

                {/* Fill in the blank: "I was right (typo)" override button (disabled in Hard Mode) */}
                {!isCurrentCorrect && !isCurrentTimedOut && currentCard.type === 'fill_blank' && gameMode !== 'hard_mode' && (
                  <button
                    type="button"
                    onClick={handleOverrideCorrect}
                    className="tactile-btn-secondary px-3.5 py-1.5 text-xs font-black shadow-[0_2.5px_0_0_#09090b] mt-2 inline-flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>I was right (typo / close enough)</span>
                  </button>
                )}

                {/* Explanation (hidden in Hard Mode to strictly maintain zero hints) */}
                {currentCard.explanation && gameMode !== 'hard_mode' && (
                  <p className="text-xs sm:text-sm font-semibold opacity-95 mt-1.5 max-w-lg leading-relaxed text-slate-800 dark:text-slate-200">
                    {currentCard.explanation}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                clearAutoAdvance();
                handleNextQuestion();
              }}
              className={`w-full sm:w-auto min-h-[50px] px-6 sm:px-8 py-3.5 text-base sm:text-lg shrink-0 font-black gap-2.5 cursor-pointer transition-all active:translate-y-1 active:shadow-none flex items-center justify-center rounded-2xl relative overflow-hidden select-none ${
                isCurrentCorrect
                  ? 'tactile-btn-emerald shadow-[0_4px_0_0_#064e3b]'
                  : 'tactile-btn-rose shadow-[0_4px_0_0_#881337]'
              }`}
            >
              {/* Auto-Advance animated progress bar */}
              {isAutoAdvanceActive && (
                <div
                  className="absolute bottom-0 inset-x-0 h-1.5 bg-black/25 dark:bg-black/40 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear shadow-[0_0_8px_#ffffff]"
                    style={{ width: `${autoAdvancePercent}%` }}
                  />
                </div>
              )}

              <span>Continue</span>

              {isAutoAdvanceActive && autoAdvanceSeconds !== null ? (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-emerald-800/80 text-emerald-100 border border-emerald-400/40 shadow-inner">
                  <Zap className="w-3 h-3 fill-current text-amber-300 animate-pulse" />
                  <span>{autoAdvanceSeconds}s</span>
                </span>
              ) : (
                <kbd className="text-xs font-mono font-bold bg-white/20 rounded px-1.5 py-0.5">
                  Enter ↵
                </kbd>
              )}

              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
