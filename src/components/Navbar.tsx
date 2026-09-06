import React from 'react';
import { LogOut, BookOpen, MessageSquareText, Lightbulb, Compass, Shield } from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSignOut: () => void;
  insightCount?: number;
  hasStalePatterns?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onSignOut,
  insightCount = 0,
  hasStalePatterns = false,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-stone-50/85 backdrop-blur-md border-b border-stone-200/70 px-4 sm:px-6 py-2.5 shadow-xs transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('journal')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:bg-indigo-950 transition-colors">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-serif font-bold tracking-tight text-stone-900">
                  MARGIN
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-stone-100 text-stone-600 rounded border border-stone-200">
                  <Shield className="w-2.5 h-2.5 text-emerald-600" />
                  Isolated to your account
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-sans tracking-tight">
                Make room for thought.
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs (if authenticated) */}
        {user && (
          <nav
            id="main-navigation"
            aria-label="Main Navigation"
            className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/60 border border-stone-300/40 text-xs shadow-inner"
          >
            <button
              id="nav-tab-journal"
              onClick={() => onSelectTab('journal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-700" />
              <span>Journal</span>
            </button>

            <button
              id="nav-tab-ask"
              onClick={() => onSelectTab('ask')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'ask'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ask</span>
            </button>

            <button
              id="nav-tab-insights"
              onClick={() => onSelectTab('insights')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Insights</span>
              {insightCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-stone-100 text-stone-600 font-mono">
                  {insightCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-patterns"
              onClick={() => onSelectTab('patterns')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'patterns'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patterns</span>
              {hasStalePatterns && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </nav>
        )}

        {/* User profile & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-stone-300 object-cover shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-semibold text-stone-700 shadow-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-stone-800 truncate max-w-[120px]">
                  {user.displayName || 'User'}
                </p>
              </div>
              <button
                id="navbar-signout-btn"
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-stone-600 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-stone-600" />
              <span className="font-medium">Private Workspace</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
