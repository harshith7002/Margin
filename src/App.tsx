import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { JournalHistoryList } from './components/JournalHistoryList';
import { JournalEditor } from './components/JournalEditor';
import { AskView } from './components/AskView';
import { InsightsView } from './components/InsightsView';
import { PatternsView } from './components/PatternsView';
import { ReflectionModal } from './components/ReflectionModal';
import { SecurityBadge } from './components/SecurityBadge';
import { DataManagementModal } from './components/DataManagementModal';
import {
  subscribeToAuth,
  signInWithGoogle,
  logOut,
  fetchUserReflections,
  persistReflection,
  removeReflection,
  fetchUserInsights,
  saveUserInsight,
  removeUserInsight,
  fetchUserPatterns,
  saveUserPatterns,
  fetchUserFutureMe,
  persistUserFutureMe,
  removeUserFutureMe,
  deleteAllUserData,
} from './lib/firebase';
import {
  UserProfile,
  ActiveTab,
  JournalReflection,
  SavedInsight,
  PatternsData,
  FutureMeEntry,
} from './types';
import { BookOpen, Sparkles, MessageSquareText, Compass, Lightbulb } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('journal');
  const [mobileJournalView, setMobileJournalView] = useState<'editor' | 'history'>('editor');

  // Core Data Collections
  const [reflections, setReflections] = useState<JournalReflection[]>([]);
  const [activeReflectionId, setActiveReflectionId] = useState<string | null>(null);
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  // Insights
  const [insights, setInsights] = useState<SavedInsight[]>([]);

  // Patterns
  const [patterns, setPatterns] = useState<PatternsData | null>(null);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);

  // Future Me
  const [futureMeEntries, setFutureMeEntries] = useState<FutureMeEntry[]>([]);

  // Privacy & Data Management Modal
  const [showDataManagementModal, setShowDataManagementModal] = useState(false);

  // Cross-tab interaction states
  const [askInitialQuestion, setAskInitialQuestion] = useState<string | null>(null);
  const [readerModalReflection, setReaderModalReflection] = useState<JournalReflection | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all user data when user changes
  const loadUserData = useCallback(async (userId: string) => {
    setIsLoadingReflections(true);
    try {
      const [userReflections, userInsights, userPatterns, userFutureMe] = await Promise.all([
        fetchUserReflections(userId),
        fetchUserInsights(userId),
        fetchUserPatterns(userId),
        fetchUserFutureMe(userId),
      ]);

      setReflections(userReflections);
      setInsights(userInsights);
      setPatterns(userPatterns);
      setFutureMeEntries(userFutureMe);

      // Default to first reflection or new if none
      if (userReflections.length > 0) {
        setActiveReflectionId(userReflections[0].id);
      }
    } catch (err: unknown) {
      console.error('Error loading user data:', err);
    } finally {
      setIsLoadingReflections(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadUserData(user.uid);
    } else {
      setReflections([]);
      setInsights([]);
      setPatterns(null);
      setFutureMeEntries([]);
      setActiveReflectionId(null);
    }
  }, [user?.uid, loadUserData]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const profile = await signInWithGoogle();
      setUser(profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      console.error('Sign in error:', msg);
      setAuthError(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setActiveTab('journal');
    } catch (err: unknown) {
      console.error('Sign out error:', err);
    }
  };

  // Reflection CRUD
  const handleSaveReflection = async (reflection: JournalReflection) => {
    if (!user) return;
    setIsSavingReflection(true);
    try {
      await persistReflection(user.uid, reflection);

      setReflections((prev) => {
        const index = prev.findIndex((r) => r.id === reflection.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = reflection;
          return next;
        }
        return [reflection, ...prev];
      });

      setActiveReflectionId(reflection.id);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const handleDeleteReflection = async (id: string) => {
    if (!user) return;
    try {
      await removeReflection(user.uid, id);
      setReflections((prev) => prev.filter((r) => r.id !== id));
      if (activeReflectionId === id) {
        setActiveReflectionId(null);
      }
    } catch (err: unknown) {
      console.error('Failed to delete reflection:', err);
    }
  };

  const handleStartNewReflection = () => {
    setActiveReflectionId(null);
    setMobileJournalView('editor');
  };

  // Insight CRUD
  const handleSaveInsight = async (insight: SavedInsight) => {
    if (!user) return;
    await saveUserInsight(user.uid, insight);
    setInsights((prev) => [insight, ...prev]);
  };

  const handleDeleteInsight = async (id: string) => {
    if (!user) return;
    await removeUserInsight(user.uid, id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  // Patterns Analysis
  const handleTriggerReanalyze = async () => {
    if (!user || reflections.length < 2) return;
    setIsAnalyzingPatterns(true);
    try {
      const res = await fetch('/api/patterns', {
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Pattern analysis failed');
      }

      const newPatterns = data.patterns as PatternsData;
      await saveUserPatterns(user.uid, newPatterns);
      setPatterns(newPatterns);
    } catch (err: unknown) {
      console.error('Pattern analysis error:', err);
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  // Future Me Handlers
  const handleSaveFutureMe = async (entry: FutureMeEntry) => {
    if (!user?.uid) return;
    await persistUserFutureMe(user.uid, entry);
    setFutureMeEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteFutureMe = async (entryId: string) => {
    if (!user?.uid) return;
    await removeUserFutureMe(user.uid, entryId);
    setFutureMeEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleDeleteAllUserData = async () => {
    if (!user?.uid) return;
    await deleteAllUserData(user.uid);
    setReflections([]);
    setInsights([]);
    setPatterns(null);
    setFutureMeEntries([]);
    setActiveReflectionId(null);
  };

  // Cross-Navigation helpers
  const handleNavigateTabWithQuery = (tab: ActiveTab, initialQuery?: string) => {
    if (tab === 'ask' && initialQuery) {
      setAskInitialQuestion(initialQuery);
    }
    setActiveTab(tab);
  };

  const handleOpenReflectionById = (reflectionId: string) => {
    const found = reflections.find((r) => r.id === reflectionId);
    if (found) {
      setReaderModalReflection(found);
    }
  };

  const handleNavigateToWritePrompt = (promptText: string) => {
    setActiveReflectionId(null);
    setActiveTab('journal');
    setMobileJournalView('editor');
  };

  const activeReflection =
    reflections.find((r) => r.id === activeReflectionId) || null;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 tracking-wide font-medium font-serif italic">
          Opening MARGIN workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-stone-200 selection:text-stone-900">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setAskInitialQuestion(null);
        }}
        onSignOut={handleSignOut}
        onOpenDataManagement={() => setShowDataManagementModal(true)}
        insightCount={insights.length}
        hasStalePatterns={patterns ? reflections.length !== patterns.entryCount : false}
      />

      <main className="flex-1 flex flex-col">
        {!user ? (
          <LandingHero
            onSignIn={handleSignIn}
            isAuthenticating={isSigningIn}
            authError={authError}
          />
        ) : (
          <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4">
            {/* Top Security & Isolation Status */}
            <SecurityBadge userId={user.uid} />

            {/* TAB CONTENT 1: JOURNAL */}
            {activeTab === 'journal' && (
              <div className="flex-1 flex flex-col gap-4">
                {/* Mobile view switcher */}
                <div className="flex md:hidden items-center p-1 rounded-xl bg-white border border-stone-200 text-xs shadow-xs">
                  <button
                    onClick={() => setMobileJournalView('editor')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mobileJournalView === 'editor'
                        ? 'bg-stone-900 text-white font-medium'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Writing Surface</span>
                  </button>
                  <button
                    onClick={() => setMobileJournalView('history')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mobileJournalView === 'history'
                        ? 'bg-stone-900 text-white font-medium'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Reflections ({reflections.length})</span>
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[620px]">
                  {/* History Sidebar */}
                  <div
                    className={`md:col-span-4 lg:col-span-3 h-[600px] md:h-[calc(100vh-190px)] ${
                      mobileJournalView === 'history' ? 'block' : 'hidden md:block'
                    }`}
                  >
                    <JournalHistoryList
                      reflections={reflections}
                      activeId={activeReflectionId}
                      onSelect={(entry) => {
                        setActiveReflectionId(entry.id);
                        setMobileJournalView('editor');
                      }}
                      onDelete={handleDeleteReflection}
                      isLoading={isLoadingReflections}
                      onNewEntry={handleStartNewReflection}
                    />
                  </div>

                  {/* Journal Writing Surface */}
                  <div
                    className={`md:col-span-8 lg:col-span-9 h-[600px] md:h-[calc(100vh-190px)] ${
                      mobileJournalView === 'editor' ? 'block' : 'hidden md:block'
                    }`}
                  >
                    <JournalEditor
                      userId={user.uid}
                      activeReflection={activeReflection}
                      onSaveReflection={handleSaveReflection}
                      onStartNewReflection={handleStartNewReflection}
                      onNavigateTab={handleNavigateTabWithQuery}
                      isSaving={isSavingReflection}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: ASK */}
            {activeTab === 'ask' && (
              <div className="flex-1 h-[calc(100vh-180px)] min-h-[600px]">
                <AskView
                  userId={user.uid}
                  reflections={reflections}
                  initialQuestion={askInitialQuestion}
                  onOpenReflection={handleOpenReflectionById}
                  onSaveInsight={handleSaveInsight}
                />
              </div>
            )}

            {/* TAB CONTENT 3: INSIGHTS */}
            {activeTab === 'insights' && (
              <div className="flex-1 h-[calc(100vh-180px)] min-h-[600px]">
                <InsightsView
                  userId={user.uid}
                  insights={insights}
                  reflections={reflections}
                  onSaveInsight={handleSaveInsight}
                  onDeleteInsight={handleDeleteInsight}
                  onOpenReflection={handleOpenReflectionById}
                />
              </div>
            )}

            {/* TAB CONTENT 4: PATTERNS */}
            {activeTab === 'patterns' && (
              <div className="flex-1 h-[calc(100vh-180px)] min-h-[600px]">
                <PatternsView
                  userId={user.uid}
                  patterns={patterns}
                  reflections={reflections}
                  futureMeEntries={futureMeEntries}
                  isLoading={isAnalyzingPatterns}
                  onTriggerReanalyze={handleTriggerReanalyze}
                  onOpenReflection={handleOpenReflectionById}
                  onNavigateToWritePrompt={handleNavigateToWritePrompt}
                  onSaveFutureMe={handleSaveFutureMe}
                  onDeleteFutureMe={handleDeleteFutureMe}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reader Modal for viewing source reflections */}
      {readerModalReflection && (
        <ReflectionModal
          reflection={readerModalReflection}
          onClose={() => setReaderModalReflection(null)}
          onSelectForEdit={(ref) => {
            setActiveReflectionId(ref.id);
            setActiveTab('journal');
            setMobileJournalView('editor');
          }}
        />
      )}

      {/* Privacy, Security & Data Management Modal */}
      {showDataManagementModal && user && (
        <DataManagementModal
          isOpen={showDataManagementModal}
          onClose={() => setShowDataManagementModal(false)}
          userId={user.uid}
          userEmail={user.email}
          reflections={reflections}
          insights={insights}
          futureMeEntries={futureMeEntries}
          patterns={patterns}
          onDeleteAllData={handleDeleteAllUserData}
        />
      )}
    </div>
  );
}
