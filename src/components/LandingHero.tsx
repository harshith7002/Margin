import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Sparkles, BookOpen, MessageSquareText, Compass } from 'lucide-react';

interface LandingHeroProps {
  onSignIn: () => void;
  isAuthenticating: boolean;
  authError: string | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSignIn,
  isAuthenticating,
  authError,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      {/* Subtle warm frosted background radiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] bg-gradient-to-b from-stone-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative max-w-2xl mx-auto text-center space-y-8">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-stone-200/80 text-stone-600 text-xs shadow-xs backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          <span className="font-serif italic text-stone-800">Make room for thought.</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-medium tracking-tight text-stone-900 leading-[1.05]">
            MARGIN
          </h1>
          <p className="text-xl sm:text-2xl font-serif italic text-stone-700">
            Write freely. Look back. Discover what keeps returning.
          </p>
          <p className="text-sm sm:text-base text-stone-500 max-w-lg mx-auto leading-relaxed font-sans">
            A private reflection workspace that helps you understand the evolution of your own thoughts over time.
          </p>
        </div>

        {/* Central Reflection Loop Pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-stone-200 text-xs font-mono text-stone-600 shadow-xs">
          <span>WRITE</span>
          <span className="text-stone-400">→</span>
          <span>UNDERSTAND</span>
          <span className="text-stone-400">→</span>
          <span>DISCOVER</span>
          <span className="text-stone-400">→</span>
          <span>CHANGE</span>
          <span className="text-stone-400">→</span>
          <span className="text-indigo-600 font-semibold">REFLECT AGAIN</span>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="landing-start-writing-btn"
            onClick={onSignIn}
            disabled={isAuthenticating}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 font-medium text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isAuthenticating ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-200 border-t-transparent rounded-full animate-spin" />
                <span>Opening private vault...</span>
              </>
            ) : (
              <>
                <span>Start writing</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            id="landing-explore-btn"
            onClick={onSignIn}
            disabled={isAuthenticating}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/80 font-medium text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore my reflections</span>
          </button>
        </div>

        {/* Auth Error Banner if any */}
        {authError && (
          <div
            id="auth-error-banner"
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 max-w-md mx-auto text-left"
          >
            <p className="font-semibold">Authentication Notice</p>
            <p className="mt-0.5">{authError}</p>
          </div>
        )}

        {/* Quote Card: The Ultimate Product Moment */}
        <div className="p-5 rounded-2xl bg-white/60 border border-stone-200/60 shadow-xs max-w-md mx-auto text-left backdrop-blur-sm">
          <p className="font-serif italic text-base text-stone-800">
            "I never realized I kept thinking about this."
          </p>
          <p className="text-[11px] text-stone-400 mt-2 font-sans uppercase tracking-wider">
            Longitudinal reflection with Gemini & Cloud Firestore
          </p>
        </div>

        {/* Subtle Privacy Guarantee */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Isolated to your account UID</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero public exposure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Server-side Gemini 3.6 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
};
