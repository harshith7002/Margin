import React from 'react';
import { X, Calendar, Bookmark, FileText } from 'lucide-react';
import Markdown from 'react-markdown';
import { JournalReflection } from '../types';

interface ReflectionModalProps {
  reflection: JournalReflection | null;
  onClose: () => void;
  onSelectForEdit?: (reflection: JournalReflection) => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  reflection,
  onClose,
  onSelectForEdit,
}) => {
  if (!reflection) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white border border-stone-200/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/70 bg-stone-50/60 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-serif font-semibold text-stone-900">
                {reflection.title || 'Untitled Reflection'}
              </h2>
              {reflection.isFutureMe && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Bookmark className="w-2.5 h-2.5 fill-amber-600" />
                  Future Me
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 font-sans">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                {new Date(reflection.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{reflection.wordCount || 0} words</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Future Me note if present */}
        {reflection.futureMeNote && (
          <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/60 text-xs text-amber-900 italic">
            <strong>Note to Future Self:</strong> "{reflection.futureMeNote}"
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-serif">
            {reflection.content}
          </div>

          {/* If there were AI conversation turns in this reflection */}
          {reflection.turns && reflection.turns.length > 0 && (
            <div className="pt-6 border-t border-stone-200/70 space-y-3">
              <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Attached Reflective Discussion
              </h4>
              <div className="space-y-3">
                {reflection.turns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`p-3.5 rounded-xl text-xs sm:text-sm ${
                      turn.role === 'user'
                        ? 'bg-stone-100 text-stone-900 ml-6'
                        : 'bg-indigo-50/60 border border-indigo-100 text-stone-800 mr-6'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-400 mb-1">
                      {turn.role === 'user' ? 'You' : 'MARGIN Reflection'}
                    </span>
                    <Markdown>{turn.content}</Markdown>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-200/70 bg-stone-50/60 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Isolated to your account UID
          </span>
          <div className="flex items-center gap-2">
            {onSelectForEdit && (
              <button
                onClick={() => {
                  onSelectForEdit(reflection);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Open in Editor
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-stone-200/70 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
