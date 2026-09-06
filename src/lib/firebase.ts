import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  JournalReflection,
  SavedInsight,
  PatternsData,
  FutureMeEntry,
  UserProfile,
} from '../types';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connect specifically to the provisioned database ID
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

/**
 * Strips all undefined values recursively to ensure Firestore compatibility.
 * Strictly adheres to Zero-Crash Payload Hygiene.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item)) as unknown as T;
  }
  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizePayload(value);
    }
  }
  return cleanObj as T;
}

export async function signInWithGoogle(): Promise<UserProfile> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

/* =========================================================================
   REFLECTIONS (Interactions subcollection)
   /users/{userId}/interactions/{interactionId}
   ========================================================================= */

export async function persistReflection(
  userId: string,
  reflection: JournalReflection
): Promise<void> {
  if (!userId) throw new Error('User ID is required for persistence');
  const cleanData = sanitizePayload<JournalReflection>({
    ...reflection,
    userId,
    updatedAt: Date.now(),
  });

  const ref = doc(db, 'users', userId, 'interactions', reflection.id);
  await setDoc(ref, cleanData, { merge: true });
}

export async function fetchUserReflections(
  userId: string
): Promise<JournalReflection[]> {
  if (!userId) return [];
  const colRef = collection(db, 'users', userId, 'interactions');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const reflections: JournalReflection[] = [];
  snapshot.forEach((docSnap) => {
    reflections.push(docSnap.data() as JournalReflection);
  });
  return reflections;
}

export async function removeReflection(
  userId: string,
  reflectionId: string
): Promise<void> {
  if (!userId || !reflectionId) return;
  const docRef = doc(db, 'users', userId, 'interactions', reflectionId);
  await deleteDoc(docRef);
}

// Backwards-compatible aliases
export const persistInteraction = persistReflection;
export const fetchUserInteractions = fetchUserReflections;
export const removeInteraction = removeReflection;

/* =========================================================================
   SAVED INSIGHTS
   /users/{userId}/insights/{insightId}
   ========================================================================= */

export async function persistSavedInsight(
  userId: string,
  insight: SavedInsight
): Promise<void> {
  if (!userId) throw new Error('User ID is required for persistence');
  const cleanData = sanitizePayload<SavedInsight>({
    ...insight,
    userId,
  });
  const ref = doc(db, 'users', userId, 'insights', insight.id);
  await setDoc(ref, cleanData, { merge: true });
}

export async function fetchSavedInsights(
  userId: string
): Promise<SavedInsight[]> {
  if (!userId) return [];
  const colRef = collection(db, 'users', userId, 'insights');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const insights: SavedInsight[] = [];
  snapshot.forEach((docSnap) => {
    insights.push(docSnap.data() as SavedInsight);
  });
  return insights;
}

export async function removeSavedInsight(
  userId: string,
  insightId: string
): Promise<void> {
  if (!userId || !insightId) return;
  const docRef = doc(db, 'users', userId, 'insights', insightId);
  await deleteDoc(docRef);
}

/* =========================================================================
   PATTERNS
   /users/{userId}/patterns/latest
   ========================================================================= */

export async function persistPatterns(
  userId: string,
  patterns: PatternsData
): Promise<void> {
  if (!userId) throw new Error('User ID is required for persistence');
  const cleanData = sanitizePayload<PatternsData>({
    ...patterns,
    userId,
  });
  const ref = doc(db, 'users', userId, 'patterns', 'latest');
  await setDoc(ref, cleanData, { merge: true });
}

export async function fetchPatterns(
  userId: string
): Promise<PatternsData | null> {
  if (!userId) return null;
  const ref = doc(db, 'users', userId, 'patterns', 'latest');
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as PatternsData;
}

/* =========================================================================
   FUTURE ME
   /users/{userId}/futureMe/{entryId}
   ========================================================================= */

export async function persistFutureMe(
  userId: string,
  entry: FutureMeEntry
): Promise<void> {
  if (!userId) throw new Error('User ID is required for persistence');
  const cleanData = sanitizePayload<FutureMeEntry>({
    ...entry,
    userId,
  });
  const ref = doc(db, 'users', userId, 'futureMe', entry.id);
  await setDoc(ref, cleanData, { merge: true });
}

export async function fetchFutureMeEntries(
  userId: string
): Promise<FutureMeEntry[]> {
  if (!userId) return [];
  const colRef = collection(db, 'users', userId, 'futureMe');
  const q = query(colRef, orderBy('writtenAt', 'desc'));
  const snapshot = await getDocs(q);

  const entries: FutureMeEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push(docSnap.data() as FutureMeEntry);
  });
  return entries;
}

export async function removeFutureMe(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, 'users', userId, 'futureMe', entryId);
  await deleteDoc(docRef);
}

/* =========================================================================
   DATA MANAGEMENT / PURGE
   ========================================================================= */

/**
 * Permanently removes all user-scoped data across all subcollections in Cloud Firestore.
 * Requires user confirmation before execution.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required for data deletion');

  const subcollections = ['interactions', 'insights', 'patterns', 'futureMe'];
  for (const subcol of subcollections) {
    const colRef = collection(db, 'users', userId, subcol);
    const snap = await getDocs(colRef);
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
  }
}

/**
 * Checks if an insight is a semantic or literal duplicate of existing insights.
 */
export function isDuplicateInsight(
  existingInsights: SavedInsight[],
  candidateText: string
): boolean {
  const normalizedCandidate = candidateText.toLowerCase().replace(/[^\w\s]/g, '').trim();
  return existingInsights.some((item) => {
    const normalizedExisting = item.text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    return (
      normalizedExisting === normalizedCandidate ||
      normalizedExisting.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedExisting)
    );
  });
}

// Aliases
export const fetchUserInsights = fetchSavedInsights;
export const saveUserInsight = persistSavedInsight;
export const removeUserInsight = removeSavedInsight;
export const fetchUserPatterns = fetchPatterns;
export const saveUserPatterns = persistPatterns;
export const fetchUserFutureMe = fetchFutureMeEntries;
export const persistUserFutureMe = persistFutureMe;
export const removeUserFutureMe = removeFutureMe;

