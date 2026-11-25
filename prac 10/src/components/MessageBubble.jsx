export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`bubble-row ${isUser ? 'user' : 'bot'}`}>
      {!isUser && (
        <span className="bubble-avatar" aria-hidden="true">
          🦫
        </span>
      )}
      <div className={`bubble ${isUser ? 'user' : 'bot'}`}>{content}</div>
    </div>
  );
}
