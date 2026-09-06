# MARGIN — Make room for thought.

> A private AI-powered reflection workspace helping you understand the evolution of your thoughts over time with Gemini and Cloud Firestore.

---

## 1. Agentic Threat Modeling & Countermeasures

| Threat Zone | Identified Risk | Countermeasure & Implementation |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection / Jailbreaks via journal text in `/api/reflect`, `/api/ask`, `/api/patterns` | Context framing isolates reflections as untrusted plain DATA wrapped in `<user_reflections>` blocks; model instructions prohibit executing instructions within data. |
| **Planning & Reasoning** | Hallucinated citations or fabricated timeline evidence | Schema enforcement in `/api/patterns` & explicit system prompts mandating only citing provided reflection IDs; outputs include `"There is not enough later writing to tell what happened next"` fallback. |
| **Tool / API Execution** | Server-side credential leakage or SSRF | Gemini API key strictly resides in server runtime (`server.ts`) via Secret Manager / environment variables; never sent to browser; proxy routes `/api/*` handle all AI requests. |
| **Memory & State** | Cross-user data leaks in Cloud Firestore | Strict owner-bound subcollection isolation `/users/{userId}/*` in `firestore.rules` verifying `request.auth.uid == userId`. Undefined values stripped to avoid driver write errors. |
| **Inter-System Comms** | Upstream Gemini API outages or rate limits | Automated multi-tier fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`) with resilient error catching. |

---

## 2. Architecture & Security Highlights

- **User Identity**: Secure, passwordless Google Sign-In via Firebase Auth.
- **Strict User Data Isolation**: Reflections, insights, patterns, and memory documents are saved exclusively to owner-bound Firestore subcollections under `/users/{userId}/*`.
- **Zero-Insecure-Default Firestore Rules**: Enforces `request.auth.uid == userId` across all subcollections.
- **Server-Side AI Proxying**: The Gemini API key is guarded strictly on the Express server (`server.ts`) and never exposed to the client or browser context.
- **Resilient AI Model Ladder**: Automatic multi-tier fallback ladder across `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash`.
- **Zero-Crash Payload Hygiene**: Recursive payload sanitizer strips any `undefined` values before persistence transactions.

---

## 3. Firestore Security Rules

To enforce user-level data isolation, deploy the following rules via Firebase CLI or Google Cloud Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /insights/{insightId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /patterns/{patternId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /memory/{memoryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /futureMe/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 4. Secret Manager & Credentials Setup

Set up Secret Manager in your Google Cloud Project to inject `GEMINI_API_KEY` securely into Cloud Run without hardcoding secrets:

```bash
# 1. Enable required Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Cloud Run Deployment Flow

Deploy the application container directly to Google Cloud Run:

```bash
# Build and deploy service to Cloud Run mounting the Secret Manager secret
gcloud run deploy margin-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=3000
```

### Required Campaign Verification Label

Apply the mandatory challenge verification label:

```bash
gcloud run services update margin-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Stability & Walkthrough Verification

Every user interaction has a corresponding verification scenario:

### Test Case 1: Landing Experience & Authentication
- **Step 1.1**: Arrive at root URL `/` when logged out. Observe hero layout: "MARGIN — Make room for thought." with clean typography and subtitle "Write freely. Look back. Discover what keeps returning."
- **Step 1.2**: Click "Start writing". Observe Google Sign-In popup trigger via Firebase Auth.
- **Step 1.3**: On successful sign-in, user is immediately transitioned into their private workspace on the **Journal** tab.

### Test Case 2: Distraction-Free Journaling & Prompt Starters
- **Step 2.1**: Click prompt starter: `"What has been on my mind lately?"`. Verify prompt inserts cleanly into the editor and focuses the textarea.
- **Step 2.2**: Click another prompt starter: `"What am I avoiding?"`. Verify it appends intelligently without overwriting existing text.
- **Step 2.3**: Enter reflection content. Verify live word and character counters update.
- **Step 2.4**: Click "Save". Verify "Saved" confirmation checkmark appears, entry is persisted to Firestore, and appears in the history sidebar.
- **Step 2.5**: Observe post-save card: "Want to see what MARGIN notices?" with links to Ask and Patterns.

### Test Case 3: Future Me Reflection
- **Step 3.1**: Write an entry and toggle "Future Me".
- **Step 3.2**: Add an optional note to future self and click "Save".
- **Step 3.3**: Verify the entry shows the amber Future Me bookmark pill in the history sidebar and appears in the "Future Me" tab inside Patterns.

### Test Case 4: Reflect with Gemini Companion
- **Step 4.1**: In an active reflection, select mode (Reflection, Summary, Brainstorm, Coaching).
- **Step 4.2**: Click "Reflect on this entry". Verify server route `/api/reflect` generates an intelligent response using Gemini 3.6 Flash.
- **Step 4.3**: Submit a follow-up response in the multi-turn discussion bar. Verify conversation turns persist.

### Test Case 5: Ask My Journal (Grounded Intelligence)
- **Step 5.1**: Navigate to the **Ask** tab. Click inquiry chip: `"What keeps coming up in my reflections?"`.
- **Step 5.2**: Verify response streams/renders grounded analysis with `[Reflection — Date]` citation buttons.
- **Step 5.3**: Click a citation button. Verify the Reflection Reader Modal opens displaying the full source entry.
- **Step 5.4**: Click "Save as Insight" on the Gemini response, select category `Breakthrough`, and confirm.

### Test Case 6: Insights Collection
- **Step 6.1**: Navigate to the **Insights** tab. Verify the saved insight appears with category badge.
- **Step 6.2**: Click "+ New Insight" to manually create a custom thought.
- **Step 6.3**: Test category filters (All, Breakthrough, Pattern, Mindset, Action, Observation) and search bar.
- **Step 6.4**: Test the Copy button (verifies clipboard write) and Delete button.

### Test Case 7: Patterns & Evolution (Longitudinal Intelligence)
- **Step 7.1**: Navigate to the **Patterns** tab. Verify freshness header ("Last analyzed: [Date]").
- **Step 7.2**: Inspect "Something Changed" proactive shift banner with earlier vs recent reflections and confidence score.
- **Step 7.3**: Inspect "Weekly Reflection Brief" (occupied thoughts, what stood out, worth exploring, next question).
- **Step 7.4**: Under "Personal Question Generator", click `Write about this →`. Verify it seamlessly switches to the Journal tab with the question prefilled into the writing canvas.
- **Step 7.5**: Open "Then vs Now" sub-tab. Select category filters (All, Concerns, Priorities, Emotional Tone, Perspective). Click "Run Focused Comparison" to trigger dynamic cross-time analysis.
- **Step 7.6**: Open "Reflection Loop" sub-tab. Verify the 4-phase cycle: Pattern Noticed → Generated Question → New Reflection → Observed Shift.
- **Step 7.7**: Open "Future Me Vault" sub-tab. Click "Write to Future Self" to open `FutureMeModal`. Set an unlock horizon (Immediate, 1 Month, 3 Months, 6 Months, 1 Year).
- **Step 7.8**: In Future Me Vault, click "Compare with Current Thinking" on an unlocked letter to run Gemini comparative analysis.
- **Step 7.9**: Click "Re-analyze" in header to trigger refreshed pattern extraction via `/api/patterns`.

### Test Case 8: Privacy, Security & Data Management
- **Step 8.1**: Click the "Privacy & Data" button with the shield icon in the top navigation bar.
- **Step 8.2**: Inspect the Security Architecture overview showing authenticated user ID and zero cross-user sharing guarantees.
- **Step 8.3**: Click "Export All Data (JSON)". Verify your browser immediately downloads an encrypted, timestamped archive of all reflections, insights, and letters.
- **Step 8.4**: Inspect the "Permanently Delete All Data" section. Click "Delete All Data". Observe the red confirmation warning requiring explicit double-confirmation before purging Firestore documents.

### Test Case 9: Strict Data Isolation & Sign Out
- **Step 9.1**: Verify "Security Architecture Active" badge displaying `/users/{userId}/*` path isolation.
- **Step 9.2**: Click Sign Out button in Navbar. Verify local state clears completely and user returns to the clean Landing Hero.
