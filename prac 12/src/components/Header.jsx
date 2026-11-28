import React from 'react';

export default function Header({ activeTab, onTabChange, demoMode }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="14" cy="14" r="4" fill="currentColor" />
              <path d="M14 1v4M14 23v4M1 14h4M23 14h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <div className="brand-text">
            <h1>Lumora</h1>
            <p className="tagline">Generate images from words. Caption photos in seconds.</p>
            <p className="identity-line">Vansh Meena | 23BCON1705</p>
          </div>
        </div>
        <nav className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'generate'}
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => onTabChange('generate')}
          >
            Generate
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'caption'}
            className={`tab ${activeTab === 'caption' ? 'active' : ''}`}
            onClick={() => onTabChange('caption')}
          >
            Caption
          </button>
        </nav>
      </div>
      {demoMode && (
        <div className="demo-banner">
          Demo mode: images are locally generated SVG placeholders, not AI-generated.
        </div>
      )}
    </header>
  );
}
