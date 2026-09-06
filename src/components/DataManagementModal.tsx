import React, { useState } from 'react';
import {
  Shield,
  Trash2,
  Download,
  AlertTriangle,
  Check,
  X,
  Lock,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';
import { JournalReflection, SavedInsight, FutureMeEntry, PatternsData } from '../types';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string | null;
  reflections: JournalReflection[];
  insights: SavedInsight[];
  futureMeEntries: FutureMeEntry[];
  patterns: PatternsData | null;
  onDeleteAllData: () => Promise<void>;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  reflections,
  insights,
  futureMeEntries,
  patterns,
  onDeleteAllData,
}) => {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'export' | 'danger'>('architecture');

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const exportBundle = {
      appName: 'MARGIN — Make room for thought',
      exportedAt: new Date().toISOString(),
      user: {
        uid: userId,
        email: userEmail,
      },
      counts: {
        reflections: reflections.length,
        insights: insights.length,
        futureMeLetters: futureMeEntries.length,
      },
      reflections,
      insights,
      futureMeEntries,
      patterns,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `margin-journal-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExecuteDeleteAll = async () => {
    if (confirmPhrase.trim() !== 'DELETE MY DATA') {
      setDeleteError('Please type the exact phrase "DELETE MY DATA" to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAllData();
      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to purge data from Firestore';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Privacy, Security & Data Management
              </h3>
              <p className="text-[11px] text-stone-500">
                User UID: <code className="font-mono text-stone-700 bg-stone-100 px-1 py-0.5 rounded">{userId.slice(0, 12)}...</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-200 px-5 pt-2 gap-2 text-xs bg-stone-50/30">
          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`pb-2 px-2 font-medium transition-colors border-b-2 cursor-pointer ${
              activeSubTab === 'architecture'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Security Architecture
          </button>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`pb-2 px-2 font-medium transition-colors border-b-2 cursor-pointer ${
              activeSubTab === 'export'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Export Archive
          </button>
          <button
            onClick={() => setActiveSubTab('danger')}
            className={`pb-2 px-2 font-medium transition-colors border-b-2 cursor-pointer ${
              activeSubTab === 'danger'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Purge Data
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: ARCHITECTURE */}
          {activeSubTab === 'architecture' && (
            <div className="space-y-4 leading-relaxed">
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Strict User-Bound Isolation Enforced</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Every reflection, insight, pattern, and Future Me message is strictly partitioned under your Firebase authentication identity.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Firestore Owner Path Isolation:</span>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      Subcollections <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">/users/{'{userId}'}/interactions</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">/insights</code>, and <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">/futureMe</code> require <code className="font-mono text-indigo-700">request.auth.uid == userId</code>. Cross-user reads and writes are blocked by security rules.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <Server className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Server-Side Gemini API Proxy:</span>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      No Google GenAI keys are embedded in frontend bundles. Requests are securely dispatched through the backend Express runtime on Cloud Run with prompt injection sanitization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Zero-Crash Undefined Sanitization:</span>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      Payload sanitizers strip undefined attributes before sending payloads to Firestore, guaranteeing zero driver rejections.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stored Counts summary */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Stored under your UID:</span>
                <span className="font-mono text-stone-700 font-medium">
                  {reflections.length} reflections • {insights.length} insights • {futureMeEntries.length} future letters
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT */}
          {activeSubTab === 'export' && (
            <div className="space-y-4">
              <p className="text-stone-600 leading-relaxed">
                You can download a complete, readable JSON backup of your journal archive at any time. The export contains all reflections, turns, saved insights, Future Me letters, and longitudinal patterns.
              </p>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <span className="font-semibold text-stone-900">Archive Manifest:</span>
                <ul className="text-stone-600 space-y-1 pl-2 text-[11px]">
                  <li>• {reflections.length} Journal Reflections with word counts & timestamps</li>
                  <li>• {insights.length} Saved Insights categorized by theme</li>
                  <li>• {futureMeEntries.length} Future Me Letters & comparisons</li>
                  <li>• Longitudinal Pattern History</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Journal Archive (JSON)</span>
              </button>
            </div>
          )}

          {/* TAB 3: PURGE */}
          {activeSubTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Permanent Data Deletion</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  This action permanently deletes all your reflections, saved insights, future messages, and longitudinal pattern analyses from Google Cloud Firestore. This cannot be undone.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-stone-700 font-medium text-xs">
                  Type <strong className="font-mono text-rose-600">DELETE MY DATA</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="DELETE MY DATA"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
              )}

              {deleteSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Your journal archive has been completely erased.</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteAll}
                  disabled={confirmPhrase.trim() !== 'DELETE MY DATA' || isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Purging...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge All Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
