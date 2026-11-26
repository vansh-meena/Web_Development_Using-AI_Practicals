// Simple in-memory token-bucket / fixed-window rate limiter.
// State is process-local and resets on restart - fine for a single instance.

const buckets = new Map();

function keyWindow(key, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, count: 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= entry.limit, count: entry.count };
}

// Returns true if the request is allowed, false if the limit has been hit.
// limit = max requests per windowMs.
export function tryConsume(name, limit, windowMs = 60_000) {
  const now = Date.now();
  let entry = buckets.get(name);
  if (!entry || now - entry.start >= windowMs) {
    buckets.set(name, { start: now, count: 1, limit });
    return true;
  }
  entry.count += 1;
  return entry.count <= entry.limit;
}
