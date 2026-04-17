# DevVoice Demo Notes

## useEffect rerender loop
If useEffect sets state and the same state drives one of its dependencies, React can trigger repeated renders.
Fix by splitting responsibilities and stabilizing dependencies with useMemo/useCallback.

## Stack trace triage
Find the first application frame (not library internals), inspect values there, and verify assumptions.

## API retry guidance
429 responses indicate rate limits. Use exponential backoff and jitter before retries.
