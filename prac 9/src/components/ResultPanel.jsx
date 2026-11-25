const PROVIDER_LABELS = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  demo: 'Demo',
};

export default function ResultPanel({ result, loading, error, notice }) {
  if (loading) {
    return (
      <div className="result-panel">
        <div className="result-placeholder">
          <span className="spinner" aria-hidden="true" /> Generating...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-panel">
        <div className="error-banner" role="alert">
          <strong>Something went wrong.</strong>
          <p>{error.message}</p>
          {error.details && (
            <ul>
              {Object.entries(error.details).map(([field, msg]) => (
                <li key={field}>
                  <strong>{field}:</strong> {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-panel">
        <div className="result-placeholder">Your generated text will appear here.</div>
      </div>
    );
  }

  return (
    <div className="result-panel">
      {notice && (
        <div className="demo-notice" role="status">
          {notice}
        </div>
      )}
      {result.demo && !notice && (
        <div className="demo-notice" role="status">
          Demo mode: this text was generated locally, no API key needed.
        </div>
      )}
      <div className="result-text">{result.text}</div>
      <div className="result-meta">
        <span className="meta-chip">{PROVIDER_LABELS[result.provider] ?? result.provider}</span>
        <span className="meta-chip">{result.model}</span>
        <span className="meta-chip">{result.mode}</span>
        <CopyButton text={result.text} />
      </div>
    </div>
  );
}

import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className={`btn small${copied ? ' copied' : ''}`} onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
