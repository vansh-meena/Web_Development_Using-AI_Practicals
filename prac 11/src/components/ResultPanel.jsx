import React, { useMemo, useState } from 'react';
import { Copy, Check, Download, FileText, FileType, AlertTriangle, RefreshCw } from 'lucide-react';
import MarkdownView from './MarkdownView.jsx';

const TYPE_LABELS = {
  blog: 'Blog',
  email: 'Email',
  instagram: 'Instagram',
  x: 'X Thread',
  linkedin: 'LinkedIn',
};

function dateStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function download(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ResultPanel({ result, onRegenerate, loading }) {
  const [tab, setTab] = useState('preview');
  const [text, setText] = useState(result?.text || '');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setText(result?.text || '');
    setTab('preview');
  }, [result]);

  const liveWordCount = useMemo(
    () => (text.trim().match(/\S+/g) || []).length,
    [text]
  );
  const liveCharCount = text.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const base = `postforge-${result.type}-${dateStamp()}`;

  return (
    <div className="result-panel">
      <div className="result-header">
        <div className="result-meta">
          <span className={`type-badge type-${result.type}`}>{TYPE_LABELS[result.type]}</span>
          <span className="chip-meta">{result.tone}</span>
          <span className="chip-meta">{result.length}</span>
          <span className="chip-meta provider">
            {result.demo ? 'Demo' : result.provider === 'openai' ? 'OpenAI' : 'Gemini'}
            {!result.demo && ` · ${result.model}`}
          </span>
        </div>
        <div className="result-counts">
          <span>{liveCharCount} chars</span>
          <span>{liveWordCount} words</span>
        </div>
      </div>

      {(result.warnings?.length > 0 || result.notice || result.cached) && (
        <div className="notices">
          {result.cached && (
            <div className="notice notice-cached">
              <span>Cached result</span>
              <button
                type="button"
                className="btn btn-mini"
                onClick={onRegenerate}
                disabled={loading}
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          )}
          {result.notice && <div className="notice notice-info">{result.notice}</div>}
          {result.warnings?.map((w, i) => (
            <div className="notice notice-warning" key={i}>
              <AlertTriangle size={14} /> {w}
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === 'preview' ? 'active' : ''}`}
          onClick={() => setTab('preview')}
        >
          Preview
        </button>
        <button
          type="button"
          className={`tab ${tab === 'edit' ? 'active' : ''}`}
          onClick={() => setTab('edit')}
        >
          Edit
        </button>
      </div>

      {tab === 'preview' ? (
        <div className="result-body preview-body">
          <MarkdownView text={text} />
        </div>
      ) : (
        <textarea
          className="result-edit"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      )}

      <div className="result-actions">
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => download(text, `${base}.md`, 'text/markdown')}>
          <FileText size={16} /> .md
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => download(text, `${base}.txt`, 'text/plain')}>
          <FileType size={16} /> .txt
        </button>
      </div>
    </div>
  );
}
