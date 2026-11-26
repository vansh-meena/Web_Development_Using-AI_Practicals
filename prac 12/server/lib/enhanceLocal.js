// Offline prompt enhancer. Deterministic: the same prompt yields the same
// enhancement. Builds one paragraph from the user's prompt plus lighting,
// lens and mood phrases selected by a hash of the prompt. Invents no
// unrelated subjects.

const LIGHTING = [
  'soft golden-hour light',
  'dramatic rim lighting',
  'diffused overcast light',
  'warm candlelit glow',
  'cool moonlit ambience',
  'bright midday sunlight',
  'neon-lit reflections',
  'misty backlit haze',
];

const LENS = [
  'shot on a 50mm lens at f/1.8',
  'wide-angle 24mm perspective',
  'telephoto 85mm compression',
  'macro close-up detail',
  'fisheye distortion',
  'tilt-shift miniature effect',
];

const MOOD = [
  'serene and contemplative',
  'vibrant and energetic',
  'melancholic and quiet',
  'epic and awe-inspiring',
  'intimate and cozy',
  'mysterious and atmospheric',
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function enhanceLocal(prompt) {
  const base = prompt.trim();
  const h = hash(base);
  const lighting = LIGHTING[h % LIGHTING.length];
  const lens = LENS[(h >> 3) % LENS.length];
  const mood = MOOD[(h >> 6) % MOOD.length];
  return `${base}, ${lighting}, ${lens}, ${mood} composition, rich color and fine detail.`;
}
