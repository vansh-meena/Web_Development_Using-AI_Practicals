'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

function Mark() {
  return <svg className="brand-mark" aria-hidden="true" viewBox="0 0 32 32"><path d="M5 24 13 8l5 10 4-7 5 13H5Z" /><path d="M5 24h22" /></svg>;
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function isActive(href) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link className="brand" href="/" aria-label="Brightline Studio home"><Mark /><span>brightline<span className="brand-studio">studio</span></span></Link>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <nav id="site-navigation" className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`} aria-label="Primary navigation">
          {links.map((link) => <Link key={link.href} className={isActive(link.href) ? 'nav-link nav-link-active' : 'nav-link'} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
          <Link className="nav-cta" href="/contact" onClick={() => setMenuOpen(false)}>Start a project <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}
