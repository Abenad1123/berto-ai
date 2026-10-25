import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Volume2,
  Volume1,
  VolumeX,
  Download,
  Upload,
  ExternalLink,
  Check,
  ShieldCheck,
  Moon,
  Sun,
  Sliders,
  Palette,
  Brain,
  Zap,
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Laptop,
  Gauge,
  SlidersHorizontal,
  Vibrate,
  Type,
  PartyPopper,
} from 'lucide-react';
import { db, seedStarterDecks } from '../lib/db';
import { sounds } from '../lib/sound';
import type {
  UserSettings,
  AccentColor,
  CardStylePreference,
  AutoAdvanceSpeed,
  QuizFormatPreference,
  AIDifficulty,
  TextSizePreference,
} from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: (isDark?: boolean) => void;
  userSettings?: UserSettings | null;
}

type SettingsTab = 'look' | 'study' | 'ai' | 'audio' | 'vault';

const ACCENT_COLORS: { id: AccentColor; name: string; hex: string; bgClass: string; ringClass: string }[] = [
  { id: 'violet', name: 'Violet', hex: '#8b5cf6', bgClass: 'bg-violet-500', ringClass: 'ring-violet-500' },
  { id: 'indigo', name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500', ringClass: 'ring-indigo-500' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-500' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b', bgClass: 'bg-amber-500', ringClass: 'ring-amber-500' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e', bgClass: 'bg-rose-500', ringClass: 'ring-rose-500' },
  { id: 'sky', name: 'Sky', hex: '#0284c7', bgClass: 'bg-sky-500', ringClass: 'ring-sky-500' },
];

const CARD_STYLES: { id: CardStylePreference; title: string; tag: string; description: string; icon: typeof Layers }[] = [
  {
    id: 'tactile',
    title: 'Neo-Brutalist',
    tag: 'Tactile 3D',
    description: 'Crisp 2.5px borders & solid 3D offset drop shadows.',
    icon: Layers,
  },
  {
    id: 'modern',
    title: 'Modern Soft',
    tag: 'Subtle Elevation',
    description: 'Smooth ambient depth, rounded curves & gentle borders.',
    icon: SlidersHorizontal,
  },
  {
    id: 'compact',
    title: 'Compact Study',
    tag: 'High Density',
    description: 'Tightened margins & maximized cards per screen for fast drills.',
    icon: Gauge,
  },
];

const QUIZ_FORMATS: { id: QuizFormatPreference; label: string; badge: string; desc: string }[] = [
  { id: 'mixed', label: 'Mixed Adaptive', badge: 'Smart Blend', desc: 'Dynamically alternates question formats based on learning difficulty.' },
  { id: 'multiple_choice', label: 'Multiple Choice', badge: '4 Choices', desc: 'Standard single-answer question with 3 plausible distractors.' },
  { id: 'true_false', label: 'True / False', badge: 'Rapid Binary', desc: 'Quick binary accuracy statements for speed checks.' },
  { id: 'fill_blank', label: 'Cloze Blank', badge: 'Active Term', desc: 'Reconstruct sentences missing their essential keyword [______].' },
  { id: 'multiple_select', label: 'Checkboxes', badge: 'Multi-Select', desc: 'Questions with multiple simultaneous correct answers.' },
  { id: 'flashcard', label: 'Classic Flip', badge: '2-Sided', desc: 'Traditional front-and-back flip cards for active recall.' },
];

const AUTO_ADVANCE_OPTIONS: { id: AutoAdvanceSpeed; label: string; badge: string; desc: string }[] = [
  { id: 'off', label: 'Manual Next', badge: 'Paused', desc: 'Stay on the question until you tap the Next button.' },
  { id: 'fast', label: 'Fast Rush', badge: '1.0s Delay', desc: 'Rapid advance designed for speed drills & blitz reviews.' },
  { id: 'normal', label: 'Balanced', badge: '1.8s Delay', desc: 'Pleasant pause allowing you to read brief feedback.' },
];

const FSRS_TARGETS: { value: number; label: string; rate: string; tag: string; desc: string }[] = [
  { value: 0.85, label: 'Quick Review', rate: '85%', tag: 'Lightest Load', desc: 'Fewer daily reviews; suitable for casual revision or broad surveys.' },
  { value: 0.90, label: 'Balanced Gold', rate: '90%', tag: 'Recommended ★', desc: 'Cognitive science golden standard balancing retention & review load.' },
  { value: 0.95, label: 'Deep Mastery', rate: '95%', tag: 'Exam Intensive', desc: 'High review density to ensure near-zero forgetting before critical exams.' },
];

const AI_DIFFICULTIES: { id: AIDifficulty; label: string; badge: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner Friendly', badge: 'Direct Recall', desc: 'Clear, straightforward questions testing fundamental definitions.' },
  { id: 'balanced', label: 'Balanced College', badge: 'Standard Depth', desc: 'Realistic exam-level reasoning with thoughtful misconceptions.' },
  { id: 'challenging', label: 'Master / Tough', badge: 'High Rigor', desc: 'Multi-step analytical synthesis with challenging distractors.' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  userSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('look');

  // Theme & Appearance
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [accentColor, setAccentColor] = useState<AccentColor>('violet');
  const [cardStyle, setCardStyle] = useState<CardStylePreference>('tactile');
  const [textSize, setTextSize] = useState<TextSizePreference>('normal');
  const [confettiEnabled, setConfettiEnabled] = useState(true);

  // Study & Memory
  const [defaultQuizFormat, setDefaultQuizFormat] = useState<QuizFormatPreference>('mixed');
  const [defaultQuestionCount, setDefaultQuestionCount] = useState<number | 'all'>(10);
  const [autoAdvance, setAutoAdvance] = useState<AutoAdvanceSpeed>('fast');
  const [fsrsRetention, setFsrsRetention] = useState<number>(0.90);

  // AI Engine
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'groq'>('gemini');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('balanced');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Audio & Feedback
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [isPlayingChime, setIsPlayingChime] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Data & Vault
  const [vaultCounts, setVaultCounts] = useState<{ decks: number; cards: number }>({ decks: 0, cards: 0 });
  const [resetConfirmStage, setResetConfirmStage] = useState<'idle' | 'confirm'>('idle');
  const [profileResetConfirmStage, setProfileResetConfirmStage] = useState<'idle' | 'confirm'>('idle');
  const [isSaved, setIsSaved] = useState(false);

  // Load existing settings when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async () => {
      const s = await db.settings.toCollection().first();
      const storedSettings = userSettings || s;

      if (storedSettings) {
        setApiKey(storedSettings.apiKey || '');
        setProvider(storedSettings.aiProvider || 'gemini');
        setSoundEnabled(storedSettings.soundEnabled !== false);
        setSoundVolume(typeof storedSettings.soundVolume === 'number' ? storedSettings.soundVolume : 0.8);
        setHapticsEnabled(storedSettings.hapticsEnabled !== false);
        setAccentColor(storedSettings.accentColor || 'violet');
        setCardStyle(storedSettings.cardStyle || 'tactile');
        setTextSize(storedSettings.textSize || 'normal');
        setConfettiEnabled(storedSettings.confettiEnabled !== false);
        setDefaultQuizFormat(storedSettings.defaultQuizFormat || 'mixed');
        setDefaultQuestionCount(storedSettings.defaultQuestionCount || 10);
        setAutoAdvance(storedSettings.autoAdvance || 'fast');
        setAiDifficulty(storedSettings.aiDifficulty || 'balanced');

        sounds.enabled = storedSettings.soundEnabled !== false;
        sounds.volume = typeof storedSettings.soundVolume === 'number' ? storedSettings.soundVolume : 0.8;
      }

      // Check stored theme mode
      if (typeof window !== 'undefined') {
        const storedThemeMode = localStorage.getItem('berto_theme_mode');
        if (storedThemeMode === 'system' || storedThemeMode === 'dark' || storedThemeMode === 'light') {
          setThemeMode(storedThemeMode);
        } else {
          setThemeMode(darkMode ? 'dark' : 'light');
        }

        const storedRetention = localStorage.getItem('berto_fsrs_retention');
        if (storedRetention) {
          const parsed = parseFloat(storedRetention);
          if (!isNaN(parsed)) setFsrsRetention(parsed);
        }
      }

      // Count decks and cards for vault overview
      try {
        const dCount = await db.decks.count();
        const cCount = await db.cards.count();
        setVaultCounts({ decks: dCount, cards: cCount });
      } catch {
        // Fallback gracefully
      }
    };

    loadSettings();
  }, [isOpen, userSettings, darkMode]);

  if (!isOpen) return null;

  // Theme Mode Selector
  const handleSelectThemeMode = (mode: 'light' | 'dark' | 'system') => {
    sounds.playTap();
    setThemeMode(mode);
    try {
      localStorage.setItem('berto_theme_mode', mode);
    } catch {}

    if (mode === 'system') {
      const isSysDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      onToggleDarkMode(isSysDark);
      document.documentElement.classList.toggle('dark', isSysDark);
    } else if (mode === 'dark') {
      onToggleDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      onToggleDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  };

  // Live Accent Color Changer
  const handleSelectAccent = (color: AccentColor) => {
    sounds.playTap();
    setAccentColor(color);
    document.documentElement.setAttribute('data-accent', color);
  };

  // Live Card Style Changer
  const handleSelectCardStyle = (style: CardStylePreference) => {
    sounds.playTap();
    setCardStyle(style);
    document.documentElement.setAttribute('data-card-style', style);
  };

  // Live Text Size Changer
  const handleSelectTextSize = (size: TextSizePreference) => {
    sounds.playTap();
    setTextSize(size);
    document.documentElement.setAttribute('data-text-size', size);
  };

  // Sound Volume Handler
  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setSoundVolume(clamped);
    sounds.volume = clamped;
    if (clamped > 0 && !soundEnabled) {
      setSoundEnabled(true);
      sounds.enabled = true;
    }
  };

  // Test Chime Audio
  const handleTestSound = () => {
    sounds.enabled = true;
    sounds.volume = soundVolume > 0 ? soundVolume : 0.8;
    sounds.playCorrect();

    if (hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 40, 25]);
      } catch {}
    }

    setIsPlayingChime(true);
    setTimeout(() => setIsPlayingChime(false), 850);
  };

  // Test Haptic Vibration
  const handleTestHaptic = () => {
    sounds.playTap();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([35, 50, 35]);
      } catch {}
    }
  };

  // Live AI Key Verification
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus('error');
      setConnectionMessage('Please enter an API key above before testing.');
      sounds.playWrong();
      return;
    }

    sounds.playTap();
    setConnectionStatus('testing');
    setConnectionMessage('');

    try {
      if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`,
          { method: 'GET' }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: Failed to reach Google Gemini`);
        }
      } else {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: Failed to reach Groq Cloud`);
        }
      }

      setConnectionStatus('success');
      setConnectionMessage(`Connection verified! Your ${provider === 'gemini' ? 'Google Gemini' : 'Groq Cloud'} key is active and ready.`);
      sounds.playCorrect();
    } catch (err: unknown) {
      setConnectionStatus('error');
      const msg = err instanceof Error ? err.message : 'Connection verification failed';
      setConnectionMessage(msg);
      sounds.playWrong();
    }
  };

  // Save Settings to IndexedDB & LocalStorage
  const handleSave = async () => {
    sounds.playTap();
    const existing = await db.settings.toCollection().first();
    const updated: UserSettings = {
      apiKey: apiKey.trim(),
      aiProvider: provider,
      soundEnabled,
      soundVolume,
      hapticsEnabled,
      darkMode,
      accentColor,
      cardStyle,
      autoAdvance,
      defaultQuizFormat,
      defaultQuestionCount,
      confettiEnabled,
      textSize,
      aiDifficulty,
    };

    if (existing?.id) {
      await db.settings.update(existing.id, updated);
    } else {
      await db.settings.add(updated);
    }

    try {
      localStorage.setItem('berto_theme', darkMode ? 'dark' : 'light');
      localStorage.setItem('berto_theme_mode', themeMode);
      localStorage.setItem('berto_fsrs_retention', fsrsRetention.toString());
    } catch {}

    sounds.enabled = soundEnabled;
    sounds.volume = soundVolume;
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.setAttribute('data-accent', accentColor);
    document.documentElement.setAttribute('data-card-style', cardStyle);
    document.documentElement.setAttribute('data-text-size', textSize);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2200);
  };

  // Export JSON Backup
  const handleExportData = async () => {
    sounds.playTap();
    const decks = await db.decks.toArray();
    const cards = await db.cards.toArray();
    const profile = await db.profile.toCollection().first();
    const existingSettings = await db.settings.toCollection().first();

    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      profile,
      settings: existingSettings,
      decks,
      cards,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berto-ai-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playCorrect();
  };

  // Import JSON Backup with Date Sanitization
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const safeParseDate = (val?: string | Date | null, fallback?: Date): Date | undefined => {
      if (!val) return fallback;
      const d = new Date(val);
      return isNaN(d.getTime()) ? fallback : d;
    };

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.decks && Array.isArray(data.decks)) {
        interface RawDeck {
          id?: number;
          title?: string;
          description?: string;
          category?: string;
          color?: string;
          icon?: string;
          cardCount?: number;
          parentId?: number | null;
          isFolder?: boolean;
          tags?: string[];
          createdAt?: string | Date;
          updatedAt?: string | Date;
        }
        const sanitizedDecks = data.decks.map((d: RawDeck) => ({
          ...d,
          createdAt: safeParseDate(d.createdAt, new Date())!,
          updatedAt: safeParseDate(d.updatedAt, new Date())!,
        }));
        await db.decks.bulkPut(sanitizedDecks);
      }

      if (data.cards && Array.isArray(data.cards)) {
        interface RawCard {
          id?: number;
          sourceCardId?: number;
          deckId: number;
          question: string;
          answer: string;
          options?: string[];
          correctAnswers?: string[];
          explanation?: string;
          type: string;
          state?: number;
          due?: string | Date;
          stability?: number;
          difficulty?: number;
          elapsed_days?: number;
          scheduled_days?: number;
          reps?: number;
          lapses?: number;
          learning_steps?: number;
          last_review?: string | Date;
          createdAt?: string | Date;
        }
        const sanitizedCards = data.cards.map((c: RawCard) => ({
          ...c,
          due: safeParseDate(c.due),
          last_review: safeParseDate(c.last_review),
          createdAt: safeParseDate(c.createdAt, new Date())!,
        }));
        await db.cards.bulkPut(sanitizedCards);
      }

      if (data.profile) {
        await db.profile.clear();
        await db.profile.add(data.profile);
      }

      if (data.settings) {
        await db.settings.clear();
        await db.settings.add(data.settings);
      }

      const dCount = await db.decks.count();
      const cCount = await db.cards.count();
      setVaultCounts({ decks: dCount, cards: cCount });

      sounds.playCorrect();
      alert(`Import Successful! Restored ${data.decks?.length || 0} decks and ${data.cards?.length || 0} cards.`);
      window.location.reload();
    } catch (err: unknown) {
      sounds.playWrong();
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'QuotaExceededError') {
        alert('Storage Quota Exceeded! Your device storage is full. Please free up disk space and try again.');
      } else {
        alert(`Import Failed: ${errorObj?.message || 'Invalid backup file. Please ensure the JSON file is a valid Berto AI backup export.'}`);
      }
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Factory Reset Starter Decks
  const handleFactoryReset = async () => {
    sounds.playTap();
    await db.cards.clear();
    await db.decks.clear();
    await seedStarterDecks();
    sounds.playCorrect();
    alert('Factory reset complete. Starter decks restored!');
    window.location.reload();
  };

  // Reset User Profile & Return to Onboarding (Clean slate)
  const handleResetProfile = async () => {
    sounds.playTap();
    await db.profile.clear();
    await db.decks.clear();
    await db.cards.clear();
    sounds.playCorrect();
    onClose();
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }>; tag: string }[] = [
    { id: 'look', label: 'Look & Theme', icon: Palette, tag: 'Style' },
    { id: 'study', label: 'Study & Memory', icon: Brain, tag: 'FSRS' },
    { id: 'ai', label: 'AI Engine', icon: Zap, tag: 'Free API' },
    { id: 'audio', label: 'Audio & Feedback', icon: Volume2, tag: 'Sound' },
    { id: 'vault', label: 'Data & Vault', icon: Database, tag: 'Backup' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="tactile-card w-full max-w-4xl bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_8px_0_0_#09090b] dark:shadow-[0_8px_0_0_#030712] max-h-[92vh] flex flex-col overflow-hidden rounded-3xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 border-b-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-violet-600 text-white flex items-center justify-center font-black border-2 border-slate-900 dark:border-slate-700 shadow-[0_2.5px_0_0_#09090b]">
              <Sliders className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Settings Hub
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                  Customization Center
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tailor themes, study intervals, audio feedback, and AI providers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              aria-label="Close settings"
              className="w-9 h-9 rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer shadow-[0_2.5px_0_0_#09090b] active:translate-y-0.5 active:shadow-none transition-all"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Mobile: Horizontal Scroll, Desktop: Left Sidebar) */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0 bg-slate-50/40 dark:bg-slate-950/20">
          
          {/* Mobile Horizontal Tabs */}
          <div className="sm:hidden flex items-center gap-1.5 p-2 overflow-x-auto no-scrollbar border-b-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-violet-600 dark:border-violet-500 shadow-[0_2px_0_0_#09090b]'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Left Tab Sidebar */}
          <div className="hidden sm:flex flex-col justify-between w-60 shrink-0 border-r-2 border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3.5 space-y-2">
            <div className="space-y-1.5">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Categories
              </span>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setActiveTab(tab.id);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border-2 transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-violet-600 dark:border-violet-500 shadow-[0_3px_0_0_#09090b]'
                        : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tab.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Offline-First Badge */}
            <div className="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Offline-First Architecture. Your data stays in your browser.</span>
            </div>
          </div>

          {/* Main Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* 1. LOOK & THEME */}
            {activeTab === 'look' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Dark / Light / System Mode with tactile preview tiles */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Interface Theme Mode
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Switch between crisp light daylight, high-contrast dark, or automatic system matching.
                  </p>

                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {/* Light Tile */}
                    <button
                      type="button"
                      onClick={() => handleSelectThemeMode('light')}
                      className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                        themeMode === 'light'
                          ? 'border-slate-900 bg-amber-50/90 dark:bg-slate-800 shadow-[0_4px_0_0_#78350f] dark:shadow-[0_4px_0_0_#f59e0b]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:border-slate-400'
                      }`}
                    >
                      {themeMode === 'light' && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-2">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">Light Mode</div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Crisp daylight</div>
                      </div>
                    </button>

                    {/* Dark Tile */}
                    <button
                      type="button"
                      onClick={() => handleSelectThemeMode('dark')}
                      className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                        themeMode === 'dark'
                          ? 'border-slate-900 bg-violet-50 dark:bg-slate-800 shadow-[0_4px_0_0_#2e1065] dark:shadow-[0_4px_0_0_#8b5cf6]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:border-slate-400'
                      }`}
                    >
                      {themeMode === 'dark' && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 dark:bg-violet-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-violet-300 mb-2">
                        <Moon className="w-4 h-4 fill-violet-400 stroke-none" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">Dark Mode</div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Low glare OLED</div>
                      </div>
                    </button>

                    {/* System Tile */}
                    <button
                      type="button"
                      onClick={() => handleSelectThemeMode('system')}
                      className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                        themeMode === 'system'
                          ? 'border-slate-900 bg-sky-50 dark:bg-slate-800 shadow-[0_4px_0_0_#0369a1] dark:shadow-[0_4px_0_0_#38bdf8]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:border-slate-400'
                      }`}
                    >
                      {themeMode === 'system' && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 mb-2">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">System OS</div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Sync with device</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 6 Vivid Accent Colors */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-[0_3px_0_0_#09090b]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">6 Vivid Accent Colors</h4>
                    </div>
                    <span className="text-[11px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider">
                      Active: {accentColor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3.5">
                    Colors reactive rings, key action buttons, and mastery highlights in real time.
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {ACCENT_COLORS.map((col) => {
                      const isSelected = accentColor === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleSelectAccent(col.id)}
                          className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700 shadow-[0_3px_0_0_#09090b] scale-105'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full ${col.bgClass} flex items-center justify-center text-white border-2 border-slate-900 shadow-sm transition-all ${
                              isSelected ? 'ring-4 ring-offset-2 ring-slate-900 dark:ring-offset-slate-800' : ''
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Visual Style Selector */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Card Visual Style
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Choose the visual presentation aesthetic of cards and study modules.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {CARD_STYLES.map((cs) => {
                      const isSelected = cardStyle === cs.id;
                      const Icon = cs.icon;
                      return (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => handleSelectCardStyle(cs.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-[0_4px_0_0_#1e1b4b] dark:border-indigo-400'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-indigo-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200">
                              {cs.tag}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white">{cs.title}</div>
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {cs.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text Scale & Confetti Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Text Scale Toggle */}
                  <div className="p-3.5 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Type className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">Text Legibility Scale</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
                        Increase typography proportions for relaxed studying without eye fatigue.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectTextSize('normal')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                          textSize === 'normal'
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-violet-600 dark:border-violet-500 shadow-[0_2px_0_0_#09090b]'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Standard (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTextSize('large')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                          textSize === 'large'
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-violet-600 dark:border-violet-500 shadow-[0_2px_0_0_#09090b]'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Large (110%)
                      </button>
                    </div>
                  </div>

                  {/* Confetti & Celebrations Switch */}
                  <div className="p-3.5 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b] flex items-center justify-between">
                    <div className="pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <PartyPopper className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">Celebration Confetti</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Joyful particle bursts upon round completion & milestone streaks.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setConfettiEnabled(!confettiEnabled);
                      }}
                      className={`w-12 h-7 rounded-full border-2 border-slate-900 transition-colors p-0.5 flex items-center cursor-pointer shrink-0 ${
                        confettiEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white border-2 border-slate-900 shadow-sm transition-transform duration-150 ${
                          confettiEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDY & MEMORY */}
            {activeTab === 'study' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Default Quiz Format */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Default Quiz Format
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Preferred question format when launching quick study rounds directly from decks.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {QUIZ_FORMATS.map((qf) => {
                      const isSelected = defaultQuizFormat === qf.id;
                      return (
                        <button
                          key={qf.id}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setDefaultQuizFormat(qf.id);
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-violet-50 dark:bg-violet-950/40 shadow-[0_3px_0_0_#2e1065] dark:border-violet-400'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 dark:bg-violet-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-1.5 pr-6">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{qf.label}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {qf.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {qf.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Round Question Count Chips */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Default Round Question Count
                    </h4>
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400">
                      {defaultQuestionCount === 'all' ? 'All Cards in Deck' : `${defaultQuestionCount} Questions`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Number of cards queued per study round when entering study mode.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {([5, 10, 15, 20, 'all'] as const).map((count) => {
                      const isSelected = defaultQuestionCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setDefaultQuestionCount(count);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-violet-600 dark:border-violet-500 shadow-[0_3px_0_0_#09090b]'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {count === 'all' ? 'All Cards' : `${count} Cards`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auto-Advance Speed Picker */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Auto-Advance Speed (On Correct Answer)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Automatically glide to the next question when you pick the correct choice.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {AUTO_ADVANCE_OPTIONS.map((opt) => {
                      const isSelected = autoAdvance === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setAutoAdvance(opt.id);
                          }}
                          className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-amber-50 dark:bg-amber-950/40 shadow-[0_3px_0_0_#78350f] dark:border-amber-400'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-amber-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-1.5 pr-6">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{opt.label}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FSRS Retention Target Indicator */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-gradient-to-br from-indigo-50/70 to-violet-50/70 dark:from-indigo-950/40 dark:to-violet-950/40 shadow-[0_3px_0_0_#1e1b4b]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        FSRS Retention Target Indicator
                      </h4>
                    </div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      Target: {Math.round(fsrsRetention * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">
                    Free Spaced Repetition Scheduler target recall probability. Higher retention yields more repetitions.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {FSRS_TARGETS.map((tgt) => {
                      const isSelected = fsrsRetention === tgt.value;
                      return (
                        <button
                          key={tgt.value}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setFsrsRetention(tgt.value);
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-white dark:bg-slate-800 shadow-[0_3px_0_0_#1e1b4b] dark:border-indigo-400'
                              : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{tgt.rate}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                              {tgt.tag}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-0.5">{tgt.label}</div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                            {tgt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI ENGINE */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* AI Provider Toggle */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      AI Generation Provider
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Berto AI runs 100% free with browser-side API calls. Select your preferred free tier provider.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setProvider('gemini');
                        setConnectionStatus('idle');
                        setConnectionMessage('');
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                        provider === 'gemini'
                          ? 'border-slate-900 bg-indigo-50 dark:bg-indigo-950/40 shadow-[0_4px_0_0_#1e1b4b] dark:border-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {provider === 'gemini' && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white">Google Gemini</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                          Free 1.5 & 2.5 Flash
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Industry-leading reasoning & structured JSON question generation with generous free requests.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setProvider('groq');
                        setConnectionStatus('idle');
                        setConnectionMessage('');
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                        provider === 'groq'
                          ? 'border-slate-900 bg-indigo-50 dark:bg-indigo-950/40 shadow-[0_4px_0_0_#1e1b4b] dark:border-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {provider === 'groq' && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white">Groq Cloud</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                          Llama 3.3 70B
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Lightning fast open weights inference engine with instant sub-second quiz synthesis.
                      </p>
                    </button>
                  </div>
                </div>

                {/* API Key Input with Secure Show/Hide & Connection Test */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_3px_0_0_#09090b] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {provider === 'gemini' ? 'Google Gemini API Key' : 'Groq Cloud API Key'}
                      </h4>
                    </div>

                    <a
                      href={provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://console.groq.com/keys'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Get free {provider === 'gemini' ? 'Gemini' : 'Groq'} key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={provider === 'gemini' ? 'Paste Gemini Key (AIza...)' : 'Paste Groq Key (gsk_...)'}
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setConnectionStatus('idle');
                        }}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        aria-label={showApiKey ? 'Hide API Key' : 'Show API Key'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Test Connection Button */}
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={connectionStatus === 'testing' || !apiKey.trim()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                        connectionStatus === 'success'
                          ? 'bg-emerald-500 text-white shadow-[0_2.5px_0_0_#064e3b]'
                          : connectionStatus === 'error'
                          ? 'bg-rose-500 text-white shadow-[0_2.5px_0_0_#881337]'
                          : 'tactile-btn-primary'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {connectionStatus === 'testing' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : connectionStatus === 'success' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified!</span>
                        </>
                      ) : connectionStatus === 'error' ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Retry Test</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Test Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Connection Feedback Badge */}
                  {connectionStatus === 'success' && (
                    <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{connectionMessage}</span>
                    </div>
                  )}

                  {connectionStatus === 'error' && (
                    <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{connectionMessage}</span>
                    </div>
                  )}

                  {/* Browser Privacy Guarantee */}
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Key is strictly stored in local browser IndexedDB. Never transmitted to Berto AI servers.</span>
                  </div>
                </div>

                {/* AI Quiz Difficulty Selector */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-4 h-4 text-violet-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      AI Question Difficulty
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Adjust prompt engineering instructions to match your targeted test rigor.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {AI_DIFFICULTIES.map((diff) => {
                      const isSelected = aiDifficulty === diff.id;
                      return (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setAiDifficulty(diff.id);
                          }}
                          className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between relative cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-violet-50 dark:bg-violet-950/40 shadow-[0_3px_0_0_#2e1065] dark:border-violet-400'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-violet-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-1.5 pr-6">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{diff.label}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {diff.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                            {diff.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. AUDIO & FEEDBACK */}
            {activeTab === 'audio' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Master Sound Effects Toggle */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border-2 border-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      {soundEnabled && soundVolume > 0 ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Master Sound FX</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Synthesized tactile audio cues for button clicks, card flips, and quiz results
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      sounds.enabled = next;
                      if (next) sounds.playTap();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 border-slate-900 transition-all cursor-pointer ${
                      soundEnabled ? 'tactile-btn-emerald' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {soundEnabled ? 'Enabled' : 'Muted'}
                  </button>
                </div>

                {/* Tactile Volume Slider & Lively Audio Waveform Chime */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {soundVolume === 0 || !soundEnabled ? (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      ) : soundVolume < 0.5 ? (
                        <Volume1 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Volume Level
                      </h4>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {soundEnabled ? `${Math.round(soundVolume * 100)}%` : 'Muted'}
                    </span>
                  </div>

                  {/* Tactile Range Track */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundEnabled ? soundVolume : 0}
                    disabled={!soundEnabled}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />

                  {/* Volume Preset Chips & Test Chime Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex gap-1.5">
                      {[0, 0.5, 0.8, 1.0].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            handleVolumeChange(v);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                            soundVolume === v && soundEnabled
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {v === 0 ? 'Mute' : `${Math.round(v * 100)}%`}
                        </button>
                      ))}
                    </div>

                    {/* Lively Test Chime Button with Waveform Pulse */}
                    <button
                      type="button"
                      onClick={handleTestSound}
                      disabled={!soundEnabled || soundVolume === 0}
                      className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                        isPlayingChime
                          ? 'bg-emerald-400 text-slate-950 scale-95 shadow-none'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_2.5px_0_0_#064e3b] active:translate-y-0.5 active:shadow-none'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isPlayingChime ? (
                        <div className="flex items-center gap-1 h-3.5">
                          <span className="w-1 bg-slate-950 rounded-full animate-bounce [animation-delay:0ms] h-2.5" />
                          <span className="w-1 bg-slate-950 rounded-full animate-bounce [animation-delay:150ms] h-3.5" />
                          <span className="w-1 bg-slate-950 rounded-full animate-bounce [animation-delay:75ms] h-2" />
                          <span className="w-1 bg-slate-950 rounded-full animate-bounce [animation-delay:200ms] h-3" />
                        </div>
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{isPlayingChime ? 'Chiming...' : 'Test Audio Chime'}</span>
                    </button>
                  </div>
                </div>

                {/* Haptic Feedback Toggle */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/70 border-2 border-slate-900 flex items-center justify-center text-violet-600 dark:text-violet-300">
                      <Vibrate className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Haptic Vibration</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Subtle physical tactile clicks on button taps, card turns, and answers
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestHaptic}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-black border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title="Test physical vibration"
                    >
                      Test
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setHapticsEnabled(!hapticsEnabled);
                      }}
                      className={`w-12 h-7 rounded-full border-2 border-slate-900 transition-colors p-0.5 flex items-center cursor-pointer shrink-0 ${
                        hapticsEnabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white border-2 border-slate-900 shadow-sm transition-transform duration-150 ${
                          hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. DATA & VAULT */}
            {activeTab === 'vault' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Vault Count Overview Banner */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-violet-500/10 dark:from-emerald-950/30 dark:to-violet-950/30 shadow-[0_2.5px_0_0_#09090b] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                      <Database className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                        Vault Inventory
                      </h4>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {vaultCounts.decks} Decks • {vaultCounts.cards} Total Study Cards
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                    Encrypted Local DB
                  </span>
                </div>

                {/* Backup & Restore Cards */}
                <div className="p-4 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_2.5px_0_0_#09090b] space-y-3">
                  <div className="text-sm font-black text-slate-900 dark:text-white">Deck Backup & Transfer</div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Export your complete study decks, folder structures, and FSRS spaced repetition history to a portable JSON backup. Transfer smoothly between your desktop, phone, or laptop.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="tactile-btn-secondary flex-1 py-2.5 text-xs font-black gap-2 cursor-pointer shadow-[0_3px_0_0_#09090b]"
                    >
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Export Full Vault (JSON)</span>
                    </button>

                    <label className="tactile-btn-secondary flex-1 py-2.5 text-xs font-black gap-2 cursor-pointer shadow-[0_3px_0_0_#09090b]">
                      <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Import & Restore Backup</span>
                      <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Factory Reset Starter Decks with Double Confirmation */}
                <div className="p-4 rounded-2xl border-2 border-rose-600/70 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/20 shadow-[0_2.5px_0_0_#881337] space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-wider">Danger Zone • Factory Reset</h4>
                  </div>
                  <p className="text-xs text-rose-900/80 dark:text-rose-200/80 font-medium leading-relaxed">
                    Restore the starter Cellular Biology 101 and CS Data Structures demo decks. Useful if you wish to restart your study profile fresh.
                  </p>

                  {resetConfirmStage === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setResetConfirmStage('confirm');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black border-2 border-rose-700 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 shadow-[0_2.5px_0_0_#881337] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Factory Reset Starter Decks</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl border-2 border-rose-600 bg-white dark:bg-slate-900 space-y-2.5 animate-in fade-in">
                      <div className="text-xs font-black text-rose-700 dark:text-rose-300">
                        ⚠️ Are you sure? This will replace your current decks with the initial starter decks!
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setResetConfirmStage('idle');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleFactoryReset}
                          className="px-4 py-1.5 rounded-lg text-xs font-black border-2 border-rose-900 bg-rose-600 text-white hover:bg-rose-500 shadow-[0_2px_0_0_#881337] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Yes, Reset to Defaults</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset User Profile & Restart Onboarding */}
                <div className="p-4 rounded-2xl border-2 border-violet-600/70 dark:border-violet-800/80 bg-violet-50/50 dark:bg-violet-950/20 shadow-[0_2.5px_0_0_#4c1d95] space-y-3">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-wider">Account • Reset Profile</h4>
                  </div>
                  <p className="text-xs text-violet-900/80 dark:text-violet-200/80 font-medium leading-relaxed">
                    Clear your student profile and trigger the onboarding and Terms of Service screen again. Decks and cards remain intact.
                  </p>

                  {profileResetConfirmStage === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setProfileResetConfirmStage('confirm');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black border-2 border-violet-700 bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/60 shadow-[0_2.5px_0_0_#4c1d95] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Profile &amp; Test Onboarding</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl border-2 border-violet-600 bg-white dark:bg-slate-900 space-y-2.5 animate-in fade-in">
                      <div className="text-xs font-black text-violet-700 dark:text-violet-300">
                        ⚠️ Reset profile and show the account creation screen?
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setProfileResetConfirmStage('idle');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetProfile}
                          className="px-4 py-1.5 rounded-lg text-xs font-black border-2 border-violet-900 bg-violet-600 text-white hover:bg-violet-500 shadow-[0_2px_0_0_#4c1d95] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Yes, Reset Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 border-t-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
              Local Auto-Sync Active
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 text-xs sm:text-sm font-black border-2 border-slate-900 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500 text-white shadow-[0_3px_0_0_#064e3b]'
                  : 'tactile-btn-primary shadow-[0_3px_0_0_#1e1b4b]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3] animate-bounce" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
