const icons = {
  compass: <><circle cx="12" cy="12" r="8" /><path d="m15 9-2.2 3.8L9 15l2.2-3.8L15 9Z" /></>,
  layout: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M9 9v11" /></>,
  pen: <><path d="m4 16.5-.8 3.3 3.3-.8L18.2 7.3a2.3 2.3 0 0 0-3.3-3.3L4 16.5Z" /><path d="m13.5 5.5 3 3" /></>,
  code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
};

export default function ServiceCard({ icon, eyebrow, title, description, price }) {
  return (
    <a className="service-card" href="/services">
      <div className="service-icon"><svg aria-hidden="true" viewBox="0 0 24 24">{icons[icon]}</svg></div>
      {eyebrow && <p className="card-eyebrow">{eyebrow}</p>}
      <h3>{title}</h3>
      <p>{description}</p>
      {price && <p className="service-price">{price}</p>}
      {!price && <span className="card-arrow" aria-hidden="true">↗</span>}
    </a>
  );
}
