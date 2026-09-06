import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Calendar,
  BookOpen,
  Bookmark,
  Plus,
} from 'lucide-react';
import { JournalReflection } from '../types';

interface JournalHistoryListProps {
  reflections: JournalReflection[];
  activeId: string | null;
  onSelect: (reflection: JournalReflection) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  onNewEntry: () => void;
}

export const JournalHistoryList: React.FC<JournalHistoryListProps> = ({
  reflections,
  activeId,
  onSelect,
  onDelete,
  isLoading,
  onNewEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'futureMe'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredReflections = reflections.filter((entry) => {
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'futureMe' && entry.isFutureMe);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
      {/* Header & Search */}
      <div className="p-4 border-b border-stone-200/70 space-y-3 bg-stone-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-700" />
            <h2 className="text-sm font-semibold text-stone-900 font-sans">
              Reflections
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono font-medium">
              {reflections.length}
            </span>
            <button
              id="history-new-reflection-btn"
              onClick={onNewEntry}
              title="Write New Reflection"
              className="p-1 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-reflections-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search past thoughts..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-stone-900 text-white font-medium'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('futureMe')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterType === 'futureMe'
                ? 'bg-amber-100 text-amber-900 font-medium'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Bookmark className="w-3 h-3 text-amber-600" />
            <span>Future Me</span>
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400 space-y-2">
            <div className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading reflections...</p>
          </div>
        ) : filteredReflections.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-stone-400 space-y-2">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto stroke-1" />
            <p className="font-medium text-stone-600">
              {searchTerm ? 'No matching reflections found' : 'Your journal is empty'}
            </p>
            <p className="text-[11px] text-stone-400 leading-relaxed max-w-xs mx-auto">
              {searchTerm
                ? 'Try a different search query'
                : 'Write your first reflection to start making room for thought.'}
            </p>
          </div>
        ) : (
          filteredReflections.map((item) => {
            const isActive = activeId === item.id;
            const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`group relative p-3 rounded-xl transition-all cursor-pointer border text-left ${
                  isActive
                    ? 'bg-white border-stone-300 shadow-xs ring-1 ring-stone-900/5'
                    : 'bg-white/50 hover:bg-white border-transparent hover:border-stone-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-xs font-semibold truncate flex-1 font-sans ${
                      isActive ? 'text-stone-900' : 'text-stone-700 group-hover:text-stone-900'
                    }`}
                  >
                    {item.title || 'Untitled Reflection'}
                  </h3>

                  {item.isFutureMe && (
                    <Bookmark className="w-3 h-3 text-amber-600 fill-amber-600 shrink-0 mt-0.5" />
                  )}
                </div>

                <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                  {item.content || 'Empty entry...'}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 text-[10px] text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-stone-400" />
                      {dateFormatted}
                    </span>
                    <span>•</span>
                    <span>{item.wordCount || 0} words</span>
                  </div>

                  {/* Delete trigger */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {deleteConfirmId === item.id ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onDelete(item.id)}
                          className="px-1.5 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-[10px] cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1 py-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        className="p-1 hover:text-rose-600 text-stone-400 transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
