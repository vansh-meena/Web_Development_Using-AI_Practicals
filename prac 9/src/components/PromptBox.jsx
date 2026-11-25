import { LIMITS } from '../constants.js';

export default function PromptBox({ prompt, onChange, maxTokens, onMaxTokensChange, disabled, onSubmit }) {
  const trimmedLen = prompt.trim().length;
  const tooShort = trimmedLen > 0 && trimmedLen < LIMITS.promptMin;
  const tooLong = trimmedLen > LIMITS.promptMax;
  const invalid = tooShort || tooLong;
  const showShortHint = tooShort;
  const showLongHint = tooLong;

  return (
    <div className="prompt-box">
      <label className="field-label" htmlFor="prompt">
        Your prompt
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste text to summarize or rewrite, or ask anything..."
        rows={7}
        disabled={disabled}
        className={invalid ? 'invalid' : ''}
      />
      <div className="prompt-meta">
        <span className={`char-count${tooLong ? ' over' : ''}`}>
          {prompt.length} / {LIMITS.promptMax}
        </span>
        {showShortHint && <span className="inline-hint">Keep at least {LIMITS.promptMin} characters</span>}
        {showLongHint && <span className="inline-hint">Over the {LIMITS.promptMax} character limit</span>}
      </div>

      <div className="slider-row">
        <label className="field-label" htmlFor="maxTokens">
          Max length
        </label>
        <div className="slider-inner">
          <input
            id="maxTokens"
            type="range"
            min={LIMITS.maxTokensMin}
            max={LIMITS.maxTokensMax}
            step={50}
            value={maxTokens}
            disabled={disabled}
            onChange={(e) => onMaxTokensChange(Number(e.target.value))}
          />
          <span className="slider-value">{maxTokens}</span>
        </div>
      </div>

      <button
        type="button"
        className="btn primary"
        onClick={onSubmit}
        disabled={disabled || invalid || trimmedLen === 0}
      >
        {disabled ? (
          <>
            <span className="spinner" aria-hidden="true" /> Generating...
          </>
        ) : (
          'Generate'
        )}
      </button>
    </div>
  );
}
