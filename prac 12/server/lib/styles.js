// Style definitions. The suffix is appended to the user's prompt as
// "<prompt>, <suffix>". Dimensions are sent separately as width/height.

export const STYLES = {
  photoreal: { id: 'photoreal', label: 'Photorealistic', suffix: 'photorealistic, 8k, sharp focus, natural lighting' },
  '3d': { id: '3d', label: '3D Render', suffix: '3D render, octane, soft studio lighting, high detail' },
  watercolor: { id: 'watercolor', label: 'Watercolor', suffix: 'watercolor painting, soft brush strokes, paper texture' },
  anime: { id: 'anime', label: 'Anime', suffix: 'anime style, vibrant colors, clean line art' },
  neon: { id: 'neon', label: 'Neon', suffix: 'cyberpunk neon aesthetic, dramatic lighting, high contrast' },
  pixel: { id: 'pixel', label: 'Pixel Art', suffix: 'pixel art, 16-bit retro game style' },
};

export const STYLE_IDS = Object.keys(STYLES);

// Pixel dimensions per aspect ratio.
export const ASPECTS = {
  square: { id: 'square', label: 'Square', width: 1024, height: 1024 },
  portrait: { id: 'portrait', label: 'Portrait', width: 768, height: 1152 },
  landscape: { id: 'landscape', label: 'Landscape', width: 1152, height: 768 },
};

export const ASPECT_IDS = Object.keys(ASPECTS);

// OpenAI only accepts specific sizes depending on the model. We map each
// aspect to the nearest supported size. Keep this in one map so it is easy
// to change when a model's supported sizes change.
export const OPENAI_SIZE_MAP = {
  square: '1024x1024',
  portrait: '1024x1536',
  landscape: '1536x1024',
};

export const PROVIDERS = ['pollinations', 'openai', 'demo'];

// Build the final prompt: user prompt + style suffix.
export function buildFinalPrompt(prompt, styleId) {
  const style = STYLES[styleId] || STYLES.photoreal;
  return `${prompt}, ${style.suffix}`;
}
