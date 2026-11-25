const MODES = [
  { id: 'freeform', label: 'Freeform' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'brainstorm', label: 'Brainstorm' },
  { id: 'explain', label: 'Explain' },
];

export default function ModeTabs({ mode, onChange, disabled }) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Generation mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
          className={`mode-tab${mode === m.id ? ' active' : ''}`}
          onClick={() => onChange(m.id)}
          disabled={disabled}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
