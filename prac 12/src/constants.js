// Frontend mirror of the server style/aspect config. Loaded from /api/image/config
// on startup, but these defaults render before that resolves.

export const STYLES = {
  photoreal: { id: 'photoreal', label: 'Photorealistic' },
  '3d': { id: '3d', label: '3D Render' },
  watercolor: { id: 'watercolor', label: 'Watercolor' },
  anime: { id: 'anime', label: 'Anime' },
  neon: { id: 'neon', label: 'Neon' },
  pixel: { id: 'pixel', label: 'Pixel Art' },
};

export const ASPECTS = {
  square: { id: 'square', label: 'Square', width: 1024, height: 1024 },
  portrait: { id: 'portrait', label: 'Portrait', width: 768, height: 1152 },
  landscape: { id: 'landscape', label: 'Landscape', width: 1152, height: 768 },
};

export const PROVIDERS = [
  { id: 'pollinations', label: 'Pollinations' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'demo', label: 'Demo' },
];
