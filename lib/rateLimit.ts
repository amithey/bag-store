type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();
// Beyond this many tracked keys, expired entries are swept so a flood of
// distinct IPs can't grow the map without bound.
const MAX_KEYS = 5000;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  options: { maxAttempts: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  if (store.size > MAX_KEYS) pruneExpired(now);
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= options.maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearRateLimit(key: string) {
  store.delete(key);
}

function pruneExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}
