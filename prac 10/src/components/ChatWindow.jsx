import SuggestionChips from './SuggestionChips.jsx';
import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import ChatInput from './ChatInput.jsx';

export default function ChatWindow({
  messages,
  setMessages,
  sessionIdRef,
  loading,
  setLoading,
  chatError,
  setChatError,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, chatError]);

  async function send(text) {
    if (loading) return;
    setChatError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ...(sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail =
          data?.error === 'Validation failed'
            ? 'That message is not valid. Please check it and try again.'
            : data?.error || 'Something went wrong. Please try again.';
        setChatError(detail);
      } else if (data && typeof data.reply === 'string') {
        sessionIdRef.current = data.sessionId;
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatError('Received an unexpected reply. Please try again.');
      }
    } catch {
      setChatError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-window">
      {chatError && (
        <div className="error-banner" role="alert">
          <span>{chatError}</span>
          <button
            type="button"
            className="error-retry"
            onClick={() => setChatError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-messages">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <p className="empty-title">Hi there! How can we help you today?</p>
              <p className="empty-sub">
                Ask anything about Platypus University — admissions, courses, fees, hostels,
                facilities or placements.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <TypingIndicator />}
        </div>
        {messages.length === 0 && !loading && <SuggestionChips onPick={send} />}
      </div>
      <ChatInput onSend={send} disabled={loading} />
    </main>
  );
}
