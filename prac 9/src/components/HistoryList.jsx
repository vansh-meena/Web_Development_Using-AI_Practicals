const PROVIDER_LABELS = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  demo: 'Demo',
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryList({ items, onSelect, activeIndex }) {
  if (items.length === 0) {
    return (
      <div className="history-list">
        <h2 className="section-title">History</h2>
        <p className="history-empty">Nothing yet — generate something and it shows up here.</p>
      </div>
    );
  }

  return (
    <div className="history-list">
      <h2 className="section-title">History</h2>
      <ul>
        {items.map((item, i) => (
          <li key={item.ts}>
            <button
              type="button"
              className={`history-item${i === activeIndex ? ' active' : ''}`}
              onClick={() => onSelect(i)}
            >
              <span className="history-mode">{PROVIDER_LABELS[item.mode] ?? item.mode}</span>
              <span className="history-preview">{item.promptPreview}</span>
              <span className="history-time">{formatTime(item.ts)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
