import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  Send,
  Sparkles,
  BookOpen,
  BookmarkPlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Markdown from 'react-markdown';
import {
  AskMessage,
  JournalReflection,
  SavedInsight,
  InsightCategory,
} from '../types';

interface AskViewProps {
  userId: string;
  reflections: JournalReflection[];
  initialQuestion?: string | null;
  onOpenReflection: (reflectionId: string) => void;
  onSaveInsight: (insight: SavedInsight) => Promise<void>;
}

const QUICK_INQUIRY_CHIPS = [
  'What keeps coming up in my reflections?',
  'What has changed recently in my thinking?',
  'What situations seem to energize or drain me?',
  'Compare my recent reflections with earlier ones',
  'What themes have become less important over time?',
  'What should I explore or write about next?',
];

export const AskView: React.FC<AskViewProps> = ({
  userId,
  reflections,
  initialQuestion,
  onOpenReflection,
  onSaveInsight,
}) => {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evidence panel collapse/expand
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(null);

  // Save Insight state
  const [savingInsightMsgId, setSavingInsightMsgId] = useState<string | null>(null);
  const [insightCategory, setInsightCategory] = useState<InsightCategory>('Pattern');
  const [insightSavedId, setInsightSavedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prepopulate if initialQuestion is provided
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleAsk(initialQuestion);
    }
  }, [initialQuestion]);

  const handleAsk = async (questionToAsk?: string) => {
    const q = (questionToAsk || inputText).trim();
    if (!q) return;

    setError(null);
    setInputText('');

    const userMsg: AskMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: q,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          history: newMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
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
        throw new Error(data.error || 'Unable to consult journal archive');
      }

      const assistantMsg: AskMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.text,
        sources: data.citations || [],
        evidenceCount: data.citations?.length || 0,
        timestamp: Date.now(),
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error communicating with journal intelligence';
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSaveAsInsight = async (msg: AskMessage) => {
    try {
      const now = Date.now();
      const newInsight: SavedInsight = {
        id: `ins-${now}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        text: msg.content,
        category: insightCategory,
        sourceReflectionIds: msg.sources?.map((s) => s.id) || [],
        sourceReflectionTitles: msg.sources?.map((s) => s.title) || [],
        createdAt: now,
      };

      await onSaveInsight(newInsight);
      setInsightSavedId(msg.id);
      setSavingInsightMsgId(null);
      setTimeout(() => setInsightSavedId(null), 3000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save insight';
      setError(errorMsg);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 border-b border-stone-200/70 bg-stone-50/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900 font-sans">
              Ask My Journal
            </h2>
            <p className="text-[11px] text-stone-500">
              Inquire across your reflection history • Grounded in {reflections.length} {reflections.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear conversation</span>
          </button>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="m-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <MessageSquareText className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-serif font-medium text-stone-900">
                Explore the story your thoughts are telling
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-sans">
                Ask questions about recurring themes, how your mindset has evolved, or what occupied your reflections during specific times.
              </p>
            </div>

            {/* Quick Inquiry Chips */}
            <div className="w-full space-y-2 text-left pt-2">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider text-center">
                Quick Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_INQUIRY_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(chip)}
                    disabled={isLoading || reflections.length === 0}
                    className="p-3 text-xs text-stone-700 bg-white hover:bg-stone-100/80 border border-stone-200/80 rounded-xl text-left transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>

            {reflections.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                You haven't written any reflections yet. Head over to the <strong>Journal</strong> tab to write your first entry.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-serif font-bold text-xs shrink-0 mt-1 shadow-xs">
                    M
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 ${
                    isUser
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200/80 text-stone-800'
                  }`}
                >
                  {/* Message Header */}
                  <div
                    className={`flex items-center justify-between text-[11px] pb-1 border-b ${
                      isUser ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-400'
                    }`}
                  >
                    <span className="font-medium font-sans">
                      {isUser ? 'You asked' : 'MARGIN observation'}
                    </span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Body */}
                  {isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}

                  {/* Sources / Evidence reference chips */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="flex items-center gap-1 font-medium">
                          <BookOpen className="w-3 h-3 text-indigo-600" />
                          Based on {msg.sources.length} {msg.sources.length === 1 ? 'reflection' : 'reflections'}:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEvidenceIdx(
                              expandedEvidenceIdx === idx ? null : idx
                            )
                          }
                          className="flex items-center gap-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          <span>{expandedEvidenceIdx === idx ? 'Hide evidence' : 'View evidence'}</span>
                          {expandedEvidenceIdx === idx ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Source Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src) => (
                          <button
                            key={src.id}
                            onClick={() => onOpenReflection(src.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-indigo-50 hover:text-indigo-900 border border-stone-200 text-[11px] text-stone-700 font-medium transition-colors cursor-pointer"
                            title="Open reflection reader"
                          >
                            <span>{src.title || 'Reflection'}</span>
                            {src.date && <span className="text-stone-400">({src.date})</span>}
                            <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                          </button>
                        ))}
                      </div>

                      {/* Expanded Evidence List */}
                      {expandedEvidenceIdx === idx && (
                        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-[11px] space-y-1.5 mt-2">
                          <p className="font-semibold text-stone-700">Referenced Citations:</p>
                          {msg.sources.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => onOpenReflection(s.id)}
                              className="p-1.5 rounded-lg bg-white border border-stone-200 hover:border-indigo-300 cursor-pointer flex items-center justify-between"
                            >
                              <span className="font-medium text-stone-800 truncate">
                                {s.title}
                              </span>
                              <span className="text-stone-400 text-[10px] shrink-0">
                                {s.date} →
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save as Insight Action Bar */}
                  {!isUser && (
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      {insightSavedId === msg.id ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                          <Check className="w-3 h-3" />
                          Saved to Insights
                        </span>
                      ) : savingInsightMsgId === msg.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <select
                            value={insightCategory}
                            onChange={(e) =>
                              setInsightCategory(e.target.value as InsightCategory)
                            }
                            className="text-[11px] bg-stone-100 border border-stone-200 rounded px-2 py-1 text-stone-800"
                          >
                            <option value="Pattern">Pattern</option>
                            <option value="Breakthrough">Breakthrough</option>
                            <option value="Mindset">Mindset</option>
                            <option value="Action">Action</option>
                            <option value="Observation">Observation</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSaveAsInsight(msg)}
                            className="px-2.5 py-1 bg-stone-900 text-white rounded text-[11px] font-medium hover:bg-stone-800 cursor-pointer"
                          >
                            Confirm Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setSavingInsightMsgId(null)}
                            className="text-stone-400 hover:text-stone-600 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSavingInsightMsgId(msg.id)}
                          className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                        >
                          <BookmarkPlus className="w-3 h-3 text-amber-600" />
                          <span>Save as Insight</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-serif font-bold text-xs shrink-0 mt-1 shadow-xs">
              M
            </div>
            <div className="bg-white border border-stone-200/80 rounded-2xl p-4 text-xs text-stone-600 flex items-center gap-2.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Synthesizing journal evidence across your reflection history...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="p-3 sm:p-4 border-t border-stone-200/70 bg-stone-50/50"
      >
        <div className="relative rounded-xl border border-stone-200 bg-white focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-100 transition-all p-2.5 flex items-center gap-2">
          <input
            id="ask-journal-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || reflections.length === 0}
            placeholder={
              reflections.length === 0
                ? 'Write a reflection first to ask questions...'
                : 'Ask anything about your past reflections and thoughts...'
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
          />

          <button
            id="ask-journal-submit-btn"
            type="submit"
            disabled={isLoading || !inputText.trim() || reflections.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
