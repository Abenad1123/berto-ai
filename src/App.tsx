import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles, BookOpen, Search, Zap, Trophy, Brain, X, ArrowLeft, Tag, FolderTree, Layers } from 'lucide-react';
import { Header } from './components/Header';
import { DeckCard } from './components/DeckCard';
import { StudyView } from './components/StudyView';
import { SummaryModal } from './components/SummaryModal';
import { CreateDeckPage } from './components/CreateDeckPage';
import { DeckViewPage } from './components/DeckViewPage';
import { SettingsModal } from './components/SettingsModal';
import { MobileNav } from './components/MobileNav';
import { WeeklyStreakWidget } from './components/WeeklyStreakWidget';
import { ShortcutsModal } from './components/ShortcutsModal';
import { Sidebar } from './components/Sidebar';
import { ProfilePage } from './components/ProfilePage';
import { StudyLauncherModal } from './components/StudyLauncherModal';
import { db, seedInitialData } from './lib/db';
import { sounds } from './lib/sound';
import { getCategoryIcon } from './lib/categoryIcons';
import type { Deck, Card, QuizAnswer, QuizLauncherConfig } from './types';

export type AppView =
  | { type: 'home' }
  | { type: 'create-deck'; parentDeckId?: number | null }
  | { type: 'deck-view'; deckId: number }
  | { type: 'study'; deck: Deck }
  | { type: 'profile' };

export function App() {
  const [view, setView] = useState<AppView>({ type: 'home' });
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [completedAnswers, setCompletedAnswers] = useState<QuizAnswer[] | null>(null);

  // Dynamic Quiz Launcher State
  const [launcherDeck, setLauncherDeck] = useState<Deck | null>(null);
  const [launcherCards, setLauncherCards] = useState<Card[]>([]);
  const [activeLauncherConfig, setActiveLauncherConfig] = useState<QuizLauncherConfig | undefined>(undefined);

  // Modals & Navigation drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeParentDeck, setActiveParentDeck] = useState<Deck | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('berto_theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
    }
    return false;
  });

  // Ensure DOM matches initial darkMode state
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const setAppDarkMode = async (isDark: boolean) => {
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('berto_theme', isDark ? 'dark' : 'light');
    } catch {}
    const existing = await db.settings.toCollection().first();
    if (existing?.id) {
      await db.settings.update(existing.id, { darkMode: isDark });
    }
  };

  const handleToggleDarkMode = (explicitVal?: boolean) => {
    const nextDark = typeof explicitVal === 'boolean' ? explicitVal : !darkMode;
    setAppDarkMode(nextDark);
    sounds.playTap();
  };

  // Helper for view navigation with browser history support
  const navigateTo = (newView: AppView, push = true) => {
    sounds.playTap();
    setView(newView);
    if (push && typeof window !== 'undefined') {
      window.history.pushState(newView, '');
    }
  };

  // Browser back/forward button listener
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.type) {
        setView(e.state as AppView);
      } else {
        setView({ type: 'home' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial database seeding & preferences load
  useEffect(() => {
    seedInitialData();

    const initSettings = async () => {
      const s = await db.settings.toCollection().first();
      if (s) {
        if (typeof s.darkMode === 'boolean') {
          const stored = localStorage.getItem('berto_theme');
          const isDark = stored ? stored === 'dark' : s.darkMode;
          setDarkMode(isDark);
          document.documentElement.classList.toggle('dark', isDark);
        }
        if (typeof s.soundVolume === 'number') {
          sounds.volume = s.soundVolume;
        }
        if (typeof s.soundEnabled === 'boolean') {
          sounds.enabled = s.soundEnabled;
        }
        if (s.accentColor) {
          document.documentElement.setAttribute('data-accent', s.accentColor);
        }
        if (s.textSize) {
          document.documentElement.setAttribute('data-text-size', s.textSize);
        }
        if (s.cardStyle) {
          document.documentElement.setAttribute('data-card-style', s.cardStyle);
        }
      }
    };
    initSettings();
  }, []);

  // Global Keyboard shortcuts: '/' search, '?' shortcuts, 'n' new deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isTyping) return;

      if (e.key === '/') {
        if (view.type === 'home') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      } else if (e.key === '?') {
        e.preventDefault();
        sounds.playTap();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigateTo({ type: 'create-deck' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view.type]);

  // Reactive queries
  const decks = useLiveQuery(async () => {
    return await db.decks.toArray();
  }, []);

  const totalCards = useLiveQuery(async () => {
    return await db.cards.count();
  }, []);

  const userProfile = useLiveQuery(async () => {
    return await db.profile.toCollection().first();
  }, []);

  const userSettings = useLiveQuery(async () => {
    return await db.settings.toCollection().first();
  }, []);

  // Sync dynamic theme & layout attributes when userSettings updates
  useEffect(() => {
    if (userSettings) {
      document.documentElement.setAttribute('data-accent', userSettings.accentColor || 'violet');
      document.documentElement.setAttribute('data-text-size', userSettings.textSize || 'normal');
      document.documentElement.setAttribute('data-card-style', userSettings.cardStyle || 'tactile');
    }
  }, [userSettings]);

  // Current deck view query if on deck-view page
  const currentDeckViewCards = useLiveQuery(
    async () => {
      if (view.type !== 'deck-view') return [];
      return await db.cards.where('deckId').equals(view.deckId).toArray();
    },
    [view.type === 'deck-view' ? view.deckId : null]
  );

  // Extract unique categories & tags
  const categories = ['All', ...Array.from(new Set(decks?.map((d) => d.category) || []))];
  const allTags = Array.from(new Set((decks || []).flatMap((d) => d.tags || [])));

  // Sub-deck map: deck.id -> count of children
  const subDeckCountMap: Record<number, number> = {};
  if (decks) {
    for (const d of decks) {
      if (d.parentId) {
        subDeckCountMap[d.parentId] = (subDeckCountMap[d.parentId] || 0) + 1;
      }
    }
  }

  // Filtered decks calculation for home view
  const filteredDecks = decks?.filter((d) => {
    const searchLower = searchQuery.toLowerCase().trim();

    // If searching, search everywhere (both parents and nested children)
    if (searchLower) {
      const matchesSearch =
        d.title.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower) ||
        d.category.toLowerCase().includes(searchLower) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(searchLower)));
      const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
      const matchesTag = !selectedTag || (d.tags && d.tags.includes(selectedTag));
      return matchesSearch && matchesCat && matchesTag;
    }

    // If tag selected, filter across all decks
    if (selectedTag) {
      const matchesTag = d.tags && d.tags.includes(selectedTag);
      const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
      return matchesTag && matchesCat;
    }

    // Sub-deck hierarchy drill-down
    if (activeParentDeck) {
      const isDirectChild = d.parentId === activeParentDeck.id;
      const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
      return isDirectChild && matchesCat;
    }

    // Default root view: only top-level decks (parentId is undefined or null)
    const isTopLevel = !d.parentId;
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    return isTopLevel && matchesCat;
  });

  // Open pre-study launcher configuration dialog
  const handleStartStudy = async (deck: Deck) => {
    sounds.playTap();
    if (!deck.id) return;
    const cards = await db.cards.where('deckId').equals(deck.id).toArray();
    if (cards.length === 0) {
      alert('This deck has no cards yet. Add some cards to start studying!');
      return;
    }
    setLauncherDeck(deck);
    setLauncherCards(cards);
  };

  // Launch session after user selects configuration in launcher
  const handleLauncherStart = (config: QuizLauncherConfig, preparedCards: Card[]) => {
    setActiveLauncherConfig(config);
    setStudyCards(preparedCards);
    if (launcherDeck) {
      navigateTo({ type: 'study', deck: launcherDeck });
    }
    setLauncherDeck(null);
    setCompletedAnswers(null);
  };

  const handleFinishStudy = async (answers: QuizAnswer[]) => {
    setCompletedAnswers(answers);

    // Persist earned XP and update daily streak in user profile
    const gameMode = activeLauncherConfig?.gameMode || 'normal';
    const xpPerCorrect = gameMode === 'speed_run' || gameMode === 'hard_mode' ? 15 : 10;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const earnedXp = correctCount * xpPerCorrect;

    try {
      const prof = await db.profile.toCollection().first();
      if (prof?.id) {
        const todayStr = new Date().toISOString().slice(0, 10);
        let newStreak = prof.streakDays || 1;
        if (prof.lastStudyDate) {
          const lastDate = new Date(prof.lastStudyDate);
          const today = new Date(todayStr);
          const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
        }

        await db.profile.update(prof.id, {
          xp: (prof.xp || 340) + earnedXp,
          streakDays: newStreak,
          lastStudyDate: todayStr,
        });
      }
    } catch (e) {
      console.warn('Failed to persist study session stats:', e);
    }
  };

  const handleDeleteDeck = async (deckId: number) => {
    sounds.playTap();
    // Recursively collect all descendant deck IDs
    const allDeckIdsToDelete = [deckId];
    const queue = [deckId];
    while (queue.length > 0) {
      const currentParentId = queue.shift()!;
      const children = await db.decks.where('parentId').equals(currentParentId).toArray();
      for (const child of children) {
        if (child.id) {
          allDeckIdsToDelete.push(child.id);
          queue.push(child.id);
        }
      }
    }
    await db.transaction('rw', [db.decks, db.cards], async () => {
      for (const id of allDeckIdsToDelete) {
        await db.cards.where('deckId').equals(id).delete();
        await db.decks.delete(id);
      }
    });
    if (activeParentDeck?.id && allDeckIdsToDelete.includes(activeParentDeck.id)) {
      setActiveParentDeck(null);
    }
    navigateTo({ type: 'home' });
  };

  // ----------------------------------------------------
  // ROUTING / VIEW RENDERING
  // ----------------------------------------------------

  // 1. ACTIVE STUDY SESSION VIEW
  if (view.type === 'study') {
    return (
      <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <StudyView
          deck={view.deck}
          cards={studyCards}
          launcherConfig={activeLauncherConfig}
          userSettings={userSettings}
          onExit={() => {
            sounds.playTap();
            navigateTo({ type: 'deck-view', deckId: view.deck.id! });
          }}
          onFinish={handleFinishStudy}
        />

        {completedAnswers && (
          <SummaryModal
            deck={view.deck}
            answers={completedAnswers}
            launcherConfig={activeLauncherConfig}
            onRestart={() => {
              setCompletedAnswers(null);
              handleStartStudy(view.deck);
            }}
            onRetryMissed={async (missedIds) => {
              sounds.playTap();
              setCompletedAnswers(null);
              const filtered = studyCards.filter((c) =>
                missedIds.includes(c.sourceCardId || c.id || 0)
              );
              if (filtered.length > 0) {
                setStudyCards(filtered);
              } else {
                handleStartStudy(view.deck);
              }
            }}
            onHome={() => {
              setStudyCards([]);
              setCompletedAnswers(null);
              navigateTo({ type: 'deck-view', deckId: view.deck.id! });
            }}
          />
        )}

        {/* Launcher modal if user wants to change settings from within study */}
        {launcherDeck && (
          <StudyLauncherModal
            isOpen={!!launcherDeck}
            deck={launcherDeck}
            cards={launcherCards}
            userSettings={userSettings}
            onClose={() => setLauncherDeck(null)}
            onStart={handleLauncherStart}
          />
        )}
      </div>
    );
  }

  // 2. DEDICATED CREATE DECK PAGE
  if (view.type === 'create-deck') {
    return (
      <CreateDeckPage
        onBack={() => navigateTo({ type: 'home' })}
        existingDecks={decks || []}
        defaultParentId={view.parentDeckId}
        onCreated={(newDeckId) => {
          navigateTo({ type: 'deck-view', deckId: newDeckId });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    );
  }

  // 3. DEDICATED DECK VIEW PAGE (INSPECTION, SUB-DECKS, CARDS MANAGEMENT)
  if (view.type === 'deck-view') {
    const currentDeck = decks?.find((d) => d.id === view.deckId);
    const subDecks = decks?.filter((d) => d.parentId === view.deckId) || [];
    const parentDeck = currentDeck?.parentId ? decks?.find((d) => d.id === currentDeck.parentId) : null;

    if (!currentDeck) {
      return (
        <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="tactile-card p-8 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 text-center max-w-md">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Deck Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">This deck may have been deleted.</p>
            <button
              onClick={() => navigateTo({ type: 'home' })}
              className="tactile-btn-primary px-5 py-2 text-xs font-black"
            >
              Return to All Decks
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <DeckViewPage
          deck={currentDeck}
          cards={currentDeckViewCards || []}
          subDecks={subDecks}
          parentDeck={parentDeck}
          onBack={() => {
            setLauncherDeck(null);
            navigateTo({ type: 'home' });
          }}
          onStartStudy={handleStartStudy}
          onSelectSubDeck={(sub) => {
            if (sub.id) navigateTo({ type: 'deck-view', deckId: sub.id });
          }}
          onCreateSubDeck={(pId) => {
            navigateTo({ type: 'create-deck', parentDeckId: pId });
          }}
          onDeleteDeck={handleDeleteDeck}
          onRefreshCards={async () => {
            // Live query handles refresh automatically
          }}
        />

        {/* Global modals accessible from subpages */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          userSettings={userSettings}
        />
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Pre-Study / Quiz Arena Launcher Dialog */}
        {launcherDeck && (
          <StudyLauncherModal
            isOpen={!!launcherDeck}
            deck={launcherDeck}
            cards={launcherCards}
            userSettings={userSettings}
            onClose={() => setLauncherDeck(null)}
            onStart={handleLauncherStart}
          />
        )}
      </div>
    );
  }

  // 4. DEDICATED STUDENT PROFILE PAGE VIEW
  if (view.type === 'profile') {
    return (
      <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <ProfilePage
          onBack={() => {
            sounds.playTap();
            navigateTo({ type: 'home' });
          }}
          onOpenSettings={() => {
            sounds.playTap();
            setIsSettingsOpen(true);
          }}
          onProfileUpdated={() => {
            // Live query will refresh automatically
          }}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          userSettings={userSettings}
        />
      </div>
    );
  }

  // 5. MAIN HOME DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-playful-grid text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900 transition-colors">
      <Header
        onOpenMenu={() => setIsSidebarOpen(true)}
        onOpenCreate={() => navigateTo({ type: 'create-deck' })}
        onOpenSettings={() => {
          sounds.playTap();
          setIsSettingsOpen(true);
        }}
        onOpenProfile={() => {
          navigateTo({ type: 'profile' });
        }}
        onOpenShortcuts={() => {
          sounds.playTap();
          setIsShortcutsOpen(true);
        }}
        profile={userProfile || null}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      <main className="max-w-4xl w-full mx-auto px-4 py-5 sm:py-7 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-8">
        {/* Clean Student Welcome Header (Decluttered) */}
        <div className="tactile-card p-5 sm:p-7 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white mb-6 relative overflow-hidden border-[2.5px] border-slate-900 shadow-[0_6px_0_0_#09090b]">
          <div className="max-w-lg relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-300 text-slate-950 border-[1.5px] border-slate-900 shadow-[0_1.5px_0_0_#09090b] mb-2.5">
              <Zap className="w-3 h-3 fill-slate-950 stroke-none" />
              <span>Spaced Repetition Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-white mb-1.5">
              {userProfile?.name ? `Keep it up, ${userProfile.name}!` : 'Ready to Study?'}
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-indigo-100 mb-4 max-w-md">
              {userProfile?.motto || 'Review your flashcards daily to lock knowledge into long-term memory.'}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={() => navigateTo({ type: 'create-deck' })}
                className="tactile-btn-amber w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-black gap-2 shadow-[0_3px_0_0_#09090b] justify-center"
              >
                <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
                <span>Create Deck (File / AI)</span>
              </button>

              <button
                onClick={() => {
                  navigateTo({ type: 'profile' });
                }}
                className="tactile-btn-secondary w-full sm:w-auto px-3.5 py-2.5 text-xs font-black shadow-[0_3px_0_0_#09090b] justify-center"
              >
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Decorative subtle icon */}
          <div className="absolute right-4 top-4 opacity-15 hidden sm:block pointer-events-none">
            <Brain className="w-40 h-40 stroke-white stroke-[1.5]" />
          </div>
        </div>

        {/* 7-Day Rhythm & Study Activity Matrix */}
        <WeeklyStreakWidget streakDays={userProfile?.streakDays || 1} totalCardsStudied={totalCards || 8} />

        {/* Quick Stats Cards - Mobile 360px optimized */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="tactile-card p-2.5 sm:p-4 bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_3px_0_0_#09090b] flex items-center gap-2 sm:gap-3 transition-colors min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-violet-100 dark:bg-violet-950/70 border-[1.5px] sm:border-[2px] border-slate-900 dark:border-slate-700 flex items-center justify-center text-violet-700 dark:text-violet-400 shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="text-sm sm:text-xl font-black text-slate-950 dark:text-white leading-tight truncate">
                {decks?.length || 0}
              </div>
              <div className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                Decks
              </div>
            </div>
          </div>

          <div className="tactile-card p-2.5 sm:p-4 bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_3px_0_0_#09090b] flex items-center gap-2 sm:gap-3 transition-colors min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border-[1.5px] sm:border-[2px] border-slate-900 dark:border-slate-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="text-sm sm:text-xl font-black text-slate-950 dark:text-white leading-tight truncate">
                {totalCards || 0}
              </div>
              <div className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                Cards
              </div>
            </div>
          </div>

          <div className="tactile-card p-2.5 sm:p-4 bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-800 shadow-[0_3px_0_0_#09090b] flex items-center gap-2 sm:gap-3 transition-colors min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-950/70 border-[1.5px] sm:border-[2px] border-slate-900 dark:border-slate-700 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="text-sm sm:text-xl font-black text-slate-950 dark:text-white leading-tight truncate">
                {userProfile?.dailyGoalCards || 20}
              </div>
              <div className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                <span className="sm:hidden">Goal</span>
                <span className="hidden sm:inline">Daily Goal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nested Sub-deck Breadcrumb Banner (if drilling down into a parent deck) */}
        {activeParentDeck && !searchQuery && !selectedTag && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-violet-100 dark:bg-violet-950/70 border-[2px] border-slate-900 dark:border-violet-700 shadow-[0_3px_0_0_#09090b] mb-5 animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveParentDeck(null);
                }}
                className="tactile-btn-secondary px-3 py-1 text-xs gap-1 shadow-[0_2px_0_0_#09090b]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Decks</span>
              </button>
              <span className="text-slate-400 dark:text-slate-500">/</span>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
                <FolderTree className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>{activeParentDeck.title} (Sub-decks)</span>
              </div>
            </div>

            <button
              onClick={() => handleStartStudy(activeParentDeck)}
              className="tactile-btn-emerald px-3.5 py-1 text-xs font-black"
            >
              Study Parent Deck
            </button>
          </div>
        )}

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          {/* Category Pills - Smooth horizontal scrolling with touch-friendly spacing */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto py-2 scrollbar-none touch-pan-x overscroll-x-contain">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sounds.playTap();
                  setSelectedCategory(cat);
                }}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-2xl text-xs font-black border-[2px] border-slate-900 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  selectedCategory === cat
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-[0_2.5px_0_0_#09090b] -translate-y-0.5'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[0_2.5px_0_0_#09090b]'
                }`}
              >
                <span>{getCategoryIcon(cat, 'w-3.5 h-3.5')}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Search Bar with Shortcut hint and Clear button */}
          <div className="relative min-w-[240px] py-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.5]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search decks & tags... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 min-h-[40px] rounded-2xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold shadow-[0_2px_0_0_#09090b] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tags Cloud Filter Bar - Smooth horizontal scrolling on mobile */}
        {allTags.length > 0 && (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto py-1 mb-5 scrollbar-none touch-pan-x overscroll-x-contain">
            <div className="flex items-center gap-1 text-[11px] font-black text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              <span>Tags:</span>
            </div>

            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    sounds.playTap();
                    setSelectedTag(isSelected ? null : tag);
                  }}
                  className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-black border-[1.5px] transition-all shrink-0 cursor-pointer flex items-center gap-1 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-slate-900 shadow-[0_2px_0_0_#1e1b4b] -translate-y-0.5'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[0_1.5px_0_0_#09090b]'
                  }`}
                >
                  <span>{tag}</span>
                  {isSelected && <X className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0 ml-1 cursor-pointer py-1"
              >
                Clear tag
              </button>
            )}
          </div>
        )}

        {/* Decks Grid */}
        {filteredDecks && filteredDecks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-8">
            {filteredDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                subDeckCount={deck.id ? subDeckCountMap[deck.id] || 0 : 0}
                onStudy={handleStartStudy}
                onViewDetails={(d) => {
                  if (d.id) navigateTo({ type: 'deck-view', deckId: d.id });
                }}
                onDelete={handleDeleteDeck}
                onExploreSubDecks={(d) => {
                  if (d.id) navigateTo({ type: 'deck-view', deckId: d.id });
                }}
                onSelectTag={(tag) => {
                  sounds.playTap();
                  setSelectedTag(tag);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="tactile-card p-10 text-center bg-white dark:bg-slate-900 my-6 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_6px_0_0_#09090b] transition-colors">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No decks found</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedTag
                ? 'No decks match your active filter. Try resetting search or tags.'
                : activeParentDeck
                ? 'This deck has no sub-decks yet. You can create one and nest it here.'
                : 'Create your first deck with AI or by importing a PDF, PPT, or TXT file!'}
            </p>
            <div className="flex justify-center gap-3 mt-4">
              {(searchQuery || selectedTag || activeParentDeck) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag(null);
                    setActiveParentDeck(null);
                  }}
                  className="tactile-btn-secondary px-4 py-2 text-xs font-black shadow-[0_3px_0_0_#09090b]"
                >
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => navigateTo({ type: 'create-deck' })}
                className="tactile-btn-violet px-5 py-2 text-xs font-black gap-2 shadow-[0_3px_0_0_#2e1065]"
              >
                <Sparkles className="w-4 h-4 fill-amber-300" />
                <span>Create Deck</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t-[2.5px] border-slate-900 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 text-center mt-auto hidden sm:block transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400 stroke-[2]" aria-hidden="true" />
            <span>Berto AI — Free Active Recall Flashcards</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
            >
              Settings & Audio
            </button>
            <span>•</span>
            <span>FSRS Spaced Repetition</span>
            <span>•</span>
            <span>Offline PWA</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        onOpenMenu={() => setIsSidebarOpen(true)}
        onOpenCreate={() => navigateTo({ type: 'create-deck' })}
        onOpenSettings={() => {
          sounds.playTap();
          setIsSettingsOpen(true);
        }}
        onOpenProfile={() => {
          navigateTo({ type: 'profile' });
        }}
        profile={userProfile || null}
      />

      {/* Hamburger Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profile={userProfile || null}
        decks={decks || []}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenCreate={() => navigateTo({ type: 'create-deck' })}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => {
          setIsSidebarOpen(false);
          navigateTo({ type: 'profile' });
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onSelectTag={(tag) => {
          setSelectedTag(tag);
          setActiveParentDeck(null);
        }}
        onSelectDeck={(d) => {
          if (d.id) navigateTo({ type: 'deck-view', deckId: d.id });
        }}
      />

      {/* Settings Modal (Volume, Mute, Dark Mode, API Key) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        userSettings={userSettings}
      />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Pre-Study / Quiz Arena Launcher Dialog */}
      {launcherDeck && (
        <StudyLauncherModal
          isOpen={!!launcherDeck}
          deck={launcherDeck}
          cards={launcherCards}
          userSettings={userSettings}
          onClose={() => setLauncherDeck(null)}
          onStart={handleLauncherStart}
        />
      )}
    </div>
  );
}

export default App;
