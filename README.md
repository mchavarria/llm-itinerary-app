Here is the comprehensive technical specification document for the MVP. It is structured with clear, actionable architectural patterns and TypeScript interfaces to guide immediate LLM-driven implementation.
1. Product Overview
A mobile-first, local-first web application designed to solve the problem of travel confirmations buried in email inboxes. By utilizing a Bring-Your-Own-Key (BYOK) LLM extraction approach, the app securely parses selected email folders (Gmail/Outlook) entirely client-side and renders a clean, chronological timeline of travel events (accommodations and transportation).
2. Core Product Philosophy
 Timeline Clarity Above All: The primary goal is to answer "Where do I need to be?" and "When do I move?"
 Zero-Knowledge Architecture: The application operates completely within the user's browser. There is no proprietary backend storing emails, itineraries, or API keys.
 User Authority: Manual synchronization, explicit folder selection, and editable, user-owned itinerary items.
 Transparent & Forgiving: Partial data extraction is preferred over failure. Errors and low-confidence extractions are surfaced as inline warnings rather than blocking processing.
3. Functional Requirements
 Authentication: Authenticate with Gmail and Outlook via OAuth2 (Browser-based flow).
 Configuration: Input and save LLM API keys (OpenAI, Anthropic, OpenRouter). Select specific mail folders/labels for ingestion.
 Ingestion: Manually trigger incremental syncs fetching only new emails from selected sources since the last sync watermark.
 Extraction: Pass email content through an LLM pipeline to extract structured JSON data for flights, trains, buses, ferries, and accommodations.
 Validation: Validate LLM output against strict schemas; retain valid fields and append warnings for missing/invalid optional data.
 Presentation: Display an Agenda view (mobile primary) and a Calendar view. Include a detailed edit screen for each item.
 Data Management: Soft-delete items, manually edit items. No automatic deduplication; resyncing the same email will not overwrite user-edited items.
4. Non-Functional Requirements
 Performance: Fast initial load (SPA/PWA). Sync processing log must stream updates to the UI in real-time.
 Storage: 100% local persistence via IndexedDB.
 Resilience: Fail-fast on network or API errors. No complex retry queues for the MVP.
 Security: API keys and OAuth tokens remain entirely in browser local storage.
5. System Architecture
The system is a Client-Side Single Page Application (SPA) acting as an orchestrator between external APIs and local browser storage. There is no proprietary backend.
1 Browser App (The Orchestrator): Manages UI, state, OAuth flows, and pipeline execution.
2 External Mail APIs (Google/Microsoft): Provides raw email data.
3 External LLM APIs (OpenAI/Anthropic/etc.): Converts raw text to structured JSON.
4 IndexedDB: Acts as the sole database for the system.
6. Frontend Architecture
 Pattern: Feature-sliced design (modular architecture).
 Routing: Client-side routing with route guards for configuration states (e.g., redirecting to settings if no API key is present).
 UI/UX: Component-driven, built with responsive utility classes. Heavy reliance on lists, cards, and modal dialogs suitable for touch interfaces.
7. Data Model / Domain Model
'''typescript
type EventType = 'flight' | 'train' | 'bus' | 'ferry' | 'accommodation';

interface SourceMeta {
  provider: 'gmail' | 'outlook';
  messageId: string;
  sender: string;
  mailboxFolder: string;
  processedAt: string; // ISO UTC
}

interface ExtractionWarning {
  field?: string;
  message: string;
  type: 'missing_required' | 'low_confidence' | 'parse_error';
}

interface BaseItineraryItem {
  id: string; // UUID generated at extraction
  eventType: EventType;
  datetimeUtc: string; // ISO UTC
  datetimeLocalOriginal?: string; // ISO string without Z
  timezoneOriginal?: string; // IANA Timezone string
  source: SourceMeta;
  warnings: ExtractionWarning[];
  isDeleted: boolean; // Soft delete flag
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
}

interface TransportationItem extends BaseItineraryItem {
  eventType: 'flight' | 'train' | 'bus' | 'ferry';
  providerName?: string; // e.g., Delta Airlines
  departureLocation?: string;
  arrivalLocation?: string;
  confirmationNumber?: string;
  passengerNames?: string[];
}

interface AccommodationItem extends BaseItineraryItem {
  eventType: 'accommodation';
  propertyName?: string;
  address?: string;
  checkOutDatetimeUtc?: string; // Optional end time
  confirmationNumber?: string;
}

type ItineraryItem = TransportationItem | AccommodationItem;

// Sync State Tracking
interface SyncWatermark {
  provider: 'gmail' | 'outlook';
  folderId: string;
  lastHistoryIdOrTimestamp: string;
}
'''
8. Synchronization Flow
1 Trigger: User clicks "Sync". UI enters "Syncing" state and displays the progressive log.
2 Fetch Watermark: Retrieve ⁠lastHistoryIdOrTimestamp⁠ for selected folders from IndexedDB.
3 Fetch Emails: Call Mail API for emails newer than the watermark.
4 Iterate: For each email:
 Pass through ⁠Pipeline⁠.
 If extracted successfully, generate UUID, map to ⁠ItineraryItem⁠.
 Save to IndexedDB.
 Emit progress event to UI.
5 Finalize: Update the sync watermark in IndexedDB. Show concise summary (e.g., "14 emails processed, 8 items added, 2 warnings").
9. OAuth/Mail Integration Architecture
 Flow: Implicit Grant or PKCE (Proof Key for Code Exchange) utilizing the provider's standard JavaScript SDKs or direct REST endpoints.
 Storage: Access tokens stored in memory or ⁠sessionStorage⁠ (preferred over ⁠localStorage⁠ to reduce XSS risk, though ⁠localStorage⁠ may be needed for persistence across tabs).
 Data Scopes: Read-only access to email metadata and bodies.
 Fetching: Use ⁠historyId⁠ (Gmail) or Delta queries (Outlook) to implement the incremental sync requirement.
10. LLM Extraction Architecture
 Pattern: Strategy Pattern for LLM Providers.
 System Prompt: The prompt acts as the application's core logic for multilingual parsing and normalization. It will enforce a strict JSON schema output matching the Domain Model.
 Temperature: Set to ⁠0.0⁠ or ⁠0.1⁠ for maximum determinism.
 JSON Mode: Utilize ⁠response_format: { type: "json_object" }⁠ where supported.
11. Processing Pipeline Design
The pipeline processes raw email payloads before sending them to the LLM.
'''typescript
interface PipelineContext {
  rawEmail: string;
  metadata: SourceMeta;
}

interface PipelineStep {
  name: string;
  process: (content: string, context: PipelineContext) => Promise<string>;
}

// First MVP Step
class NoFilterStep implements PipelineStep {
  name = 'NoFilter';
  async process(content: string) { return content; }
}

class PipelineExecutor {
  steps: PipelineStep[] = [new NoFilterStep()];
  
  async execute(initialContent: string, context: PipelineContext) {
    let content = initialContent;
    for (const step of this steps) {
      content = await step.process(content, context);
    }
    return content;
  }
}
'''
12. Validation & Error Handling
 Library: Zod (or similar schema validator) to parse LLM JSON output.
 Partial Recovery: Instead of ⁠z.strict()⁠, use ⁠z.object({...}).passthrough()⁠ or optional fields. If an optional field fails validation (e.g., ⁠passengerNames⁠ is returned as a string instead of an array), the validator discards the field, nullifies it, and appends an ⁠ExtractionWarning⁠ to the item.
 Hard Fail: If ⁠eventType⁠, ⁠datetimeUtc⁠, or ⁠sender⁠ is missing or unparseable, the extraction is considered a hard fail. The error is logged to the sync UI, and the email is skipped. No retry queue.
13. Persistence/Storage Design
 Technology: ⁠Dexie.js⁠ (wrapper for IndexedDB).
 Collections (Tables):
 ⁠itinerary_items⁠: Stores the extracted travel items. Indices on ⁠datetimeUtc⁠, ⁠eventType⁠, and ⁠source.messageId⁠.
 ⁠sync_watermarks⁠: Stores incremental sync markers per provider/folder.
 ⁠settings⁠: Stores user preferences, API keys, and selected folders.
14. Mobile-First UX Considerations
 Layout: Bottom navigation bar for core views (Agenda, Calendar, Settings).
 Interactions: Swipe-to-delete (soft delete) with an undo toast.
 Readability: Large, clear typography for dates and times. Prominent visual icons for event types (✈️, 🚆, 🏨).
 Feedback: Sticky progress banner during the manual sync process so the user can scroll their agenda while sync runs.
 Warnings: Visual indicators (e.g., yellow alert icon) on items with ⁠warnings.length > 0⁠. Tapping reveals inline details.
15. Security Considerations
 API Keys: API keys are stored in ⁠localStorage⁠ or IndexedDB. A clear UI warning must inform users that keys are stored locally in plain text and they should use keys with restricted billing limits.
 Data Leakage: Because there is no backend, CORS and CSP (Content Security Policy) headers must be strictly configured in the hosting environment to prevent exfiltration of tokens/data via XSS.
16. State Management Approach
 Global State: React Context + Hooks (or Zustand) for lightweight global state (Settings, Current Theme, Auth Status).
 Async State: React Query (or similar) to handle IndexedDB subscriptions, loading states, and mutations.
 Sync State: A dedicated ephemeral Context to manage the stream of logs and progress bars during the active sync process.
17. Suggested Technology Stack
 Framework: React 18+ (via Vite)
 Language: TypeScript (Strict Mode)
 Styling: Tailwind CSS + Shadcn UI (for accessible mobile components)
 Database: Dexie.js (IndexedDB)
 Validation: Zod
 State: Zustand (global) + TanStack Query (data fetching from DB)
 Routing: React Router DOM
 Hosting: Static hosting (Vercel, Netlify, or GitHub Pages)
18. Suggested Folder / Project Structure
'''text
src/
├── core/               # Domain models, Pipeline logic, Validation schemas
├── services/           # External API integrations
│   ├── llm/            # LLM Provider strategies
│   └── mail/           # OAuth and Mail API clients
├── storage/            # Dexie DB configuration and repositories
├── ui/
│   ├── components/     # Reusable UI elements (buttons, cards)
│   ├── features/       # Feature-specific components (SyncLog, ItineraryList)
│   ├── layouts/        # App shell, bottom nav
│   └── views/          # Page-level components (Agenda, Calendar, Settings)
├── store/              # Zustand state stores
└── utils/              # Timezone parsing, formatting utilities
'''
19. API Abstractions / Interfaces
'''typescript
interface IMailClient {
  authenticate(): Promise<void>;
  isAuthenticated(): boolean;
  getFolders(): Promise<Array<{ id: string, name: string }>>;
  fetchNewEmails(folderId: string, watermark?: string): Promise<{
    emails: Array<{ messageId: string, sender: string, body: string, date: string }>;
    newWatermark: string;
  }>;
}

interface ILLMClient {
  extractItinerary(prompt: string, emailContent: string): Promise<string>; // Returns raw JSON string
}

interface IStorageRepository {
  saveItems(items: ItineraryItem[]): Promise<void>;
  getItems(startUtc?: string, endUtc?: string): Promise<ItineraryItem[]>;
  updateItem(id: string, updates: Partial<ItineraryItem>): Promise<void>;
  softDeleteItem(id: string): Promise<void>;
  getWatermark(provider: string, folderId: string): Promise<string | null>;
  setWatermark(provider: string, folderId: string, watermark: string): Promise<void>;
}
'''
20. Risks & Tradeoffs
 LLM Context Limits: Unfiltered email bodies (HTML markup, inline images) can exceed context limits or cause high token costs. Mitigation: The ⁠NoFilterStep⁠ will likely need an HTML-to-Text conversion step immediately post-MVP.
 LLM Hallucinations: The LLM might invent confirmation numbers. Mitigation: Partial recovery validation and inline warnings telling users to verify against the source.
 Browser Storage Eviction: iOS Safari can clear IndexedDB if storage is low or the app is unused for a period. Mitigation: Explicitly warn users that this is a transient utility, not a permanent backup.
 Token Expiry: OAuth tokens will expire. Users will need to re-authenticate manually during sync if the token is invalid.
21. MVP Roadmap
 Phase 1: Foundation. Project setup, Dexie.js schema setup, UI shell (Agenda view empty state).
 Phase 2: Authentication. Implement Gmail/Outlook OAuth flows and folder selection UI.
 Phase 3: Pipeline & LLM. Implement ⁠PipelineExecutor⁠, Zod schemas, and OpenRouter/OpenAI API integration.
 Phase 4: Sync Engine. Connect Mail fetching -> Pipeline -> DB. Build the progressive sync UI.
 Phase 5: Refinement. Build Calendar view, Item Detail/Edit screens, apply inline warnings UI, and perform mobile touch-target polish.
22. Future Extensibility Considerations
 Composable Pipeline: Adding a ⁠StripHTMLStep⁠, ⁠RemoveQuotedTextStep⁠, or ⁠PIIRedactionStep⁠ before the LLM call to save tokens and improve privacy.
 Local LLMs: Transitioning from BYOK APIs to WebGPU-based local models (e.g., WebLLM with Llama-3-8B) for 100% offline, free, and private extraction.
 Export: Generating ⁠.ics⁠ files for users to manually import into their calendars.

This is a test commit.
