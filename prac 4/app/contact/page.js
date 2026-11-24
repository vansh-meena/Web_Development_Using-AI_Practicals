import ContactForm from '../../components/ContactForm';
import Faq from '../../components/Faq';
import SectionHeading from '../../components/SectionHeading';

export const metadata = {
  title: 'Contact',
  description: 'Start a conversation with Brightline Studio about your next project.',
};

const faqs = [
  { question: 'What kind of projects do you take on?', answer: 'We work best with teams at a meaningful inflection point: launching something new, repositioning, growing into a new audience, or making a digital experience better. If the question matters to you, it is probably worth a conversation.' },
  { question: 'How long does a typical project take?', answer: 'Most projects run between four and twelve weeks, depending on scope, decision-making, and how quickly you need to move. We will map a realistic timeline together before we begin.' },
  { question: 'Do you work with teams outside New York?', answer: 'Absolutely. Brightline is based in New York and works with teams across time zones. Our process is built for clear, thoughtful collaboration wherever you are.' },
  { question: 'Can you work with our existing team or partners?', answer: 'Yes. We often join an existing team as a focused creative partner, and we are comfortable collaborating with developers, writers, marketers, and other specialists you already trust.' },
  { question: 'What happens after I send an enquiry?', answer: 'We will read it carefully and get back to you within two business days. If there is a fit, we will schedule a short introduction to hear more about what you are building.' },
];

export default function ContactPage() {
  return (
    <>
      <section className="page-hero section-shell section-soft">
        <div className="container narrow-container">
          <p className="eyebrow">Start a conversation</p>
          <h1 className="display-text page-title">Have a good<br /><span>one in mind?</span></h1>
          <p className="page-lede">Tell us what you are working on, where you are stuck, or where you want to go. We will take it from there.</p>
        </div>
      </section>

      <section className="section-shell section-white">
        <div className="container contact-grid">
          <aside className="contact-details">
            <SectionHeading eyebrow="Find us" title="Come say hello." />
            <div className="detail-block"><p className="detail-label">Studio</p><p>41 Mercer Street, Floor 3<br />New York, NY 10013</p></div>
            <div className="detail-block"><p className="detail-label">Reach out</p><a href="mailto:hello@brightline.studio">hello@brightline.studio</a><a href="tel:+12125550184">+1 212 555 0184</a></div>
            <div className="detail-block"><p className="detail-label">Hours</p><p>Monday – Friday<br />9:00am – 6:00pm ET</p></div>
          </aside>
          <div className="contact-form-wrap"><ContactForm /></div>
        </div>
      </section>

      <section className="section-shell section-soft">
        <div className="container faq-layout"><SectionHeading eyebrow="A few answers" title="Before you write." /><Faq items={faqs} /></div>
      </section>
    </>
  );
}
