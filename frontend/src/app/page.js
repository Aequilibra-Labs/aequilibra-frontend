import { NavBar } from '@/components/landing/NavBar';
import { Hero } from '@/components/landing/Hero';
import { ExplainerArb101 } from '@/components/landing/ExplainerArb101';
import { ExplainerFunding } from '@/components/landing/ExplainerFunding';
import { ExplainerStrategy } from '@/components/landing/ExplainerStrategy';
import { SupportedDexes } from '@/components/landing/SupportedDexes';
import { TrustNotes } from '@/components/landing/TrustNotes';
import { Faq } from '@/components/landing/Faq';
import { FooterCTA } from '@/components/landing/FooterCTA';
import { Footer } from '@/components/landing/Footer';

// Landing/Marketing homepage
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col w-full">
      <NavBar />
      <main className="flex-1 w-full">
        <Hero />
        
        {/* Interactive Explainers Section */}
        <section id="explainers" className="w-full px-4 py-12 lg:py-16">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl lg:text-3xl font-bold">How it works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three interactive explainers to get you started with arbitrage strategies
              </p>
            </div>
            
            <div className="space-y-8">
              <ExplainerArb101 />
              <ExplainerFunding />
              <ExplainerStrategy />
            </div>
          </div>
        </section>

        <SupportedDexes />
        <TrustNotes />
        <Faq />
        <FooterCTA />
      </main>
      <Footer />
    </div>
  );
}
