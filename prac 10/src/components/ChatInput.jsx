import { useState } from 'react';

const MAX_CHARS = 2000;

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const canSend = !disabled && text.trim().length > 0 && text.length <= MAX_CHARS;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Type your question… (Enter to send, Shift+Enter for a new line)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Message"
        />
        <button type="button" className="send-button" onClick={submit} disabled={!canSend}>
          Send
        </button>
      </div>
      <div className={`char-count ${text.length > MAX_CHARS ? 'over' : ''}`}>
        {text.length}/{MAX_CHARS}
      </div>
    </div>
  );
}
