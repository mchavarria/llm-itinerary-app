# Project Context: Travel Itinerary Utility (MVP)

## Core Stack
- React (Vite) + TypeScript (Strict Mode)
- Dexie.js (IndexedDB)
- Zustand (Global & Pipeline State)
- Tailwind CSS (Mobile-First UI Layout)

## Architecture Pillars
1. **Local-First & BYOK:** Zero proprietary backend. Users bring their own LLM API keys. Database runs entirely in browser IndexedDB.
2. **Manual Sync Pipeline:** `Mail Provider API` ➔ `Preprocessing Pipeline` ➔ `LLM Extraction` ➔ `Zod Schema Validation` ➔ `IndexedDB Persistence`.
3. **No-Fail Partial Recovery:** Invalid optional fields generate an `ExtractionWarning` rather than triggering a hard pipeline failure.

## Current Project Phase
- **Phase 1 (App Shell & CI/CD Deployment):** Completed.
- **Phase 2 (Settings Database & Zustand Core):** Completed.
- **Phase 3 (Sync Engine & UI Log Architecture):** Active / Just Implemented.
- **Next Up:** Phase 4 (LLM Schema Parsing Engine) & Phase 5 (Live OAuth Integrations).
