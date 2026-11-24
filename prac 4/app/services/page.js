import Link from 'next/link';
import SectionHeading from '../../components/SectionHeading';
import ServiceCard from '../../components/ServiceCard';

export const metadata = {
  title: 'Services',
  description: 'Strategy, identity, and digital design services from Brightline Studio.',
};

const services = [
  { icon: 'compass', title: 'Brand strategy', description: 'Get aligned on where you are going, why it matters, and how to make the market care.', price: 'From $1,200' },
  { icon: 'pen', title: 'Visual identity', description: 'Build a distinctive identity system that gives every touchpoint the same clear point of view.', price: 'From $3,800' },
  { icon: 'layout', title: 'Website design', description: 'Create a digital home that tells your story quickly and makes the next step feel natural.', price: 'From $4,500' },
  { icon: 'code', title: 'Web development', description: 'Bring the design to life with a responsive, accessible experience built for real people.', price: 'From $5,800' },
  { icon: 'chart', title: 'Campaign creative', description: 'Turn a launch, message, or moment into a campaign people remember and share.', price: 'From $2,400' },
  { icon: 'search', title: 'Creative direction', description: 'Add an experienced creative partner to your team when the stakes or the scope get bigger.', price: 'From $1,500' },
];

const packages = [
  { name: 'Starter', price: '$2,400', description: 'For a focused idea that needs a clear, confident beginning.', features: ['One-day discovery workshop', 'Strategic direction brief', 'Core visual direction', 'Two weeks of collaboration'] },
  { name: 'Growth', price: '$6,800', description: 'For a growing brand ready to look and sound like its best self.', features: ['Brand positioning & messaging', 'Complete visual identity', 'Responsive website design', 'Launch-ready brand toolkit'], featured: true },
  { name: 'Premium', price: '$12,500', description: 'For a big shift that deserves a deeply considered, complete system.', features: ['Full brand strategy', 'Identity and art direction', 'Website design & development', 'Launch support and training'] },
];

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero section-shell section-soft">
        <div className="container narrow-container">
          <p className="eyebrow">Our services</p>
          <h1 className="display-text page-title">Good ideas deserve<br /><span>good company.</span></h1>
          <p className="page-lede">Bring us the messy middle, the ambitious plan, or the almost-there idea. We will help you make it clear, compelling, and ready for what is next.</p>
        </div>
      </section>

      <section className="section-shell section-white">
        <div className="container">
          <div className="section-intro split-intro"><SectionHeading eyebrow="What we bring" title="The right mix of thinking and making." /><p className="section-lede">Every engagement is shaped around the question in front of you. Start with one service or bring us in for the whole journey.</p></div>
          <div className="service-grid service-grid-all">{services.map((service) => <ServiceCard key={service.title} {...service} />)}</div>
        </div>
      </section>

      <section className="section-shell section-soft">
        <div className="container">
          <SectionHeading eyebrow="Ways to work together" title="A starting point for every kind of ambition." />
          <div className="package-grid">
            {packages.map((pack) => <article className={`package-card ${pack.featured ? 'package-featured' : ''}`} key={pack.name}>
              {pack.featured && <span className="package-badge">Most popular</span>}
              <p className="package-name">{pack.name}</p><p className="package-price">{pack.price}</p><p className="package-description">{pack.description}</p>
              <ul className="feature-list">{pack.features.map((feature) => <li key={feature}><span className="check-mark">✓</span>{feature}</li>)}</ul>
              <Link className={pack.featured ? 'button button-primary button-full' : 'button button-outline button-full'} href="/contact">Choose {pack.name}</Link>
            </article>)}
          </div>
        </div>
      </section>
    </>
  );
}
