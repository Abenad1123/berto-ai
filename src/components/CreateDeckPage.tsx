import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  Upload,
  CheckCircle2,
  FileText,
  FolderTree,
  FolderPlus,
  Trash2,
  Layers,
  Highlighter,
  CheckSquare,
  Check,
  Palette,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Compass,
  X,
} from 'lucide-react';
import type { Deck, Card, QuestionType } from '../types';
import { db } from '../lib/db';
import { generateCardsFromText } from '../lib/ai';
import { initializeFSRSCard } from '../lib/fsrs';
import { sounds } from '../lib/sound';
import { extractTextFromFile } from '../lib/fileParser';
import { getCategoryIcon } from '../lib/categoryIcons';

interface CreateDeckPageProps {
  onBack: () => void;
  onCreated: (deckId: number) => void;
  onOpenSettings: () => void;
  existingDecks?: Deck[];
  defaultParentId?: number | null;
}

export interface ManualCardItem {
  type: QuestionType;
  question: string;
  answer: string;
  options: string[];
  correctAnswers: string[];
  explanation?: string;
}

const colorThemes: Record<
  'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky',
  {
    name: string;
    bgClass: string;
    ringClass: string;
    checkDark?: boolean;
  }
> = {
  violet: {
    name: 'Arcane Violet',
    bgClass: 'bg-violet-500 hover:bg-violet-400',
    ringClass: 'ring-violet-500',
  },
  indigo: {
    name: 'Cosmic Indigo',
    bgClass: 'bg-indigo-500 hover:bg-indigo-400',
    ringClass: 'ring-indigo-500',
  },
  emerald: {
    name: 'Forest Emerald',
    bgClass: 'bg-emerald-500 hover:bg-emerald-400',
    ringClass: 'ring-emerald-500',
  },
  amber: {
    name: 'Solar Amber',
    bgClass: 'bg-amber-400 hover:bg-amber-300',
    ringClass: 'ring-amber-500',
    checkDark: true,
  },
  rose: {
    name: 'Ruby Rose',
    bgClass: 'bg-rose-500 hover:bg-rose-400',
    ringClass: 'ring-rose-500',
  },
  sky: {
    name: 'Aero Sky',
    bgClass: 'bg-sky-400 hover:bg-sky-300',
    ringClass: 'ring-sky-500',
    checkDark: true,
  },
};

export const CreateDeckPage: React.FC<CreateDeckPageProps> = ({
  onBack,
  onCreated,
  onOpenSettings,
  existingDecks = [],
  defaultParentId = null,
}) => {
  const [tab, setTab] = useState<'ai' | 'manual' | 'folder'>('ai');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [parentId, setParentId] = useState<number | null>(defaultParentId);
  const [color, setColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'>('violet');
  const [content, setContent] = useState('');
  const [count, setCount] = useState(10);
  const [aiQuestionFormat, setAiQuestionFormat] = useState<QuestionType | 'mixed'>('mixed');

  // File import state
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual cards state with multi-format support
  const [manualCards, setManualCards] = useState<ManualCardItem[]>([
    {
      type: 'multiple_choice',
      question: '',
      answer: '',
      options: ['', '', '', ''],
      correctAnswers: [],
      explanation: '',
    },
    {
      type: 'fill_blank',
      question: '',
      answer: '',
      options: ['', '', '', ''],
      correctAnswers: [],
      explanation: '',
    },
    {
      type: 'true_false',
      question: '',
      answer: 'True',
      options: ['True', 'False'],
      correctAnswers: ['True'],
      explanation: '',
    },
  ]);

  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const handleHighlightToBlankOrAnswer = (cardIndex: number) => {
    const el = textareaRefs.current[cardIndex];
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end).trim();

    if (!selected) {
      alert('Please select or highlight text inside the question box first!');
      return;
    }

    sounds.playTap();
    const copy = [...manualCards];
    const card = copy[cardIndex];
    card.answer = selected;

    if (card.type === 'fill_blank') {
      const before = card.question.substring(0, start);
      const after = card.question.substring(end);
      card.question = `${before}[______]${after}`;
    } else if (card.type === 'multiple_choice') {
      if (!card.options[0] || card.options[0] === card.answer) {
        card.options[0] = selected;
      } else {
        const emptyIdx = card.options.findIndex((o) => !o.trim());
        if (emptyIdx !== -1) card.options[emptyIdx] = selected;
        else card.options[0] = selected;
      }
    } else if (card.type === 'multiple_select') {
      if (!card.options.includes(selected)) {
        const emptyIdx = card.options.findIndex((o) => !o.trim());
        if (emptyIdx !== -1) card.options[emptyIdx] = selected;
        else card.options[0] = selected;
      }
      if (!card.correctAnswers.includes(selected)) {
        card.correctAnswers.push(selected);
      }
    }

    setManualCards(copy);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category suggestions from existing decks plus common defaults
  const existingCategories = Array.from(new Set(existingDecks.map((d) => d.category).filter(Boolean)));
  const defaultSuggestions = ['Science', 'Computer Science', 'History', 'Language', 'Math', 'Medicine', 'Business'];
  const suggestedCategories = Array.from(new Set([...existingCategories, ...defaultSuggestions]));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playTap();
    setIsExtractingFile(true);
    setError(null);

    try {
      const extracted = await extractTextFromFile(file);
      setContent(extracted);
      setImportedFileName(file.name);

      // Auto-populate title if empty
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      sounds.playCorrect();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to extract text from file.');
    } finally {
      setIsExtractingFile(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const parseTags = (): string[] => {
    return tags
      .split(/[, ]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));
  };

  const handleGenerateAI = async () => {
    sounds.playTap();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for this quest deck.');
      return;
    }
    if (!content.trim() || content.trim().length < 20) {
      setError('Please paste notes or upload a file with study material.');
      return;
    }

    const settings = await db.settings.toCollection().first();
    const apiKey = settings?.apiKey || '';
    const provider = settings?.aiProvider || 'gemini';

    if (!apiKey) {
      setError('No AI API key found. Please open Settings to add your free Gemini or Groq key.');
      return;
    }

    try {
      setIsLoading(true);
      const truncatedContent = content.slice(0, 40000);
      const generated = await generateCardsFromText({
        apiKey,
        provider,
        content: truncatedContent,
        count,
        type: aiQuestionFormat,
      });

      if (!generated || generated.length === 0) {
        throw new Error('AI could not generate questions from this text. Try adding more detail.');
      }

      const now = new Date();
      let createdDeckId = 0;

      await db.transaction('rw', [db.decks, db.cards], async () => {
        const deckId = await db.decks.add({
          title: title.trim(),
          description: `Generated from ${importedFileName || content.slice(0, 40)}...`,
          category: category.trim() || 'General',
          color,
          icon: 'Sparkles',
          cardCount: generated.length,
          tags: parseTags(),
          parentId: parentId || null,
          createdAt: now,
          updatedAt: now,
        });

        createdDeckId = Number(deckId);

        const cardsToAdd: Card[] = generated
          .filter((g) => g && typeof g.question === 'string' && g.question.trim().length > 0)
          .map((g) => {
            const rawType = g.type || (aiQuestionFormat === 'mixed' ? 'multiple_choice' : aiQuestionFormat);
            const validTypes: QuestionType[] = ['multiple_choice', 'multiple_select', 'fill_blank', 'true_false', 'flashcard'];
            const cardType: QuestionType = validTypes.includes(rawType as QuestionType) ? (rawType as QuestionType) : 'multiple_choice';

            const answer = typeof g.answer === 'string' ? g.answer.trim() : String(g.answer || '');
            let options = Array.isArray(g.options) ? g.options.map((o) => String(o).trim()).filter(Boolean) : undefined;
            if (cardType === 'multiple_choice' && options && !options.includes(answer)) {
              options[0] = answer;
            }
            if (cardType === 'true_false') {
              options = ['True', 'False'];
            }

            let correctAnswers = Array.isArray(g.correctAnswers)
              ? g.correctAnswers.map((ca) => String(ca).trim()).filter(Boolean)
              : undefined;
            if (cardType === 'multiple_select' && (!correctAnswers || correctAnswers.length === 0)) {
              correctAnswers = [answer];
            }

            return {
              deckId: createdDeckId,
              question: g.question.trim(),
              answer,
              options,
              correctAnswers,
              explanation: typeof g.explanation === 'string' ? g.explanation.trim() : undefined,
              type: cardType,
              createdAt: now,
              ...initializeFSRSCard(),
            };
          });

        if (cardsToAdd.length === 0) {
          throw new Error('AI generated cards were not in the expected format. Please try again.');
        }

        await db.cards.bulkAdd(cardsToAdd);
      });

      sounds.playCorrect();
      onCreated(createdDeckId);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to generate cards. Check your API key and connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManual = async () => {
    sounds.playTap();
    if (!title.trim()) {
      setError('Please provide a title for this quest deck.');
      return;
    }
    const validCards = manualCards.filter((c) => c.question.trim() && c.answer.trim());
    const isFolderDeck = tab === 'folder' || validCards.length === 0;

    const now = new Date();
    let createdDeckId = 0;

    await db.transaction('rw', [db.decks, db.cards], async () => {
      const deckId = await db.decks.add({
        title: title.trim(),
        description: isFolderDeck ? 'Organizational folder deck for sub-decks.' : 'Custom student study deck.',
        category: category.trim() || 'General',
        color,
        icon: isFolderDeck ? 'FolderTree' : 'BookOpen',
        cardCount: validCards.length,
        isFolder: isFolderDeck,
        tags: parseTags(),
        parentId: parentId || null,
        createdAt: now,
        updatedAt: now,
      });

      createdDeckId = Number(deckId);

      if (validCards.length > 0) {
        const cardsToAdd: Card[] = validCards.map((c) => ({
          deckId: createdDeckId,
          question: c.question.trim(),
          answer: c.answer.trim(),
          options:
            c.type === 'multiple_choice' || c.type === 'multiple_select'
              ? c.options.filter((o) => o.trim())
              : c.type === 'true_false'
              ? ['True', 'False']
              : undefined,
          correctAnswers: c.type === 'multiple_select' ? c.correctAnswers : undefined,
          explanation: c.explanation?.trim() || undefined,
          type: c.type,
          createdAt: now,
          ...initializeFSRSCard(),
        }));

        await db.cards.bulkAdd(cardsToAdd);
      }
    });

    sounds.playCorrect();
    onCreated(createdDeckId);
  };

  const addManualCardRow = (defaultType: QuestionType = 'multiple_choice') => {
    sounds.playTap();
    setManualCards([
      ...manualCards,
      {
        type: defaultType,
        question: '',
        answer: defaultType === 'true_false' ? 'True' : '',
        options: defaultType === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
        correctAnswers: defaultType === 'true_false' ? ['True'] : [],
        explanation: '',
      },
    ]);
  };

  const removeManualCardRow = (index: number) => {
    sounds.playTap();
    setManualCards(manualCards.filter((_, idx) => idx !== index));
  };

  const updateManualCardType = (index: number, newType: QuestionType) => {
    sounds.playTap();
    const copy = [...manualCards];
    const card = copy[index];
    card.type = newType;
    if (newType === 'true_false') {
      card.answer = 'True';
      card.options = ['True', 'False'];
      card.correctAnswers = ['True'];
    } else if (card.options.length === 0) {
      card.options = ['', '', '', ''];
    }
    setManualCards(copy);
  };

  const updateManualCardField = (index: number, field: keyof ManualCardItem, val: any) => {
    const copy = [...manualCards];
    (copy[index] as any)[field] = val;
    setManualCards(copy);
  };

  const updateManualOption = (cardIdx: number, optIdx: number, val: string) => {
    const copy = [...manualCards];
    const prevVal = copy[cardIdx].options[optIdx];
    copy[cardIdx].options[optIdx] = val;
    if ((copy[cardIdx].answer === prevVal && prevVal !== '') || (!copy[cardIdx].answer && optIdx === 0)) {
      copy[cardIdx].answer = val;
    }
    if (copy[cardIdx].correctAnswers.includes(prevVal)) {
      copy[cardIdx].correctAnswers = copy[cardIdx].correctAnswers.map((ca) => (ca === prevVal ? val : ca));
    }
    setManualCards(copy);
  };

  const toggleMultiSelectAnswer = (cardIdx: number, optionVal: string) => {
    sounds.playTap();
    const copy = [...manualCards];
    const card = copy[cardIdx];
    if (card.correctAnswers.includes(optionVal)) {
      card.correctAnswers = card.correctAnswers.filter((a) => a !== optionVal);
    } else {
      card.correctAnswers.push(optionVal);
    }
    card.answer = card.correctAnswers.join(', ');
    setManualCards(copy);
  };

  const colorOptions: Array<'violet' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'> = [
    'violet',
    'indigo',
    'emerald',
    'amber',
    'rose',
    'sky',
  ];

  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-16">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b-[2.5px] border-slate-900 bg-[#fbfaf8]/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2 sm:pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                sounds.playTap();
                onBack();
              }}
              className="tactile-btn-secondary px-2.5 sm:px-3 py-1.5 min-h-[44px] text-xs font-black gap-1.5 shadow-[0_2.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none shrink-0"
              aria-label="Back to decks"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Back to Decks</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block shrink-0" />
            <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2 truncate">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400 hidden sm:inline shrink-0" />
              <span className="truncate">Craft New Deck</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {tab === 'ai' ? (
              <button
                onClick={handleGenerateAI}
                disabled={isLoading}
                className="tactile-btn-primary px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-[0_3px_0_0_#1e1b4b] active:translate-y-0.5 active:shadow-none disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span className="hidden sm:inline">Forging Cards...</span>
                    <span className="sm:hidden">Forging...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-amber-300 stroke-none shrink-0" />
                    <span className="hidden sm:inline">Generate AI Deck</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </button>
            ) : tab === 'folder' ? (
              <button
                onClick={handleSaveManual}
                className="tactile-btn-amber px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-[0_3px_0_0_#78350f] active:translate-y-0.5 active:shadow-none shrink-0"
              >
                <FolderPlus className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="hidden sm:inline">Create Folder Realm</span>
                <span className="sm:hidden">Create</span>
              </button>
            ) : (
              <button
                onClick={handleSaveManual}
                className="tactile-btn-emerald px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-[0_3px_0_0_#064e3b] active:translate-y-0.5 active:shadow-none shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Save Quest Deck</span>
                <span className="sm:hidden">Save</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1 space-y-4 sm:space-y-6">
        {/* Method Switcher Tabs with Playful Drop Shadows */}
        <div className="p-1.5 bg-slate-200/90 dark:bg-slate-800 rounded-2xl border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setTab('ai');
            }}
            className={`flex-1 py-2.5 px-2 sm:px-3 min-h-[44px] text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              tab === 'ai'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-[2px] border-slate-900 shadow-[0_2.5px_0_0_#09090b] -translate-y-0.5'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
            <span className="truncate">AI Generator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setTab('manual');
            }}
            className={`flex-1 py-2.5 px-2 sm:px-3 min-h-[44px] text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              tab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-[2px] border-slate-900 shadow-[0_2.5px_0_0_#09090b] -translate-y-0.5'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">Manual<span className="hidden sm:inline">&nbsp;Cards</span></span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setTab('folder');
            }}
            className={`flex-1 py-2.5 px-2 sm:px-3 min-h-[44px] text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              tab === 'folder'
                ? 'bg-amber-400 text-slate-950 border-[2px] border-slate-900 shadow-[0_2.5px_0_0_#78350f] -translate-y-0.5'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline truncate">Folder Deck (0 Cards)</span>
            <span className="sm:hidden truncate">Folder</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-[2.5px] border-rose-600 text-rose-900 dark:text-rose-200 text-xs font-black flex items-start justify-between gap-3 animate-shake shadow-[0_3px_0_0_#881337]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            {error.includes('Settings') && (
              <button
                onClick={onOpenSettings}
                className="underline hover:text-rose-950 dark:hover:text-white cursor-pointer font-extrabold shrink-0"
              >
                Open Settings
              </button>
            )}
          </div>
        )}

        {/* Step 1: Name Your Quest & Category */}
        <section className="tactile-card p-4 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-sm border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] shrink-0">
              1
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                <span>Name Your Quest & Category</span>
                <Compass className="w-4 h-4 text-violet-500 hidden sm:inline" />
              </h2>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Define the title, realm discipline, and organizational tags
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Quest Deck Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Molecular Biology: Cell Respiration & Krebs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-black shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Category Selector with vibrant icon tiles that have tactile press down animations */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category Domain (Select a realm or type your own)
              </label>
              <input
                type="text"
                placeholder="e.g. Neuroscience, Calculus, Japanese, Bio..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base sm:text-xs font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mt-2.5">
                {suggestedCategories.map((sCat) => {
                  const isSelected = category.toLowerCase() === sCat.toLowerCase();
                  return (
                    <button
                      key={sCat}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setCategory(sCat);
                      }}
                      className={`p-2.5 min-h-[52px] rounded-xl border-[2px] font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_2.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 ${
                        isSelected
                          ? 'bg-violet-600 text-white border-slate-900 shadow-[0_2.5px_0_0_#1e1b4b] ring-2 ring-violet-400'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-900 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {getCategoryIcon(sCat, isSelected ? 'w-4 h-4 text-white' : 'w-4 h-4 text-violet-600 dark:text-violet-400')}
                      <span className="truncate max-w-full">{sCat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nested Sub-deck Parent Selector & Tags in 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Nested Parent Deck */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>Nest under Parent Deck (Optional)</span>
                </label>
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base sm:text-xs font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">None (Top-Level Deck)</option>
                  {existingDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Tags (comma or space separated)
                </label>
                <input
                  type="text"
                  placeholder="#exam, #chapter3, #midterm"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base sm:text-xs font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parseTags().map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 border-[1.5px] border-slate-900 shadow-[0_1px_0_0_#09090b] truncate max-w-[120px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Choose Your Banner Color */}
        <section className="tactile-card p-4 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center font-black text-sm border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] shrink-0">
                2
              </span>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2 truncate">
                  <span>Choose Your Banner Color</span>
                  <Palette className="w-4 h-4 text-fuchsia-500 hidden sm:inline shrink-0" />
                </h2>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  Pick a bouncy theme color for your deck header and study cards
                </p>
              </div>
            </div>

            <span className="tactile-pill bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-900 shadow-[0_1.5px_0_0_#09090b] text-xs font-black shrink-0">
              {colorThemes[color].name}
            </span>
          </div>

          {/* Color picker with bouncy color bubbles and selection checkmark */}
          <div className="flex items-center gap-2.5 sm:gap-3 py-2 flex-wrap">
            {colorOptions.map((c) => {
              const theme = colorThemes[c];
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setColor(c);
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-2xl border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#09090b] flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 active:translate-y-0.5 active:shadow-none shrink-0 ${theme.bgClass} ${
                    isSelected
                      ? '-translate-y-1 shadow-[0_5px_0_0_#09090b] ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900'
                      : 'opacity-90'
                  }`}
                  title={theme.name}
                >
                  {isSelected && (
                    <Check
                      className={`w-6 h-6 stroke-[3.5] drop-shadow ${
                        theme.checkDark ? 'text-slate-950' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Tab Content (Folder Deck, AI Generation, or Manual Artisan) */}
        {tab === 'folder' ? (
          <section className="tactile-card p-4 sm:p-8 bg-amber-50/90 dark:bg-amber-950/30 border-[2.5px] border-slate-900 dark:border-amber-700/80 shadow-[0_6px_0_0_#78350f] space-y-4 sm:space-y-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-400 dark:bg-amber-500 text-slate-950 border-[2.5px] border-slate-900 flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#78350f]">
                <FolderTree className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border-[1.5px] border-slate-900 text-[10px] font-black uppercase tracking-wider">
                  Quest Folder Mode Activated
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                  Organizational Realm Container (0 Direct Cards)
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  This deck will serve as a <strong>top-level organizational folder</strong>. You can use it to group multiple chapters, lectures, or topics hierarchically. You can attach sub-decks directly inside it right after creation!
                </p>
              </div>
            </div>

            {/* Folder Mastery Tip */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-[0_3px_0_0_#09090b] flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-amber-500 shrink-0" />
              <span>
                <strong>Folder Strategy:</strong> Perfect for broad subjects like &ldquo;Biology 101&rdquo; or &ldquo;Medical School Term 1&rdquo;. Sub-decks can then hold the actual flashcards for each lecture!
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveManual}
                className="tactile-btn-amber px-6 py-3.5 min-h-[44px] text-xs sm:text-sm gap-2 shadow-[0_4px_0_0_#78350f] active:translate-y-1 active:shadow-none w-full sm:w-auto"
              >
                <FolderPlus className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                <span>Create Folder Realm Now</span>
              </button>
            </div>
          </section>
        ) : tab === 'ai' ? (
          <section className="tactile-card p-4 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm border-[2px] border-slate-900 shadow-[0_2px_0_0_#78350f] shrink-0">
                3
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <span>Feed Study Notes & Forge AI Cards</span>
                  <Sparkles className="w-4 h-4 text-amber-500 hidden sm:inline" />
                </h2>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Upload lecture slides (PDF/PPT) or paste notes to generate cards with FSRS spaced repetition
                </p>
              </div>
            </div>

            {/* File Drag & Drop / Upload Area with Neo-brutalist dashed border */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.ppt,.txt,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-[2.5px] border-dashed border-slate-400 dark:border-slate-600 hover:border-indigo-600 dark:hover:border-indigo-400 rounded-2xl p-4 sm:p-6 text-center bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all cursor-pointer group shadow-[0_3px_0_0_#09090b] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                {isExtractingFile ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-black">Extracting text from document...</span>
                  </div>
                ) : importedFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate">{importedFileName}</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Extracted {content.length.toLocaleString()} characters • Click to switch file
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 shadow-[0_2.5px_0_0_#09090b] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        Upload Lecture Slide PPT, PDF, or Text File
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        Supports <span className="font-black text-slate-800 dark:text-slate-200">.pdf</span>, <span className="font-black text-slate-800 dark:text-slate-200">.pptx</span>,{' '}
                        <span className="font-black text-slate-800 dark:text-slate-200">.txt</span>, and <span className="font-black text-slate-800 dark:text-slate-200">.md</span> (Runs 100% locally in browser)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Notes / Extracted Text Content ({content.length} chars)
                </label>
                {content && (
                  <button
                    type="button"
                    onClick={() => {
                      setContent('');
                      setImportedFileName(null);
                    }}
                    className="text-[11px] font-black text-rose-500 hover:underline cursor-pointer"
                  >
                    Clear text
                  </button>
                )}
              </div>

              <textarea
                rows={6}
                placeholder="Paste lecture notes, study outline, textbook excerpt, or review points..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-[2.5px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base sm:text-sm font-semibold leading-relaxed shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* AI Output Configuration */}
            <div className="pt-4 border-t-[2.5px] border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Format Strategy
                </label>
                <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-1.5">
                  {[
                    { id: 'mixed', label: 'Mixed (Best)' },
                    { id: 'multiple_choice', label: 'Multiple Choice' },
                    { id: 'fill_blank', label: 'Fill Blank' },
                    { id: 'multiple_select', label: 'Checkboxes' },
                    { id: 'true_false', label: 'True / False' },
                    { id: 'flashcard', label: 'Flashcard' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setAiQuestionFormat(fmt.id as any)}
                      className={`py-2.5 px-2 min-h-[40px] text-[11px] font-black rounded-xl border-[2px] transition-all cursor-pointer ${
                        aiQuestionFormat === fmt.id
                          ? 'bg-indigo-600 text-white border-slate-900 shadow-[0_2.5px_0_0_#1e1b4b] -translate-y-0.5'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] hover:bg-slate-100'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Number of Cards to Forge
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2.5 min-h-[44px] text-xs font-black rounded-xl border-[2px] transition-all cursor-pointer ${
                        count === n
                          ? 'bg-indigo-600 text-white border-slate-900 shadow-[0_2.5px_0_0_#1e1b4b] -translate-y-0.5'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] hover:bg-slate-100'
                      }`}
                    >
                      {n} Cards
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Generate Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isLoading}
                className="tactile-btn tactile-btn-primary w-full py-3.5 min-h-[48px] text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-[0_4px_0_0_#1e1b4b] active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>Creating {count} flashcards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-amber-300 stroke-none shrink-0" />
                    <span>Generate {count} Cards</span>
                  </>
                )}
              </button>
            </div>
          </section>
        ) : (
          /* Tab B: Interactive Manual Cards Builder with Cloze & Multi-Format */
          <section className="tactile-card p-4 sm:p-7 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] shrink-0">
                  3
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                    <span>Manual Card Artisan ({manualCards.length} cards)</span>
                  </h2>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Highlight text to create cloze blanks, or set multiple choice, checkboxes, or true/false
                  </p>
                </div>
              </div>

              {/* Quick Add Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => addManualCardRow('multiple_choice')}
                  className="tactile-btn-secondary px-3 py-2 min-h-[38px] text-[11px] font-black gap-1 shadow-[0_2px_0_0_#09090b] active:translate-y-0.5 active:shadow-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choice</span>
                </button>
                <button
                  type="button"
                  onClick={() => addManualCardRow('fill_blank')}
                  className="tactile-btn-amber px-3 py-2 min-h-[38px] text-[11px] font-black gap-1 shadow-[0_2px_0_0_#78350f] active:translate-y-0.5 active:shadow-none"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Fill Blank</span>
                </button>
                <button
                  type="button"
                  onClick={() => addManualCardRow('multiple_select')}
                  className="tactile-btn-secondary px-3 py-2 min-h-[38px] text-[11px] font-black gap-1 shadow-[0_2px_0_0_#09090b] active:translate-y-0.5 active:shadow-none"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Checkboxes</span>
                </button>
                <button
                  type="button"
                  onClick={() => addManualCardRow('true_false')}
                  className="tactile-btn-secondary px-3 py-2 min-h-[38px] text-[11px] font-black gap-1 shadow-[0_2px_0_0_#09090b] active:translate-y-0.5 active:shadow-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>True/False</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              {manualCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] space-y-3 sm:space-y-3.5 relative"
                >
                  {/* Card Header & Type Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b-[2px] border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black border-[1.5px] border-slate-900 shadow-[0_1.5px_0_0_#09090b] shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Question Format:
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap scrollbar-none w-full sm:w-auto">
                      {[
                        { id: 'multiple_choice', label: 'Multiple Choice', icon: HelpCircle },
                        { id: 'multiple_select', label: 'Checkboxes (Multi)', icon: CheckSquare },
                        { id: 'fill_blank', label: 'Fill in Blank', icon: Highlighter },
                        { id: 'true_false', label: 'True / False', icon: CheckCircle2 },
                        { id: 'flashcard', label: 'Flashcard', icon: BookOpen },
                      ].map((t) => {
                        const Icon = t.icon;
                        const isActive = card.type === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => updateManualCardType(idx, t.id as QuestionType)}
                            className={`px-2.5 py-1.5 min-h-[34px] rounded-xl text-[10px] sm:text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                              isActive
                                ? 'bg-indigo-600 text-white border-slate-900 shadow-[0_1.5px_0_0_#1e1b4b]'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}

                      {manualCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeManualCardRow(idx)}
                          aria-label="Remove card"
                          className="w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] rounded-xl border-[1.5px] border-slate-300 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer ml-1 transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt with Highlight to Blank Action */}
                  <div>
                    <div className="flex items-stretch sm:items-center justify-between mb-1.5 flex-col sm:flex-row gap-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Question / Statement Prompt *
                      </label>

                      {/* The Highlight Tool */}
                      <button
                        type="button"
                        onClick={() => handleHighlightToBlankOrAnswer(idx)}
                        className="tactile-btn-amber px-3 py-2 min-h-[38px] text-[11px] font-black gap-1.5 shadow-[0_1.5px_0_0_#78350f] active:translate-y-0.5 active:shadow-none inline-flex items-center justify-center w-full sm:w-auto shrink-0"
                        title="Highlight text in the box and click to set as answer or cloze blank"
                      >
                        <Highlighter className="w-3.5 h-3.5 shrink-0" />
                        <span>Turn Selection into Blank / Answer</span>
                      </button>
                    </div>

                    <textarea
                      ref={(el) => {
                        textareaRefs.current[idx] = el;
                      }}
                      rows={2}
                      placeholder={
                        card.type === 'fill_blank'
                          ? 'e.g. The powerhouse of the cell is Mitochondria (select word & click button to make blank)...'
                          : card.type === 'true_false'
                          ? 'e.g. Ribosomes are responsible for protein synthesis in the cell...'
                          : 'Type your question or statement...'
                      }
                      value={card.question}
                      onChange={(e) => updateManualCardField(idx, 'question', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />

                    {/* Cloze live preview badge if question contains [______] */}
                    {card.type === 'fill_blank' && card.question.includes('[______]') && (
                      <div className="mt-1.5 p-2 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 shrink-0">
                          Cloze Preview:
                        </span>
                        <span className="break-words">
                          {card.question.split('[______]').map((part, pIdx, arr) => (
                            <React.Fragment key={pIdx}>
                              {part}
                              {pIdx < arr.length - 1 && (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-300 dark:bg-amber-600 font-mono font-black text-slate-950 text-xs border border-slate-900 mx-1 shadow-sm">
                                  [ _____ ]
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Format Editors */}
                  {/* 1. Multiple Choice */}
                  {card.type === 'multiple_choice' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Choices (Click letter badge to set correct answer)
                        </label>
                        {card.answer && (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 truncate">
                            Correct: {card.answer}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {card.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrect = card.answer === opt && opt !== '';
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-1.5 rounded-xl border-[2px] transition-all bg-white dark:bg-slate-900 ${
                                isCorrect
                                  ? 'border-emerald-600 ring-2 ring-emerald-400 shadow-[0_2px_0_0_#064e3b]'
                                  : 'border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playTap();
                                  updateManualCardField(idx, 'answer', opt);
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
                                onChange={(e) => updateManualOption(idx, optIdx, e.target.value)}
                                className="w-full text-base sm:text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none py-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Multiple Select (Checkboxes) */}
                  {card.type === 'multiple_select' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Checkboxes (Check all options that are TRUE)</span>
                        </label>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                          {card.correctAnswers.length} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {card.options.map((opt, optIdx) => {
                          const isChecked = card.correctAnswers.includes(opt) && opt !== '';
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-1.5 rounded-xl border-[2px] transition-all bg-white dark:bg-slate-900 ${
                                isChecked
                                  ? 'border-indigo-600 ring-2 ring-indigo-400 shadow-[0_2px_0_0_#1e1b4b]'
                                  : 'border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleMultiSelectAnswer(idx, opt)}
                                className={`w-9 h-9 sm:w-7 sm:h-7 min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] rounded-lg font-black text-xs flex items-center justify-center shrink-0 border-[1.5px] border-slate-900 cursor-pointer shadow-[0_1.5px_0_0_#09090b] ${
                                  isChecked
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                                title="Toggle correct checkbox"
                              >
                                {isChecked ? '✓' : ''}
                              </button>
                              <input
                                type="text"
                                placeholder={`Checkbox Option ${optIdx + 1}...`}
                                value={opt}
                                onChange={(e) => updateManualOption(idx, optIdx, e.target.value)}
                                className="w-full text-base sm:text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none py-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Fill in the Blank */}
                  {card.type === 'fill_blank' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Correct Word or Phrase (The Blank) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mitochondria (or use highlight button above)"
                        value={card.answer}
                        onChange={(e) => updateManualCardField(idx, 'answer', e.target.value)}
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border-[2px] border-amber-500 bg-amber-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-base sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                      />
                    </div>
                  )}

                  {/* 4. True or False */}
                  {card.type === 'true_false' && (
                    <div className="pt-1 space-y-1.5">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Correct Answer Truth Value *
                      </label>
                      <div className="flex gap-3 max-w-xs">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            updateManualCardField(idx, 'answer', 'True');
                          }}
                          className={`flex-1 py-3 min-h-[48px] rounded-xl text-xs font-black border-[2px] border-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            card.answer === 'True'
                              ? 'bg-emerald-500 text-white shadow-[0_2.5px_0_0_#064e3b]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-[0_1.5px_0_0_#09090b]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>True</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            updateManualCardField(idx, 'answer', 'False');
                          }}
                          className={`flex-1 py-3 min-h-[48px] rounded-xl text-xs font-black border-[2px] border-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            card.answer === 'False'
                              ? 'bg-rose-500 text-white shadow-[0_2.5px_0_0_#881337]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-[0_1.5px_0_0_#09090b]'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>False</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Flashcard */}
                  {card.type === 'flashcard' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Answer (Back of Card) *
                      </label>
                      <input
                        type="text"
                        placeholder="Answer / Key concept to recall..."
                        value={card.answer}
                        onChange={(e) => updateManualCardField(idx, 'answer', e.target.value)}
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      />
                    </div>
                  )}

                  {/* Explanation (Optional for all types) */}
                  <div>
                    <input
                      type="text"
                      placeholder="Explanation / Memory Tip / Context (Optional)..."
                      value={card.explanation || ''}
                      onChange={(e) => updateManualCardField(idx, 'explanation', e.target.value)}
                      className="w-full px-3.5 py-2 min-h-[44px] rounded-xl border-[1.5px] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base sm:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => addManualCardRow('multiple_choice')}
                className="tactile-btn-secondary px-4 py-3 min-h-[44px] text-xs font-black gap-1.5 shadow-[0_2.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Card</span>
              </button>

              <button
                type="button"
                onClick={handleSaveManual}
                className="tactile-btn-emerald px-6 py-3 min-h-[44px] text-xs sm:text-sm font-black gap-2 shadow-[0_3px_0_0_#064e3b] active:translate-y-1 active:shadow-none w-full sm:w-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Quest Deck ({manualCards.filter((c) => c.question.trim() && c.answer.trim()).length} Cards)</span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
