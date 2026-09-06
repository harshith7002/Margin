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
} from 'lucide-react';
import {
  PatternsData,
  JournalReflection,
  FutureMeEntry,
  ActiveTab,
} from '../types';

interface PatternsViewProps {
  userId: string;
  patterns: PatternsData | null;
  reflections: JournalReflection[];
  futureMeEntries: FutureMeEntry[];
  isLoading: boolean;
  onTriggerReanalyze: () => Promise<void>;
  onOpenReflection: (reflectionId: string) => void;
  onNavigateToWritePrompt: (promptText: string) => void;
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
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'thenVsNow' | 'themes' | 'memory' | 'futureMe'
  >('overview');
  const [dismissedChange, setDismissedChange] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
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
                Longitudinal intelligence • See what keeps returning and how your thinking has evolved
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
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Overview & Shifts
          </button>
          <button
            onClick={() => setActiveSubTab('thenVsNow')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'thenVsNow'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Then vs Now
          </button>
          <button
            onClick={() => setActiveSubTab('themes')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'themes'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Recurring Themes ({patterns?.recurringThemes?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('memory')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'memory'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Reflection Memory ({patterns?.reflectionMemories?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('futureMe')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'futureMe'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Bookmark className="w-3 h-3 text-amber-500" />
            <span>Future Me ({reflections.filter((r) => r.isFutureMe).length})</span>
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
              Write at least 2 or 3 reflections in your Journal to activate pattern recognition.
            </p>
          </div>
        ) : !patterns ? (
          <div className="py-16 text-center text-xs text-stone-500 space-y-3">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Synthesizing longitudinal patterns across your entries...</p>
          </div>
        ) : (
          <>
            {/* SUB-TAB 1: OVERVIEW & SHIFTS */}
            {activeSubTab === 'overview' && (
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
                          <span>See the reflections</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Weekly Reflection Brief */}
                {patterns.weeklyBrief && (
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-500" />
                        <h3 className="text-sm font-semibold text-stone-900 font-sans">
                          Weekly Reflection Brief
                        </h3>
                      </div>
                      <span className="text-xs text-stone-500">
                        {patterns.weeklyBrief.periodLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* What occupied thoughts */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                          What occupied your thoughts
                        </span>
                        <ul className="space-y-1">
                          {patterns.weeklyBrief.occupiedThoughts.map(
                            (thought, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-1.5 text-stone-700"
                              >
                                <span className="text-indigo-500 font-bold">•</span>
                                <span>{thought}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* What stood out */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                          What stood out
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {patterns.weeklyBrief.whatStoodOut}
                        </p>
                      </div>

                      {/* Worth exploring */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                          Worth exploring
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

                {/* Personal Question Generator */}
                {patterns.personalQuestions && patterns.personalQuestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          Personal Question Generator
                        </h3>
                        <p className="text-xs text-stone-500">
                          Questions emerging from your recurring themes: PATTERN → QUESTION → REFLECTION
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patterns.personalQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="p-4 bg-white border border-stone-200/80 rounded-xl shadow-xs space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {q.theme}
                            </span>
                            <h4 className="font-serif font-medium text-stone-900 text-sm pt-1">
                              "{q.question}"
                            </h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed">
                              {q.reason}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigateToWritePrompt(q.question)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 hover:text-indigo-700 pt-2 border-t border-stone-100 cursor-pointer"
                          >
                            <span>Write about this</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: THEN VS NOW */}
            {activeSubTab === 'thenVsNow' && patterns.thenVsNow && (
              <div className="space-y-6">
                <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-serif font-semibold text-stone-900">
                      Longitudinal Comparison: Then vs Now
                    </h3>
                    <p className="text-xs text-stone-500">
                      Comparing earlier and recent reflection sets to observe grounded mindset shifts.
                    </p>
                  </div>

                  {/* Then vs Now Side-by-side Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* THEN COLUMN */}
                    <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <span className="font-mono text-xs font-bold text-stone-600 uppercase">
                          THEN (Earlier Reflections)
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="font-semibold text-stone-700">Recurring Themes:</p>
                        <ul className="space-y-1 text-stone-600 pl-2">
                          {patterns.thenVsNow.thenThemes.map((t, idx) => (
                            <li key={idx}>• {t}</li>
                          ))}
                        </ul>

                        <p className="font-semibold text-stone-700 pt-2">Earlier Concerns:</p>
                        <ul className="space-y-1 text-stone-600 pl-2">
                          {patterns.thenVsNow.thenConcerns.map((c, idx) => (
                            <li key={idx}>• {c}</li>
                          ))}
                        </ul>

                        <p className="font-semibold text-stone-700 pt-2">Observed Patterns:</p>
                        <ul className="space-y-1 text-stone-600 pl-2">
                          {patterns.thenVsNow.thenPatterns.map((p, idx) => (
                            <li key={idx}>• {p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* NOW COLUMN */}
                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 uppercase">
                          NOW (Recent Reflections)
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="font-semibold text-stone-700">Recurring Themes:</p>
                        <ul className="space-y-1 text-stone-600 pl-2">
                          {patterns.thenVsNow.nowThemes.map((t, idx) => (
                            <li key={idx}>• {t}</li>
                          ))}
                        </ul>

                        <p className="font-semibold text-stone-700 pt-2">Current Concerns:</p>
                        <ul className="space-y-1 text-stone-600 pl-2">
                          {patterns.thenVsNow.nowConcerns.map((c, idx) => (
                            <li key={idx}>• {c}</li>
                          ))}
                        </ul>

                        <p className="font-semibold text-stone-700 pt-2">Current Patterns:</p>
                        <ul className="space-y-1 text-stone-600 pl-2">
                          {patterns.thenVsNow.nowPatterns.map((p, idx) => (
                            <li key={idx}>• {p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* WHAT CHANGED EXPLANATION */}
                  <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-stone-500">
                      What Changed?
                    </span>
                    <p className="text-xs text-stone-800 leading-relaxed">
                      {patterns.thenVsNow.whatChangedGrounded}
                    </p>
                    <p className="text-[11px] text-stone-400 italic pt-1">
                      Evidence notes: {patterns.thenVsNow.evidenceNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: RECURRING THEMES & TIMELINE */}
            {activeSubTab === 'themes' && (
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

            {/* SUB-TAB 4: REFLECTION MEMORY */}
            {activeSubTab === 'memory' && (
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

            {/* SUB-TAB 5: FUTURE ME VAULT */}
            {activeSubTab === 'futureMe' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    <span>Future Me Reflections</span>
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Reflections marked with [Future Me] so you can look back with fresh eyes and connect earlier intentions with later realities.
                  </p>
                </div>

                {reflections.filter((r) => r.isFutureMe).length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                    <Bookmark className="w-8 h-8 text-stone-300 mx-auto stroke-1" />
                    <p className="font-medium text-stone-600">No reflections saved for Future Me yet</p>
                    <p className="text-[11px] max-w-xs mx-auto">
                      When writing a reflection in Journal, click the "Future Me" bookmark button to save it for your future self.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reflections
                      .filter((r) => r.isFutureMe)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-4 bg-white border border-stone-200/80 rounded-xl shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-serif font-semibold text-stone-900 text-sm truncate">
                              {r.title}
                            </h4>
                            <span className="text-[10px] text-stone-400">
                              {new Date(r.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {r.futureMeNote && (
                            <div className="p-2 bg-amber-50 border border-amber-100 rounded text-[11px] text-amber-900 italic">
                              Note to Future Self: "{r.futureMeNote}"
                            </div>
                          )}

                          <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                            {r.content}
                          </p>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-stone-400">
                              {r.wordCount} words
                            </span>
                            <button
                              onClick={() => onOpenReflection(r.id)}
                              className="text-xs font-semibold text-stone-900 hover:text-indigo-600 cursor-pointer"
                            >
                              Read full reflection →
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
