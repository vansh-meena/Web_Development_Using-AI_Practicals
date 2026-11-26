import React from 'react';

function ProviderBadge({ provider }) {
  const map = { pollinations: 'Pollinations', openai: 'OpenAI', demo: 'Demo' };
  return <span className={`provider-badge small ${provider}`}>{map[provider] || provider}</span>;
}

export default function Gallery({ items, onReuse, onClear }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="gallery">
      <div className="gallery-header">
        <h2>Recent images</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear gallery</button>
      </div>
      <div className="gallery-grid">
        {items.map((it) => {
          const isDataUrl = String(it.url).startsWith('data:');
          const ext = it.demo ? 'svg' : 'png';
          const download = () => {
            if (isDataUrl) {
              const a = document.createElement('a');
              a.href = it.url;
              a.download = `lumora-${it.style}-${it.seed}.${ext}`;
              a.click();
            } else {
              const a = document.createElement('a');
              a.href = `/api/image/download?url=${encodeURIComponent(it.url)}`;
              a.download = `lumora-${it.style}-${it.seed}.${ext}`;
              a.click();
            }
          };
          return (
            <div className="gallery-item" key={it.key}>
              <div className="gallery-thumb">
                <img src={it.url} alt={it.finalPrompt} loading="lazy" />
              </div>
              <div className="gallery-meta">
                <ProviderBadge provider={it.provider} />
                <span className="meta-chip small">{it.style}</span>
                <span className="meta-chip small">{it.aspect}</span>
                <span className="meta-chip small">seed {it.seed}</span>
              </div>
              <div className="gallery-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onReuse(it)}>Reuse prompt</button>
                <button className="btn btn-ghost btn-sm" onClick={download}>Download</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
