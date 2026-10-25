import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Keyboard,
  Tag,
  CornerDownRight,
  Folder,
  BookOpen,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
  History,
  Settings,
} from 'lucide-react';
import type { Deck, UserProfile } from '../types';
import { sounds } from '../lib/sound';
import { getCategoryIcon } from '../lib/categoryIcons';

const avatarColorGradients: Record<string, string> = {
  violet: 'from-violet-600 via-purple-600 to-indigo-600',
  indigo: 'from-indigo-600 via-blue-600 to-violet-700',
  emerald: 'from-emerald-500 via-teal-600 to-emerald-700',
  amber: 'from-amber-400 via-amber-500 to-orange-500',
  rose: 'from-rose-500 via-pink-600 to-rose-700',
  sky: 'from-sky-400 via-sky-500 to-blue-600',
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  decks: Deck[];
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenCreate: () => void;
  onOpenSettings?: () => void;
  onOpenProfile: () => void;
  onOpenShortcuts: () => void;
  onOpenHelp?: () => void;
  onOpenAbout?: () => void;
  onOpenFeedback?: () => void;
  onOpenChangelog?: () => void;
  onSelectTag?: (tag: string) => void;
  onSelectDeck?: (deck: Deck) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  profile,
  decks,
  onOpenCreate,
  onOpenSettings,
  onOpenProfile,
  onOpenShortcuts,
  onOpenHelp,
  onOpenAbout,
  onOpenFeedback,
  onOpenChangelog,
  onSelectTag,
  onSelectDeck,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [collapsedDeckIds, setCollapsedDeckIds] = useState<Record<number, boolean>>({});

  const avatarGradient =
    (profile?.avatarColor && avatarColorGradients[profile.avatarColor]) ||
    'from-violet-600 to-indigo-600';
  const currentLevel = Math.max(1, Math.floor((profile?.xp ?? 0) / 500) + 1);

  const toggleDeckCollapse = (deckId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    setCollapsedDeckIds((prev) => ({
      ...prev,
      [deckId]: !prev[deckId],
    }));
  };

  // Ensure component is rendered immediately when opening
  if (isOpen && !isRendered) {
    setIsRendered(true);
  }

  // Synchronize enter and exit animation lifecycle with GPU frame scheduling
  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      const raf = requestAnimationFrame(() => {
        setIsVisible(false);
      });
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Listen for Escape key to close sidebar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  // Deduplicate decks by id and title to prevent double-renders
  const uniqueDecks = Array.from(
    new Map(decks.map((d) => [d.id ?? `${d.title}-${d.parentId}`, d])).values()
  );

  // Collect all unique tags across decks
  const allTags = Array.from(
    new Set(uniqueDecks.flatMap((d) => d.tags || []))
  );

  // Group top-level decks (parentId is null/undefined)
  const topLevelDecks = uniqueDecks.filter((d) => !d.parentId);

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto">
      {/* Backdrop with silky fade & subtle blur transition */}
      <div
        onClick={() => {
          sounds.playTap();
          onClose();
        }}
        aria-hidden="true"
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-out Menu Panel with hardware-accelerated spring physics */}
      <aside
        className={`relative w-[320px] max-w-[88vw] sm:w-[350px] h-full bg-[#fbfaf8] dark:bg-slate-900 border-r-[3px] border-slate-900 shadow-2xl z-10 flex flex-col overflow-hidden will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Compact Learner Header (~55px) with staggered entry */}
        <div
          className={`shrink-0 px-3 sm:px-3.5 pb-3 sm:pb-3.5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] border-b-[2.5px] border-slate-900 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xs flex items-center justify-between gap-2 transition-all duration-300 ease-out delay-75 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          }`}
        >
          {/* Learner Profile Row */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenProfile();
            }}
            aria-label="View learner profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-xl hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {/* Avatar with Level badge */}
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatarGradient} text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center font-black text-sm group-hover:scale-105 group-active:scale-95 transition-transform`}>
                {profile?.avatarIcon ? (
                  <span className="text-base">{profile.avatarIcon}</span>
                ) : profile?.name ? (
                  profile.name.charAt(0).toUpperCase()
                ) : (
                  'A'
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 border border-slate-900 text-[8px] font-black px-1 rounded shadow-xs">
                Lv.{currentLevel}
              </span>
            </div>

            {/* Name + Streak + View Profile Link */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-950 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {profile?.name || 'Student Hero'}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/70 border border-amber-400/80 text-[10px] font-black text-amber-800 dark:text-amber-300 shrink-0">
                  🔥 {profile?.streakDays ?? 0}d
                </span>
              </div>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 mt-0.5">
                <span>View Profile</span>
                <span className="group-hover:translate-x-1 transition-transform font-black">→</span>
              </span>
            </div>
          </button>

          {/* Close button with tactile rotation */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close menu"
            className="group w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-900 dark:text-white hover:text-rose-600 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90 group-active:scale-75" aria-hidden="true" />
          </button>
        </div>

        {/* Streamlined Quick Actions with Generous Spacing and staggered entrance */}
        <div
          className={`shrink-0 p-3.5 sm:p-4 pb-4 sm:pb-5 border-b-[2.5px] border-slate-900 dark:border-slate-800 bg-[#fbfaf8] dark:bg-slate-900 transition-all duration-300 ease-out delay-100 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          {/* Primary Action Button: Create New Deck (Tactile Amber) */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenCreate();
            }}
            className="tactile-btn tactile-btn-amber w-full min-h-[46px] py-2.5 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[0_3px_0_0_#78350f] active:translate-y-0.5 active:shadow-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 stroke-none shrink-0" aria-hidden="true" />
            <span>Create New Deck</span>
          </button>

          {/* Desktop Only: Keyboard Shortcuts (Hidden on mobile phones) */}
          <div className="hidden sm:block mt-3">
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
                onOpenShortcuts();
              }}
              aria-label="Keyboard shortcuts"
              className="w-full flex items-center justify-between p-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] cursor-pointer hover:bg-violet-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#09090b] dark:hover:shadow-[0_3px_0_0_#000] active:translate-y-0 active:shadow-[0_1px_0_0_#09090b] transition-all text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-violet-600 dark:text-violet-400 stroke-[2.2]" />
                <span className="font-black text-slate-900 dark:text-white">Shortcuts</span>
              </div>
              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">?</span>
            </button>
          </div>
        </div>

        {/* Main HERO Section: Decks & Folders (Takes 80%+ of vertical drawer space!) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-2 transition-all duration-300 ease-out delay-150 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between pb-1 px-0.5">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400 stroke-[2.5]" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white">
                Decks & Folders
              </span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-900 dark:text-violet-300 border-[1.5px] border-slate-900 dark:border-violet-700 shadow-[0_1.5px_0_0_#09090b]">
              {uniqueDecks.length}
            </span>
          </div>

          {/* Decks List or Empty State */}
          {topLevelDecks.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40">
              <BookOpen className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 stroke-[1.8] mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No decks yet</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tap &quot;Create New Deck&quot; to begin!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topLevelDecks.map((deck) => {
                const subDecks = uniqueDecks.filter((d) => d.parentId === deck.id);
                const isFolder = deck.isFolder || (deck.cardCount === 0 && subDecks.length > 0);

                return (
                  <div key={deck.id} className="space-y-1.5">
                    {/* Top Deck Item Card */}
                    <div
                      onClick={() => {
                        sounds.playTap();
                        onClose();
                        if (onSelectDeck) onSelectDeck(deck);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          sounds.playTap();
                          onClose();
                          if (onSelectDeck) onSelectDeck(deck);
                        }
                      }}
                      className="p-2.5 min-h-[48px] rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-700 transition-all flex items-center justify-between cursor-pointer group active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[185px]">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {isFolder ? (
                            <Folder className="w-4 h-4 text-amber-500 fill-amber-400/20 stroke-[2.5]" aria-hidden="true" />
                          ) : (
                            getCategoryIcon(deck.category, 'w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2.5]', deck.icon)
                          )}
                        </div>
                        <div className="truncate text-left">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {deck.title}
                          </span>
                          {deck.category && !isFolder && (
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block truncate">
                              {deck.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isFolder ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border-[1.5px] border-slate-900 dark:border-amber-700 shadow-[0_1px_0_0_#09090b] shrink-0">
                            Folder
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border-[1.5px] border-slate-900 dark:border-indigo-700 shadow-[0_1px_0_0_#09090b] shrink-0">
                            {deck.cardCount ?? 0}
                          </span>
                        )}

                        {/* Sub-decks collapse/expand toggle */}
                        {subDecks.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => toggleDeckCollapse(deck.id!, e)}
                            aria-label={collapsedDeckIds[deck.id!] ? `Expand ${deck.title} sub-decks` : `Collapse ${deck.title} sub-decks`}
                            title={collapsedDeckIds[deck.id!] ? 'Expand sub-decks' : 'Collapse sub-decks'}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-white cursor-pointer transition-all active:scale-95 shadow-[0_1px_0_0_#09090b]"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 stroke-[2.8] transition-transform duration-200 ${
                                collapsedDeckIds[deck.id!] ? '-rotate-90' : 'rotate-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sub-decks tree indentation (collapsible) */}
                    {subDecks.length > 0 && !collapsedDeckIds[deck.id!] && (
                      <div className="ml-4 pl-3 border-l-[2.5px] border-indigo-400 dark:border-indigo-600 space-y-1.5 my-1 animate-in fade-in duration-150">
                        {subDecks.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => {
                              sounds.playTap();
                              onClose();
                              if (onSelectDeck) onSelectDeck(sub);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                sounds.playTap();
                                onClose();
                                if (onSelectDeck) onSelectDeck(sub);
                              }
                            }}
                            className="p-2 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border-[1.5px] border-slate-900/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-[0_1px_0_0_#09090b] active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                              <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 stroke-[2.5]" aria-hidden="true" />
                              <span className="truncate">{sub.title}</span>
                            </div>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 shrink-0">
                              {sub.cardCount ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Essential App Pages & Support Links */}
          <div className="pt-3 border-t-[2px] border-slate-200 dark:border-slate-800 space-y-1.5 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-1">
              App & Support
            </span>

            {onOpenHelp && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                  onOpenHelp();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2.2] shrink-0" />
                <span className="font-black">Help & FAQ</span>
              </button>
            )}

            {onOpenAbout && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                  onOpenAbout();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2] shrink-0" />
                <span className="font-black">About & Privacy</span>
              </button>
            )}

            {onOpenFeedback && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                  onOpenFeedback();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left"
              >
                <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.2] shrink-0" />
                <span className="font-black">Feedback & Bug Report</span>
              </button>
            )}

            {onOpenChangelog && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                  onOpenChangelog();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left"
              >
                <History className="w-4 h-4 text-rose-500 stroke-[2.2] shrink-0" />
                <span className="font-black">Changelog & Updates</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400 stroke-[2.2] shrink-0" />
                <span className="font-black">Settings & Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Bottom Tags Strip (~40px) */}
        {allTags.length > 0 && (
          <div
            className={`shrink-0 border-t-[2.5px] border-slate-900 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 px-3.5 sm:px-4 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <div className="flex items-center justify-between mb-1 px-0.5">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Tag className="w-3 h-3 text-amber-500 stroke-[2.5]" />
                <span>Tags ({allTags.length})</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Scroll →</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar -mx-0.5 px-0.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  aria-label={`Filter by tag ${tag}`}
                  className="shrink-0 px-2.5 py-1 min-h-[32px] rounded-xl text-[10px] font-black bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/70 hover:text-amber-900 dark:hover:text-amber-200 text-slate-800 dark:text-slate-200 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] cursor-pointer transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-1 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="text-amber-500 dark:text-amber-400">#</span>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
