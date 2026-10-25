import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { sounds } from '../lib/sound';

interface FeedbackPageProps {
  onBack: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'question' | 'other';

export function FeedbackPage({ onBack }: FeedbackPageProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Generate system diagnostics
  const getDiagnostics = () => {
    return [
      `--- Berto AI System Diagnostics ---`,
      `App Version: 1.0.0`,
      `Date/Time: ${new Date().toISOString()}`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`,
      `Screen: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}`,
      `Language: ${typeof navigator !== 'undefined' ? navigator.language : 'Unknown'}`,
      `Online Status: ${typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline'}`,
      `Feedback Category: ${feedbackType}`,
      `Subject: ${subject || 'No subject'}`,
    ].join('\n');
  };

  const handleCopyDiagnostics = async () => {
    sounds.playTap();
    const payload = `${getDiagnostics()}\n\nUser Description:\n${description || '(none provided)'}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenEmail = () => {
    sounds.playTap();
    const categoryLabel =
      feedbackType === 'bug'
        ? '[Bug Report]'
        : feedbackType === 'feature'
        ? '[Feature Request]'
        : '[Feedback]';
    const emailSubject = encodeURIComponent(`${categoryLabel} ${subject || 'Berto AI User Feedback'}`);
    const emailBody = encodeURIComponent(
      `Description:\n${description}\n\nContact (optional): ${email}\n\n${getDiagnostics()}`
    );
    window.open(`mailto:support@bertoai.app?subject=${emailSubject}&body=${emailBody}`, '_blank');
  };

  const handleOpenGithub = () => {
    sounds.playTap();
    const issueTitle = encodeURIComponent(subject || `[${feedbackType.toUpperCase()}] New Report`);
    const issueBody = encodeURIComponent(
      `### Description\n${description}\n\n### System Diagnostics\n\`\`\`\n${getDiagnostics()}\n\`\`\``
    );
    window.open(
      `https://github.com/berto-ai/berto-ai/issues/new?title=${issueTitle}&body=${issueBody}`,
      '_blank'
    );
  };

  const handleSubmitLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      sounds.playWrong();
      return;
    }
    sounds.playCorrect();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-16">
      {/* Top Header */}
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
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                <span>Feedback & Bug Report</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
                Report an issue or suggest ideas directly to improve Berto AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {submitted ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-800 shadow-[0_4px_0_0_#09090b] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border-[2px] border-emerald-600 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Feedback Recorded!</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Thank you for helping make Berto AI better. You can also send diagnostics directly via email or GitHub.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleOpenEmail}
                className="tactile-btn-secondary px-4 py-2 text-xs font-black gap-2 shadow-[0_2px_0_0_#09090b]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via Email Client</span>
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  setSubmitted(false);
                  setDescription('');
                  setSubject('');
                }}
                className="tactile-btn-primary px-4 py-2 text-xs font-black shadow-[0_2px_0_0_#09090b]"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitLocal} className="space-y-5">
            {/* Category Select Buttons */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: 'bug', label: 'Bug Report', icon: Bug },
                  { type: 'feature', label: 'Feature Idea', icon: Lightbulb },
                  { type: 'question', label: 'Question', icon: HelpCircle },
                  { type: 'other', label: 'Other', icon: MessageSquare },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = feedbackType === cat.type;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setFeedbackType(cat.type as FeedbackType);
                      }}
                      className={`min-h-[44px] p-2 rounded-xl text-xs font-black border-[2px] border-slate-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-[0_2.5px_0_0_#1e1b4b] -translate-y-0.5'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-[0_2px_0_0_#09090b]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Title / Short Summary
              </label>
              <input
                type="text"
                placeholder="e.g. Card font scaling issue on Android or Quiz timer suggestion"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-bold shadow-[0_2px_0_0_#09090b] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Details & Steps to Reproduce *
              </label>
              <textarea
                rows={5}
                required
                placeholder="What happened? What were you trying to do, and what did you expect to happen instead?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium shadow-[0_2px_0_0_#09090b] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                placeholder="name@example.com (if you'd like a response)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-[2px] border-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-bold shadow-[0_2px_0_0_#09090b] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* System Diagnostics Box */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border-[2px] border-slate-300 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Device & Environment Diagnostics</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Diagnostics'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                {getDiagnostics()}
              </pre>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                className="tactile-btn tactile-btn-indigo w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-black shadow-[0_3px_0_0_#1e1b4b]"
              >
                Submit Feedback
              </button>

              <button
                type="button"
                onClick={handleOpenEmail}
                className="tactile-btn-secondary w-full sm:w-auto px-4 py-2.5 text-xs font-black gap-1.5 shadow-[0_2px_0_0_#09090b]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGithub}
                className="tactile-btn-secondary w-full sm:w-auto px-4 py-2.5 text-xs font-black gap-1.5 shadow-[0_2px_0_0_#09090b]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>GitHub Issue</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
