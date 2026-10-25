import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Check,
  Search,
  Tag,
  FolderTree,
  Folder,
  Layers,
  X,
  Lightbulb,
  Highlighter,
  CheckSquare,
  CheckCircle2,
  Flame,
  Eye,
  EyeOff,
  HelpCircle,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import type { Deck, Card, QuestionType } from '../types';
import { db } from '../lib/db';
import { sounds } from '../lib/sound';
import { initializeFSRSCard } from '../lib/fsrs';
import { getCategoryIcon } from '../lib/categoryIcons';

interface DeckViewPageProps {
  deck: Deck;
  cards: Card[];
  subDecks?: Deck[];
  parentDeck?: Deck | null;
  onBack: () => void;
  onStartStudy: (deck: Deck) => void;
  onSelectSubDeck: (deck: Deck) => void;
  onCreateSubDeck: (parentId: number) => void;
  onDeleteDeck: (deckId: number) => void;
  onRefreshCards: () => void;
}

const deckColorThemes: Record<
  'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet',
  {
    gradient: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    bannerBg: string;
    accentHex: string;
  }
> = {
  indigo: {
    gradient: 'from-indigo-600 via-indigo-700 to-indigo-900',
    border: 'border-indigo-600 dark:border-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-950 dark:text-indigo-200',
    bannerBg: 'bg-gradient-to-r from-indigo-500 to-indigo-700',
    accentHex: '#4f46e5',
  },
  emerald: {
    gradient: 'from-emerald-500 via-teal-600 to-emerald-800',
    border: 'border-emerald-600 dark:border-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-950 dark:text-emerald-200',
    bannerBg: 'bg-gradient-to-r from-emerald-500 to-teal-700',
    accentHex: '#059669',
  },
  amber: {
    gradient: 'from-amber-400 via-amber-500 to-orange-600',
    border: 'border-amber-500 dark:border-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-950 dark:text-amber-200',
    bannerBg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    accentHex: '#d97706',
  },
  rose: {
    gradient: 'from-rose-500 via-pink-600 to-rose-800',
    border: 'border-rose-600 dark:border-rose-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
    badgeText: 'text-rose-950 dark:text-rose-200',
    bannerBg: 'bg-gradient-to-r from-rose-500 to-pink-700',
    accentHex: '#e11d48',
  },
  sky: {
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    border: 'border-sky-500 dark:border-sky-500',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80',
    badgeText: 'text-sky-950 dark:text-sky-200',
    bannerBg: 'bg-gradient-to-r from-sky-400 to-blue-600',
    accentHex: '#0284c7',
  },
  violet: {
    gradient: 'from-violet-500 via-purple-600 to-fuchsia-700',
    border: 'border-violet-600 dark:border-violet-500',
    badgeBg: 'bg-violet-100 dark:bg-violet-950/80',
    badgeText: 'text-violet-950 dark:text-violet-200',
    bannerBg: 'bg-gradient-to-r from-violet-500 to-fuchsia-700',
    accentHex: '#7c3aed',
  },
};

const questionTypeBadgeConfig: Record<
  QuestionType,
  {
    label: string;
    borderAccent: string;
    chipBg: string;
    chipText: string;
    badgeBorder: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  multiple_choice: {
    label: 'Multiple Choice',
    borderAccent: 'border-l-[6px] border-l-violet-500',
    chipBg: 'bg-violet-100 dark:bg-violet-950/70',
    chipText: 'text-violet-700 dark:text-violet-300',
    badgeBorder: 'border-violet-400 dark:border-violet-700',
    icon: HelpCircle,
  },
  multiple_select: {
    label: 'Checkboxes (Multi)',
    borderAccent: 'border-l-[6px] border-l-emerald-500',
    chipBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    chipText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-400 dark:border-emerald-700',
    icon: CheckSquare,
  },
  fill_blank: {
    label: 'Fill Blank',
    borderAccent: 'border-l-[6px] border-l-sky-500',
    chipBg: 'bg-sky-100 dark:bg-sky-950/70',
    chipText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-400 dark:border-sky-700',
    icon: Highlighter,
  },
  true_false: {
    label: 'True / False',
    borderAccent: 'border-l-[6px] border-l-amber-500',
    chipBg: 'bg-amber-100 dark:bg-amber-950/70',
    chipText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-400 dark:border-amber-700',
    icon: CheckCircle2,
  },
  flashcard: {
    label: 'Flashcard',
    borderAccent: 'border-l-[6px] border-l-fuchsia-500',
    chipBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/70',
    chipText: 'text-fuchsia-700 dark:text-fuchsia-300',
    badgeBorder: 'border-fuchsia-400 dark:border-fuchsia-700',
    icon: BookOpen,
  },
};

export const DeckViewPage: React.FC<DeckViewPageProps> = ({
  deck,
  cards,
  subDecks = [],
  parentDeck,
  onBack,
  onStartStudy,
  onSelectSubDeck,
  onCreateSubDeck,
  onDeleteDeck,
  onRefreshCards,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | QuestionType>('all');

  // Inline card creation state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newType, setNewType] = useState<QuestionType>('multiple_choice');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectAnswers, setNewCorrectAnswers] = useState<string[]>([]);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  // Flip preview state: set of card IDs currently flipped to show answer
  const [flippedCardIds, setFlippedCardIds] = useState<Set<number>>(new Set());

  const toggleFlip = (cardId: number) => {
    sounds.playCardFlip();
    setFlippedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Turn highlighted text into blank or answer
  const handleHighlightToBlankOrAnswer = () => {
    const el = questionInputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = newQuestion.substring(start, end).trim();

    if (!selected) {
      alert('Please select or highlight text inside the question box first!');
      return;
    }

    sounds.playTap();
    setNewAnswer(selected);

    if (newType === 'fill_blank') {
      const before = newQuestion.substring(0, start);
      const after = newQuestion.substring(end);
      setNewQuestion(`${before}[______]${after}`);
    } else if (newType === 'multiple_choice') {
      if (!newOptions[0] || newOptions[0] === newAnswer) {
        const copy = [...newOptions];
        copy[0] = selected;
        setNewOptions(copy);
      } else {
        const emptyIdx = newOptions.findIndex((o) => !o.trim());
        const copy = [...newOptions];
        if (emptyIdx !== -1) copy[emptyIdx] = selected;
        else copy[0] = selected;
        setNewOptions(copy);
      }
    } else if (newType === 'multiple_select') {
      if (!newOptions.includes(selected)) {
        const emptyIdx = newOptions.findIndex((o) => !o.trim());
        const copy = [...newOptions];
        if (emptyIdx !== -1) copy[emptyIdx] = selected;
        else copy.push(selected);
        setNewOptions(copy);
      }
      if (!newCorrectAnswers.includes(selected)) {
        setNewCorrectAnswers([...newCorrectAnswers, selected]);
      }
    }
  };

  const handleSaveCard = async () => {
    if (!newQuestion.trim()) {
      alert('Please enter a question or statement.');
      return;
    }

    let finalAnswer = newAnswer.trim();
    let finalOptions: string[] | undefined = undefined;
    let finalCorrectAnswers: string[] | undefined = undefined;

    if (newType === 'multiple_choice') {
      finalOptions = newOptions.filter((o) => o.trim());
      if (finalOptions.length < 2) {
        alert('Please provide at least 2 choices for a multiple choice card.');
        return;
      }
      if (!finalAnswer) {
        finalAnswer = finalOptions[0];
      }
    } else if (newType === 'multiple_select') {
      finalOptions = newOptions.filter((o) => o.trim());
      if (finalOptions.length < 2) {
        alert('Please provide at least 2 choices for a checkbox question.');
        return;
      }
      if (newCorrectAnswers.length === 0) {
        alert('Please check at least one correct answer option.');
        return;
      }
      finalCorrectAnswers = newCorrectAnswers;
      finalAnswer = newCorrectAnswers.join(', ');
    } else if (newType === 'true_false') {
      finalOptions = ['True', 'False'];
      finalAnswer = finalAnswer || 'True';
      finalCorrectAnswers = [finalAnswer];
    } else if (newType === 'fill_blank') {
      if (!finalAnswer) {
        alert('Please specify the answer that fills the blank.');
        return;
      }
    } else if (newType === 'flashcard') {
      if (!finalAnswer) {
        alert('Please enter the answer for the back of the card.');
        return;
      }
    }

    sounds.playTap();
    const now = new Date();

    const cardToAdd: Card = {
      deckId: deck.id!,
      question: newQuestion.trim(),
      answer: finalAnswer,
      explanation: newExplanation.trim() || undefined,
      type: newType,
      options: finalOptions,
      correctAnswers: finalCorrectAnswers,
      createdAt: now,
      ...initializeFSRSCard(),
    };

    await db.cards.add(cardToAdd);

    // Update deck card count
    const count = await db.cards.where('deckId').equals(deck.id!).count();
    await db.decks.update(deck.id!, { cardCount: count, updatedAt: now });

    setNewQuestion('');
    setNewAnswer('');
    setNewExplanation('');
    setNewOptions(['', '', '', '']);
    setNewCorrectAnswers([]);
    setIsAddingCard(false);
    sounds.playCorrect();
    onRefreshCards();
  };

  const [sessionStartTime] = useState(() => Date.now());

  const handleDeleteCard = useCallback(async (cardId: number) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    sounds.playTap();
    await db.cards.delete(cardId);
    const count = await db.cards.where('deckId').equals(deck.id!).count();
    await db.decks.update(deck.id!, { cardCount: count, updatedAt: new Date() });
    onRefreshCards();
  }, [deck.id, onRefreshCards]);

  // Filter cards
  const filteredCards = cards.filter((c) => {
    const qMatch =
      c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.explanation && c.explanation.toLowerCase().includes(searchQuery.toLowerCase()));
    const typeMatch = selectedTypeFilter === 'all' || c.type === selectedTypeFilter;
    return qMatch && typeMatch;
  });

  // Calculate FSRS due cards (due <= sessionStartTime or reps === 0)
  const dueCardsCount = useMemo(() => {
    return cards.filter((c) => {
      if (!c.due) return true;
      return new Date(c.due).getTime() <= sessionStartTime || (c.reps ?? 0) === 0;
    }).length;
  }, [cards, sessionStartTime]);

  const activeTheme = deckColorThemes[deck.color] || deckColorThemes.indigo;

  const getFormatLabel = (type: QuestionType) => {
    return questionTypeBadgeConfig[type]?.label || type;
  };

  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-16">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2 sm:pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 min-w-0">
            <button
              onClick={() => {
                sounds.playTap();
                onBack();
              }}
              className="tactile-btn-secondary px-2.5 sm:px-3 py-1.5 min-h-[44px] text-xs font-black gap-1.5 shadow-[0_2.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none shrink-0"
              aria-label="Back to all decks"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">All Decks</span>
              <span className="sm:hidden">Decks</span>
            </button>

            {parentDeck && (
              <>
                <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">/</span>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onSelectSubDeck(parentDeck);
                  }}
                  className="px-2 sm:px-2.5 py-1 min-h-[44px] flex items-center rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-300 dark:border-slate-700 truncate max-w-[80px] sm:max-w-[150px] shadow-[0_1.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none shrink-0"
                >
                  <span className="truncate">{parentDeck.title}</span>
                </button>
              </>
            )}

            <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">/</span>
            <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[200px]">
              {deck.title}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {cards.length > 0 && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onStartStudy(deck);
                }}
                className="tactile-btn-emerald px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm font-black gap-1.5 sm:gap-2 shadow-[0_3px_0_0_#064e3b] active:translate-y-0.5 active:shadow-none shrink-0"
              >
                <Play className="w-4 h-4 fill-white stroke-none shrink-0" />
                <span className="hidden sm:inline">Study ({dueCardsCount > 0 ? `${dueCardsCount} Due` : 'Review'})</span>
                <span className="sm:hidden">{dueCardsCount > 0 ? `${dueCardsCount} Due` : 'Study'}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (deck.id && confirm(`Delete "${deck.title}" and its cards?`)) {
                  onDeleteDeck(deck.id);
                }
              }}
              aria-label="Delete deck"
              className="tactile-btn-rose w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-xs shadow-[0_2.5px_0_0_#881337] active:translate-y-0.5 active:shadow-none flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Deck Hero Summary Card with Vibrant Header Banner */}
        <section className="tactile-card bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] relative overflow-hidden">
          {/* Top Dynamic Gradient Accent Stripe matching deck color */}
          <div className={`h-3 w-full bg-gradient-to-r ${activeTheme.gradient} border-b-[2px] border-slate-900`} />

          <div className="p-4 sm:p-8 space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-5">
              <div className="space-y-3 flex-1 min-w-0">
                {/* Playful Stats & Info Badges */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Category Pill */}
                  <span className="tactile-pill bg-indigo-100 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-200 border-slate-900 shadow-[0_2px_0_0_#09090b] text-[11px] sm:text-xs">
                    {getCategoryIcon(deck.category, 'w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0')}
                    <span className="truncate max-w-[120px] sm:max-w-none">{deck.category}</span>
                  </span>

                  {/* Due cards with fire badge */}
                  {dueCardsCount > 0 ? (
                    <span className="tactile-pill bg-rose-500 text-white border-slate-900 shadow-[0_2px_0_0_#881337] animate-pop text-[11px] sm:text-xs shrink-0">
                      <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 stroke-[2.5] shrink-0" />
                      <span>{dueCardsCount} Due for Quest</span>
                    </span>
                  ) : (
                    <span className="tactile-pill bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-300 border-slate-900 shadow-[0_2px_0_0_#09090b] text-[11px] sm:text-xs shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500 shrink-0" />
                      <span>Deck Mastered</span>
                    </span>
                  )}

                  {/* Total Cards Chip */}
                  {cards.length === 0 ? (
                    <span className="tactile-pill bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border-slate-900 shadow-[0_2px_0_0_#78350f] text-[11px] sm:text-xs shrink-0">
                      <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Folder Deck</span>
                    </span>
                  ) : (
                    <span className="tactile-pill bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-900 shadow-[0_2px_0_0_#09090b] text-[11px] sm:text-xs shrink-0">
                      <Layers className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span>{cards.length} Study Cards</span>
                    </span>
                  )}

                  {/* Subdecks Chip if any exist */}
                  {subDecks.length > 0 && (
                    <span className="tactile-pill bg-sky-100 dark:bg-sky-950/70 text-sky-950 dark:text-sky-300 border-slate-900 shadow-[0_2px_0_0_#09090b] text-[11px] sm:text-xs shrink-0">
                      <FolderTree className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{subDecks.length} Sub-decks</span>
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight tracking-tight break-words">
                  {deck.title}
                </h1>

                {deck.description && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl break-words">
                    {deck.description}
                  </p>
                )}

                {/* Tags with tactile badges */}
                {deck.tags && deck.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {deck.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] truncate max-w-[150px]"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Action Block */}
              <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                {cards.length > 0 ? (
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onStartStudy(deck);
                    }}
                    className="tactile-btn-emerald w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 min-h-[48px] text-sm sm:text-base font-black gap-2.5 shadow-[0_4px_0_0_#064e3b] active:translate-y-1 active:shadow-none hover:-translate-y-0.5"
                  >
                    <Play className="w-4 h-4 fill-white stroke-none shrink-0" />
                    <span>Start Study Quest</span>
                  </button>
                ) : (
                  <div className="w-full text-center sm:text-right text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border-[2px] border-amber-300 dark:border-amber-800 p-3 rounded-2xl shadow-[0_2px_0_0_#78350f]">
                    This deck has 0 cards. Add sub-decks or cards below.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sub-Decks Section with Tactile Folder Pills */}
        {deck.id && (
          <section className="tactile-card p-4 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-[2px] border-slate-900 flex items-center justify-center shadow-[0_2px_0_0_#09090b] shrink-0">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white truncate">
                    Sub-Decks Realm
                  </h2>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    {subDecks.length} sub-deck chapters attached
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onCreateSubDeck(deck.id!);
                }}
                className="tactile-btn-secondary px-3 py-2 min-h-[40px] text-xs font-black gap-1.5 shadow-[0_2.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sub-Deck</span>
              </button>
            </div>

            {subDecks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {subDecks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      sounds.playTap();
                      onSelectSubDeck(sub);
                    }}
                    className="p-3.5 sm:p-4 rounded-2xl border-[2.5px] border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 hover:bg-indigo-50/70 dark:hover:bg-slate-700/80 shadow-[0_3px_0_0_#09090b] hover:shadow-[0_5px_0_0_#09090b] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-between group gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 truncate pr-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 shadow-[0_1.5px_0_0_#09090b]">
                        <Folder className="w-4 h-4 fill-amber-400 stroke-slate-900" />
                      </div>
                      <div className="space-y-0.5 truncate min-w-0">
                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                          {sub.title}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300">
                            {sub.cardCount ?? 0} cards
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        onSelectSubDeck(sub);
                      }}
                      className="tactile-btn-primary px-3 py-2 min-h-[40px] text-[11px] font-black shrink-0 flex items-center gap-1 shadow-[0_2px_0_0_#1e1b4b] active:translate-y-0.5 active:shadow-none"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-[1.5px] border-dashed border-slate-300 dark:border-slate-700 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  No sub-decks yet. Click &ldquo;New Sub-Deck&rdquo; to organize chapters, lectures, or topic modules under this quest!
                </p>
              </div>
            )}
          </section>
        )}

        {/* Card Creator Drawer / Section with Highlight Toolbar & Instant Preview */}
        {isAddingCard && (
          <section className="tactile-card p-4 sm:p-7 bg-amber-50/90 dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-amber-600 shadow-[0_6px_0_0_#78350f] dark:shadow-[0_6px_0_0_#451a03] space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b-[2px] border-slate-900 dark:border-slate-700 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 border-[2px] border-slate-900 flex items-center justify-center shadow-[0_2px_0_0_#78350f] shrink-0">
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-950 dark:text-amber-200 truncate">
                    Card Creator Workshop
                  </h3>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">
                    Craft a card with cloze blank, choices, or true/false
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                aria-label="Close card creator"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border-[2px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b] hover:bg-slate-100 active:translate-y-0.5 active:shadow-none shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Playful Question Type Selector Tabs with Icons - Horizontal scroll on mobile */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Select Question Format
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1.5 sm:flex-wrap scrollbar-none">
                {[
                  { id: 'multiple_choice', label: 'Multiple Choice', icon: HelpCircle },
                  { id: 'multiple_select', label: 'Checkboxes (Multi)', icon: CheckSquare },
                  { id: 'fill_blank', label: 'Fill in Blank', icon: Highlighter },
                  { id: 'true_false', label: 'True / False', icon: CheckCircle2 },
                  { id: 'flashcard', label: 'Flashcard', icon: BookOpen },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = newType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setNewType(t.id as QuestionType);
                        if (t.id === 'true_false') {
                          setNewAnswer('True');
                          setNewOptions(['True', 'False']);
                          setNewCorrectAnswers(['True']);
                        }
                      }}
                      className={`px-3 py-2 min-h-[40px] text-xs font-black rounded-xl border-[2px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-[0_2.5px_0_0_#78350f] -translate-y-0.5'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] hover:bg-amber-100/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {/* Question Textarea with Vibrant Cloze Toolbar */}
              <div>
                <div className="flex items-stretch sm:items-center justify-between mb-1.5 flex-col sm:flex-row gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>2. Question / Statement Prompt *</span>
                  </label>

                  {/* Vibrant Cloze Toolbar Button formatted for mobile */}
                  <button
                    type="button"
                    onClick={handleHighlightToBlankOrAnswer}
                    className="tactile-btn-amber px-3 py-2 min-h-[40px] text-xs font-black gap-1.5 shadow-[0_2px_0_0_#78350f] active:translate-y-0.5 active:shadow-none inline-flex items-center justify-center w-full sm:w-auto"
                    title="Highlight text in the box and click to set as cloze blank or answer"
                  >
                    <Highlighter className="w-3.5 h-3.5 shrink-0" />
                    <span>Highlight to Cloze Blank / Answer</span>
                  </button>
                </div>

                <textarea
                  ref={questionInputRef}
                  rows={2}
                  placeholder={
                    newType === 'fill_blank'
                      ? 'e.g. The powerhouse of the cell is Mitochondria (select Mitochondria & click highlight button)...'
                      : newType === 'true_false'
                      ? 'e.g. Ribosomes are responsible for protein synthesis in the cell...'
                      : 'Type your question or statement...'
                  }
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Pro Tip: Highlight any key word in the box and click the yellow button above to generate a cloze blank!
                  </span>
                </p>
              </div>

              {/* Instant Preview Card with Glowing Border */}
              {(newQuestion.trim() || newAnswer.trim()) && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border-[2.5px] border-amber-400 dark:border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.2)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Instant Card Preview</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      {getFormatLabel(newType)}
                    </span>
                  </div>

                  <div className="text-sm font-black text-slate-900 dark:text-white break-words">
                    {newType === 'fill_blank' && newQuestion.includes('[______]') ? (
                      newQuestion.split('[______]').map((part, pIdx, arr) => (
                        <React.Fragment key={pIdx}>
                          {part}
                          {pIdx < arr.length - 1 && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-300 dark:bg-amber-600 font-mono font-black text-slate-950 text-xs border border-slate-900 mx-1">
                              [ _____ ]
                            </span>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      newQuestion || 'Type question to see preview...'
                    )}
                  </div>

                  {newAnswer && (
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1 break-words">
                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                      <span>Target Answer: {newAnswer}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Type-Specific Controls */}
              {/* 1. Multiple Choice */}
              {newType === 'multiple_choice' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Choices (Click letter badge to set correct answer)
                    </label>
                    {newAnswer && (
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">
                        Correct: {newAnswer}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newOptions.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isCorrect = newAnswer === opt && opt !== '';
                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border-[2px] transition-all bg-white dark:bg-slate-900 ${
                            isCorrect
                              ? 'border-emerald-600 ring-2 ring-emerald-400 shadow-[0_2px_0_0_#064e3b]'
                              : 'border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playTap();
                              setNewAnswer(opt);
                            }}
                            className={`w-9 h-9 sm:w-7 sm:h-7 min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] rounded-lg font-black text-xs flex items-center justify-center shrink-0 border-[1.5px] border-slate-900 cursor-pointer shadow-[0_1.5px_0_0_#09090b] ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                            title="Mark as correct answer"
                          >
                            {isCorrect ? '✓' : letter}
                          </button>
                          <input
                            type="text"
                            placeholder={`Option ${letter}...`}
                            value={opt}
                            onChange={(e) => {
                              const copy = [...newOptions];
                              copy[oIdx] = e.target.value;
                              setNewOptions(copy);
                              if (isCorrect) setNewAnswer(e.target.value);
                            }}
                            className="w-full text-base sm:text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none py-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Checkboxes (Multiple Select) */}
              {newType === 'multiple_select' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Checkboxes (Check all correct answers)</span>
                    </label>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                      {newCorrectAnswers.length} correct
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newOptions.map((opt, oIdx) => {
                      const isCorrect = newCorrectAnswers.includes(opt) && opt !== '';
                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border-[2px] transition-all bg-white dark:bg-slate-900 ${
                            isCorrect
                              ? 'border-indigo-600 ring-2 ring-indigo-400 shadow-[0_2px_0_0_#1e1b4b]'
                              : 'border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playTap();
                              if (newCorrectAnswers.includes(opt)) {
                                setNewCorrectAnswers(newCorrectAnswers.filter((a) => a !== opt));
                              } else if (opt.trim()) {
                                setNewCorrectAnswers([...newCorrectAnswers, opt]);
                              }
                            }}
                            className={`w-9 h-9 sm:w-7 sm:h-7 min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] rounded-lg font-black text-xs flex items-center justify-center shrink-0 border-[1.5px] border-slate-900 cursor-pointer shadow-[0_1.5px_0_0_#09090b] ${
                              isCorrect
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                            title="Toggle correct"
                          >
                            {isCorrect ? '✓' : ''}
                          </button>
                          <input
                            type="text"
                            placeholder={`Option ${oIdx + 1}...`}
                            value={opt}
                            onChange={(e) => {
                              const oldVal = newOptions[oIdx];
                              const copy = [...newOptions];
                              copy[oIdx] = e.target.value;
                              setNewOptions(copy);
                              if (newCorrectAnswers.includes(oldVal)) {
                                setNewCorrectAnswers(
                                  newCorrectAnswers.map((a) => (a === oldVal ? e.target.value : a))
                                );
                              }
                            }}
                            className="w-full text-base sm:text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none py-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. True / False */}
              {newType === 'true_false' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Correct Statement Truth Value *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setNewAnswer(val);
                          setNewCorrectAnswers([val]);
                        }}
                        className={`py-3 min-h-[48px] rounded-2xl border-[2.5px] text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          newAnswer === val
                            ? val === 'True'
                              ? 'bg-emerald-500 text-white border-slate-900 shadow-[0_3px_0_0_#064e3b]'
                              : 'bg-rose-500 text-white border-slate-900 shadow-[0_3px_0_0_#881337]'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-900 dark:border-slate-700 shadow-[0_2px_0_0_#09090b]'
                        }`}
                      >
                        {val === 'True' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Fill in Blank or Flashcard Answer */}
              {(newType === 'fill_blank' || newType === 'flashcard') && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {newType === 'fill_blank' ? 'Missing Word / Blank Answer *' : 'Card Answer (Back) *'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      newType === 'fill_blank'
                        ? 'e.g. Mitochondria'
                        : 'e.g. The double-membraned organelle responsible for ATP production.'
                    }
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Explanation Field */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Explanation / Memory Tip (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cellular respiration generates ATP through oxidative phosphorylation."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] rounded-2xl border-[2px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base sm:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t-[2px] border-slate-900/20 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="tactile-btn-secondary px-4 py-2.5 min-h-[44px] text-xs font-black shadow-[0_2px_0_0_#09090b] active:translate-y-0.5 active:shadow-none w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCard}
                className="tactile-btn-amber px-6 py-2.5 min-h-[44px] text-xs sm:text-sm font-black shadow-[0_3px_0_0_#78350f] active:translate-y-1 active:shadow-none w-full sm:w-auto"
              >
                Save Card to Deck
              </button>
            </div>
          </section>
        )}

        {/* Cards Management Arena */}
        <section className="tactile-card p-4 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-[2px] border-slate-900 flex items-center justify-center shadow-[0_2px_0_0_#09090b] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white truncate">
                  Study Cards ({cards.length})
                </h2>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  Interactive quest questions with instant answers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setIsAddingCard(true);
                }}
                className="tactile-btn-amber px-4 py-2 min-h-[40px] text-xs font-black gap-1.5 shadow-[0_2.5px_0_0_#78350f] active:translate-y-0.5 active:shadow-none w-full sm:w-auto justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>
          </div>

          {/* Question Type Filter Buttons as lively tactile chips with active states */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:flex-wrap scrollbar-none">
            <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mr-1 shrink-0">
              Filter:
            </span>
            {[
              { id: 'all', label: `All (${cards.length})`, icon: GraduationCap },
              { id: 'multiple_choice', label: 'Multiple Choice', icon: HelpCircle },
              { id: 'multiple_select', label: 'Checkboxes', icon: CheckSquare },
              { id: 'fill_blank', label: 'Fill Blank', icon: Highlighter },
              { id: 'true_false', label: 'True/False', icon: CheckCircle2 },
              { id: 'flashcard', label: 'Flashcards', icon: BookOpen },
            ].map((pill) => {
              const Icon = pill.icon;
              const isSelected = selectedTypeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedTypeFilter(pill.id as 'all' | QuestionType);
                  }}
                  className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-black border-[2px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-violet-600 text-white border-slate-900 shadow-[0_2.5px_0_0_#1e1b4b] -translate-y-0.5'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Cards Bar with Neo-brutalist styling */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search question prompts, answers, or explanations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base sm:text-xs font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Cards List with Interactive Flip Preview and Type Border Accent */}
          <div className="space-y-3.5 pt-1">
            {filteredCards.length > 0 ? (
              filteredCards.map((card, idx) => {
                const isFlipped = card.id ? flippedCardIds.has(card.id) : false;
                const typeConfig = questionTypeBadgeConfig[card.type] || questionTypeBadgeConfig.multiple_choice;
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={card.id || idx}
                    onClick={() => card.id && toggleFlip(card.id)}
                    className={`p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border-[2.5px] border-slate-900 dark:border-slate-700 ${typeConfig.borderAccent} shadow-[0_4px_0_0_#09090b] hover:shadow-[0_6px_0_0_#09090b] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group`}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-2.5 min-w-0">
                        {/* Header Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-[0_1.5px_0_0_#09090b] shrink-0">
                            {idx + 1}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${typeConfig.chipBg} ${typeConfig.chipText} border-[1.5px] ${typeConfig.badgeBorder} shrink-0`}>
                            <TypeIcon className="w-3 h-3" />
                            <span>{typeConfig.label}</span>
                          </span>

                          {/* Interactive test pill */}
                          <span className="tactile-pill bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-900 shadow-[0_1.5px_0_0_#09090b] text-[10px] py-0.5 px-2 shrink-0">
                            {isFlipped ? (
                              <>
                                <EyeOff className="w-3 h-3 text-rose-500" />
                                <span>Answer Revealed (Tap to hide)</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 text-indigo-500" />
                                <span>Tap to test yourself</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Question Text */}
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                          {card.type === 'fill_blank' && card.question.includes('[______]') ? (
                            card.question.split('[______]').map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < arr.length - 1 && (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-900/60 font-mono font-black text-amber-950 dark:text-amber-200 text-xs border border-amber-600 mx-1 shadow-sm">
                                    [ _____ ]
                                  </span>
                                )}
                              </React.Fragment>
                            ))
                          ) : (
                            card.question
                          )}
                        </h4>

                        {/* Options if Multiple Choice / Select */}
                        {card.options && card.options.length > 0 && !isFlipped && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {card.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-[1.5px] border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 truncate shadow-[0_1.5px_0_0_#09090b]"
                              >
                                {card.type === 'multiple_select' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-black mr-1">
                                    ☐
                                  </span>
                                ) : (
                                  <span className="text-violet-600 dark:text-violet-400 font-black mr-1">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                )}
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Revealed Answer Box with Celebration Styling */}
                        {isFlipped && (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-[2px] border-emerald-600 dark:border-emerald-600 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 shadow-[0_3px_0_0_#064e3b]">
                            <div className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2 break-words">
                              <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                              <span>
                                Correct Answer:{' '}
                                {card.type === 'multiple_select'
                                  ? (card.correctAnswers || [card.answer]).join(', ')
                                  : card.answer}
                              </span>
                            </div>
                            {card.explanation && (
                              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 pt-0.5 break-words">
                                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                                <span>{card.explanation}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (card.id) handleDeleteCard(card.id);
                          }}
                          aria-label="Delete card"
                          className="text-slate-400 hover:text-rose-600 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-400 active:bg-rose-100 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-[2px] border-dashed border-slate-300 dark:border-slate-700">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                  {searchQuery ? 'No cards match your search query.' : 'This deck has no study cards yet.'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click &ldquo;Add Card&rdquo; above to forge your first question or flashcard!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
