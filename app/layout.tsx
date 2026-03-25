import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { env } from '@/lib/env'
import { ErrorBoundary } from '@/lib/error-boundary'

const inter = Inter({ subsets: ['latin'] })

// Trigger environment validation at build time
if (typeof window === 'undefined') {
  // Access env to ensure validation runs during build
  void env.NASA_API_KEY;
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'Solar System Emulator | 3D Interactive Experience',
  description: 'Explore our solar system in stunning 3D. Interactive visualization of the Sun, planets, and their orbits with real astronomical data.',
  keywords: ['solar system', '3D', 'planets', 'astronomy', 'space', 'interactive', 'visualization', 'NASA', 'WebGL', 'Three.js'],
  authors: [{ name: 'Ajay Prakash' }],
  creator: 'Ajay Prakash',
  publisher: 'Ajay Prakash',
  metadataBase: new URL('https://solar-system-emulator.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Solar System Emulator | 3D Interactive Experience',
    description: 'Explore our solar system in stunning 3D with real astronomical data. Navigate through planets, view NASA imagery, and learn fascinating facts about our cosmic neighborhood.',
    url: 'https://solar-system-emulator.vercel.app',
    siteName: 'Solar System Emulator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Solar System Emulator - Interactive 3D Visualization',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solar System Emulator | 3D Interactive Experience',
    description: 'Explore our solar system in stunning 3D with real astronomical data.',
    creator: '@ajayprakash',
    images: ['/og-image.png'],
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
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <ErrorBoundary>
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>
          <main id="main-content">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  )
}
