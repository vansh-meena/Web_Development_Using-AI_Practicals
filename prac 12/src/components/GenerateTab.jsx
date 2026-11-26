import React, { useState } from 'react';
import StyleGrid from './StyleGrid.jsx';
import AspectSelector from './AspectSelector.jsx';
import ImageStage from './ImageStage.jsx';
import { STYLES, ASPECTS, PROVIDERS } from '../constants.js';

export default function GenerateTab({
  config, onGenerate, loading, result, error,
  onRetry, onUseDemo, onReuse, reuseState,
}) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photoreal');
  const [aspect, setAspect] = useState('square');
  const [provider, setProvider] = useState(config?.defaultProvider || 'pollinations');
  const [seed, setSeed] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(null);
  const [enhanceError, setEnhanceError] = useState('');
  const [cooldown, setCooldown] = useState(false);

  // Sync provider default once config loads.
  React.useEffect(() => {
    if (config?.defaultProvider && !provider) setProvider(config.defaultProvider);
  }, [config]);

  // Restore from reuse (gallery).
  React.useEffect(() => {
    if (reuseState) {
      setPrompt(reuseState.prompt || '');
      setStyle(reuseState.style || 'photoreal');
      setAspect(reuseState.aspect || 'square');
      setProvider(reuseState.provider || 'pollinations');
      setSeed(reuseState.seed != null ? String(reuseState.seed) : '');
    }
  }, [reuseState]);

  const trimmed = prompt.trim();
  const promptValid = trimmed.length >= 3 && trimmed.length <= 1000;
  const generateDisabled = loading || cooldown || !promptValid;

  const handleEnhance = async () => {
    if (!promptValid) return;
    setEnhancing(true);
    setEnhanceError('');
    try {
      const res = await fetch('/api/image/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enhancement failed.');
      setEnhanced(data.prompt);
    } catch (e) {
      setEnhanceError(e.message || 'Enhancement failed.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = () => {
    if (generateDisabled) return;
    onGenerate({
      prompt: trimmed,
      style,
      aspect,
      provider,
      seed: seed === '' ? undefined : Number(seed),
    });
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
  };

  const handleRandomSeed = () => {
    setSeed(String(Math.floor(Math.random() * 1_000_000_000)));
  };

  const openaiProvider = (config?.availableProviders || []).find((p) => p.id === 'openai');
  const openaiDisabled = openaiProvider && !openaiProvider.available;

  return (
    <div className="generate-layout">
      <div className="generate-controls">
        <div className="control-group">
          <label htmlFor="prompt">Prompt</label>
          <div className="prompt-wrap">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create…"
              maxLength={1000}
              rows={4}
            />
            <span className="prompt-counter">{prompt.length} / 1000</span>
          </div>
          <div className="enhance-row">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleEnhance}
              disabled={enhancing || !promptValid}
            >
              {enhancing ? 'Enhancing…' : 'Enhance prompt'}
            </button>
            {enhanceError && <span className="inline-error">{enhanceError}</span>}
          </div>
          {enhanced && (
            <div className="enhance-preview">
              <p>{enhanced}</p>
              <div className="enhance-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setPrompt(enhanced); setEnhanced(null); }}
                >Use this</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEnhanced(null)}>Dismiss</button>
              </div>
            </div>
          )}
        </div>

        <div className="control-group">
          <label>Style</label>
          <StyleGrid selected={style} onSelect={setStyle} />
        </div>

        <div className="control-group">
          <label>Aspect ratio</label>
          <AspectSelector selected={aspect} onSelect={setAspect} />
        </div>

        <div className="control-group">
          <label>Provider</label>
          <div className="provider-selector">
            {PROVIDERS.map((p) => {
              const isDisabled = p.id === 'openai' && openaiDisabled;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`provider-option ${provider === p.id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && setProvider(p.id)}
                  disabled={isDisabled}
                  title={isDisabled ? 'OpenAI is disabled because no API key is configured on the server.' : ''}
                  aria-pressed={provider === p.id}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="seed">Seed (optional)</label>
          <div className="seed-row">
            <input
              id="seed"
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Random"
              min={0}
              max={999999999}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleRandomSeed}>Random</button>
          </div>
          {provider === 'openai' && <p className="seed-hint">Seed is ignored by OpenAI.</p>}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-generate"
          onClick={handleGenerate}
          disabled={generateDisabled}
        >
          {loading ? 'Generating…' : 'Generate image'}
        </button>
      </div>

      <div className="generate-stage">
        <ImageStage
          result={result}
          loading={loading}
          error={error}
          aspect={aspect}
          onRetry={onRetry}
          onUseDemo={onUseDemo}
        />
      </div>
    </div>
  );
}
