// path: src/lib/http.ts
export type TokenBucket = { capacity: number; tokens: number; last: number };
const buckets = new Map<string, TokenBucket>();

function take(rpsKey?: string) {
  if (!rpsKey) return;
  const now = Date.now();
  const cap = 1; // default 1 req/s per key
  const bucket = buckets.get(rpsKey) ?? { capacity: cap, tokens: cap, last: now };
  const delta = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + delta * bucket.capacity);
  if (bucket.tokens < 1) {
    const waitMs = ((1 - bucket.tokens) / bucket.capacity) * 1000;
    return new Promise<void>(r => setTimeout(() => { bucket.tokens = Math.max(0, bucket.tokens); r(); }, waitMs));
  }
  bucket.tokens -= 1;
  bucket.last = now;
  buckets.set(rpsKey, bucket);
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: { retries?: number; backoffMs?: number; timeoutMs?: number; rpsKey?: string } = {}
): Promise<Response> {
  const retries = opts.retries ?? 3;
  const base = opts.backoffMs ?? 300;
  const timeoutMs = opts.timeoutMs ?? 15000;
  await take(opts.rpsKey);

  let attempt = 0;
  while (true) {
    attempt++;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(to);
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (attempt <= retries) {
          const wait = base * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
      }
      return res;
    } catch (err) {
      clearTimeout(to);
      if (attempt <= retries) {
        const wait = base * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}
