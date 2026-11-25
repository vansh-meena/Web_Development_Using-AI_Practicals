import { useCallback, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import ChatWindow from './components/ChatWindow.jsx';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const sessionIdRef = useRef(null);

  const reset = useCallback(async () => {
    const id = sessionIdRef.current;
    if (id) {
      try {
        await fetch(`/api/chat/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch {
        // Network failure on reset is not worth blocking the UI over.
      }
    }
    sessionIdRef.current = null;
    setSessionId(null);
    setMessages([]);
    setChatError(null);
  }, []);

  return (
    <div className="app-shell">
      <Header onReset={reset} disabled={loading} />
      <ChatWindow
        messages={messages}
        setMessages={setMessages}
        sessionId={sessionId}
        setSessionId={setSessionId}
        sessionIdRef={sessionIdRef}
        loading={loading}
        setLoading={setLoading}
        chatError={chatError}
        setChatError={setChatError}
        onReset={reset}
      />
    </div>
  );
}
