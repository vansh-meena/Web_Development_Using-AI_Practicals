import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: {
    default: 'Brightline Studio — Clear ideas, beautifully made',
    template: '%s — Brightline Studio',
  },
  description: 'Brightline Studio is an independent design studio helping ambitious brands find their next clear direction.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
