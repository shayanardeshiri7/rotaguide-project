import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PROJECT } from '@/content/project';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://rotaguide.vercel.app'),
  title: {
    default: 'RotaGuide — injection-site rotation, guided',
    template: '%s · RotaGuide',
  },
  description:
    'A 3D-printed injection guide and a local-first tracker for insulin injection-site rotation. BMEN 668 capstone, University of Calgary.',
  keywords: [
    'lipohypertrophy',
    'insulin injection rotation',
    'biomedical engineering',
    'capstone',
    'PWA',
  ],
  openGraph: {
    title: 'RotaGuide — injection-site rotation, guided',
    description:
      'A 3D-printed guide and a local-first tracker for insulin injection-site rotation.',
    type: 'website',
    locale: 'en_CA',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#2D7A5F',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <nav className="nav">
          <div className="nav__inner">
            <Link className="nav__brand" href="/">
              Rota<span>Guide</span>
            </Link>
            <div className="nav__links">
              <Link href="/">The project</Link>
              <Link href="/app">The app</Link>
              <a href={PROJECT.repo} rel="noreferrer noopener">
                GitHub
              </a>
            </div>
          </div>
        </nav>

        <main id="main">{children}</main>

        <footer className="footer">
          <div className="shell">
            <div className="footer__links">
              <a href={PROJECT.repo} rel="noreferrer noopener">
                Source on GitHub
              </a>
              <Link href="/app">The tracker</Link>
              {/* /v1 is a static file outside the Next router, so it
                  stays a plain anchor. */}
              <a href="/v1/">The original v1</a>
            </div>
            <p>
              {PROJECT.course} · {PROJECT.institution} · {PROJECT.term}
            </p>
            <p style={{ marginTop: 'var(--rg-space-3)' }}>
              Not a medical device. A student engineering prototype, not evaluated by any regulator,
              and not a source of medical advice.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
