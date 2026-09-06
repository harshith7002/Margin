import React, { useState } from 'react';
import {
  Lightbulb,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Calendar,
  BookOpen,
  Filter,
  Sparkles,
} from 'lucide-react';
import { SavedInsight, InsightCategory, JournalReflection } from '../types';

interface InsightsViewProps {
  userId: string;
  insights: SavedInsight[];
  reflections: JournalReflection[];
  onSaveInsight: (insight: SavedInsight) => Promise<void>;
  onDeleteInsight: (id: string) => Promise<void>;
  onOpenReflection: (reflectionId: string) => void;
}

const CATEGORIES: InsightCategory[] = [
  'Breakthrough',
  'Pattern',
  'Mindset',
  'Action',
  'Observation',
];

export const InsightsView: React.FC<InsightsViewProps> = ({
  userId,
  insights,
  reflections,
  onSaveInsight,
  onDeleteInsight,
  onOpenReflection,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<InsightCategory>('Pattern');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredInsights = insights.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sourceReflectionTitles || []).some((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const insight: SavedInsight = {
        id: `ins-${now}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        text: newText.trim(),
        category: newCategory,
        sourceReflectionIds: [],
        createdAt: now,
      };

      await onSaveInsight(insight);
      setNewText('');
      setShowCreateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat: InsightCategory) => {
    switch (cat) {
      case 'Breakthrough':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Pattern':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Mindset':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Action':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Observation':
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-stone-200/70 bg-stone-50/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900 font-sans">
                Saved Insights
              </h2>
              <p className="text-[11px] text-stone-500">
                Meaningful observations, patterns, and breakthroughs worth keeping
              </p>
            </div>
          </div>

          <button
            id="add-insight-btn"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Insight</span>
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-insights-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search insights..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 text-[11px] scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              All ({insights.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = insights.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white font-medium'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredInsights.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
              <Lightbulb className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="font-serif italic text-base text-stone-800">
              Your useful thoughts will live here.
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Save observations when exploring in Ask, or tap "+ New Insight" above to capture a realization.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-stone-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(
                        insight.category
                      )}`}
                    >
                      {insight.category}
                    </span>

                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(insight.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif whitespace-pre-wrap">
                    "{insight.text}"
                  </p>
                </div>

                {/* Source links & Actions */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                  {insight.sourceReflectionIds && insight.sourceReflectionIds.length > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                      <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                      <button
                        onClick={() => onOpenReflection(insight.sourceReflectionIds[0])}
                        className="truncate hover:text-indigo-600 underline cursor-pointer"
                      >
                        {insight.sourceReflectionTitles?.[0] || 'View Source Reflection'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-400">Captured Thought</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(insight.text, insight.id)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                      title="Copy insight"
                    >
                      {copiedId === insight.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteInsight(insight.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete insight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Insight Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-stone-900">
                Save an Insight
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as InsightCategory)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-800"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Insight Text
                </label>
                <textarea
                  rows={4}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="What realization or breakthrough did you have?..."
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Insight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
