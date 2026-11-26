import React from 'react';
import { PenLine } from 'lucide-react';

export default function Header({ config, loading }) {
  const providerLabel = config
    ? config.provider === 'demo'
      ? 'Demo'
      : config.provider === 'openai'
        ? 'OpenAI'
        : 'Gemini'
    : '—';

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark">
            <PenLine size={22} />
          </div>
          <div className="brand-text">
            <h1>PostForge</h1>
            <p className="tagline">AI content for blogs, emails, and social — in seconds.</p>
          </div>
        </div>
        <div className="header-right">
          <span className={`provider-badge provider-${config?.provider || 'demo'}`}>
            <span className="dot" /> {providerLabel}
            {config?.model && config.provider !== 'demo' && (
              <span className="model-name">· {config.model}</span>
            )}
          </span>
        </div>
      </div>
      {config?.demo && (
        <div className="demo-banner">
          Demo mode: output comes from built-in templates, not a live AI model.
        </div>
      )}
    </header>
  );
}
