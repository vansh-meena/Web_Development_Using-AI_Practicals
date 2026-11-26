import React, { useState, useRef, useCallback } from 'react';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function readError(file) {
  if (!file) return 'No file selected.';
  if (!ALLOWED.includes(file.type)) return 'Only JPEG, PNG, and WebP files are allowed.';
  if (file.size > MAX_BYTES) return 'File must be at most 4 MB.';
  return '';
}

// Downscale to at most 1024px on the longest side, re-encode as JPEG.
function downscale(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1024;
        let { width, height } = img;
        if (width > height && width > maxSide) {
          height = Math.round(height * (maxSide / width));
          width = maxSide;
        } else if (height >= width && height > maxSide) {
          width = Math.round(width * (maxSide / height));
          height = maxSide;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Could not read the image.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

export default function CaptionTab({ captionAvailable }) {
  const [preview, setPreview] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [fileError, setFileError] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [captionError, setCaptionError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    setFileError('');
    setCaption('');
    setCaptionError('');
    const err = readError(file);
    if (err) { setFileError(err); return; }
    try {
      const url = await downscale(file);
      setDataUrl(url);
      setPreview(url);
    } catch (e) {
      setFileError(e.message || 'Could not process the image.');
    }
  }, []);

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleCaption = async () => {
    if (!dataUrl) return;
    setLoading(true);
    setCaptionError('');
    setCaption('');
    try {
      const res = await fetch('/api/image/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, mimeType: 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Captioning failed.');
      setCaption(data.caption);
    } catch (e) {
      setCaptionError(e.message || 'Captioning failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { setCopied(false); }
  };

  if (!captionAvailable) {
    return (
      <div className="caption-disabled">
        <h2>Captioning is unavailable</h2>
        <p>Captioning needs GEMINI_API_KEY (add it to .env and restart).</p>
      </div>
    );
  }

  return (
    <div className="caption-layout">
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onInputChange}
          hidden
        />
        {preview ? (
          <img src={preview} alt="Preview" className="caption-preview" />
        ) : (
          <div className="dropzone-prompt">
            <p><strong>Drop an image here</strong> or click to browse</p>
            <p className="dropzone-hint">JPEG, PNG, or WebP — max 4 MB</p>
          </div>
        )}
      </div>

      {fileError && <p className="inline-error">{fileError}</p>}

      <div className="caption-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCaption}
          disabled={!dataUrl || loading}
        >
          {loading ? 'Generating caption…' : 'Generate caption'}
        </button>
        {preview && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setPreview(null); setDataUrl(null); setCaption(''); setFileError(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {captionError && <p className="inline-error">{captionError}</p>}

      {caption && (
        <div className="caption-result">
          <p>{caption}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy caption'}
          </button>
        </div>
      )}
    </div>
  );
}
