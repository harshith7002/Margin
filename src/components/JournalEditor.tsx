import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Check,
  Clock,
  Send,
  MessageSquareText,
  Compass,
  Bookmark,
  Calendar,
  AlertCircle,
  RotateCcw,
  FileText,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import Markdown from 'react-markdown';
import {
  JournalReflection,
  TurnMessage,
  ReflectionMode,
  ActiveTab,
} from '../types';

interface JournalEditorProps {
  userId: string;
  activeReflection: JournalReflection | null;
  onSaveReflection: (reflection: JournalReflection) => Promise<void>;
  onStartNewReflection: () => void;
  onNavigateTab: (tab: ActiveTab, initialQuery?: string) => void;
  isSaving: boolean;
}

const PROMPT_STARTERS = [
  'What has been on my mind lately?',
  'What am I avoiding?',
  'What went better than expected?',
  'What did I learn today?',
  'What would I tell my future self?',
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  activeReflection,
  onSaveReflection,
  onStartNewReflection,
  onNavigateTab,
  isSaving,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFutureMe, setIsFutureMe] = useState(false);
  const [futureMeNote, setFutureMeNote] = useState('');
  const [futureMeUnlockPreset, setFutureMeUnlockPreset] = useState('immediate');
  const [showFutureMeInput, setShowFutureMeInput] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [postSaveBanner, setPostSaveBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Companion AI reflection state
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [turns, setTurns] = useState<TurnMessage[]>([]);
  const [isReflecting, setIsReflecting] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state when activeReflection changes
  useEffect(() => {
    if (activeReflection) {
      setTitle(activeReflection.title || '');
      setContent(activeReflection.content || '');
      setIsFutureMe(!!activeReflection.isFutureMe);
      setFutureMeNote(activeReflection.futureMeNote || '');
      setTurns(activeReflection.turns || []);
      setMode(activeReflection.mode || 'reflection');
      setPostSaveBanner(false);
    } else {
      const todayDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      setTitle(`Reflection — ${todayDate}`);
      setContent('');
      setIsFutureMe(false);
      setFutureMeNote('');
      setTurns([]);
      setMode('reflection');
      setPostSaveBanner(false);
    }
    setSelectedPrompt(null);
    setErrorMessage(null);
  }, [activeReflection]);

  // Word and character counts
  const trimmedContent = content.trim();
  const wordCount = trimmedContent ? trimmedContent.split(/\s+/).length : 0;
  const charCount = content.length;

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    if (!content.trim()) {
      setContent(prompt + '\n\n');
    } else {
      // Append naturally without overwriting existing writing
      setContent((prev) => prev.trim() + '\n\n' + prompt + '\n\n');
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, 50);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setErrorMessage('Please write your reflection before saving.');
      return;
    }
    setErrorMessage(null);

    const now = Date.now();
    const finalTitle = title.trim() || `Reflection — ${new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    let futureMeUnlockDate: number | null = null;
    if (isFutureMe && futureMeUnlockPreset !== 'immediate') {
      const day = 24 * 60 * 60 * 1000;
      const days = futureMeUnlockPreset === '1_month' ? 30 : futureMeUnlockPreset === '3_months' ? 90 : futureMeUnlockPreset === '6_months' ? 180 : 365;
      futureMeUnlockDate = now + days * day;
    }

    const reflectionToSave: JournalReflection = {
      id: activeReflection ? activeReflection.id : `ref-${now}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: finalTitle,
      content,
      wordCount,
      charCount,
      isFutureMe,
      futureMeNote: isFutureMe ? futureMeNote.trim() : undefined,
      futureMeUnlockDate: isFutureMe ? futureMeUnlockDate : null,
      mode,
      turns,
      createdAt: activeReflection ? activeReflection.createdAt : now,
      updatedAt: now,
    };

    try {
      await onSaveReflection(reflectionToSave);
      setSaveSuccessNotice(true);
      setPostSaveBanner(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save reflection';
      setErrorMessage(msg);
    }
  };

  // Optional companion reflection with Gemini
  const handleRequestReflection = async (customPrompt?: string) => {
    const textToAnalyze = customPrompt || content;
    if (!textToAnalyze.trim()) {
      setErrorMessage('Write a reflection first so Gemini has context to reflect upon.');
      return;
    }

    setIsReflecting(true);
    setErrorMessage(null);

    const userTurn: TurnMessage = {
      id: `turn-${Date.now()}-user`,
      role: 'user',
      content: textToAnalyze.trim(),
      timestamp: Date.now(),
    };

    const newTurns = [...turns, userTurn];
    setTurns(newTurns);
    if (customPrompt) setFollowUpText('');

    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          turns: newTurns.slice(-6),
          currentInput: textToAnalyze,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Reflection service currently unavailable');
      }

      const modelTurn: TurnMessage = {
        id: `turn-${Date.now()}-model`,
        role: 'model',
        content: data.text,
        timestamp: Date.now(),
      };

      const updatedTurns = [...newTurns, modelTurn];
      setTurns(updatedTurns);

      // Auto-save the reflection with new turn
      const now = Date.now();
      const reflectionToSave: JournalReflection = {
        id: activeReflection ? activeReflection.id : `ref-${now}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: title.trim() || `Reflection — ${new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        content,
        wordCount,
        charCount,
        isFutureMe,
        futureMeNote,
        mode,
        turns: updatedTurns,
        createdAt: activeReflection ? activeReflection.createdAt : now,
        updatedAt: now,
      };

      await onSaveReflection(reflectionToSave);
      setPostSaveBanner(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate reflection';
      setErrorMessage(msg);
    } finally {
      setIsReflecting(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Header & Toolbar */}
      <div className="p-4 border-b border-stone-200/70 bg-stone-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            id="reflection-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reflection Title..."
            className="w-full bg-transparent font-serif text-xl sm:text-2xl font-semibold text-stone-900 placeholder-stone-400 focus:outline-none"
          />
          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 font-sans">
            <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            <span>•</span>
            <span>{charCount} characters</span>
            {activeReflection && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  {new Date(activeReflection.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions: Save for Future Me, New Reflection, Save */}
        <div className="flex items-center gap-2">
          {/* Future Me toggle */}
          <button
            id="future-me-toggle-btn"
            type="button"
            onClick={() => {
              setIsFutureMe(!isFutureMe);
              if (!isFutureMe) setShowFutureMeInput(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isFutureMe
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-stone-600 border-stone-200 hover:text-stone-900'
            }`}
            title="Mark this reflection to revisit in Future Me"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFutureMe ? 'fill-amber-600 text-amber-600' : 'text-stone-400'}`} />
            <span>Future Me</span>
          </button>

          {activeReflection && (
            <button
              id="new-reflection-btn"
              type="button"
              onClick={onStartNewReflection}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium transition-colors cursor-pointer"
            >
              New
            </button>
          )}

          <button
            id="save-reflection-btn"
            type="button"
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-200 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccessNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Future Me Note expandable banner */}
      {isFutureMe && showFutureMeInput && (
        <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200 flex flex-wrap items-center gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 shrink-0">
            <Bookmark className="w-3.5 h-3.5 text-amber-700 shrink-0 fill-amber-700" />
            <span className="font-medium">Note to Future You:</span>
          </div>
          <input
            type="text"
            value={futureMeNote}
            onChange={(e) => setFutureMeNote(e.target.value)}
            placeholder="e.g., Check if this decision brought clarity or if you pivoted..."
            className="flex-1 min-w-[200px] bg-white border border-amber-200 rounded px-2 py-1 text-xs text-amber-950 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
          />
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-amber-800">Unlock:</span>
            <select
              value={futureMeUnlockPreset}
              onChange={(e) => setFutureMeUnlockPreset(e.target.value)}
              className="bg-white border border-amber-200 rounded px-2 py-1 text-[11px] text-amber-900 focus:outline-none cursor-pointer"
            >
              <option value="immediate">Immediate</option>
              <option value="1_month">1 Month</option>
              <option value="3_months">3 Months</option>
              <option value="6_months">6 Months</option>
              <option value="1_year">1 Year</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Message if any */}
      {errorMessage && (
        <div className="m-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Clickable Prompt Starters */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Prompt Starters — Click to insert
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_STARTERS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className={`px-3 py-1.5 rounded-lg text-xs border text-left transition-colors cursor-pointer ${
                  selectedPrompt === prompt
                    ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-xs'
                    : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {selectedPrompt === prompt ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    "{prompt}"
                  </span>
                ) : (
                  `"${prompt}"`
                )}
              </button>
            ))}
          </div>
        </div>

        {/* The Writing Surface */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="journal-content-textarea"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely. What occupies your mind? What patterns or questions are you sitting with today?..."
            className="w-full bg-transparent text-stone-900 text-base leading-relaxed placeholder-stone-400 resize-none focus:outline-none font-sans"
          />
        </div>

        {/* Post-Save Suggestion: "Want to see what MARGIN notices?" */}
        {postSaveBanner && (
          <div
            id="post-save-notice-banner"
            className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3"
          >
            <div className="flex items-center gap-2 text-stone-800">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-serif italic font-medium text-sm">
                Want to see what MARGIN notices?
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Explore recurring patterns across your entries, or ask questions about how your thoughts on this theme have shifted.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                id="post-save-ask-btn"
                type="button"
                onClick={() =>
                  onNavigateTab(
                    'ask',
                    `What recurring themes appear around "${title || 'my recent reflections'}"?`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 hover:bg-stone-100 shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquareText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ask about this reflection</span>
              </button>

              <button
                id="post-save-patterns-btn"
                type="button"
                onClick={() => onNavigateTab('patterns')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 hover:bg-stone-100 shadow-xs transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>See longitudinal patterns</span>
              </button>
            </div>
          </div>
        )}

        {/* Optional Reflection Companion (Turn History) */}
        {turns.length > 0 && (
          <div className="pt-6 border-t border-stone-200/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Reflective Conversation
              </span>
              <span className="text-[11px] text-stone-400">
                Mode: {mode}
              </span>
            </div>

            <div className="space-y-4">
              {turns.map((turn) => {
                const isUser = turn.role === 'user';
                return (
                  <div
                    key={turn.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-serif font-bold">
                        M
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-stone-900 text-white'
                          : 'bg-white border border-stone-200/80 text-stone-800'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{turn.content}</p>
                      ) : (
                        <div className="prose prose-stone max-w-none text-xs sm:text-sm">
                          <Markdown>{turn.content}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Active reflection thinking indicator */}
        {isReflecting && (
          <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>Reflecting and connecting with previous entries...</span>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar for Companion Reflect / Follow-up */}
      <div className="p-3 sm:p-4 border-t border-stone-200/70 bg-stone-50/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-200/60 rounded-lg text-[11px] border border-stone-200">
            <button
              type="button"
              onClick={() => setMode('reflection')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mode === 'reflection' ? 'bg-white text-stone-900 font-medium shadow-xs' : 'text-stone-600'
              }`}
            >
              Reflection
            </button>
            <button
              type="button"
              onClick={() => setMode('summary')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mode === 'summary' ? 'bg-white text-stone-900 font-medium shadow-xs' : 'text-stone-600'
              }`}
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setMode('brainstorm')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mode === 'brainstorm' ? 'bg-white text-stone-900 font-medium shadow-xs' : 'text-stone-600'
              }`}
            >
              Brainstorm
            </button>
            <button
              type="button"
              onClick={() => setMode('coaching')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mode === 'coaching' ? 'bg-white text-stone-900 font-medium shadow-xs' : 'text-stone-600'
              }`}
            >
              Coaching
            </button>
          </div>

          {/* Trigger Gemini Reflection or Send Follow-up */}
          {turns.length === 0 ? (
            <button
              id="reflect-with-gemini-btn"
              type="button"
              onClick={() => handleRequestReflection()}
              disabled={isReflecting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-medium shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reflect on this entry</span>
            </button>
          ) : (
            <div className="flex-1 flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (followUpText.trim()) handleRequestReflection(followUpText);
                  }
                }}
                placeholder="Reply or follow-up with Gemini..."
                className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRequestReflection(followUpText)}
                disabled={isReflecting || !followUpText.trim()}
                className="p-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
