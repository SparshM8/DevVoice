# DevVoice

DevVoice is a voice-native developer experience agent MVP for hackathons. It combines voice interaction, technical Q&A, debugging support, and semantic context retrieval with Qdrant-backed RAG.

## What this MVP includes

- **Voice-first dashboard** with push-to-talk and continuous listening mode
- **Live transcript** and conversation history in-session
- **Spoken responses** through browser TTS
- **Developer support modes** (explain code, debug errors, summarize docs, suggest fixes)
- **File upload and parsing** for txt, md, pdf, json, and code files
- **Chunking + embedding + vector storage** pipeline
- **Qdrant integration** with local in-memory fallback
- **Session memory continuity** across turns (browser localStorage + server state)
- **Mock mode** for no-key demo readiness
- **Comprehensive seed data** with 7 debugging scenarios and 40+ chunks
- **Error boundaries** and loading states for robustness
- **Browser session persistence** so refreshes don't lose context

## Tech stack

- Frontend and backend: Next.js 15 App Router + TypeScript + Tailwind CSS
- Voice: Browser Web Speech API + optional Vapi SDK wrapper
- Vector store: Qdrant via @qdrant/js-client-rest
- RAG pipeline: custom chunking + local/cloud embeddings + semantic retrieval
- LLM abstraction: OpenAI-compatible endpoint with intelligent mock fallbacks

## Project structure

```text
src/
  app/
    api/
      chat/route.ts          # Chat endpoint with RAG context
      upload/route.ts        # File upload + parsing + indexing
      history/route.ts       # Session summaries
      seed/route.ts          # Load demo context
    dashboard/page.tsx       # Voice console page
    history/page.tsx         # Session history page
    knowledge/page.tsx       # Knowledge base upload UI
    demo/page.tsx            # Demo guide + prompts
    page.tsx                 # Landing page
  components/
    dashboard/
      DevVoiceConsole.tsx      # Main orchestration component
      FloatingVoicePanel.tsx   # Voice input panel
      TranscriptPanel.tsx      # Live transcript display
      ContextCards.tsx         # Retrieved chunks UI
      SuggestedActions.tsx      # Action suggestions
      StatusChips.tsx          # Listening/thinking/speaking indicators
    shared/
      ErrorBoundary.tsx      # Error isolation
      SuspenseFallback.tsx   # Loading skeleton
    layout/TopNav.tsx        # Navigation header
  lib/
    chunker.ts              # Text chunking algorithm (900-char with overlap)
    config.ts               # Centralized env config
    embeddings.ts           # Local + OpenAI embeddings with fallback
    file-parser.ts          # PDF/MD/JSON/code parsing
    llm.ts                  # LLM response generation with mock fallback
    memory-store.ts         # In-memory session store
    mock.ts                 # Developer-oriented mock responses
    qdrant.ts               # Vector DB client + local fallback
    rag.ts                  # RAG ingestion + retrieval pipeline
    seed-contexts.ts        # 7 comprehensive debugging scenarios
    storage.ts              # Browser localStorage session persistence
    types.ts                # TypeScript types
    utils.ts                # Utility functions (cosine similarity, etc)
    vapi-client.ts          # Optional Vapi integration wrapper
data/
  seed/devvoice-demo-notes.md  # Basic seed doc
  demo-prompts.json            # 8 categorized demo prompts
scripts/
  dev-start.js             # Dev startup helper with config feedback
```

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Copy environment**:

   ```bash
   copy .env.example .env.local
   ```

3. **Start dev server**:

   ```bash
   npm run dev
   # Or with startup helper:
   node scripts/dev-start.js && npm run dev
   ```

4. **Open browser**:

   ```
   http://localhost:3000
   ```

## Demo flow (5 minutes)

1. **Seed knowledge base** (automatic or manual):
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```
   Or click "Seed Demo Data" on http://localhost:3000/demo

2. **Open dashboard**: http://localhost:3000/dashboard

3. **Ask by voice or text**:
   - "Why is my React useEffect causing repeated renders?"
   - "What does EADDRINUSE mean?"
   - "Help me analyze this stack trace..."

4. **Show artifacts**:
   - Live transcript (top left)
   - Retrieved context cards (right side)
   - Suggested debugging actions (bottom right)
   - Spoken response playing

5. **Prove continuity**: Open http://localhost:3000/history to show session persistence

## API overview

See [API.md](./API.md) for full reference. Quick endpoints:

- **POST /api/chat** – Send message, get response + context
- **POST /api/upload** – Upload doc, auto-index for retrieval
- **GET /api/history** – Session summaries
- **POST /api/seed** – Load 7 demo debugging scenarios

## Environment configuration

See [.env.example](./.env.example):

```bash
MOCK_MODE=true                          # Start in mock mode (no keys needed)
OPENAI_API_KEY=                         # Optional: enable real LLM
EMBEDDINGS_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini
QDRANT_URL=                             # Optional: remote vector DB
QDRANT_API_KEY=
QDRANT_COLLECTION=devvoice_context
MAX_CONTEXT_CHUNKS=6
NEXT_PUBLIC_VAPI_PUBLIC_KEY=            # Optional: real voice agent
```

**Mock mode behavior** (default):
- Embeddings use deterministic hash-based vectors (fast, no API calls)
- Retrieval works against in-memory vector store
- Responses use developer-focused templates
- All demos work without keys

## Key features

### Voice interface

- Browser Web Speech API (Web Speech Recognition)
- Optional Vapi bidirectional streaming for production
- Push-to-talk and continuous listening modes
- Real-time transcript display

### RAG pipeline

- Intelligent chunking (900 chars, 120-char overlap)
- Multi-format parsing (PDF, Markdown, JSON, code, plain text)
- Local embeddings fallback when API keys absent
- Qdrant + local in-memory vector store fallback
- Configurable retrieval limit (default 6 chunks)

### Session management

- In-memory server-side store (6 hours, auto-expire)
- Browser localStorage for UI persistence
- Automatic session creation on first message
- Session title inferred from first user query
- Retrieved context preserved per turn

### Error handling

- Error boundaries isolate crashes
- Try-catch throughout API routes
- Graceful fallbacks for missing configs
- Detailed error messages in responses

## Extensibility

### Add more seed data

Edit `src/lib/seed-contexts.ts`:

```ts
export const seedContexts = [
  {
    source: "my-guide.md",
    type: "markdown",
    text: "Your documentation here...",
  },
];
```

### Enable real LLM

1. Get OpenAI API key
2. Set `OPENAI_API_KEY` in `.env.local`
3. Restart dev server
4. LLM will auto-switch from mock to real

### Enable Qdrant

1. Run Qdrant server: `docker run -p 6333:6333 qdrant/qdrant`
2. Set `QDRANT_URL=http://localhost:6333`
3. Restart dev server
4. Vector store switches from local to remote

### Wire Vapi

1. Get Vapi public key and assistant ID
2. Set `NEXT_PUBLIC_VAPI_PUBLIC_KEY` and `NEXT_PUBLIC_VAPI_ASSISTANT_ID`
3. Vapi client wrapper in `src/lib/vapi-client.ts` ready to integrate

## Production deployment

For a hackathon submission or real deployment:

```bash
npm run build  # Validate production build
npm start      # Run Next.js server
```

The app runs as a single Node.js process. For scaling:
- Use external Qdrant instance (not local in-memory)
- Migrate session store to database
- Add Redis for distributed cache
- Deploy to Vercel, Fly.io, or Docker

## Future roadmap

- Streaming responses (token-by-token display)
- Real-time Vapi bidirectional loop
- Persistent database (PostgreSQL)
- Advanced repo indexing (file tree navigation)
- Role-specific personas (student, junior, senior)
- Metrics dashboard (queries, retrieval scores, triage patterns)

## License

MIT

  - Seeds built-in developer debugging context

## Mock mode behavior

When keys are missing, DevVoice still works:

- Embeddings fallback to deterministic local vectors
- Retrieval works against local in-memory vector store
- Responses use developer-oriented mock reasoning templates

Set MOCK_MODE=false and provide real keys to switch fully to external services.

## Future upgrades

- Streaming responses and token-by-token transcript updates
- Real-time Vapi bidirectional conversation loop
- Persistent database for sessions and file catalog
- Repo indexing and file-level code navigation
- Role-specific personas (student, reviewer, senior engineer)
