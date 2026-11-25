import { useEffect, useState } from 'react';
import ModeTabs from './components/ModeTabs.jsx';
import PromptBox from './components/PromptBox.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import HistoryList from './components/HistoryList.jsx';
import { LIMITS, PROVIDER_LABELS } from './constants.js';

export default function App() {
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState('freeform');
  const [prompt, setPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(LIMITS.maxTokensDefault);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/generate/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setConfig(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed || trimmed.length < LIMITS.promptMin || trimmed.length > LIMITS.promptMax) return;

    setLoading(true);
    setError(null);
    setNotice(null);
    setActiveIndex(-1);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, mode, maxTokens }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const err = {
          message: data?.error ?? 'The request failed.',
          details: data?.details,
        };
        setError(err);
        return;
      }
      setResult(data);
      if (data.notice) setNotice(data.notice);
      setHistory((h) => [
        {
          ts: Date.now(),
          mode,
          prompt: trimmed,
          promptPreview: trimmed.length > 60 ? trimmed.slice(0, 59) + '…' : trimmed,
          result: data,
          notice: data.notice ?? null,
        },
        ...h,
      ]);
    } catch {
      setError({ message: 'Could not reach the server. Is it running?' });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectHistory(i) {
    const item = history[i];
    if (!item) return;
    setActiveIndex(i);
    setPrompt(item.prompt);
    setMode(item.mode);
    setResult(item.result);
    setNotice(item.notice);
    setError(null);
  }

  const providerBadge = config ? PROVIDER_LABELS[config.provider] ?? config.provider : '...';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>AI Text Studio</h1>
          <span className={`provider-badge${config?.demo ? ' demo' : ''}`} title={`Model: ${config?.model ?? ''}`}>
            {providerBadge}
          </span>
        </div>
        <p className="tagline">
          Rewrite, summarize, brainstorm, and explain text with AI — works instantly in demo mode, no key required.
        </p>
      </header>

      <main className="app-main">
        <section className="editor-col">
          <ModeTabs mode={mode} onChange={setMode} disabled={loading} />
          <PromptBox
            prompt={prompt}
            onChange={setPrompt}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            disabled={loading}
            onSubmit={handleGenerate}
          />
        </section>

        <section className="result-col">
          <ResultPanel result={result} loading={loading} error={error} notice={notice} />
          <HistoryList items={history} onSelect={handleSelectHistory} activeIndex={activeIndex} />
        </section>
      </main>
    </div>
  );
}
