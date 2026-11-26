import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import Header from './components/Header.jsx';
import TypeCards from './components/TypeCards.jsx';
import GeneratorForm from './components/GeneratorForm.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import HistoryList from './components/HistoryList.jsx';

export default function App() {
  const [config, setConfig] = useState(null);
  const [type, setType] = useState('blog');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [keyPoints, setKeyPoints] = useState('');
  const [provider, setProvider] = useState('demo');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generateLocked, setGenerateLocked] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    fetch('/api/content/config')
      .then((r) => r.json())
      .then((c) => {
        if (!active) return;
        setConfig(c);
        setProvider(c.provider);
        if (c.tones && !c.tones.includes(tone)) setTone(c.tones[0]);
      })
      .catch(() => {
        if (active) setError('Could not load app configuration. Is the server running?');
      });
    return () => {
      active = false;
    };
  }, []);

  const topicValid = topic.trim().length >= 3 && topic.trim().length <= 1000;

  const runGenerate = useCallback(
    async (override) => {
      setError(null);
      setLoading(true);
      setGenerateLocked(true);
      try {
        const body = {
          type,
          topic: topic.trim(),
          tone,
          length,
          keyPoints: keyPoints || undefined,
          provider: provider || undefined,
          refresh: override?.refresh === true,
        };
        const res = await fetch('/api/content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error || 'Generation failed.';
          if (data?.details) {
            const dets = Object.entries(data.details)
              .map(([f, m]) => `${f}: ${m}`)
              .join(' ');
            setError(`${msg} (${dets})`);
          } else {
            setError(msg);
          }
          return;
        }
        setResult(data);
        setHistory((prev) => {
          const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ts: Date.now(),
            type,
            topic: topic.trim(),
            tone,
            length,
            keyPoints,
            provider,
            result: data,
          };
          return [entry, ...prev].slice(0, 20);
        });
      } catch (e) {
        setError('Could not reach the server. Make sure it is running.');
      } finally {
        setLoading(false);
        // keep button disabled for 2s after a response
        setTimeout(() => setGenerateLocked(false), 2000);
      }
    },
    [type, topic, tone, length, keyPoints, provider]
  );

  const handleGenerate = useCallback(() => {
    if (loading || generateLocked) return;
    runGenerate({ refresh: false });
  }, [loading, generateLocked, runGenerate]);

  const handleRegenerate = useCallback(() => {
    if (loading) return;
    runGenerate({ refresh: true });
  }, [loading, runGenerate]);

  const restoreHistory = useCallback((h) => {
    setType(h.type);
    setTopic(h.topic);
    setTone(h.tone);
    setLength(h.length);
    setKeyPoints(h.keyPoints || '');
    setProvider(h.provider || 'demo');
    setResult(h.result);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return (
    <div className="app">
      <Header config={config} loading={loading} />

      <main className="main">
        <section className="left-col">
          <div className="card">
            <h2 className="section-title">Choose a content type</h2>
            <TypeCards value={type} onChange={setType} disabled={loading} />
          </div>

          <div className="card">
            <h2 className="section-title">Details</h2>
            <GeneratorForm
              config={config}
              type={type}
              setType={setType}
              topic={topic}
              setTopic={setTopic}
              tone={tone}
              setTone={setTone}
              length={length}
              setLength={setLength}
              keyPoints={keyPoints}
              setKeyPoints={setKeyPoints}
              provider={provider}
              setProvider={setProvider}
              onGenerate={handleGenerate}
              loading={loading}
              generateDisabled={!topicValid || generateLocked}
            />
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="right-col">
          {result ? (
            <ResultPanel
              result={result}
              onRegenerate={handleRegenerate}
              loading={loading}
            />
          ) : (
            <div className="empty-result card">
              <div className="empty-result-inner">
                <h2>Your content will appear here</h2>
                <p>Pick a type, enter a topic, and hit Generate. Try it in demo mode — no API key needed.</p>
              </div>
            </div>
          )}

          <HistoryList
            history={history}
            onSelect={restoreHistory}
            onClear={clearHistory}
          />
        </section>
      </main>

      <footer className="footer">
        <span>PostForge · AI content generator</span>
      </footer>
    </div>
  );
}
