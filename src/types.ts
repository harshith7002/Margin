export type ActiveTab = 'journal' | 'ask' | 'insights' | 'patterns';

export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'coaching';

export interface TurnMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JournalReflection {
  id: string;
  userId: string;
  title: string;
  content: string;
  wordCount: number;
  charCount: number;
  isFutureMe?: boolean;
  futureMeNote?: string;
  mode?: ReflectionMode;
  turns?: TurnMessage[];
  createdAt: number;
  updatedAt: number;
}

// Keep JournalInteraction alias for backwards compatibility
export type JournalInteraction = JournalReflection;

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type InsightCategory =
  | 'Breakthrough'
  | 'Pattern'
  | 'Mindset'
  | 'Action'
  | 'Observation';

export interface SavedInsight {
  id: string;
  userId: string;
  text: string;
  category: InsightCategory;
  sourceReflectionIds: string[];
  sourceReflectionTitles?: string[];
  createdAt: number;
}

export interface AskSourceCitation {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
}

export interface AskMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AskSourceCitation[];
  evidenceCount?: number;
  timestamp: number;
}

export interface RecurringTheme {
  id: string;
  theme: string;
  description: string;
  frequencyCount: number;
  status:
    | 'First appeared'
    | 'Reappeared'
    | 'Became more frequent'
    | 'Changed direction'
    | 'Faded';
  firstSeenDate: string;
  lastSeenDate: string;
  sourceReflectionIds: string[];
}

export interface SomethingChangedInsight {
  headline: string;
  earlierSummary: string;
  recentSummary: string;
  whatChangedExplanation: string;
  earlierSourceIds: string[];
  recentSourceIds: string[];
  confidence: 'Strong evidence' | 'Moderate evidence' | 'Emerging pattern';
}

export interface ThenVsNowComparison {
  thenThemes: string[];
  thenConcerns: string[];
  thenPatterns: string[];
  nowThemes: string[];
  nowConcerns: string[];
  nowPatterns: string[];
  whatChangedGrounded: string;
  evidenceNotes: string;
}

export interface WeeklyBrief {
  periodLabel: string;
  occupiedThoughts: string[];
  whatStoodOut: string;
  worthExploring: string;
  nextQuestion: string;
}

export interface ReflectionMemoryItem {
  id: string;
  type:
    | 'Goal'
    | 'Value'
    | 'Repeated Question'
    | 'Recurring Challenge'
    | 'Accomplishment'
    | 'Perspective Shift';
  title: string;
  description: string;
  sourceReflectionIds: string[];
  sourceReflectionDates: string[];
}

export interface PersonalQuestion {
  id: string;
  question: string;
  reason: string;
  theme: string;
}

export interface PatternsData {
  id: string;
  userId: string;
  generatedAt: number;
  entryCount: number;
  isStale: boolean;
  somethingChanged: SomethingChangedInsight | null;
  recurringThemes: RecurringTheme[];
  thenVsNow: ThenVsNowComparison;
  weeklyBrief: WeeklyBrief;
  reflectionMemories: ReflectionMemoryItem[];
  personalQuestions: PersonalQuestion[];
}

export interface FutureMeEntry {
  id: string;
  userId: string;
  reflectionId: string;
  reflectionTitle: string;
  reflectionSnippet: string;
  writtenAt: number;
  noteToFutureSelf?: string;
  laterReflectionsFound?: {
    id: string;
    title: string;
    date: string;
    connectionSnippet: string;
  }[];
}
