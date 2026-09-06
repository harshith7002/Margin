import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Lock, Server } from 'lucide-react';

interface SecurityBadgeProps {
  userId: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ userId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-xs border border-stone-200/80 rounded-xl p-3 text-xs text-stone-600 shadow-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-stone-900">Security Architecture Active</span>
            <span className="text-[10px] text-stone-500 ml-2 hidden sm:inline">
              Strict User-Bound Isolation Enforced
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <span>{isExpanded ? 'Hide' : 'Architecture'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-stone-100 space-y-2.5 text-[11px] leading-relaxed">
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-800 font-medium">Firestore Owner Path Isolation: </span>
              <p className="text-stone-500 mt-0.5">
                Every reflection, insight, and pattern is stored under{' '}
                <code className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded border border-stone-200 font-mono">
                  /users/{userId}/*
                </code>{' '}
                and secured with zero-insecure-default rules (<code className="font-mono">request.auth.uid == userId</code>).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Server className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-800 font-medium">Server-Side Gemini API Proxy: </span>
              <p className="text-stone-500 mt-0.5">
                API credentials never touch the browser. Prompt injection defense sanitizes journal entries as pure data. Resilient model fallback ladder configured across Gemini 3.6 Flash and candidate models.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
