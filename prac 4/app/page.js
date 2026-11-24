import Link from 'next/link';
import SectionHeading from '../components/SectionHeading';
import ServiceCard from '../components/ServiceCard';

const featuredServices = [
  {
    icon: 'compass',
    eyebrow: 'Find the signal',
    title: 'Brand strategy',
    description: 'Positioning, voice, and a point of view that makes the right people pay attention.',
  },
  {
    icon: 'layout',
    eyebrow: 'Make it memorable',
    title: 'Digital experiences',
    description: 'Thoughtful websites and products that turn a good first impression into momentum.',
  },
  {
    icon: 'pen',
    eyebrow: 'Say it clearly',
    title: 'Visual identity',
    description: 'A flexible visual system with the confidence to look consistent everywhere it shows up.',
  },
];

const process = [
  { number: '01', title: 'Discover', description: 'We listen, ask the sharper questions, and find the opportunity hiding in the brief.' },
  { number: '02', title: 'Design', description: 'We explore generously, then make the strongest idea impossible to ignore.' },
  { number: '03', title: 'Build', description: 'We turn the direction into a polished, practical system your team can own.' },
  { number: '04', title: 'Launch', description: 'We help you go live with confidence and a clear next move.' },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="icon icon-sm">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero-section section-shell">
        <div className="hero-grid" aria-hidden="true">
          <span className="hero-orb hero-orb-one" />
          <span className="hero-orb hero-orb-two" />
          <span className="hero-line hero-line-one" />
          <span className="hero-line hero-line-two" />
        </div>
        <div className="container hero-content">
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> Independent design studio · New York / Everywhere</p>
          <h1 className="display-text hero-title">Make your next<br /><span>move</span> unmistakable.</h1>
          <p className="hero-copy">Brightline helps ambitious teams turn complex ideas into clear brands, memorable products, and work that moves people forward.</p>
          <div className="button-row">
            <Link className="button button-primary" href="/contact">Start a project <ArrowIcon /></Link>
            <Link className="text-link" href="/services">Explore our services <ArrowIcon /></Link>
          </div>
          <div className="hero-note"><span className="hero-note-line" /> Built for the in-between moments: the pivot, the launch, the leap.</div>
        </div>
      </section>

      <section className="section-shell section-white">
        <div className="container">
          <div className="section-intro split-intro">
            <SectionHeading eyebrow="What we do" title="Clarity is a competitive advantage." />
            <p className="section-lede">When the path forward feels noisy, the right creative partner makes the signal clearer. We bring strategy and craft together so your next chapter feels like yours.</p>
          </div>
          <div className="service-grid service-grid-home">
            {featuredServices.map((service) => <ServiceCard key={service.title} {...service} />)}
          </div>
          <div className="section-action"><Link className="text-link" href="/services">See all services <ArrowIcon /></Link></div>
        </div>
      </section>

      <section className="section-shell section-soft">
        <div className="container">
          <div className="section-intro process-intro">
            <SectionHeading eyebrow="How we work" title="A clear path from first thought to full expression." />
            <p className="section-lede">Good work should feel collaborative, considered, and a little surprising. Our process keeps the big picture in focus while leaving room for the unexpected.</p>
          </div>
          <div className="process-grid">
            {process.map((step) => (
              <div className="process-step" key={step.number}>
                <span className="process-number">{step.number}</span>
                <div className="process-rule" />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section section-shell">
        <div className="container cta-inner">
          <div><p className="eyebrow eyebrow-light">Have a good feeling about this?</p><h2 className="display-text cta-title">Let&apos;s make it<br />worth remembering.</h2></div>
          <Link className="button button-light" href="/contact">Tell us what&apos;s next <ArrowIcon /></Link>
        </div>
      </section>
    </>
  );
}
