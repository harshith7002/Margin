import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Calendar,
  RotateCw,
  Clock,
  BookOpen,
  Bookmark,
  TrendingUp,
  HelpCircle,
  Award,
  Layers,
  Check,
  ChevronRight,
  AlertCircle,
  FileText,
  Flame,
  Plus,
  Lock,
  Unlock,
  Filter,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  PatternsData,
  JournalReflection,
  FutureMeEntry,
  ThenVsNowItem,
  ThenVsNowCategory,
  ReflectionLoopItem,
} from '../types';
import { FutureMeModal } from './FutureMeModal';

interface PatternsViewProps {
  userId: string;
  patterns: PatternsData | null;
  reflections: JournalReflection[];
  futureMeEntries: FutureMeEntry[];
  isLoading: boolean;
  onTriggerReanalyze: () => Promise<void>;
  onOpenReflection: (reflectionId: string) => void;
  onNavigateToWritePrompt: (promptText: string) => void;
  onSaveFutureMe?: (entry: FutureMeEntry) => Promise<void>;
  onDeleteFutureMe?: (id: string) => Promise<void>;
}

export const PatternsView: React.FC<PatternsViewProps> = ({
  userId,
  patterns,
  reflections,
  futureMeEntries,
  isLoading,
  onTriggerReanalyze,
  onOpenReflection,
  onNavigateToWritePrompt,
  onSaveFutureMe,
  onDeleteFutureMe,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'thenVsNow' | 'reflectionLoop' | 'themes' | 'memory' | 'futureMe'
  >('overview');
  const [dismissedChange, setDismissedChange] = useState(false);

  // Then vs Now Category Filter
  const [thenVsNowCategory, setThenVsNowCategory] = useState<string>('all');
  const [isComparingCustom, setIsComparingCustom] = useState(false);
  const [customThenVsNow, setCustomThenVsNow] = useState<ThenVsNowItem[] | null>(null);

  // Future Me write modal
  const [showFutureMeModal, setShowFutureMeModal] = useState(false);
  const [comparingFutureId, setComparingFutureId] = useState<string | null>(null);
  const [futureCompareError, setFutureCompareError] = useState<string | null>(null);

  const hasNewReflections =
    patterns && reflections.length !== patterns.entryCount;

  const formattedAnalyzedDate = patterns?.generatedAt
    ? new Date(patterns.generatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Combine entries from futureMeEntries collection and reflections with isFutureMe
  const allFutureMeEntries: FutureMeEntry[] = [
    ...futureMeEntries,
    ...reflections
      .filter((r) => r.isFutureMe && !futureMeEntries.some((f) => f.reflectionId === r.id))
      .map((r) => ({
        id: `fm-${r.id}`,
        userId,
        reflectionId: r.id,
        reflectionTitle: r.title,
        reflectionSnippet: r.content.substring(0, 300),
        title: r.title,
        message: r.futureMeNote ? `${r.futureMeNote}\n\n${r.content}` : r.content,
        writtenAt: r.createdAt,
        unlockDate: r.futureMeUnlockDate || null,
        isUnlocked: r.futureMeUnlockDate ? Date.now() >= r.futureMeUnlockDate : true,
        comparison: null,
      })),
  ];

  // Compare Future Me with Present Me
  const handleCompareFutureMe = async (entry: FutureMeEntry) => {
    setComparingFutureId(entry.id);
    setFutureCompareError(null);
    try {
      const res = await fetch('/api/future-me-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          futureMessage: entry.message,
          writtenAt: entry.writtenAt,
          title: entry.title,
          reflections: reflections.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: r.createdAt,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to compare Future Me letter');
      }

      const updatedEntry: FutureMeEntry = {
        ...entry,
        isUnlocked: true,
        comparison: data.comparison,
      };

      if (onSaveFutureMe) {
        await onSaveFutureMe(updatedEntry);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error comparing letter';
      setFutureCompareError(msg);
    } finally {
      setComparingFutureId(null);
    }
  };

  // Run On-Demand Then vs Now
  const handleRunFocusedThenVsNow = async () => {
    if (reflections.length < 2) return;
    setIsComparingCustom(true);
    try {
      const res = await fetch('/api/then-vs-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflections: reflections.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: r.createdAt,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.comparison?.items) {
        setCustomThenVsNow(data.comparison.items);
      }
    } catch (err: unknown) {
      console.error('Error running focused Then vs Now:', err);
    } finally {
      setIsComparingCustom(false);
    }
  };

  // Extract items for Then vs Now
  const thenVsNowItems: ThenVsNowItem[] =
    customThenVsNow ||
    patterns?.thenVsNow?.items ||
    (patterns?.thenVsNow?.thenConcerns?.length
      ? patterns.thenVsNow.thenConcerns.map((tc, idx) => ({
          id: `item-${idx}`,
          category: 'concern',
          label: patterns.thenVsNow.thenThemes?.[idx] || 'Recurring Concern',
          then: tc,
          now: patterns.thenVsNow.nowConcerns?.[idx] || patterns.thenVsNow.nowThemes?.[idx] || 'Shifted focus in recent reflections',
          whatChanged: patterns.thenVsNow.whatChangedGrounded || 'Your focus shifted noticeably over time.',
          status: 'shifted',
        }))
      : []);

  const filteredThenVsNowItems = thenVsNowItems.filter((item) => {
    if (thenVsNowCategory === 'all') return true;
    return item.category === thenVsNowCategory;
  });

  // Reflection Loops
  const reflectionLoops: ReflectionLoopItem[] =
    patterns?.reflectionLoops && patterns.reflectionLoops.length > 0
      ? patterns.reflectionLoops
      : (patterns?.recurringThemes || []).map((t, idx) => ({
          id: `loop-${idx}`,
          theme: t.theme,
          pattern: `${t.theme} appears repeatedly across ${t.frequencyCount} reflections with a status of "${t.status}".`,
          question: patterns?.personalQuestions?.[idx]?.question || `When you reflect on ${t.theme}, what currently feels most unresolved?`,
          reflectionPrompt: `When I think about ${t.theme} today, what feels clearest versus what still feels uncertain...`,
          observedChange: patterns?.somethingChanged?.headline || `Tracking how your perspective on ${t.theme} evolves across entries.`,
          status: 'active',
          sourceReflectionIds: t.sourceReflectionIds,
        }));

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs font-sans">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-stone-200/70 bg-stone-50/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900 font-sans">
                Patterns & Evolution
              </h2>
              <p className="text-[11px] text-stone-500">
                Longitudinal intelligence • See what keeps returning and how your thinking has changed over time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formattedAnalyzedDate && (
              <span className="text-[11px] text-stone-400 hidden sm:inline">
                Last analyzed: {formattedAnalyzedDate}
              </span>
            )}
            <button
              id="reanalyze-patterns-btn"
              type="button"
              onClick={onTriggerReanalyze}
              disabled={isLoading || reflections.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyzing...' : 'Re-analyze'}</span>
            </button>
          </div>
        </div>

        {/* Freshness Banner if reflections changed since last analysis */}
        {hasNewReflections && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                New reflections available since last analysis ({reflections.length - (patterns?.entryCount || 0)} new).
              </span>
            </div>
            <button
              onClick={onTriggerReanalyze}
              className="text-xs font-semibold text-amber-900 hover:underline cursor-pointer"
            >
              Re-analyze now →
            </button>
          </div>
        )}

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] pt-1">
          <button
            id="subtab-overview"
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'overview'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Overview & Shifts
          </button>
          <button
            id="subtab-then-vs-now"
            onClick={() => setActiveSubTab('thenVsNow')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeSubTab === 'thenVsNow'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Then vs Now</span>
            {thenVsNowItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-800 font-mono">
                {thenVsNowItems.length}
              </span>
            )}
          </button>
          <button
            id="subtab-reflection-loop"
            onClick={() => setActiveSubTab('reflectionLoop')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeSubTab === 'reflectionLoop'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <RotateCw className="w-3 h-3 text-emerald-500" />
            <span>Reflection Loop</span>
          </button>
          <button
            id="subtab-themes"
            onClick={() => setActiveSubTab('themes')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'themes'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Recurring Themes ({patterns?.recurringThemes?.length || 0})
          </button>
          <button
            id="subtab-memory"
            onClick={() => setActiveSubTab('memory')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'memory'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Reflection Memory ({patterns?.reflectionMemories?.length || 0})
          </button>
          <button
            id="subtab-future-me"
            onClick={() => setActiveSubTab('futureMe')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              activeSubTab === 'futureMe'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Future Me ({allFutureMeEntries.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {reflections.length < 2 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shadow-xs">
              <Compass className="w-6 h-6 stroke-1 text-emerald-600" />
            </div>
            <h3 className="font-serif font-medium text-lg text-stone-900">
              Keep writing
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              MARGIN needs a little more history before it can spot meaningful changes and shifts in your thinking.
              Write at least 2 reflections in your Journal to activate longitudinal pattern recognition and Then vs Now comparisons.
            </p>
          </div>
        ) : !patterns && isLoading ? (
          <div className="py-16 text-center text-xs text-stone-500 space-y-3">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Synthesizing longitudinal patterns across your entries...</p>
          </div>
        ) : (
          <>
            {/* SUB-TAB 1: OVERVIEW & SHIFTS */}
            {activeSubTab === 'overview' && patterns && (
              <div className="space-y-6">
                {/* "SOMETHING CHANGED" Proactive Experience */}
                {patterns.somethingChanged && !dismissedChange && (
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-stone-50 border border-indigo-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold">
                          Something Changed
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {patterns.somethingChanged.confidence}
                        </span>
                      </div>
                      <button
                        onClick={() => setDismissedChange(true)}
                        className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                        title="Dismiss"
                      >
                        Dismiss
                      </button>
                    </div>

                    <h3 className="text-lg font-serif font-semibold text-stone-900">
                      "{patterns.somethingChanged.headline}"
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 bg-white/80 border border-stone-200 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          Earlier Thoughts
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {patterns.somethingChanged.earlierSummary}
                        </p>
                      </div>

                      <div className="p-3 bg-white/80 border border-indigo-100 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-indigo-600">
                          Recent Reflections
                        </span>
                        <p className="text-stone-800 leading-relaxed">
                          {patterns.somethingChanged.recentSummary}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed italic pt-1">
                      {patterns.somethingChanged.whatChangedExplanation}
                    </p>

                    {patterns.somethingChanged.recentSourceIds?.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() =>
                            onOpenReflection(
                              patterns.somethingChanged!.recentSourceIds[0]
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 cursor-pointer"
                        >
                          <span>Read recent reflection</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* WEEKLY REFLECTION BRIEF */}
                {patterns.weeklyBrief && (
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <h3 className="text-sm font-semibold text-stone-900">
                          {patterns.weeklyBrief.periodLabel}
                        </h3>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        Synthesized Reflection
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          What Stood Out
                        </span>
                        <p className="text-stone-800 leading-relaxed font-serif text-sm">
                          {patterns.weeklyBrief.whatStoodOut}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          Nuance Worth Exploring
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {patterns.weeklyBrief.worthExploring}
                        </p>
                      </div>
                    </div>

                    {patterns.weeklyBrief.nextQuestion && (
                      <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50/60 p-3 rounded-xl">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Next Question to Explore
                          </span>
                          <p className="font-serif italic text-stone-900 text-sm">
                            "{patterns.weeklyBrief.nextQuestion}"
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            onNavigateToWritePrompt(
                              patterns.weeklyBrief.nextQuestion
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          Write about this →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: THEN VS NOW (CORE DIFFERENTIATOR) */}
            {activeSubTab === 'thenVsNow' && (
              <div className="space-y-6">
                {/* Intro Banner */}
                <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-serif font-semibold text-stone-900">
                          Then vs Now — Longitudinal Comparison
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-medium">
                          Core Differentiator
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        MARGIN doesn't just store entries. It compares your reflections across time to reveal shifts in concerns, priorities, emotional tone, and perspectives.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunFocusedThenVsNow}
                      disabled={isComparingCustom || reflections.length < 2}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isComparingCustom ? 'animate-spin' : ''}`} />
                      <span>{isComparingCustom ? 'Comparing...' : 'Run Focused Comparison'}</span>
                    </button>
                  </div>

                  {/* Grounded Narrative Summary */}
                  {patterns?.thenVsNow?.whatChangedGrounded && (
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 leading-relaxed space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-stone-500">
                        Overall Trajectory
                      </span>
                      <p>{patterns.thenVsNow.whatChangedGrounded}</p>
                    </div>
                  )}

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 text-[11px]">
                    {[
                      { id: 'all', label: 'All Shifts' },
                      { id: 'concern', label: 'Concerns' },
                      { id: 'priority', label: 'Priorities' },
                      { id: 'emotional_tone', label: 'Emotional Tone' },
                      { id: 'perspective', label: 'Perspective' },
                      { id: 'topic', label: 'Recurring Topics' },
                      { id: 'repeated_thought', label: 'Repeated Thoughts' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setThenVsNowCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                          thenVsNowCategory === cat.id
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Structured Then vs Now Cards */}
                {filteredThenVsNowItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                    <TrendingUp className="w-8 h-8 text-stone-300 mx-auto stroke-1" />
                    <p className="font-medium text-stone-600">No shifts recorded in this category yet</p>
                    <p className="text-[11px]">
                      Keep reflecting in your Journal to capture shifts in emotional tone, priorities, and perspective.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredThenVsNowItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-4"
                      >
                        {/* Header: Label + Category + Status */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              {item.category.replace('_', ' ')}
                            </span>
                            <h4 className="font-serif font-semibold text-stone-900 text-sm">
                              {item.label}
                            </h4>
                          </div>
                          {item.status && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-mono">
                              Status: {item.status}
                            </span>
                          )}
                        </div>

                        {/* Comparative Cards: THEN vs NOW */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* THEN */}
                          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono uppercase font-bold">
                              <span>THEN (Earlier)</span>
                              {item.thenDate && <span>{item.thenDate}</span>}
                            </div>
                            <p className="text-xs text-stone-800 font-serif italic leading-relaxed">
                              "{item.then}"
                            </p>
                            {item.thenSourceId && (
                              <button
                                onClick={() => onOpenReflection(item.thenSourceId!)}
                                className="text-[10px] text-indigo-600 hover:underline cursor-pointer pt-1"
                              >
                                Read earlier reflection →
                              </button>
                            )}
                          </div>

                          {/* NOW */}
                          <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-indigo-700 font-mono uppercase font-bold">
                              <span>NOW (Recent)</span>
                              {item.nowDate && <span>{item.nowDate}</span>}
                            </div>
                            <p className="text-xs text-stone-900 font-serif italic leading-relaxed">
                              "{item.now}"
                            </p>
                            {item.nowSourceId && (
                              <button
                                onClick={() => onOpenReflection(item.nowSourceId!)}
                                className="text-[10px] text-indigo-600 hover:underline cursor-pointer pt-1"
                              >
                                Read recent reflection →
                              </button>
                            )}
                          </div>
                        </div>

                        {/* WHAT CHANGED */}
                        <div className="p-3 bg-stone-50/70 border border-stone-200/80 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">
                            WHAT CHANGED:
                          </span>
                          <p className="text-xs text-stone-800 leading-relaxed font-medium">
                            {item.whatChanged}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: REFLECTION LOOP (PATTERN → QUESTION → REFLECTION → CHANGE) */}
            {activeSubTab === 'reflectionLoop' && (
              <div className="space-y-6">
                <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-base font-serif font-semibold text-stone-900">
                      The Reflection Loop
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    MARGIN connects your journal reflections into a continuous developmental cycle:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs">
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">1. Pattern</span>
                      <span className="text-stone-800 font-medium">Recurring themes identified</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">2. Question</span>
                      <span className="text-stone-800 font-medium">Grounded inquiry generated</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">3. Reflection</span>
                      <span className="text-stone-800 font-medium">Write with pre-loaded prompt</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">4. Change</span>
                      <span className="text-stone-800 font-medium">Track evolved perspective</span>
                    </div>
                  </div>
                </div>

                {/* Loops List */}
                <div className="space-y-4">
                  {reflectionLoops.map((loop) => (
                    <div
                      key={loop.id}
                      className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Theme: {loop.theme}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          Active Loop
                        </span>
                      </div>

                      {/* 4 Steps Visual */}
                      <div className="space-y-3 text-xs">
                        {/* 1. PATTERN */}
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            1. Pattern
                          </span>
                          <p className="text-stone-800 leading-relaxed font-serif">
                            "{loop.pattern}"
                          </p>
                        </div>

                        {/* 2. QUESTION */}
                        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-indigo-700">
                            2. Grounded Question
                          </span>
                          <p className="text-stone-900 font-serif italic text-sm">
                            "{loop.question}"
                          </p>
                        </div>

                        {/* 3. REFLECTION ACTION */}
                        <div className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400">
                              3. Reflection Action
                            </span>
                            <p className="text-stone-600 text-xs">
                              Write your thoughts on this question to close the loop.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNavigateToWritePrompt(loop.reflectionPrompt || loop.question)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          >
                            <span>Write about this</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 4. CHANGE */}
                        {loop.observedChange && (
                          <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-700">
                              4. Observed Evolution & Change
                            </span>
                            <p className="text-stone-800 text-xs leading-relaxed">
                              {loop.observedChange}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: RECURRING THEMES & TIMELINE */}
            {activeSubTab === 'themes' && patterns && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patterns.recurringThemes.map((theme) => (
                    <div
                      key={theme.id}
                      className="p-4 bg-white border border-stone-200/80 rounded-xl shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif font-semibold text-stone-900 text-sm">
                          {theme.theme}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                          {theme.status}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {theme.description}
                      </p>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                        <span>Mentioned in {theme.frequencyCount} {theme.frequencyCount === 1 ? 'reflection' : 'reflections'}</span>
                        {theme.sourceReflectionIds?.length > 0 && (
                          <button
                            onClick={() => onOpenReflection(theme.sourceReflectionIds[0])}
                            className="text-indigo-600 hover:underline cursor-pointer"
                          >
                            View evidence →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 5: REFLECTION MEMORY */}
            {activeSubTab === 'memory' && patterns && (
              <div className="space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                  <p className="font-medium text-stone-800">Lightweight Reflection Memory</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Traceable goals, topics, challenges, and shifts derived strictly from your reflections.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patterns.reflectionMemories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 bg-white border border-stone-200/80 rounded-xl shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {mem.type}
                        </span>
                      </div>

                      <h4 className="font-serif font-semibold text-stone-900 text-sm">
                        {mem.title}
                      </h4>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {mem.description}
                      </p>

                      {mem.sourceReflectionIds?.length > 0 && (
                        <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                          <span>Traceable source</span>
                          <button
                            onClick={() => onOpenReflection(mem.sourceReflectionIds[0])}
                            className="text-indigo-600 hover:underline cursor-pointer"
                          >
                            Read reflection →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 6: FUTURE ME VAULT (SIGNATURE FEATURE) */}
            {activeSubTab === 'futureMe' && (
              <div className="space-y-6">
                {/* Header & Write Button */}
                <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-amber-700 fill-amber-700" />
                        <h3 className="font-serif font-semibold text-stone-900 text-sm">
                          Future Me Vault
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                          Signature Feature
                        </span>
                      </div>
                      <p className="text-xs text-amber-900/80 leading-relaxed">
                        Write private messages to your future self. Once unlocked, MARGIN performs a grounded comparison between what you expected then vs what your writing shows now.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFutureMeModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Write to Future Me</span>
                    </button>
                  </div>
                </div>

                {futureCompareError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{futureCompareError}</span>
                  </div>
                )}

                {allFutureMeEntries.length === 0 ? (
                  <div className="py-16 text-center text-xs text-stone-400 space-y-3">
                    <Bookmark className="w-8 h-8 text-stone-300 mx-auto stroke-1" />
                    <p className="font-medium text-stone-600">No letters written to Future Me yet</p>
                    <p className="text-[11px] max-w-sm mx-auto">
                      Click "Write to Future Me" above, or toggle the Future Me bookmark button inside any Journal reflection.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {allFutureMeEntries.map((entry) => {
                      const isLocked = entry.unlockDate && Date.now() < entry.unlockDate && !entry.isUnlocked;
                      const unlockDateStr = entry.unlockDate
                        ? new Date(entry.unlockDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : null;

                      return (
                        <div
                          key={entry.id}
                          className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-4"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                  <Lock className="w-3 h-3 text-amber-600" />
                                  <span>Unlocks {unlockDateStr}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  <Unlock className="w-3 h-3 text-emerald-600" />
                                  <span>Unlocked</span>
                                </span>
                              )}
                              <h4 className="font-serif font-semibold text-stone-900 text-sm">
                                {entry.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-stone-400">
                              <span>
                                Written on{' '}
                                {new Date(entry.writtenAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              {onDeleteFutureMe && (
                                <button
                                  onClick={() => onDeleteFutureMe(entry.id)}
                                  className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className="p-3.5 bg-amber-50/30 border border-amber-100 rounded-xl space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-800 font-mono">
                              Message Content:
                            </span>
                            <p className="text-xs text-stone-800 font-serif italic leading-relaxed whitespace-pre-line">
                              {entry.message}
                            </p>
                          </div>

                          {/* COMPARISON RESULT IF PRESENT */}
                          {entry.comparison ? (
                            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-indigo-700 font-mono">
                                  You Then vs You Now Analysis:
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  Analyzed {new Date(entry.comparison.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-stone-400">
                                    You Then
                                  </span>
                                  <p className="text-stone-700 leading-relaxed font-serif">
                                    "{entry.comparison.youThen}"
                                  </p>
                                </div>

                                <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-indigo-600">
                                    You Now
                                  </span>
                                  <p className="text-stone-900 leading-relaxed font-serif">
                                    "{entry.comparison.youNow}"
                                  </p>
                                </div>
                              </div>

                              <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-1 text-xs">
                                <span className="text-[10px] uppercase font-bold text-emerald-700 font-mono">
                                  What Changed:
                                </span>
                                <p className="text-stone-800 font-medium leading-relaxed">
                                  {entry.comparison.whatChanged}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* Trigger Comparison Button */
                            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                              <span className="text-[11px] text-stone-500">
                                Compare your past letter with your newer reflections
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCompareFutureMe(entry)}
                                disabled={comparingFutureId === entry.id || reflections.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                {comparingFutureId === entry.id ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Comparing with Present Me...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                                    <span>Compare with Present Me</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Writing to Future Me */}
      {showFutureMeModal && (
        <FutureMeModal
          isOpen={showFutureMeModal}
          onClose={() => setShowFutureMeModal(false)}
          userId={userId}
          reflections={reflections}
          onSaveFutureMe={async (entry) => {
            if (onSaveFutureMe) await onSaveFutureMe(entry);
          }}
          onOpenReflection={onOpenReflection}
        />
      )}
    </div>
  );
};
