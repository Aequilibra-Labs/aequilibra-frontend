import { NavBar } from '@/components/landing/NavBar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Stats } from '@/components/landing/Stats';
import { HyperliquidStats } from '@/components/landing/HyperliquidStats';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SupportedDexes } from '@/components/landing/SupportedDexes';
import { Testimonials } from '@/components/landing/Testimonials';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';

// Landing/Marketing homepage
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Stats />
        <HyperliquidStats />
        <HowItWorks />
        <SupportedDexes />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
