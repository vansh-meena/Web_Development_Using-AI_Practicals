import React, { useState } from 'react';
import { ASPECTS } from '../constants.js';

function ProviderBadge({ provider }) {
  const map = { pollinations: 'Pollinations', openai: 'OpenAI', demo: 'Demo' };
  return <span className={`provider-badge ${provider}`}>{map[provider] || provider}</span>;
}

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={onClick}>
      {copied ? 'Copied' : label}
    </button>
  );
}

export default function ImageStage({
  result, loading, error, aspect, onRetry, onUseDemo,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [imgError, setImgError] = useState(false);

  const a = ASPECTS[aspect] || ASPECTS.square;
  const ratio = `${a.width} / ${a.height}`;

  React.useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [result?.url, loading]);

  if (loading) {
    return (
      <div className="image-stage">
        <div className="image-skeleton" style={{ aspectRatio: ratio }} />
        <p className="stage-hint">Generating your image…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-stage">
        <div className="image-error" style={{ aspectRatio: ratio }}>
          <p className="error-text">{error}</p>
          <div className="error-actions">
            <button className="btn btn-primary btn-sm" onClick={onRetry}>Retry</button>
            <button className="btn btn-ghost btn-sm" onClick={onUseDemo}>Use demo instead</button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="image-stage">
        <div className="image-empty" style={{ aspectRatio: ratio }}>
          <p>Your generated image will appear here.</p>
        </div>
      </div>
    );
  }

  const isDataUrl = String(result.url).startsWith('data:');
  const ext = result.demo ? 'svg' : isDataUrl ? 'png' : 'png';

  const handleDownload = () => {
    if (isDataUrl) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = `lumora-${result.style}-${result.seed}.${ext}`;
      a.click();
    } else {
      const a = document.createElement('a');
      a.href = `/api/image/download?url=${encodeURIComponent(result.url)}`;
      a.download = `lumora-${result.style}-${result.seed}.${ext}`;
      a.click();
    }
  };

  return (
    <div className="image-stage">
      <div className="image-frame" style={{ aspectRatio: ratio }}>
        {!imgLoaded && !imgError && <div className="image-skeleton overlay" />}
        {imgError && (
          <div className="image-error">
            <p className="error-text">This image could not be loaded.</p>
            <div className="error-actions">
              <button className="btn btn-primary btn-sm" onClick={onRetry}>Retry</button>
              <button className="btn btn-ghost btn-sm" onClick={onUseDemo}>Use demo instead</button>
            </div>
          </div>
        )}
        {!imgError && (
          <img
            src={result.url}
            alt={result.finalPrompt}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={imgLoaded ? 'loaded' : ''}
          />
        )}
      </div>

      <div className="stage-meta">
        <div className="meta-row">
          <ProviderBadge provider={result.provider} />
          <span className="meta-chip">{result.style}</span>
          <span className="meta-chip">{result.aspect}</span>
          <span className="meta-chip">{result.width}×{result.height}</span>
        </div>
        <div className="meta-row">
          <span className="seed-label">Seed: {result.seed}</span>
          <CopyButton value={result.seed} label="Copy seed" />
          {!result.seedSupported && <span className="seed-note">Seed is ignored by OpenAI</span>}
        </div>
        <div className="meta-actions">
          <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPrompt((v) => !v)}>
            {showPrompt ? 'Hide prompt' : 'Show prompt'}
          </button>
        </div>
        {showPrompt && (
          <div className="final-prompt">
            <p>{result.finalPrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
