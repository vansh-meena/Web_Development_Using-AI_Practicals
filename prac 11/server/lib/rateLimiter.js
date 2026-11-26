// Simple in-memory rate limiter: at most 8 real provider calls per minute.
const WINDOW_MS = 60 * 1000;
const MAX_CALLS = 8;
const timestamps = [];

export function rateLimiter() {
  const now = Date.now();
  while (timestamps.length && now - timestamps[0] > WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= MAX_CALLS) {
    return false;
  }
  timestamps.push(now);
  return true;
}
