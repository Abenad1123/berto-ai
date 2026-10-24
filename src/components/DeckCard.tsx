import React from 'react';
import { Play, Sparkles, Trash2, Microscope, Code2, Globe2, BookOpen, Atom, Layers, FolderTree, Folder, Tag } from 'lucide-react';
import type { Deck } from '../types';
import { getCategoryIcon } from '../lib/categoryIcons';

interface DeckCardProps {
  deck: Deck;
  subDeckCount?: number;
  onStudy: (deck: Deck) => void;
  onViewDetails: (deck: Deck) => void;
  onDelete: (deckId: number) => void;
  onExploreSubDecks?: (deck: Deck) => void;
  onSelectTag?: (tag: string) => void;
}

const themeConfigs: Record<
  string,
  {
    badge: string;
    accent: string;
    stackBg: string;
    darkStackBg: string;
    iconBg: string;
    btnClass: string;
    defaultIcon: React.ReactNode;
  }
> = {
  emerald: {
    badge: 'bg-emerald-100 text-emerald-950 border-[1.5px] border-slate-900 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-600',
    accent: 'text-emerald-600 dark:text-emerald-400',
    stackBg: 'bg-emerald-200/90',
    darkStackBg: 'dark:bg-emerald-950/60',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    btnClass: 'tactile-btn-emerald',
    defaultIcon: <Microscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />,
  },
  indigo: {
    badge: 'bg-indigo-100 text-indigo-950 border-[1.5px] border-slate-900 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-600',
    accent: 'text-indigo-600 dark:text-indigo-400',
    stackBg: 'bg-indigo-200/90',
    darkStackBg: 'dark:bg-indigo-950/60',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    btnClass: 'tactile-btn-primary',
    defaultIcon: <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />,
  },
  violet: {
    badge: 'bg-violet-100 text-violet-950 border-[1.5px] border-slate-900 dark:bg-violet-950/80 dark:text-violet-200 dark:border-violet-600',
    accent: 'text-violet-600 dark:text-violet-400',
    stackBg: 'bg-violet-200/90',
    darkStackBg: 'dark:bg-violet-950/60',
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    btnClass: 'tactile-btn-violet',
    defaultIcon: <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 stroke-[2.5]" />,
  },
  amber: {
    badge: 'bg-amber-100 text-amber-950 border-[1.5px] border-slate-900 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-600',
    accent: 'text-amber-600 dark:text-amber-400',
    stackBg: 'bg-amber-200/90',
    darkStackBg: 'dark:bg-amber-950/60',
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    btnClass: 'tactile-btn-amber',
    defaultIcon: <Globe2 className="w-5 h-5 text-amber-700 dark:text-amber-300 stroke-[2.5]" />,
  },
  rose: {
    badge: 'bg-rose-100 text-rose-950 border-[1.5px] border-slate-900 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-600',
    accent: 'text-rose-600 dark:text-rose-400',
    stackBg: 'bg-rose-200/90',
    darkStackBg: 'dark:bg-rose-950/60',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    btnClass: 'tactile-btn-rose',
    defaultIcon: <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />,
  },
  sky: {
    badge: 'bg-sky-100 text-sky-950 border-[1.5px] border-slate-900 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-600',
    accent: 'text-sky-600 dark:text-sky-400',
    stackBg: 'bg-sky-200/90',
    darkStackBg: 'dark:bg-sky-950/60',
    iconBg: 'bg-sky-50 dark:bg-sky-950/50',
    btnClass: 'tactile-btn-primary',
    defaultIcon: <Atom className="w-5 h-5 text-sky-600 dark:text-sky-400 stroke-[2.5]" />,
  },
};

export const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  subDeckCount = 0,
  onStudy,
  onViewDetails,
  onDelete,
  onExploreSubDecks,
  onSelectTag,
}) => {
  const theme = themeConfigs[deck.color] || themeConfigs.violet;

  return (
    <div className="relative group cursor-pointer">
      {/* Physical Stack Shadow Layer 2 */}
      <div
        className={`absolute inset-0 ${theme.stackBg} ${theme.darkStackBg} rounded-[1.75rem] border-[2.5px] border-slate-900 dark:border-slate-800 translate-x-2 translate-y-2.5 -z-10 transition-transform duration-150 group-hover:translate-x-3 group-hover:translate-y-3.5 shadow-sm`}
      />

      {/* Main Front Card */}
      <div
        onClick={() => onViewDetails(deck)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onViewDetails(deck);
        }}
        className="tactile-card p-5 sm:p-6 flex flex-col justify-between transition-all duration-150 group-hover:-translate-y-1.5 bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_5px_0_0_#09090b] dark:shadow-[0_5px_0_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 relative z-0"
      >
        <div>
          {/* Top Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Tilted Icon Container with energetic hover */}
              <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} border-[2.5px] border-slate-900 dark:border-slate-700 shadow-[0_3px_0_0_#09090b] dark:shadow-[0_3px_0_0_#000] flex items-center justify-center transform -rotate-3 group-hover:rotate-3 group-hover:scale-105 transition-all shrink-0`}>
                <div className={theme.accent}>
                  {getCategoryIcon(deck.category, 'w-5 h-5 stroke-[2.5]')}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[0_1px_0_0_#09090b] ${theme.badge}`}>
                    {deck.category}
                  </span>

                  {(deck.isFolder || deck.cardCount === 0) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-200 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-[1.5px] border-slate-900 dark:border-amber-600 shadow-[0_1px_0_0_#09090b]">
                      <Folder className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                      <span>Folder</span>
                    </span>
                  )}

                  {/* Sub-decks counter pill if nested */}
                  {subDeckCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onExploreSubDecks) onExploreSubDecks(deck);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-violet-100 dark:bg-violet-950/80 text-violet-900 dark:text-violet-200 border-[1.5px] border-slate-900 dark:border-violet-600 shadow-[0_1px_0_0_#09090b] hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors cursor-pointer"
                      title="View nested sub-decks"
                    >
                      <FolderTree className="w-3 h-3 stroke-[2.5]" />
                      <span>{subDeckCount} {subDeckCount === 1 ? 'Sub-deck' : 'Sub-decks'}</span>
                    </button>
                  )}
                </div>

                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    {deck.isFolder || deck.cardCount === 0
                      ? `${subDeckCount} ${subDeckCount === 1 ? 'Sub-deck' : 'Sub-decks'}`
                      : `${deck.cardCount ?? 0} ${deck.cardCount === 1 ? 'Card' : 'Cards'}`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (deck.id && confirm(`Delete "${deck.title}"?`)) {
                  onDelete(deck.id);
                }
              }}
              aria-label={`Delete deck ${deck.title}`}
              className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-2 min-w-[36px] min-h-[36px] rounded-xl border border-transparent hover:border-slate-900 dark:hover:border-slate-700 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-snug mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {deck.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {deck.description || 'Master this deck with high-yield active recall testing.'}
          </p>

          {/* Tags list */}
          {deck.tags && deck.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {deck.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1px_0_0_#09090b] hover:bg-violet-100 dark:hover:bg-violet-950 hover:text-violet-800 dark:hover:text-violet-300 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Tag className="w-2.5 h-2.5 text-amber-500 stroke-[2.5]" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info & Play Button */}
        <div className="pt-3.5 border-t-[2px] border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(deck);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-[1.5px] border-slate-900/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-[0_1px_0_0_#09090b]"
          >
            {deck.isFolder || deck.cardCount === 0 ? (
              <>
                <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-400/20 stroke-[2.5]" aria-hidden="true" />
                <span>Folder ({subDeckCount})</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                <span>Cards ({deck.cardCount ?? 0})</span>
              </>
            )}
          </button>

          {deck.isFolder || deck.cardCount === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(deck);
              }}
              className="tactile-btn tactile-btn-amber px-4 py-2 text-xs sm:text-sm font-black gap-1.5 shadow-[0_3.5px_0_0_#78350f] active:translate-y-1 active:shadow-none"
            >
              <Folder className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Open Folder</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStudy(deck);
              }}
              className={`tactile-btn ${theme.btnClass} px-5 py-2.5 text-xs sm:text-sm font-black gap-2 shadow-[0_3.5px_0_0_#09090b] active:translate-y-1 active:shadow-none`}
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>Study Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
