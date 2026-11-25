export default function TypingIndicator() {
  return (
    <div className="bubble-row bot">
      <span className="bubble-avatar" aria-hidden="true">
        🦫
      </span>
      <div className="bubble bot typing" aria-label="Assistant is typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}
