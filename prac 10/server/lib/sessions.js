const sessions = new Map();

const MAX_MESSAGES = 12;
const MAX_SESSIONS = 500;
const IDLE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function isValidId(id) {
  return typeof id === 'string' && id.length >= 1 && id.length <= 100;
}

function pruneExpired(now) {
  for (const [key, session] of sessions) {
    if (now - session.lastActive > IDLE_EXPIRY_MS) {
      sessions.delete(key);
    }
  }
}

export function getHistory(sessionId) {
  if (!isValidId(sessionId)) return [];
  pruneExpired(Date.now());
  const session = sessions.get(sessionId);
  if (!session) return [];
  session.lastActive = Date.now();
  return session.messages.map((m) => ({ role: m.role, content: m.content }));
}

export function appendMessages(sessionId, entries) {
  if (!isValidId(sessionId)) return;
  let session = sessions.get(sessionId);
  if (!session) {
    session = { messages: [], lastActive: Date.now() };
    sessions.set(sessionId, session);
  }
  session.messages.push(...entries);

  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  // History must always start with a user message.
  while (session.messages.length > 0 && session.messages[0].role !== 'user') {
    session.messages.shift();
  }
  session.lastActive = Date.now();

  if (sessions.size > MAX_SESSIONS) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, value] of sessions) {
      if (value.lastActive < oldestTime) {
        oldestTime = value.lastActive;
        oldestKey = key;
      }
    }
    if (oldestKey) sessions.delete(oldestKey);
  }
}

export function deleteSession(sessionId) {
  if (isValidId(sessionId)) {
    sessions.delete(sessionId);
  }
}
