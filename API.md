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

```json
{
  "sessionId": "uuid",
  "answer": "Your useEffect likely depends on state that it updates...",
  "suggestions": [
    "Check if effect dependency array includes mutable values...",
    "Wrap callbacks with useCallback and computed values with useMemo..."
  ],
  "contexts": [
    {
      "id": "chunk-id",
      "text": "Full chunk text from retrieved knowledge base",
      "source": "react-useeffect-guide.md",
      "type": "markdown",
      "score": 0.92
    }
  ]
}
```

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
  "fileName": "debugging-guide.md",
  "chunksStored": 12
}
```

---

## History Endpoint

**GET** `/api/history`

Retrieve all session summaries.

### Response

```json
{
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

---

## Seed Endpoint

**POST** `/api/seed`

Load demo context (React patterns, debugging strategies, error codes).

### Response

```json
{
  "seededDocuments": 7,
  "chunksStored": 42
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Optional detailed message"
}
```

### Common Status Codes

- 400: Invalid request (missing fields, malformed JSON)
- 404: Resource not found
- 500: Server error (check logs)
