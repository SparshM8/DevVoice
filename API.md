# DevVoice API Reference

## Chat Endpoint

**POST** `/api/chat`

Send a user message and receive context-aware assistance.

### Request

```json
{
  "message": "Why is my React useEffect causing repeated renders?",
  "sessionId": "uuid-optional"
}
```

### Response

The endpoint returns an **SSE stream**, not one JSON document. It emits `metadata`, `action`, `text`, `suggestions`, and `end` events. The first metadata event contains the server session identifier and retrieved context:

```text
event: metadata
data: {"sessionId":"uuid","contexts":[...],"suggestions":[]}

event: text
data: "Your useEffect likely depends on state that it updates..."
event: suggestions
data: ["Check the dependency array...","Guard state updates..."]
event: end
data: {}
```

When an external provider is unavailable, an `action` event explains that DevVoice is switching to its mock fallback before useful answer text is streamed. The response also issues a signed `HttpOnly` anonymous visitor cookie when needed; callers should preserve cookies for continuity and isolation.

---

## Upload Endpoint

**POST** `/api/upload`

Upload and index documents for semantic retrieval.

### Request

- Multipart form data
- Field name: `file`
- Supported types: txt, md, pdf, json, js, ts, tsx, py, java, go, log

### Response

```json
{
  "requestId": "uuid",
  "fileName": "debugging-guide.md",
  "chunksStored": 12,
  "chunksRequested": 12
}
```

`chunksStored` is the number of newly created or updated retrieval points reported for this request. Re-uploading identical content for the same anonymous visitor is idempotent and returns `0` newly created points. Invalid or empty uploads return structured JSON errors with a `requestId` rather than an HTML error page.

---

## History Endpoint

**GET** `/api/history`

Retrieve session summaries for the current anonymous visitor.

### Response

```json
{
  "requestId": "uuid",
  "sessions": [
    {
      "id": "uuid",
      "title": "Why is my React useEffect...",
      "updatedAt": "2026-04-17T10:30:00Z",
      "turnCount": 3,
      "lastAssistantMessage": "Your effect likely depends..."
    }
  ]
}
```

The endpoint is anonymous but visitor-scoped. It does not list sessions belonging to another visitor, and temporary server summaries can disappear across serverless instances. Browser localStorage remains the UI’s durable session copy.

---

## Seed Endpoint

**POST** `/api/seed`

Load demo context (React patterns, debugging strategies, error codes).

### Response

```json
{
  "requestId": "uuid",
  "seededDocuments": 7,
  "chunksStored": 11,
  "chunksRequested": 11
}
```

The seed operation is idempotent for the current anonymous visitor. A repeated call reports zero newly created chunks rather than duplicating the built-in context.

---

## Error Responses

All JSON errors follow this format:

```json
{
  "error": "Error message",
  "requestId": "uuid"
}
```

### Common Status Codes

- 400: Invalid request (missing fields, malformed JSON)
- 404: Resource not found
- 500: Server error (check logs)
