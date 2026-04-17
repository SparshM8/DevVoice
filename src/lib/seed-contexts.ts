export const seedContexts = [
  {
    source: "react-useeffect-common-mistakes.md",
    type: "markdown",
    text:
      "# React useEffect: Dependency Loop Pitfalls\n\n## Problem: Infinite Re-render Loop\n\nWhen useEffect updates state that exists in its dependency array, it triggers a re-render, which calls the effect again:\n\n```jsx\nuseEffect(() => {\n  setState({...data}); // Problem if state is in dependencies\n}, [state]);\n```\n\n## Solution: Stabilize Dependencies\n\n1. Extract values outside effect if they don't need reactivity\n2. Use useMemo for complex objects: `useMemo(() => ({...}), [deps])`\n3. Use useCallback for functions: `useCallback((arg) => {...}, [deps])`\n4. Guard state updates with equality checks\n5. Keep dependency array minimal and stable\n\n## Best Practice\n\n- Separate fetching logic from derived state computation\n- Memoize callback dependencies\n- Use ESLint exhaustive-deps plugin to catch mistakes",
  },
  {
    source: "javascript-null-safety-patterns.md",
    type: "markdown",
    text:
      "# JavaScript Null Safety Patterns\n\n## Common Errors\n\n- `Cannot read property 'x' of null` → Null pointer dereference\n- `TypeError: undefined is not a function` → Missing function guard\n- `Cannot read property 'x' of undefined` → Uninitialized object access\n\n## Prevention Patterns\n\n### 1. Optional Chaining\n```js\nconst value = obj?.nested?.property ?? 'default';\n```\n\n### 2. Nullish Coalescing\n```js\nconst result = response?.data ?? emptyArray;\n```\n\n### 3. Type Guards\n```js\nif (user && user.profile && user.profile.name) {\n  doSomething(user.profile.name);\n}\n```\n\n### 4. Assertion Only After Check\n```js\nconst email = user?.email;\nif (!email) throw new Error('Email required');\nprocessEmail(email);\n```",
  },
  {
    source: "debugging-stack-traces.md",
    type: "markdown",
    text:
      "# Debugging Stack Traces: Fast Triage\n\n## Read from Top\n\n1. **Skip library internals** – Skim past frameworks, bundler noise\n2. **Find first app frame** – First non-node_modules, non-dist line\n3. **Inspect that function** – What inputs? What assumptions?\n4. **Verify assumptions** – Null checks? Type expectations? Async ordering?\n\n## Common Patterns\n\n### ENOENT (File Not Found)\n- Check file path construction\n- Verify async operations complete before file reads\n- Log actual path being accessed\n\n### EADDRINUSE (Port Conflict)\n- Kill existing process on port\n- Check if port is hardcoded vs configurable\n- Look for lingering processes from previous runs\n\n### TypeError at .property\n- Object is null/undefined before property access\n- Add null guard or optional chaining\n- Log value before accessing property\n\n## Minimal Reproduction\n\n1. Isolate: create minimal input that triggers error\n2. Instrument: add console logs at key steps\n3. Verify: confirm fix prevents error with minimal example",
  },
  {
    source: "api-error-responses-guide.md",
    type: "markdown",
    text:
      "# HTTP Status Codes and Recovery Strategies\n\n## 4xx Client Errors (Your Request Was Bad)\n\n- **400 Bad Request** – Malformed JSON or missing required fields. Check request body syntax.\n- **401 Unauthorized** – Missing or invalid auth token. Refresh token or re-authenticate.\n- **403 Forbidden** – Valid auth but insufficient permissions. Check API scope or user role.\n- **404 Not Found** – Resource doesn't exist. Verify ID and base URL.\n- **429 Too Many Requests** – Rate limit hit. Use exponential backoff: `2^n * 100ms + jitter`.\n\n## 5xx Server Errors (Their Problem)\n\n- **500 Internal Server Error** – Unexpected server error. Retry with backoff.\n- **502 Bad Gateway** – Upstream failure. Likely temporary, retry.\n- **503 Service Unavailable** – Maintenance or overload. Implement circuit breaker.\n\n## Retry Strategy\n\n```js\nconst delay = (ms) => new Promise(r => setTimeout(r, ms));\nconst jitter = Math.random() * 100;\nconst backoffMs = Math.pow(2, attempt) * 100 + jitter;\nawait delay(backoffMs);\n```\n\n## When NOT to Retry\n\n- 400/401/403/404: User error, won't fix by retrying\n- 429: Wait full backoff time, don't spam\n- 5xx: Only after exponential backoff, max 3-5 attempts",
  },
  {
    source: "typescript-type-narrowing.md",
    type: "markdown",
    text:
      "# TypeScript Type Narrowing and Control Flow\n\n## Common Type Errors\n\n- `Property 'x' does not exist on type 'A | B'` → Must narrow discriminated union\n- `Argument of type 'string | null' is not assignable to parameter of type 'string'` → Null guard needed\n- `Type 'any' is not assignable to type 'T'` → Too permissive, use discriminator\n\n## Narrowing Techniques\n\n### Type Guards\n```ts\nif (typeof value === 'string') {\n  // value is string here\n}\n```\n\n### Discriminated Unions\n```ts\ntype Result = { status: 'ok'; data: T } | { status: 'error'; error: string };\nif (result.status === 'ok') {\n  // result.data is accessible\n}\n```\n\n### Custom Predicates\n```ts\nfunction isString(x: unknown): x is string {\n  return typeof x === 'string';\n}\n```\n\n### Assertion Functions\n```ts\nfunction assertNotNull(x: T | null): asserts x is T {\n  if (x === null) throw new Error('Expected non-null');\n}\n```",
  },
  {
    source: "terminal-error-codes.log",
    type: "text",
    text:
      "ENOENT: no such file or directory\n  → File path doesn't exist. Check path construction and working directory.\n  → Use path.resolve() to get absolute path before operation.\n\nEADDRINUSE: Address already in use\n  → Port is bound by another process. Use different port or kill existing process.\n  → On Windows: netstat -ano | findstr :PORT\n  → On macOS/Linux: lsof -i :PORT\n\nEACCES: permission denied\n  → File/directory permission error. Check sudo, file ownership, or execute permissions.\n  → npm installs may need cache clear: npm cache clean --force\n\nECONNREFUSED: connection refused\n  → Cannot connect to service (DB, API, etc). Check if service is running on expected host/port.\n  → Verify connection string format and network accessibility.\n\nETIMEDOUT: operation timed out\n  → Request took too long. Increase timeout, check network, or optimize query.\n  → For API calls: reduce payload size or paginate large responses.",
  },
  {
    source: "performance-tips-frontend.md",
    type: "markdown",
    text:
      "# Frontend Performance Quick Wins\n\n## React Optimization\n\n1. **Memoize expensive renders**: `useMemo()` for computed arrays/objects\n2. **Memoize callbacks**: `useCallback()` if passed as deps to child effects\n3. **Lazy load**: Use `React.lazy()` and `Suspense` for code splitting\n4. **Split state**: Keep unrelated state in separate `useState` calls\n5. **Avoid object/array literals in render**: Move to module-level or memoize\n\n## Bundle Size\n\n1. **Check bundle**: `npm install -g webpack-bundle-analyzer`\n2. **Remove unused deps**: `npm prune`\n3. **Prefer tree-shakeable libraries**: Check package.json sideEffects\n\n## Network\n\n1. **Compress responses**: Ensure server sends gzip\n2. **Cache aggressively**: Set Cache-Control: max-age\n3. **Minimize requests**: Combine images into spritesheet, batch API calls\n4. **Prioritize resources**: Preload critical CSS/JS\n\n## Profiling\n\n- Chrome DevTools Performance tab: record, identify long tasks\n- Lighthouse: run audits for actionable suggestions\n- Web Vitals: track LCP, FID, CLS metrics",
  },
];

export function getRandomContext() {
  return seedContexts[Math.floor(Math.random() * seedContexts.length)];
}
