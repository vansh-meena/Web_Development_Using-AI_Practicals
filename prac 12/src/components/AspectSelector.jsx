import React from 'react';
import { ASPECTS } from '../constants.js';

function Shape({ aspect }) {
  if (aspect === 'square') return <span className="aspect-shape square" />;
  if (aspect === 'portrait') return <span className="aspect-shape portrait" />;
  return <span className="aspect-shape landscape" />;
}

export default function AspectSelector({ selected, onSelect }) {
  return (
    <div className="aspect-selector">
      {Object.values(ASPECTS).map((a) => (
        <button
          key={a.id}
          type="button"
          className={`aspect-option ${selected === a.id ? 'selected' : ''}`}
          onClick={() => onSelect(a.id)}
          aria-pressed={selected === a.id}
        >
          <Shape aspect={a.id} />
          <span className="aspect-name">{a.label}</span>
          <span className="aspect-dims">{a.width}×{a.height}</span>
        </button>
      ))}
    </div>
  );
}
