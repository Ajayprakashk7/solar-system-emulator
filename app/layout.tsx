import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { env } from '@/lib/env';
import { ErrorBoundary } from '@/lib/error-handler';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const siteUrl = 'https://solar-system.ajayprakash.dev';

if (typeof window === 'undefined') {
  void env.NASA_API_KEY;
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Solar System Emulator | Interactive 3D Astronomy',
  description:
    'Explore the Solar System in an interactive 3D visualization with planets, moons, orbital motion, NASA imagery, and educational astronomy data.',
  keywords: [
    'solar system',
    '3D planets',
    'astronomy',
    'space',
    'interactive visualization',
    'NASA',
    'WebGL',
    'Three.js',
  ],
  authors: [{ name: 'Ajay Prakash' }],
  creator: 'Ajay Prakash',
  publisher: 'Ajay Prakash',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Solar System Emulator | Interactive 3D Astronomy',
    description:
      'Navigate the Solar System in 3D, inspect planets and moons, and explore astronomy data and NASA imagery.',
    url: siteUrl,
    siteName: 'Solar System Emulator',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Solar System Emulator | Interactive 3D Astronomy',
    description: 'Explore the Solar System in an interactive 3D experience.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <ErrorBoundary>
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>
          <main id="main-content">{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
