import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        {children}
      </body>
    </html>
  );
}
