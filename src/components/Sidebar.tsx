import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  Settings as SettingsIcon,
  Keyboard,
  Tag,
  CornerDownRight,
  Folder,
  BookOpen,
} from 'lucide-react';
import type { Deck, UserProfile } from '../types';
import { sounds } from '../lib/sound';
import { getCategoryIcon } from '../lib/categoryIcons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  decks: Deck[];
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenShortcuts: () => void;
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
  onSelectTag,
  onSelectDeck,
}) => {
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={() => {
          sounds.playTap();
          onClose();
        }}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Slide-out Menu Panel */}
      <aside className="relative w-[320px] max-w-[88vw] sm:w-[350px] h-full bg-[#fbfaf8] dark:bg-slate-900 border-r-[3px] border-slate-900 shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
        {/* Compact Learner Header (~55px) */}
        <div className="shrink-0 p-3 sm:p-3.5 border-b-[2.5px] border-slate-900 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xs flex items-center justify-between gap-2">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 border border-slate-900 text-[8px] font-black px-1 rounded shadow-xs">
                Lv.1
              </span>
            </div>

            {/* Name + Streak + View Profile Link */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-950 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {profile?.name || 'Student Hero'}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/70 border border-amber-400/80 text-[10px] font-black text-amber-800 dark:text-amber-300 shrink-0">
                  🔥 {profile?.streakDays || 1}d
                </span>
              </div>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 mt-0.5">
                <span>View Profile</span>
                <span className="group-hover:translate-x-0.5 transition-transform font-black">→</span>
              </span>
            </div>
          </button>

          {/* Close button (min 44x44px touch target) */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close menu"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-900 dark:text-white hover:text-rose-600 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>

        {/* Streamlined Quick Actions (~90px total) */}
        <div className="shrink-0 p-3 sm:p-3.5 space-y-2 border-b-[2.5px] border-slate-900 dark:border-slate-800 bg-[#fbfaf8] dark:bg-slate-900">
          {/* Primary Action Button: Create New Deck (Tactile Amber) */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenCreate();
            }}
            className="tactile-btn tactile-btn-amber w-full min-h-[44px] py-2.5 px-3.5 text-xs sm:text-sm font-black gap-2 shadow-[0_3px_0_0_#78350f] active:translate-y-0.5 active:shadow-none justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" aria-hidden="true" />
            <span>Create New Deck</span>
          </button>

          {/* Secondary Row: Side-by-Side Compact Tactile Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Settings & Audio */}
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
                onOpenSettings();
              }}
              aria-label="Settings and audio"
              className="flex items-center gap-2 p-2 px-2.5 min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 active:translate-y-0.5 active:shadow-none transition-all group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <SettingsIcon className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-black text-slate-900 dark:text-white truncate block">Settings</span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate block">Audio & UX</span>
              </div>
            </button>

            {/* Keyboard Shortcuts */}
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
                onOpenShortcuts();
              }}
              aria-label="Keyboard shortcuts"
              className="flex items-center gap-2 p-2 px-2.5 min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 active:translate-y-0.5 active:shadow-none transition-all group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/70 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Keyboard className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-black text-slate-900 dark:text-white truncate block">Shortcuts</span>
                <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 truncate block">Press ?</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main HERO Section: Decks & Folders (Takes 80%+ of vertical drawer space!) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-2">
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
                      className="p-2.5 min-h-[48px] rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-750 transition-all flex items-center justify-between cursor-pointer group active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[185px]">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {isFolder ? (
                            <Folder className="w-4 h-4 text-amber-500 fill-amber-400/20 stroke-[2.5]" aria-hidden="true" />
                          ) : (
                            getCategoryIcon(deck.category, 'w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2.5]')
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

                      {isFolder ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-[1.5px] border-slate-900 dark:border-amber-700 shadow-[0_1px_0_0_#09090b] shrink-0">
                          Folder
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border-[1.5px] border-slate-900 dark:border-indigo-700 shadow-[0_1px_0_0_#09090b] shrink-0">
                          {deck.cardCount ?? 0}
                        </span>
                      )}
                    </div>

                    {/* Sub-decks tree indentation */}
                    {subDecks.length > 0 && (
                      <div className="ml-4 pl-3 border-l-[2.5px] border-indigo-400 dark:border-indigo-600 space-y-1.5 my-1">
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
        </div>

        {/* Compact Bottom Tags Strip (~40px) */}
        {allTags.length > 0 && (
          <div className="shrink-0 border-t-[2.5px] border-slate-900 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 px-3.5 sm:px-4 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
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
