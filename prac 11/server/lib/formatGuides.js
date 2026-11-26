export const TYPES = ['blog', 'email', 'instagram', 'x', 'linkedin'];
export const TONES = ['professional', 'casual', 'friendly', 'witty', 'persuasive'];
export const LENGTHS = ['short', 'medium', 'long'];
export const PROVIDERS = ['openai', 'gemini', 'demo'];

export const FORMAT_GUIDES = {
  blog:
    'Write the post in Markdown. Start with the SEO title as a "# " heading. Then an intro paragraph. Then 3 to 5 sections each with a "## " heading and short paragraphs. End with a closing call to action. No preamble.',
  email:
    'Start the first line with "Subject: " followed by a clear subject. Then a greeting. Then 2 to 4 short paragraphs or bullet points. End with a warm professional sign-off. No preamble.',
  instagram:
    'Write a scroll-stopping first line, then an engaging body. Then 8 to 12 hashtags, each on its own line starting with #. No preamble.',
  x:
    'Write a numbered thread. Start each tweet with "1/", "2/", and so on. 4 to 8 tweets total. Each tweet must be at most 280 characters. The first tweet is the hook, the last is a call to action. No preamble.',
  linkedin:
    'Start with a strong hook line. Then 3 to 5 insight bullets. Then a single takeaway line. Then 3 to 5 hashtags, each on its own line starting with #. No preamble.',
};

// word targets per type+length; maxTokens ~ 2.5x word target
export const LENGTH_MAP = {
  blog: { short: 300, medium: 600, long: 1000 },
  email: { short: 80, medium: 150, long: 250 },
  instagram: { short: 60, medium: 110, long: 180 },
  linkedin: { short: 100, medium: 180, long: 300 },
  x: { short: 4, medium: 6, long: 8 }, // tweet counts
};

export function lengthInstruction(type, length) {
  if (type === 'x') {
    const n = LENGTH_MAP.x[length];
    return `Write exactly ${n} tweets in the thread.`;
  }
  const words = LENGTH_MAP[type][length];
  return `Target roughly ${words} words.`;
}

export function maxTokens(type, length) {
  if (type === 'x') {
    const n = LENGTH_MAP.x[length];
    return n * 140; // ~280 chars * factor
  }
  const words = LENGTH_MAP[type][length];
  return Math.max(256, Math.round(words * 2.5));
}
