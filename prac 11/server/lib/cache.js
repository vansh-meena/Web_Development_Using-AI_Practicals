const MAX_ENTRIES = 50;
const TTL_MS = 30 * 60 * 1000;

const store = new Map();

export function cacheKey(input) {
  return [
    input.type,
    input.tone,
    input.length,
    input.topic,
    input.keyPoints || '',
    input.provider,
    input.model,
  ].join('||');
}

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache(key, value) {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }
  store.set(key, { t: Date.now(), value });
}
