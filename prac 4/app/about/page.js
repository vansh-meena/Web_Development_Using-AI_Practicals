import SectionHeading from '../../components/SectionHeading';

export const metadata = {
  title: 'About',
  description: 'Meet the people and principles behind Brightline Studio.',
};

const values = [
  { number: '01', title: 'Be clear', description: 'We make the complicated feel simple without sanding away what makes it meaningful.' },
  { number: '02', title: 'Stay curious', description: 'The best answers usually live just beyond the obvious. We keep looking.' },
  { number: '03', title: 'Make it useful', description: 'Beautiful is a baseline. Everything we make should earn its place in the world.' },
  { number: '04', title: 'Leave room', description: 'We build systems that can grow, flex, and keep surprising you in good ways.' },
];

const team = [
  { initials: 'MC', name: 'Maya Chen', role: 'Founder & Creative Director', bio: 'Maya turns early-stage ambiguity into brave, grounded creative direction.' },
  { initials: 'JR', name: 'Jonah Reed', role: 'Strategy Partner', bio: 'Jonah finds the human truth in a business challenge and makes it actionable.' },
  { initials: 'AN', name: 'Ari Navarro', role: 'Design Director', bio: 'Ari brings rigor, warmth, and an unusually sharp eye to every visual system.' },
  { initials: 'SK', name: 'Sofia Kim', role: 'Digital Lead', bio: 'Sofia creates digital experiences that feel as good to use as they are to look at.' },
];

export default function AboutPage() {
  return (
    <>
      <section className="page-hero section-shell section-soft">
        <div className="container narrow-container">
          <p className="eyebrow">About Brightline</p>
          <h1 className="display-text page-title">Small team.<br /><span>Wide lens.</span></h1>
          <p className="page-lede">We are a design studio for people building what comes next. Part strategic partner, part creative catalyst, always invested in the details that make a difference.</p>
        </div>
      </section>

      <section className="section-shell section-white">
        <div className="container story-grid">
          <div className="story-marker"><span className="marker-shape" /> Since 2016</div>
          <div className="story-copy">
            <SectionHeading eyebrow="Our story" title="The best work starts with a better question." />
            <p>Brightline began with a simple belief: good design is not decoration at the end of the process. It is a way of seeing the opportunity earlier, making better decisions, and giving people something they can believe in.</p>
            <p>Today, we work with founders, in-house teams, and organizations in the middle of a meaningful shift. We stay intentionally small so every project gets the full attention of senior thinkers and makers, not a relay race of handoffs.</p>
            <p>Our home base is New York, but our best work happens wherever the right conversation takes us.</p>
          </div>
        </div>
      </section>

      <section className="section-shell section-soft">
        <div className="container">
          <SectionHeading eyebrow="What guides us" title="A few things we won&apos;t compromise on." />
          <div className="values-grid">
            {values.map((value) => <article className="value-card" key={value.number}><span className="card-number">{value.number}</span><h3>{value.title}</h3><p>{value.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section-shell section-white">
        <div className="container">
          <SectionHeading eyebrow="The people" title="A compact crew with a lot of range." />
          <div className="team-grid">
            {team.map((person) => <article className="team-card" key={person.name}><div className="avatar">{person.initials}</div><p className="team-role">{person.role}</p><h3>{person.name}</h3><p className="team-bio">{person.bio}</p></article>)}
          </div>
        </div>
      </section>
    </>
  );
}
