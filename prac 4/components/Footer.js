import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand"><Link className="brand brand-footer" href="/"><span className="brand-mark footer-mark">▲</span><span>brightline<span className="brand-studio">studio</span></span></Link><p>Clear ideas for what&apos;s next.</p></div>
          <div><p className="footer-label">Explore</p><nav className="footer-links" aria-label="Footer navigation">{footerLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></div>
          <div className="newsletter-block"><p className="footer-label">A little inspiration, occasionally</p><NewsletterForm /></div>
        </div>
        <div className="footer-bottom"><span>© 2024 Brightline Studio</span><span>Made with intention in New York</span></div>
      </div>
    </footer>
  );
}
