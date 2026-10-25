import React, { useState } from 'react';
import {
  ArrowLeft,
  HelpCircle,
  Brain,
  FileText,
  Keyboard,
  Sparkles,
  ChevronDown,
  Search,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '../lib/sound';

interface HelpFaqPageProps {
  onBack: () => void;
}

interface FaqItem {
  id: string;
  category: 'fsrs' | 'import' | 'shortcuts' | 'offline';
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-fsrs',
    category: 'fsrs',
    question: 'What is FSRS and how does it help me learn faster?',
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <p>
          <strong>FSRS (Free Spaced Repetition Scheduler)</strong> is a modern spaced repetition algorithm that outperforms legacy SM-2. Instead of arbitrary fixed multipliers, FSRS models your actual memory retrievability and memory stability based on your response history.
        </p>
        <p>
          It schedules cards right before you're predicted to forget them, maximizing long-term retention while saving up to 30% of review time.
        </p>
      </div>
    ),
  },
  {
    id: 'review-grades',
    category: 'fsrs',
    question: 'How should I grade my answers (Again, Hard, Good, Easy)?',
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Again (1):</strong> Total blackout or incorrect recall. The card is reset for immediate re-learning.</li>
          <li><strong>Hard (2):</strong> Recalled correctly, but required intense cognitive strain or hesitation. Interval increases slightly.</li>
          <li><strong>Good (3):</strong> The standard correct response with normal recall effort. The optimal progression step.</li>
          <li><strong>Easy (4):</strong> Instant, effortless recall. FSRS significantly extends the interval so you don't over-review trivial facts.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'document-import',
    category: 'import',
    question: 'How do I generate cards from my lecture slides (PDF, PPTX, TXT)?',
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <p>
          Go to <strong>Create Deck</strong>, give your deck a name, and either upload a file or paste your lecture notes directly into the text box.
        </p>
        <p>
          Files are parsed <em>100% locally on your device</em> — your documents are never uploaded to any central server. If you have an AI API key configured (e.g. Groq or Gemini in Settings), Berto AI will automatically forge high-yield active recall flashcards in seconds.
        </p>
      </div>
    ),
  },
  {
    id: 'card-types',
    category: 'import',
    question: 'What question formats are supported?',
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <p>Berto AI supports three high-retention formats:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Multiple Choice:</strong> Four distinct options designed to test discrimination between similar concepts.</li>
          <li><strong>True or False:</strong> Rapid assertion testing to eliminate common conceptual misconceptions.</li>
          <li><strong>Identification / Cloze:</strong> Direct fill-in or keyword retrieval to test pure active recall without hints.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'keyboard-shortcuts',
    category: 'shortcuts',
    question: 'What are the main keyboard shortcuts?',
    answer: (
      <div className="overflow-x-auto text-xs sm:text-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 font-black text-slate-900 dark:text-white">Key</th>
              <th className="py-2 font-black text-slate-900 dark:text-white">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr>
              <td className="py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">Space / Enter</td>
              <td className="py-2 text-slate-600 dark:text-slate-300">Flip flashcard or advance</td>
            </tr>
            <tr>
              <td className="py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">1, 2, 3, 4</td>
              <td className="py-2 text-slate-600 dark:text-slate-300">Grade card: Again (1), Hard (2), Good (3), Easy (4)</td>
            </tr>
            <tr>
              <td className="py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">/</td>
              <td className="py-2 text-slate-600 dark:text-slate-300">Focus search bar on Dashboard</td>
            </tr>
            <tr>
              <td className="py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">?</td>
              <td className="py-2 text-slate-600 dark:text-slate-300">Toggle Shortcuts cheat sheet</td>
            </tr>
            <tr>
              <td className="py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">Esc</td>
              <td className="py-2 text-slate-600 dark:text-slate-300">Close open modal or drawer</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'offline-data',
    category: 'offline',
    question: 'Does Berto AI work completely offline?',
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <p>
          <strong>Yes, absolutely.</strong> All your decks, cards, study logs, streak counts, and profile stats are stored in your device's local IndexedDB database.
        </p>
        <p>
          You can study on the subway, on a plane, or during an internet outage without losing any progress. You can also export a full JSON backup at any time from Settings.
        </p>
      </div>
    ),
  },
];

export function HelpFaqPage({ onBack }: HelpFaqPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'fsrs' | 'import' | 'shortcuts' | 'offline'>('all');
  const [openId, setOpenId] = useState<string | null>('what-is-fsrs');
  const [search, setSearch] = useState('');

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    sounds.playTap();
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-16">
      {/* Top Sticky Header */}
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
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                <span>Help & FAQ</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
                Guides, spaced repetition tips, and keyboard controls
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.5]" />
          <input
            type="text"
            placeholder="Search questions or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-[2px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-bold shadow-[0_2.5px_0_0_#09090b] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Questions', icon: Sparkles },
            { id: 'fsrs', label: 'FSRS & Spaced Repetition', icon: Brain },
            { id: 'import', label: 'Decks & Import', icon: FileText },
            { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
            { id: 'offline', label: 'Offline & Privacy', icon: ShieldCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sounds.playTap();
                  setActiveCategory(cat.id as any);
                }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black border-[1.5px] border-slate-900 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-[0_2px_0_0_#1e1b4b] -translate-y-0.5'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-[0_1.5px_0_0_#09090b]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left font-black text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 border-t border-slate-100 dark:border-slate-800 pt-3 animate-in fade-in duration-150">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border-[2px] border-slate-900 text-slate-500">
              No matching questions found. Try a different search keyword!
            </div>
          )}
        </div>

        {/* Quick Tips Box */}
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-[2.5px] border-slate-900 dark:border-amber-700/60 shadow-[0_3px_0_0_#78350f] text-slate-900 dark:text-amber-100">
          <div className="flex items-center gap-2 font-black text-xs sm:text-sm mb-2 text-amber-900 dark:text-amber-300">
            <Zap className="w-4 h-4 text-amber-600 fill-amber-400" />
            <span>Study Tip for Best Retention</span>
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-amber-950 dark:text-amber-200">
            Study 10–15 minutes consistently every single day rather than cramming 2 hours once a week. Your brain consolidates FSRS memory traces during sleep!
          </p>
        </div>
      </main>
    </div>
  );
}
