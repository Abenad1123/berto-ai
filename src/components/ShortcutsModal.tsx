import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { sounds } from '../lib/sound';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: '1, 2, 3, 4', desc: 'Select Multiple Choice options' },
  { key: 'Space', desc: 'Flip Flashcard / Reveal answer' },
  { key: 'Enter', desc: 'Confirm answer / Advance question' },
  { key: '/', desc: 'Instant search decks from anywhere' },
  { key: 'N', desc: 'Open New Deck Creator' },
  { key: '?', desc: 'Open this Keyboard Shortcuts cheat sheet' },
  { key: 'Esc', desc: 'Close open modal / dialog' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="tactile-card w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-7 animate-pop border-[3px] border-slate-900 dark:border-slate-800 shadow-[0_8px_0_0_#09090b]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-[2px] border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center border-[2px] border-slate-900 shadow-[0_2px_0_0_#2e1065]">
              <Keyboard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Keyboard Shortcuts</h3>
              <p className="text-[11px] font-bold text-slate-400">Power studying with zero mouse delay</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close shortcuts modal"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2 py-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 shadow-[0_1.5px_0_0_#09090b]"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white shadow-[0_1.5px_0_0_#09090b] font-mono">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t-[2px] border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="tactile-btn-primary w-full py-2.5 text-xs font-black"
          >
            Got it, Let's Study
          </button>
        </div>
      </div>
    </div>
  );
};
