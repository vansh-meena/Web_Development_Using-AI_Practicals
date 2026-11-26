import React from 'react';
import { Trash2 } from 'lucide-react';

const TYPE_LABELS = {
  blog: 'Blog',
  email: 'Email',
  instagram: 'Instagram',
  x: 'X Thread',
  linkedin: 'LinkedIn',
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryList({ history, onSelect, onClear }) {
  if (!history.length) {
    return (
      <div className="history-list">
        <div className="history-head">
          <h3>History</h3>
        </div>
        <p className="history-empty">Your recent generations will appear here.</p>
      </div>
    );
  }
  return (
    <div className="history-list">
      <div className="history-head">
        <h3>History</h3>
        <button type="button" className="btn btn-mini btn-ghost" onClick={onClear}>
          <Trash2 size={13} /> Clear
        </button>
      </div>
      <ul className="history-items">
        {history.map((h) => (
          <li key={h.id}>
            <button type="button" className="history-item" onClick={() => onSelect(h)}>
              <span className={`type-badge type-${h.type}`}>{TYPE_LABELS[h.type]}</span>
              <span className="history-topic">{h.topic}</span>
              <span className="history-time">{timeAgo(h.ts)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
