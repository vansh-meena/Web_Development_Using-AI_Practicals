import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Header from './components/Header.jsx';
import GenerateTab from './components/GenerateTab.jsx';
import CaptionTab from './components/CaptionTab.jsx';
import Gallery from './components/Gallery.jsx';

function AppInner() {
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [lastRequest, setLastRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState([]);
  const [reuseState, setReuseIdentifier] = useState(null);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/image/config')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setConfig(data); })
      .catch((e) => { if (!cancelled) setBanner('Could not load server config. Is the server running?'); });
    return () => { cancelled = true; };
  }, []);

  const runGenerate = useCallback(async (req) => {
    setLoading(true);
    setError('');
    setResult(null);
    setLastRequest(req);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || 'Generation failed.';
        if (data.details) {
          const fields = Object.entries(data.details).map(([k, v]) => `${k}: ${v}`).join('; ');
          msg = `${msg} (${fields})`;
        }
        throw new Error(msg);
      }
      setResult(data);
      setGallery((prev) => {
        const item = { ...data, key: `${Date.now()}-${data.seed}` };
        return [item, ...prev].slice(0, 12);
      });
    } catch (e) {
      setError(e.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = useCallback((req) => runGenerate(req), [runGenerate]);

  const handleRetry = useCallback(() => {
    if (lastRequest) runGenerate(lastRequest);
  }, [lastRequest, runGenerate]);

  const handleUseDemo = useCallback(() => {
    if (lastRequest) runGenerate({ ...lastRequest, provider: 'demo' });
  }, [lastRequest, runGenerate]);

  const handleReuse = useCallback((item) => {
    setActiveTab('generate');
    setReuseIdentifier({
      prompt: item.finalPrompt?.replace(/, [^,]+(,[^,]+)*$/, '') || '',
      style: item.style,
      aspect: item.aspect,
      provider: item.provider,
      seed: item.seed,
      __id: Date.now(),
    });
  }, []);

  const demoMode = (config?.defaultProvider === 'demo') ||
    (result?.provider === 'demo' && !loading);

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} demoMode={demoMode} />
      {banner && <div className="error-banner">{banner}</div>}
      <main className="app-main">
        {activeTab === 'generate' && (
          <GenerateTab
            config={config}
            onGenerate={handleGenerate}
            loading={loading}
            result={result}
            error={error}
            onRetry={handleRetry}
            onUseDemo={handleUseDemo}
            onReuse={handleReuse}
            reuseState={reuseState}
          />
        )}
        {activeTab === 'caption' && (
          <CaptionTab captionAvailable={config?.captionAvailable} />
        )}
        {activeTab === 'generate' && (
          <Gallery
            items={gallery}
            onReuse={handleReuse}
            onClear={() => setGallery([])}
          />
        )}
      </main>
      <footer className="app-footer">
        <p>Lumora — text-to-image and photo captioning. Keys never leave the server.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
