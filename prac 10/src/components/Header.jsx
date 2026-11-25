import { useEffect, useState } from 'react';

export default function Header({ onReset, disabled }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/chat/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.provider === 'string') setConfig(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const badgeLabel = config ? config.provider : 'connecting…';
  const badgeClass = config?.demo ? 'provider-badge demo' : 'provider-badge';

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-title-wrap">
          <span className="header-logo" aria-hidden="true">
            🦫
          </span>
          <div>
            <h1 className="header-title">Platypus University Help Center</h1>
            <p className="header-subtitle">Ask about admissions, courses, fees, hostels and more</p>
          </div>
        </div>
        <div className="header-actions">
          <span className={badgeClass} title="Active AI provider">
            {badgeLabel}
          </span>
          <button
            type="button"
            className="reset-button"
            onClick={onReset}
            disabled={disabled}
          >
            Reset conversation
          </button>
        </div>
      </div>
    </header>
  );
}
