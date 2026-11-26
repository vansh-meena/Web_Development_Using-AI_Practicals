import React from 'react';
import { FileText, Mail, Instagram, Twitter, Linkedin } from 'lucide-react';

const META = {
  blog: { name: 'Blog Post', icon: FileText, desc: 'SEO-ready article with sections.' },
  email: { name: 'Email', icon: Mail, desc: 'Subject, body, and sign-off.' },
  instagram: { name: 'Instagram', icon: Instagram, desc: 'Caption plus hashtags.' },
  x: { name: 'X Thread', icon: Twitter, desc: 'Numbered thread of tweets.' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, desc: 'Hook, insights, and hashtags.' },
};

export default function TypeCards({ value, onChange, disabled }) {
  return (
    <div className="type-cards">
      {Object.entries(META).map(([key, { name, icon: Icon, desc }]) => (
        <button
          key={key}
          type="button"
          className={`type-card ${value === key ? 'selected' : ''}`}
          onClick={() => onChange(key)}
          disabled={disabled}
        >
          <div className="type-card-icon">
            <Icon size={22} />
          </div>
          <div className="type-card-name">{name}</div>
          <div className="type-card-desc">{desc}</div>
        </button>
      ))}
    </div>
  );
}
