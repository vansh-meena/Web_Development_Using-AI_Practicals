import React from 'react';

// Minimal, safe markdown renderer -> React elements.
// Supports: # ## ### headings, **bold**, *italic*, - bullets, 1. numbered lists, paragraphs.
// Never injects HTML.

function renderInline(text, keyPrefix) {
  // bold then italic, producing React spans
  const tokens = [];
  // Split on **bold** first
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  boldParts.forEach((part, bi) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      tokens.push(<strong key={`${keyPrefix}-b-${bi}`}>{part.slice(2, -2)}</strong>);
    } else {
      // italic within
      const italicParts = part.split(/(\*[^*]+\*|_[^_]+_)/g);
      italicParts.forEach((ip, ii) => {
        if (/^(\*[^*]+\*|_[^_]+_)$/.test(ip)) {
          tokens.push(<em key={`${keyPrefix}-i-${bi}-${ii}`}>{ip.slice(1, -1)}</em>);
        } else if (ip) {
          tokens.push(<React.Fragment key={`${keyPrefix}-t-${bi}-${ii}`}>{ip}</React.Fragment>);
        }
      });
    }
  });
  return tokens;
}

export default function MarkdownView({ text }) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let list = null; // { type: 'ul'|'ol', items: [] }
  let para = [];

  function flushPara() {
    if (para.length) {
      blocks.push(
        <p key={`p-${blocks.length}`}>{renderInline(para.join(' '), `p${blocks.length}`)}</p>
      );
      para = [];
    }
  }
  function flushList() {
    if (list) {
      const items = list.items.map((it, i) => (
        <li key={`li-${blocks.length}-${i}`}>{renderInline(it, `li${blocks.length}${i}`)}</li>
      ));
      if (list.type === 'ol') {
        blocks.push(<ol key={`ol-${blocks.length}`}>{items}</ol>);
      } else {
        blocks.push(<ul key={`ul-${blocks.length}`}>{items}</ul>);
      }
      list = null;
    }
  }

  lines.forEach((raw, idx) => {
    const line = raw;
    if (!line.trim()) {
      flushPara();
      flushList();
      return;
    }
    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    const subject = line.match(/^Subject:\s*(.*)$/);

    if (h2) {
      flushPara(); flushList();
      blocks.push(<h2 key={`h2-${idx}`}>{renderInline(h2[1], `h2${idx}`)}</h2>);
    } else if (h3) {
      flushPara(); flushList();
      blocks.push(<h3 key={`h3-${idx}`}>{renderInline(h3[1], `h3${idx}`)}</h3>);
    } else if (h1) {
      flushPara(); flushList();
      blocks.push(<h1 key={`h1-${idx}`}>{renderInline(h1[1], `h1${idx}`)}</h1>);
    } else if (bullet) {
      flushPara();
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(bullet[1]);
    } else if (numbered) {
      flushPara();
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(numbered[1]);
    } else if (subject) {
      flushPara(); flushList();
      blocks.push(
        <div className="subject-line" key={`subj-${idx}`}>
          <span className="subject-label">Subject:</span> {subject[1]}
        </div>
      );
    } else {
      flushList();
      para.push(line);
    }
  });
  flushPara();
  flushList();

  return <div className="markdown-view">{blocks}</div>;
}
