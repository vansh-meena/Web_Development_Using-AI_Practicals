import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

const EXAMPLES = {
  blog: [
    'How remote teams stay productive without burning out',
    'A beginner’s guide to personal finance',
    'Why sleep is the foundation of productivity',
    'Building healthy habits that actually stick',
  ],
  email: [
    'Inviting users to try our new dashboard',
    'A welcome email for new subscribers',
    'Announcing a seasonal sale',
    'Sharing a monthly product update',
  ],
  instagram: [
    'Morning routine for more energy',
    'A minimalist desk setup',
    'Tips for better focus while working from home',
    'Weekend recipe ideas for busy people',
  ],
  x: [
    'Lessons from a year of side projects',
    'Why deep work beats busy work',
    'Simple habits that improved my focus',
    'What I learned writing every day for 30 days',
  ],
  linkedin: [
    'Three lessons from leading a remote team',
    'How I approached my career change',
    'Why documentation matters more than meetings',
    'Building trust as a new manager',
  ],
};

export default function GeneratorForm({
  config,
  type,
  setType,
  topic,
  setTopic,
  tone,
  setTone,
  length,
  setLength,
  keyPoints,
  setKeyPoints,
  provider,
  setProvider,
  onGenerate,
  loading,
  generateDisabled,
}) {
  const examples = EXAMPLES[type] || EXAMPLES.blog;
  const topicLen = topic.length;
  const kpLen = keyPoints.length;

  return (
    <form
      className="generator-form"
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate();
      }}
    >
      <div className="field">
        <label>Topic</label>
        <textarea
          className="topic-textarea"
          value={topic}
          maxLength={1000}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Describe what you want to write about…"
          rows={3}
        />
        <div className="counter-row">
          <div className="example-chips">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                className="chip"
                onClick={() => setTopic(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
          <span className={`counter ${topicLen > 1000 ? 'over' : ''}`}>{topicLen} / 1000</span>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Tone</label>
          <div className="segmented">
            {(config?.tones || ['professional', 'casual', 'friendly', 'witty', 'persuasive']).map((t) => (
              <button
                key={t}
                type="button"
                className={`seg ${tone === t ? 'active' : ''}`}
                onClick={() => setTone(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Length</label>
          <div className="segmented">
            {(config?.lengths || ['short', 'medium', 'long']).map((l) => (
              <button
                key={l}
                type="button"
                className={`seg ${length === l ? 'active' : ''}`}
                onClick={() => setLength(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label>Key points <span className="optional">(optional)</span></label>
        <textarea
          className="kp-textarea"
          value={keyPoints}
          maxLength={1500}
          onChange={(e) => setKeyPoints(e.target.value)}
          placeholder="One point per line — the model will include each one."
          rows={3}
        />
        <div className="counter-row">
          <span />
          <span className={`counter ${kpLen > 1500 ? 'over' : ''}`}>{kpLen} / 1500</span>
        </div>
      </div>

      {config && config.availableProviders.length > 1 && (
        <div className="field">
          <label>Provider</label>
          <div className="segmented">
            {['demo', 'openai', 'gemini']
              .filter((p) => config.availableProviders.includes(p))
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`seg ${provider === p ? 'active' : ''}`}
                  onClick={() => setProvider(p)}
                >
                  {p === 'demo' ? 'Demo' : p === 'openai' ? 'OpenAI' : 'Gemini'}
                </button>
              ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary generate-btn"
        disabled={loading || generateDisabled}
      >
        {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
        {loading ? 'Generating…' : 'Generate'}
      </button>
    </form>
  );
}
