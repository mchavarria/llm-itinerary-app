# Functional Requirements

## Core Functions:
- **Authentication**:
  - Use OAuth2 for Gmail and Outlook browser-based authentication flows.
  - Supports user login from different mail services.

- **Configuration**:
  - Users input and securely store LLM API keys (e.g., OpenAI, Anthropic).
  - Allow users to manually select specific mail folders for processing.

- **Ingestion**:
  - Manual sync triggered by the user.
  - Fetch incremental updates (new mail only since the latest watermark).

- **LLM-Based Data Extraction**:
  - Emails processed into itinerary data features via structured JSON (accommodations, flights).

- **Validation and Editing**:
  - Rejection of invalid LLM interpretations and errors into revaluable schema feedback.
  - Final batch navigation, merged API Responses for-saving edits.