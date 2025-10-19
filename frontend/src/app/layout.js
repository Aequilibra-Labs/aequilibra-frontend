import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Aequilibra - Find the best funding across perps',
  description:
    'Aggregate perpetual DEX funding rates. Compare pairs, track history, and build neutral strategies. Access GMX, dYdX, Perpetual Protocol and more.',
  keywords: [
    'perpetual',
    'funding',
    'DEX',
    'derivatives',
    'crypto',
    'arbitrage',
    'neutral',
    'GMX',
    'dYdX',
  ],
  authors: [{ name: 'Aequilibra Labs' }],
  creator: 'Aequilibra Labs',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aequilibra.xyz',
    title: 'Aequilibra - Find the best funding across perps',
    description:
      'Aggregate perpetual DEX funding rates. Compare pairs, track history, and build neutral strategies.',
    siteName: 'Aequilibra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aequilibra - Find the best funding across perps',
    description:
      'Aggregate perpetual DEX funding rates. Compare pairs, track history, and build neutral strategies.',
    creator: '@AequilibraLabs',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: "next",
      imageUrl: "https://aequilibra.vercel.app/og-image.png",
      button: {
        title: "Open Aequilibra",
        action: {
          type: "launch_miniapp",
          name: "Aequilibra",
          url: "https://aequilibra.vercel.app"
        }
      }
    })
  }
};

import { MiniAppSdk } from '@/components/MiniAppSdk';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased h-full`}
      >
        <MiniAppSdk />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
