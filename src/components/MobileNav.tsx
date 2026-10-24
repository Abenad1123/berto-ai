import React from 'react';
import { Menu, Sparkles, Settings as SettingsIcon, User } from 'lucide-react';
import { sounds } from '../lib/sound';
import type { UserProfile } from '../types';

interface MobileNavProps {
  onOpenMenu: () => void;
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  profile?: UserProfile | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenMenu,
  onOpenCreate,
  onOpenSettings,
  onOpenProfile,
  profile,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-[2.5px] border-slate-900 dark:border-slate-800 px-3 py-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-around transition-colors">
      <button
        type="button"
        onClick={() => {
          sounds.playTap();
          onOpenMenu();
        }}
        aria-label="Open menu"
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[48px] gap-1 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shadow-[0_1.5px_0_0_#09090b]">
          <Menu className="w-4 h-4 text-slate-900 dark:text-white" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider">Menu</span>
      </button>

      <button
        type="button"
        onClick={() => {
          sounds.playTap();
          onOpenCreate();
        }}
        aria-label="Create new deck"
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] gap-1 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer -translate-y-2.5"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 border-[2.5px] border-slate-900 shadow-[0_3px_0_0_#2e1065] flex items-center justify-center text-white active:translate-y-0.5 active:shadow-none transition-all">
          <Sparkles className="w-6 h-6 fill-amber-300 stroke-none" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">New Deck</span>
      </button>

      <button
        type="button"
        onClick={() => {
          sounds.playTap();
          onOpenProfile();
        }}
        aria-label="Open profile"
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[48px] gap-1 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shadow-[0_1.5px_0_0_#09090b]">
          {profile?.name ? (
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-4 h-4 text-slate-900 dark:text-white" aria-hidden="true" />
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider">Profile</span>
      </button>

      <button
        type="button"
        onClick={() => {
          sounds.playTap();
          onOpenSettings();
        }}
        aria-label="Open settings"
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[48px] gap-1 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-slate-700 flex items-center justify-center shadow-[0_1.5px_0_0_#09090b]">
          <SettingsIcon className="w-4 h-4 text-slate-900 dark:text-white" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider">Settings</span>
      </button>
    </nav>
  );
};
