import React, { useState } from 'react';
import {
  Bookmark,
  Calendar,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Clock,
  Send,
  BookOpen,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { FutureMeEntry, JournalReflection } from '../types';

interface FutureMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  reflections: JournalReflection[];
  onSaveFutureMe: (entry: FutureMeEntry) => Promise<void>;
  onOpenReflection: (reflectionId: string) => void;
  initialEntry?: FutureMeEntry | null;
}

export const FutureMeModal: React.FC<FutureMeModalProps> = ({
  isOpen,
  onClose,
  userId,
  reflections,
  onSaveFutureMe,
  onOpenReflection,
  initialEntry,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [message, setMessage] = useState(initialEntry?.message || '');
  const [unlockPreset, setUnlockPreset] = useState<string>('1_month');
  const [customDate, setCustomDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const calculateUnlockTimestamp = (): number | null => {
    if (unlockPreset === 'none') return null;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    switch (unlockPreset) {
      case '1_week':
        return now + 7 * day;
      case '1_month':
        return now + 30 * day;
      case '3_months':
        return now + 90 * day;
      case '6_months':
        return now + 180 * day;
      case '1_year':
        return now + 365 * day;
      case 'custom':
        return customDate ? new Date(customDate).getTime() : null;
      default:
        return now + 30 * day;
    }
  };

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please write a message to your future self.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const now = Date.now();
      const unlockDate = calculateUnlockTimestamp();
      const isUnlocked = unlockDate ? now >= unlockDate : true;

      const entry: FutureMeEntry = {
        id: initialEntry ? initialEntry.id : `fm-${now}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: title.trim() || `Letter to Future Self — ${new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        message: message.trim(),
        writtenAt: initialEntry ? initialEntry.writtenAt : now,
        unlockDate,
        isUnlocked,
        comparison: initialEntry?.comparison || null,
      };

      await onSaveFutureMe(entry);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save Future Me message';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <Bookmark className="w-4 h-4 fill-amber-700 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Write to Future Me
              </h3>
              <p className="text-[11px] text-stone-500">
                Send intentions, questions, or honest fears to your future self
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveLetter} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-stone-700 font-medium">Letter Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Where I hope to be with my career & mindset..."
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-900 font-serif placeholder:font-sans placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Unlock Timeframe */}
          <div className="space-y-1.5">
            <label className="block text-stone-700 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Unlock / Review Horizon</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '1_week', label: '1 Week' },
                { id: '1_month', label: '1 Month' },
                { id: '3_months', label: '3 Months' },
                { id: '6_months', label: '6 Months' },
                { id: '1_year', label: '1 Year' },
                { id: 'none', label: 'Immediate' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setUnlockPreset(preset.id)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    unlockPreset === preset.id
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {unlockPreset === 'custom' && (
              <div className="pt-2">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          {/* Letter Content */}
          <div className="space-y-1">
            <label className="block text-stone-700 font-medium">Message to Your Future Self</label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What are you currently wrestling with? What do you hope will be resolved or clearer when you open this? What question do you want to ask yourself?"
              className="w-full p-3 border border-stone-200 rounded-xl text-xs text-stone-900 leading-relaxed placeholder:text-stone-400 focus:outline-none focus:border-amber-500 resize-none font-serif"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Letter saved to your private Future Me Vault.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Letter...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 fill-white" />
                  <span>Save to Future Me</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
