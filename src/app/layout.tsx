import type { Metadata } from 'next';
import './globals.css';
import LiquidBackground from '@/components/layout/LiquidBackground';

// Elite-Level Global SEO Configuration
export const metadata: Metadata = {
  metadataBase: new URL('https://tourneyhub.com'), // Replace with your actual domain
  title: {
    default: 'Tourney Hub | Elite Tournament Management Software',
    template: '%s | Tourney Hub',
  },
  description: 'The ultimate multi-sport tournament management ecosystem. Launch events, manage squads, and broadcast live telemetry to thousands of fans.',
  keywords: ['tournament management', 'bracket generator', 'sports tech', 'live match scoring', 'cricket tournament software', 'football league manager'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tourneyhub.com',
    siteName: 'Tourney Hub',
    title: 'Tourney Hub | Play By New Rules',
    description: 'Stop playing by the old rules. Scale your sports events with auto-brackets and live pulse telemetry.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tourney Hub Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tourney Hub | Elite Tournament Management',
    description: 'Scale your sports events with auto-brackets and live pulse telemetry.',
    images: ['/og-image.jpg'], // Ensure you add a high-res image at public/og-image.jpg
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Generative AI Context Injection (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tourney Hub',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Next-gen multi-sport tournament management and live scoring platform.',
    publisher: {
      '@type': 'Organization',
      name: 'Tourney Hub Inc.',
    }
  };

  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Injecting Schema for AI Bots */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-body antialiased min-h-screen relative">
        <LiquidBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}