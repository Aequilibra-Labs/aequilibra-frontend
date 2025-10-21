import { NavBar } from '@/components/landing/NavBar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SupportedDexes } from '@/components/landing/SupportedDexes';
import { Footer } from '@/components/landing/Footer';

// Landing/Marketing homepage
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col w-full">
      <NavBar />
      <main className="flex-1 w-full space-y-6 sm:space-y-8 md:space-y-12">
        <Hero />
        <Features />
        <HowItWorks />
        <SupportedDexes />
      </main>
      <Footer />
    </div>
  );
}
