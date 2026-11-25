// Deterministic demo generator: same prompt + mode always yields the same
// output. No network calls. Output is shaped like the real providers' so the
// app is fully demonstrable with no API keys.

function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(list, seed, offset) {
  return list[(seed + offset) % list.length];
}

function sentences(prompt) {
  return prompt
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clamp(s, n) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function generateDemoText({ prompt, mode }) {
  const seed = seedFrom(prompt + '::' + mode);
  const parts = sentences(prompt);

  switch (mode) {
    case 'summarize':
      return demoSummarize(parts, seed);
    case 'rewrite':
      return demoRewrite(parts, seed);
    case 'brainstorm':
      return demoBrainstorm(prompt, seed);
    case 'explain':
      return demoExplain(prompt, seed);
    default:
      return demoFreeform(prompt, parts, seed);
  }
}

function demoSummarize(parts, seed) {
  const lead = parts[0] ?? '';
  const rest = parts.slice(1);
  const bullets = [`Main subject: ${titleCase(clamp(lead, 140))}.`];

  if (rest.length > 0) {
    for (const s of rest.slice(0, 5)) {
      bullets.push(`Point: ${clamp(s, 160)}`);
    }
  } else {
    bullets.push(
      `Key idea: the text centers on ${clamp(lead.toLowerCase().replace(/^(the|a|an)\s+/i, ''), 110)}.`,
      `Focus area: ${pick(['motivation', 'context', 'constraints', 'goals', 'requirements', 'impact'], seed, 1)} appears to matter most.`,
      `Detail level: the input is concise, so the summary preserves its wording closely.`,
      `Takeaway: the core message is stated in the opening sentence.`,
      `Scope: nothing in the input suggests secondary themes.`
    );
  }
  return bullets.slice(0, 6).join('\n');
}

function demoRewrite(parts, seed) {
  const connectors = ['In short,', 'Put simply,', 'To be clear,', 'The gist is:'];
  const lead = parts[0] ?? '';
  const cleaned = lead
    .replace(/^\s*(please\s+)?(can you\s+)?(kindly\s+)?/i, '')
    .replace(/\butilize\b/gi, 'use')
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bbasically\b/gi, '')
    .replace(/\bvery\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const opener = pick(connectors, seed, 2);
  let out = `${opener} ${cleaned.endsWith('.') ? cleaned : cleaned + '.'}`;
  if (parts.length > 1) {
    out += ` ${parts.slice(1).join(' ')}`;
  }
  return out;
}

function demoBrainstorm(prompt, seed) {
  const subject = clamp(prompt.replace(/\s+/g, ' ').trim(), 60);
  const angles = [
    ['Start with the smallest version', `ship a minimal slice of "${subject}" first, then expand based on what people actually use.`],
    ['Flip the assumption', `ask what "${subject}" would look like if the usual constraint were removed — this surfaces hidden defaults.`],
    ['Steal from another field', `borrow a proven pattern from a different industry and apply it to "${subject}".`],
    ['Automate the boring part', `find the most repetitive step around "${subject}" and hand it to a script or template.`],
    ['Add a feedback loop', `attach a quick review step to "${subject}" so small improvements compound weekly.`],
    ['Split the audience', `serve two different groups of "${subject}" differently instead of one average experience.`],
    ['Make it social', `let others see or remix "${subject}" — visibility creates momentum on its own.`],
    ['Timebox it', `give "${subject}" a strict deadline to force decisions and cut scope creep.`],
  ];
  const start = seed % 4;
  const count = 6 + (seed % 3); // 6-8 ideas
  return angles
    .slice(start, start + count)
    .concat(count > angles.length - start ? angles.slice(0, start) : [])
    .slice(0, count)
    .map((a, i) => `${i + 1}. ${a[0]} — ${a[1]}`)
    .join('\n');
}

function demoExplain(prompt, seed) {
  const topic = clamp(prompt.replace(/\s+/g, ' ').trim(), 80);
  const analogies = [
    `Think of it like a kitchen: ${topic} is the recipe, the tools are your ingredients, and practice is how you learn which flavors go together.`,
    `Picture a library: ${topic} works like the catalog — it doesn't hold every book, it tells you exactly where to look.`,
    `It's similar to traffic lights: ${topic} isn't about going faster, it's about knowing when to go and when to stop.`,
    `Imagine a garden: ${topic} starts as seeds, needs regular attention, and only shows results after consistent care.`,
  ];
  const analogy = pick(analogies, seed, 3);
  return `${titleCase(topic)} is easier than it first looks.

At its core, it comes down to a few simple pieces that work together, and you can understand each one on its own before combining them. ${analogy}

Start with the smallest working example, get comfortable with it, and build up from there. The terminology looks intimidating early on, but it's just names for steps you'll already be doing naturally.`;
}

function demoFreeform(prompt, parts, seed) {
  const lead = clamp(parts[0] ?? prompt, 120);
  const openers = [
    `Here's my take on "${lead}".`,
    `Good question — let's look at "${lead}".`,
    `Happy to help with "${lead}".`,
  ];
  const closers = [
    'Want me to go deeper on any part of this?',
    'Let me know if you want a different angle.',
    'I can expand on any of these points if useful.',
  ];
  const body = [
    'The main thing to know is what you are really asking for — once that is clear, the steps tend to fall into place.',
    'A practical approach is to start small, check the result, and adjust rather than planning every detail up front.',
    'It also helps to write down what "done" looks like for you, so it is easy to tell when you have arrived.',
  ];
  return `${pick(openers, seed, 4)}\n\n${body.join('\n\n')}\n\n${pick(closers, seed, 5)}`;
}
