# System Architecture

The architecture of the app is designed to be fully client-side as follows:

1. **Browser App (The Orchestrator):**
   - Manages UI, state, and OAuth flows.
   - Executes the pipeline for transforming email content into structured travel data.

2. **External Mail APIs (Google/Microsoft):**
   - Provide email data to the app for processing.

3. **External LLM APIs (OpenAI, Anthropic, etc.):**
   - Perform text-to-JSON transformation according to strict schemas.

4. **IndexedDB:**
   - Serves as the sole database for data persistence on the client.