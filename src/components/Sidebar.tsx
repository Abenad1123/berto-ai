import React from 'react';
import {
  X,
  Sparkles,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Keyboard,
  Tag,
  CornerDownRight,
  Folder,
  BookOpen,
  Flame,
} from 'lucide-react';
import type { Deck, UserProfile } from '../types';
import { sounds } from '../lib/sound';
import { getCategoryIcon } from '../lib/categoryIcons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  decks: Deck[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
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
  darkMode,
  onToggleDarkMode,
  onOpenCreate,
  onOpenSettings,
  onOpenProfile,
  onOpenShortcuts,
  onSelectTag,
  onSelectDeck,
}) => {
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

  // Compute total active cards
  const totalCards = uniqueDecks.reduce((sum, d) => sum + (d.cardCount || 0), 0);

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
      <aside className="relative w-[320px] max-w-[88vw] sm:w-84 h-full bg-[#fbfaf8] dark:bg-slate-900 border-r-[3px] border-slate-900 shadow-2xl z-10 flex flex-col p-4 sm:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain animate-in slide-in-from-left duration-200">
        {/* Top Gamified Learner Card */}
        <div className="pb-4 border-b-[2.5px] border-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Learner Profile</span>
            </div>

            {/* Close button (min 44x44px touch target) */}
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              aria-label="Close menu"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-900 dark:text-white hover:text-rose-600 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b] dark:shadow-[0_2px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <X className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>

          <div
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenProfile();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                sounds.playTap();
                onClose();
                onOpenProfile();
              }
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50/60 to-purple-50 dark:from-slate-800 dark:to-indigo-950/40 border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            <div className="flex items-center gap-3">
              {/* Avatar with tilt and Level indicator */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] flex items-center justify-center font-black text-lg group-hover:scale-105 group-hover:rotate-3 transition-transform">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 border border-slate-900 text-[9px] font-black px-1 rounded-md shadow-xs">
                  Lv.1
                </span>
              </div>

              <div className="overflow-hidden flex-1">
                <h3 className="text-sm font-black text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {profile?.name || 'Student Hero'}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  {profile?.major || 'Tap to edit profile'}
                </p>
              </div>
            </div>

            {/* Mini Gamified Stat Pills */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl bg-white dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-700 text-[10px] font-black text-orange-700 dark:text-orange-400 shadow-[0_1px_0_0_#09090b]">
                <Flame className="w-3.5 h-3.5 fill-orange-500 stroke-orange-600" />
                <span>3d Streak</span>
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl bg-white dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-700 text-[10px] font-black text-indigo-700 dark:text-indigo-400 shadow-[0_1px_0_0_#09090b]">
                <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{totalCards} Cards</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="py-4 space-y-2 border-b-[2.5px] border-slate-900 dark:border-slate-800">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenCreate();
            }}
            className="tactile-btn tactile-btn-amber w-full py-3 px-4 text-xs sm:text-sm font-black gap-2 shadow-[0_3.5px_0_0_#78350f] active:translate-y-1 active:shadow-none justify-center"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" aria-hidden="true" />
            <span>Create New Deck</span>
          </button>

          {/* Dark Mode Tactile Switch Card */}
          <div
            onClick={() => {
              sounds.playTap();
              onToggleDarkMode();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                sounds.playTap();
                onToggleDarkMode();
              }
            }}
            className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" /> : <Moon className="w-4 h-4 text-slate-700" aria-hidden="true" />}
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">Dark Mode</span>
            </div>
            <div className={`w-11 h-6 rounded-full border-[2px] border-slate-900 p-0.5 flex items-center transition-colors ${darkMode ? 'bg-indigo-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}>
              <div className="w-4 h-4 rounded-full bg-white border border-slate-900 shadow-sm" />
            </div>
          </div>

          {/* Settings Card */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <SettingsIcon className="w-4 h-4 text-indigo-700 dark:text-indigo-400 stroke-[2.5]" aria-hidden="true" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">Settings & Audio</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Config</span>
          </button>

          {/* Keyboard Shortcuts Card */}
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onOpenShortcuts();
            }}
            className="w-full flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/70 border-[1.5px] border-slate-900 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Keyboard className="w-4 h-4 text-violet-700 dark:text-violet-400 stroke-[2.5]" aria-hidden="true" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">Keyboard Shortcuts</span>
            </div>
            <kbd className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 border-[1.5px] border-slate-900 dark:border-slate-600 text-[10px] font-mono font-black text-slate-800 dark:text-slate-200 shadow-[0_1px_0_0_#09090b]">
              ?
            </kbd>
          </button>
        </div>

        {/* Decks List */}
        <div className="py-4 border-b-[2.5px] border-slate-900 dark:border-slate-800 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400 stroke-[2.5]" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white">
                Decks & Folders
              </span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-900 dark:text-violet-300 border-[1.5px] border-slate-900 dark:border-violet-700 shadow-[0_1.5px_0_0_#09090b]">
              {topLevelDecks.length}
            </span>
          </div>

          <div className="space-y-2">
            {topLevelDecks.map((deck) => {
              const subDecks = uniqueDecks.filter((d) => d.parentId === deck.id);
              const isFolder = deck.isFolder || (deck.cardCount === 0 && subDecks.length > 0);

              return (
                <div key={deck.id} className="space-y-1.5">
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
                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border-[2px] border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b] dark:shadow-[0_2.5px_0_0_#000] hover:bg-violet-50 dark:hover:bg-slate-750 transition-all flex items-center justify-between cursor-pointer group active:translate-y-0.5 active:shadow-none"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[170px]">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {isFolder ? (
                          <Folder className="w-4 h-4 text-amber-500 fill-amber-400/20 stroke-[2.5]" aria-hidden="true" />
                        ) : (
                          getCategoryIcon(deck.category, 'w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2.5]')
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {deck.title}
                      </span>
                    </div>

                    {isFolder ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-[1.5px] border-slate-900 dark:border-amber-700 shadow-[0_1px_0_0_#09090b]">
                        Folder
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border-[1.5px] border-slate-900 dark:border-indigo-700 shadow-[0_1px_0_0_#09090b]">
                        {deck.cardCount ?? 0}
                      </span>
                    )}
                  </div>

                  {/* Sub-decks list */}
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
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-[1.5px] border-slate-900/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-[0_1px_0_0_#09090b]"
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                            <CornerDownRight className="w-3 h-3 text-indigo-500 shrink-0 stroke-[2.5]" aria-hidden="true" />
                            <span className="truncate">{sub.title}</span>
                          </div>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
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
        </div>

        {/* Playful Tag Pills */}
        {allTags.length > 0 && (
          <div className="pt-3 pb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
              <Tag className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
              <span>Tags ({allTags.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  className="px-2.5 py-1 min-h-[32px] rounded-xl text-[10px] font-black bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/70 hover:text-amber-900 dark:hover:text-amber-200 text-slate-800 dark:text-slate-200 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b] dark:shadow-[0_1.5px_0_0_#000] cursor-pointer transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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
