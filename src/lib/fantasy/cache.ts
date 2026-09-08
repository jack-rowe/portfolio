// Simple in-memory TTL cache. On Vercel this lives per-lambda-instance, which is
// fine for v1 — worst case a cold instance refetches. Swap for KV later if needed.

type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  // Dedupe concurrent fetches of the same key (matters for the 5MB player dump).
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = fetcher()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
