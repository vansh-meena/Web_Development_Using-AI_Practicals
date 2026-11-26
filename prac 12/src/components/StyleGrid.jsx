import React from 'react';
import { STYLES } from '../constants.js';

export default function StyleGrid({ selected, onSelect }) {
  return (
    <div className="style-grid">
      {Object.values(STYLES).map((style) => (
        <button
          key={style.id}
          type="button"
          className={`style-card ${selected === style.id ? 'selected' : ''}`}
          onClick={() => onSelect(style.id)}
          aria-pressed={selected === style.id}
        >
          <span className={`style-swatch style-${style.id}`} aria-hidden="true" />
          <span className="style-label">{style.label}</span>
        </button>
      ))}
    </div>
  );
}
