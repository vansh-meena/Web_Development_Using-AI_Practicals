// Deterministic demo content templates. No network. Same input -> same output.
// Tone changes openings/sentence style; length changes structure (sections, paragraphs, tweets).

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function hashtagsFromTopic(topic, count) {
  const words = (topic.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (w) => w.length > 3 && !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'was', 'but', 'not', 'have', 'will'].includes(w)
  );
  const seen = new Set();
  const tags = [];
  for (const w of words) {
    const t = '#' + w;
    if (!seen.has(t)) {
      seen.add(t);
      tags.push(t);
    }
    if (tags.length >= count) break;
  }
  // pad with generic derived tags if not enough
  const fallback = ['#content', '#writing', '#tips', '#growth', '#ideas', '#creators', '#marketing', '#postforge'];
  let i = 0;
  while (tags.length < count && i < fallback.length) {
    if (!seen.has(fallback[i])) {
      seen.add(fallback[i]);
      tags.push(fallback[i]);
    }
    i++;
  }
  return tags;
}

function keyPointLines(keyPoints) {
  if (!keyPoints) return [];
  return keyPoints
    .split(/\n|\.|\u2022|;|(?:-\s)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 8);
}

function opening(tone, topic) {
  switch (tone) {
    case 'professional':
      return `An effective approach to ${topic} begins with clear fundamentals and disciplined execution.`;
    case 'casual':
      return `So, ${topic}. It's easier than people make it look.`;
    case 'friendly':
      return `Let's talk about ${topic} together. You've got this, and I'll walk you through it.`;
    case 'witty':
      return `${titleCase(topic)} sounds intimidating — until you realise most of it is just showing up.`;
    case 'persuasive':
      return `Stop putting off ${topic}. The right moment is the one you create today.`;
    default:
      return `Here's a look at ${topic}.`;
  }
}

function closing(tone) {
  switch (tone) {
    case 'professional':
      return 'Apply these principles consistently, and results will follow.';
    case 'casual':
      return "Anyway, that's the gist. Go try it.";
    case 'friendly':
      return "You're all set. Go give it a try and let me know how it goes!";
    case 'witty':
      return "That's the whole trick. Now go do the thing.";
    case 'persuasive':
      return 'Start now. Every day you wait is a day you pay for later.';
    default:
      return 'Thanks for reading.';
  }
}

function greeting(tone) {
  switch (tone) {
    case 'professional': return 'Hi there,';
    case 'casual': return 'Hey,';
    case 'friendly': return 'Hi friend,';
    case 'witty': return 'Hello again,';
    case 'persuasive': return 'Friend,';
    default: return 'Hello,';
  }
}

function signOff(tone) {
  switch (tone) {
    case 'professional': return 'Best regards,\nThe PostForge Team';
    case 'casual': return 'Cheers,\nPostForge';
    case 'friendly': return 'Warmly,\nYour friends at PostForge';
    case 'witty': return 'Yours in good timing,\nPostForge';
    case 'persuasive': return 'Make it happen,\nPostForge';
    default: return 'Thanks,\nPostForge';
  }
}

// ---- per-type builders ----

function buildBlog(input) {
  const { topic, tone, length, keyPoints } = input;
  const sections = length === 'short' ? 3 : length === 'medium' ? 4 : 5;
  const kp = keyPointLines(keyPoints);
  const sectionTitles = [
    'Why It Matters',
    'Getting Started',
    'Key Practices',
    'Common Pitfalls',
    'Making It Stick',
  ].slice(0, sections);
  // ensure key points are woven in
  const paraCount = length === 'short' ? 1 : length === 'medium' ? 2 : 2;

  let out = `# ${titleCase(topic)}: A Practical Guide\n\n`;
  out += `${opening(tone, topic)}\n\n`;
  sectionTitles.forEach((title, idx) => {
    out += `## ${title}\n\n`;
    out += `${sectionBody(tone, topic, idx)}\n\n`;
    if (paraCount > 1) {
      out += `${secondPara(tone, topic, idx)}\n\n`;
    }
  });
  if (kp.length) {
    out += `## Key Points to Remember\n\n`;
    kp.forEach((p) => {
      out += `- ${p}\n`;
    });
    out += '\n';
  }
  out += `## Ready to Act?\n\n${closing(tone)}\n`;
  return out;
}

function sectionBody(tone, topic, idx) {
  const stems = [
    `When it comes to ${topic}, the foundations carry the most weight.`,
    `Start by clarifying your goal with ${topic}.`,
    `Small, repeatable habits produce better results than occasional big pushes.`,
    `Most setbacks come from skipping the basics, not from ${topic} being hard.`,
    `Consistency is what separates progress from wishful thinking.`,
  ];
  const casualStems = [
    `Here's the thing about ${topic}: the basics do most of the work.`,
    `First up: figure out what you actually want from ${topic}.`,
    `Tiny habits win. Big heroic bursts rarely do.`,
    `Most slip-ups? Skipping basics, not ${topic} being tough.`,
    `Showing up regularly beats trying to be perfect.`,
  ];
  const friendlyStems = [
    `Let's start with why ${topic} matters to you specifically.`,
    `Begin by naming your goal for ${topic} — it helps, I promise.`,
    `Friendly reminder: small steady steps add up faster than you'd think.`,
    `If you hit a snag, it's usually the basics, not ${topic} itself.`,
    `Keep going. Consistency is your best friend here.`,
  ];
  const wittyStems = [
    `The basics of ${topic} aren't sexy. They just work.`,
    `Know your goal. Vague goals are just wishes with a fancy name.`,
    `Habits over heroics. Heroes get tired; habits don't.`,
    `Pitfalls are mostly the basics waving at you, ignored.`,
    `Consistency: boring name, exciting results.`,
  ];
  const persuasiveStems = [
    `If you want results from ${topic}, master the fundamentals first.`,
    `Define your goal now. A vague goal costs you every day you delay.`,
    `Compounding habits beat occasional effort every single time.`,
    `Most failures aren't about difficulty — they're about neglected basics.`,
    `Commit to consistency and you'll outlast everyone still hesitating.`,
  ];
  const map = { professional: stems, casual: casualStems, friendly: friendlyStems, witty: wittyStems, persuasive: persuasiveStems };
  return (map[tone] || stems)[idx] || stems[idx];
}

function secondPara(tone, topic, idx) {
  const lines = [
    `Keep your focus on progress over perfection as you work on ${topic}.`,
    `Each step forward compounds, so don't underestimate small wins.`,
    `Review your approach regularly and adjust without overthinking.`,
    `Track what works so you can repeat it deliberately.`,
    `Share your progress with someone — accountability helps.`,
  ];
  if (tone === 'casual') return `Don't overthink it. Just keep moving.`;
  if (tone === 'witty') return `Translation: keep going, even when it's dull.`;
  if (tone === 'friendly') return `You're doing great — keep that momentum going!`;
  if (tone === 'persuasive') return `Act on this today, not someday.`;
  return lines[idx] || lines[0];
}

function buildEmail(input) {
  const { topic, tone, length, keyPoints } = input;
  const kp = keyPointLines(keyPoints);
  const paras = length === 'short' ? 2 : length === 'medium' ? 3 : 4;
  let out = `Subject: ${emailSubject(tone, topic)}\n\n`;
  out += `${greeting(tone)}\n\n`;
  out += `${opening(tone, topic)}\n\n`;
  const bodyLines = [
    `We put together a few thoughts on ${topic} that should help you move forward.`,
    `There's a simple way to approach ${topic} without getting overwhelmed.`,
    `Here's what we've learned works best in practice.`,
    `The key is to start small and build from there.`,
  ];
  for (let i = 1; i < paras; i++) {
    if (i === 2 && kp.length) {
      out += `A few points worth keeping in mind:\n\n`;
      kp.slice(0, 4).forEach((p) => {
        out += `- ${p}\n`;
      });
      out += '\n';
    } else {
      out += `${bodyLines[i] || bodyLines[0]}\n\n`;
    }
  }
  out += `${signOff(tone)}\n`;
  return out;
}

function emailSubject(tone, topic) {
  const t = titleCase(topic);
  switch (tone) {
    case 'professional': return `A Practical Note on ${t}`;
    case 'casual': return `Quick thought on ${topic}`;
    case 'friendly': return `Some ideas for you on ${t}`;
    case 'witty': return `${t}: easier than it sounds`;
    case 'persuasive': return `Act on ${t} today`;
    default: return `About ${t}`;
  }
}

function buildInstagram(input) {
  const { topic, tone, length, keyPoints } = input;
  const kp = keyPointLines(keyPoints);
  const tagCount = length === 'short' ? 8 : length === 'medium' ? 10 : 12;
  const bodyLines = length === 'short' ? 2 : length === 'medium' ? 3 : 4;

  let out = `${igHook(tone, topic)}\n\n`;
  for (let i = 0; i < bodyLines; i++) {
    out += `${igBodyLine(tone, topic, i)}\n\n`;
  }
  if (kp.length) {
    out += `Things to remember:\n`;
    kp.slice(0, 5).forEach((p) => {
      out += `• ${p}\n`;
    });
    out += '\n';
  }
  out += `${closing(tone)}\n\n`;
  hashtagsFromTopic(topic, tagCount).forEach((t) => {
    out += `${t}\n`;
  });
  return out;
}

function igHook(tone, topic) {
  switch (tone) {
    case 'professional': return `A clear framework for ${topic}:`;
    case 'casual': return `Okay, ${topic} — let's break it down.`;
    case 'friendly': return `Here's something on ${topic} I think you'll like!`;
    case 'witty': return `${titleCase(topic)}: 90% showing up, 10% pretending you planned it.`;
    case 'persuasive': return `Stop scrolling — ${topic} can change how you work today.`;
    default: return `${titleCase(topic)}`;
  }
}

function igBodyLine(tone, topic, i) {
  const prof = [
    `Start with the fundamentals and build steadily.`,
    `Focus on consistency over intensity.`,
    `Review your progress and refine your approach.`,
    `Share what you learn along the way.`,
  ];
  const casual = [
    `Just start. Really. That's most of it.`,
    `Keep it small. Small stuff sticks.`,
    `Check in on yourself once in a while.`,
    `Tell a friend — keeps you honest.`,
  ];
  const friendly = [
    `You can start small, and that's totally okay!`,
    `Consistency is your friend — keep going gently.`,
    `Pause and notice how far you've come. Nice, right?`,
    `Share your wins, however small they feel.`,
  ];
  const witty = [
    `Start small. Tiny, even. Embarrassingly tiny.`,
    `Consistency: the unsexy secret everyone ignores.`,
    `Review your progress. Pretend it's a plot twist.`,
    `Tell someone. Accountability, but make it social.`,
  ];
  const persuasive = [
    `Start today — not Monday, not next month.`,
    `Consistency compounds. Miss it and you stall.`,
    `Review your results and double down on what works.`,
    `Share your progress — commit publicly and follow through.`,
  ];
  const map = { professional: prof, casual, friendly, witty, persuasive };
  return (map[tone] || prof)[i] || prof[i];
}

function buildX(input) {
  const { topic, tone, length, keyPoints } = input;
  const count = length === 'short' ? 4 : length === 'medium' ? 6 : 8;
  const kp = keyPointLines(keyPoints);
  const tweets = [];

  tweets.push(xHook(tone, topic));
  const middles = xMiddles(tone, topic);
  for (let i = 0; i < count - 2; i++) {
    let t = middles[i % middles.length];
    if (i < kp.length) {
      t = `${kp[i]}`;
    }
    tweets.push(t);
  }
  tweets.push(xCta(tone, topic));

  let out = '';
  tweets.forEach((t, i) => {
    let line = `${i + 1}/ ${t}`;
    if (line.length > 280) {
      line = line.slice(0, 277) + '...';
    }
    out += line + '\n\n';
  });
  return out.trim();
}

function xHook(tone, topic) {
  switch (tone) {
    case 'professional': return `A practical framework for ${topic}, in a few points:`;
    case 'casual': return `so ${topic}. here's the short version.`;
    case 'friendly': return `Let's talk ${topic} — quick version, just for you!`;
    case 'witty': return `${titleCase(topic)} sounds hard. It's mostly just showing up.`;
    case 'persuasive': return `Want results from ${topic}? Read this thread before you scroll on.`;
    default: return `On ${topic}:`;
  }
}

function xMiddles(tone, topic) {
  const base = [
    `Start with the fundamentals. They carry everything else.`,
    `Small consistent steps beat occasional big effort.`,
    `Track what works and repeat it on purpose.`,
    `Review regularly, but don't overthink every move.`,
    `Tell someone your goal — accountability is free leverage.`,
    `Progress beats perfection every single time.`,
  ];
  if (tone === 'casual') return [
    `basics first. seriously, basics do most of it.`,
    `tiny steps > big rare pushes.`,
    `notice what works. do it again.`,
    `don't overthink. adjust and keep going.`,
    `tell a friend. keeps you honest.`,
    `progress > perfection. always.`,
  ];
  if (tone === 'friendly') return [
    `Start with the basics — you've got this!`,
    `Small steady steps add up faster than you'd think.`,
    `Notice what works and do more of it.`,
    `Check in kindly, no harsh self-judgement.`,
    `Share your goal with a friend for support.`,
    `Progress over perfection, every time.`,
  ];
  if (tone === 'witty') return [
    `Basics first. Not glamorous. Just effective.`,
    `Tiny habits > heroic bursts. Heroes tire out.`,
    `Track the wins. Pretend it's analytics.`,
    `Adjust, don't agonise. Move on.`,
    `Tell someone. Accountability, but social.`,
    `Progress beats perfection. Obvious, ignored.`,
  ];
  if (tone === 'persuasive') return [
    `Master the fundamentals first — everything depends on them.`,
    `Consistency compounds. Skip it and you stall.`,
    `Track what works, then double down deliberately.`,
    `Review fast, adjust faster. No endless deliberation.`,
    `Commit publicly. Accountability forces follow-through.`,
    `Choose progress over perfection — today.`,
  ];
  return base;
}

function xCta(tone, topic) {
  switch (tone) {
    case 'professional': return `If this was useful, bookmark it and share it with someone working on ${topic}.`;
    case 'casual': return `anyway, go try it. rt the first tweet if it helped.`;
    case 'friendly': return `Hope this helped! Share it with a friend who needs it. 💛`;
    case 'witty': return `That's the thread. Bookmark it before it scrolls away.`;
    case 'persuasive': return `Stop waiting. Start on ${topic} today and share this with someone who should too.`;
    default: return `Thanks for reading.`;
  }
}

function buildLinkedIn(input) {
  const { topic, tone, length, keyPoints } = input;
  const kp = keyPointLines(keyPoints);
  const bullets = length === 'short' ? 3 : length === 'medium' ? 4 : 5;
  const tagCount = length === 'short' ? 3 : length === 'medium' ? 4 : 5;

  let out = `${liHook(tone, topic)}\n\n`;
  const insightBases = [
    `The fundamentals of ${topic} do most of the heavy lifting.`,
    `Consistency outperforms intensity over time.`,
    `Tracking what works lets you repeat it on purpose.`,
    `Sharing your goal creates useful accountability.`,
    `Progress compounds when you review and adjust.`,
  ];
  for (let i = 0; i < bullets; i++) {
    let b = insightBases[i] || insightBases[0];
    if (i < kp.length) b = kp[i];
    out += `• ${b}\n`;
  }
  out += '\n';
  out += `Takeaway: ${liTakeaway(tone, topic)}\n\n`;
  hashtagsFromTopic(topic, tagCount).forEach((t) => {
    out += `${t}\n`;
  });
  return out;
}

function liHook(tone, topic) {
  switch (tone) {
    case 'professional': return `A few lessons I've found useful when working on ${topic}:`;
    case 'casual': return `Real talk on ${topic} — the stuff that actually helps:`;
    case 'friendly': return `Sharing some thoughts on ${topic} that might help you today:`;
    case 'witty': return `${titleCase(topic)}: mostly fundamentals, a little timing, and a lot of showing up.`;
    case 'persuasive': return `If you're serious about ${topic}, these five points will save you months.`;
    default: return `On ${topic}:`;
  }
}

function liTakeaway(tone, topic) {
  switch (tone) {
    case 'professional': return `master the fundamentals of ${topic} and apply them consistently.`;
    case 'casual': return `just start ${topic} small and keep showing up.`;
    case 'friendly': return `be kind to yourself and keep going with ${topic} — you're closer than you think.`;
    case 'witty': return `do the boring basics of ${topic} consistently; the exciting part shows up later.`;
    case 'persuasive': return `act on ${topic} today — consistency now beats regret later.`;
    default: return `keep at it.`;
  }
}

export function generateDemo(input) {
  const builders = {
    blog: buildBlog,
    email: buildEmail,
    instagram: buildInstagram,
    x: buildX,
    linkedin: buildLinkedIn,
  };
  const fn = builders[input.type] || buildBlog;
  return fn(input);
}
