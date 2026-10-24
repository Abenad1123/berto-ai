import React, { useState, useEffect } from 'react';
import { X, User, Check } from 'lucide-react';
import { db } from '../lib/db';
import { sounds } from '../lib/sound';
import type { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alex',
    age: 'University Student',
    major: 'Computer Science & Pre-Med',
    motto: 'Consistency beats intensity.',
    avatarColor: 'violet',
    dailyGoalCards: 20,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadProfile = async () => {
      const p = await db.profile.toCollection().first();
      if (p) setProfile(p);
    };
    loadProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    sounds.playTap();
    const existing = await db.profile.toCollection().first();
    if (existing?.id) {
      await db.profile.update(existing.id, profile);
    } else {
      await db.profile.add(profile);
    }
    sounds.playCorrect();
    setIsSaved(true);
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const avatarColors: Record<string, string> = {
    violet: 'bg-violet-600 border-violet-950 text-white',
    emerald: 'bg-emerald-600 border-emerald-950 text-white',
    amber: 'bg-amber-400 border-amber-950 text-slate-950',
    rose: 'bg-rose-600 border-rose-950 text-white',
    sky: 'bg-sky-500 border-sky-950 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="tactile-card w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-7 max-h-[90vh] flex flex-col animate-pop border-[3px] border-slate-900 shadow-[0_8px_0_0_#09090b]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-[2px] border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 text-slate-950 flex items-center justify-center border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b] transform -rotate-2">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Student Profile</h3>
              <p className="text-[11px] font-bold text-slate-400">Personalize your study experience</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close profile"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border-[2px] border-slate-900 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#09090b]"
          >
            <X className="w-4 h-4 text-slate-900 dark:text-white" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 py-4 overflow-y-auto p-1 pr-2 flex-1">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-[2px] border-slate-900 shadow-[0_2px_0_0_#09090b]">
            <div
              className={`w-14 h-14 rounded-2xl border-[2.5px] border-slate-900 flex items-center justify-center font-black text-2xl shadow-[0_3px_0_0_#09090b] ${
                avatarColors[profile.avatarColor] || avatarColors.violet
              }`}
            >
              {profile.name.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Avatar Color
              </label>
              <div className="flex items-center gap-1.5">
                {Object.keys(avatarColors).map((col) => (
                  <button
                    key={col}
                    type="button"
                    aria-label={`Select ${col} avatar color`}
                    onClick={() => setProfile({ ...profile, avatarColor: col })}
                    className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded-full border-[2px] border-slate-900 transition-transform ${
                        col === 'violet'
                          ? 'bg-violet-600'
                          : col === 'emerald'
                          ? 'bg-emerald-500'
                          : col === 'amber'
                          ? 'bg-amber-400'
                          : col === 'rose'
                          ? 'bg-rose-500'
                          : 'bg-sky-400'
                      } ${profile.avatarColor === col ? 'scale-125 ring-2 ring-slate-950 shadow-md' : 'opacity-70 hover:opacity-100'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Age / Grade
              </label>
              <input
                type="text"
                placeholder="e.g. 18 / College"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Daily Card Goal
              </label>
              <input
                type="number"
                min={5}
                max={200}
                value={profile.dailyGoalCards}
                onChange={(e) => setProfile({ ...profile, dailyGoalCards: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              Major / Study Focus
            </label>
            <input
              type="text"
              placeholder="e.g. Biology, Computer Science, Law"
              value={profile.major}
              onChange={(e) => setProfile({ ...profile, major: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              Study Motto
            </label>
            <input
              type="text"
              placeholder="e.g. Master the concepts, ace the exam."
              value={profile.motto}
              onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-[0_2px_0_0_#09090b]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 mt-2 border-t-[2px] border-slate-100 dark:border-slate-800 flex items-center justify-between pb-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="tactile-btn-primary px-6 py-2.5 text-xs sm:text-sm font-black gap-2 shadow-[0_3px_0_0_#1e1b4b]"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Profile</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
