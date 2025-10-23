'use client'

import { useState, useEffect } from 'react';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SupportedDexes } from '@/components/landing/SupportedDexes';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import AnimatedLayout, { StaggerContainer, ScrollAnimation } from '@/components/ui/AnimatedLayout';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

// Landing/Marketing homepage
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load time for smooth entrance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatedLayout 
      loading={isLoading}
      enableParallax={true}
      className="flex min-h-screen flex-col w-full"
    >
      <div className="flex min-h-screen flex-col w-full">
        {/* Floating Theme Toggle */}
        <div className="fixed top-6 right-6 z-50">
          <div className="backdrop-blur-md bg-background/80 border border-border/50 rounded-full p-1 shadow-lg">
            <ThemeToggle />
          </div>
        </div>
        
        {/* Main Content with Staggered Animations */}
        <main className="flex-1 w-full">
          <StaggerContainer staggerDelay={0.3} className="space-y-6 sm:space-y-8 md:space-y-12">
            {/* Hero Section - First to appear */}
            <ScrollAnimation animation="fadeInUp" delay={0}>
              <Hero />
            </ScrollAnimation>
            
            {/* Features Section */}
            <ScrollAnimation animation="fadeInLeft" delay={0.2} threshold={0.2}>
              <Features />
            </ScrollAnimation>
            
            {/* How It Works Section - Hidden on mobile */}
            <ScrollAnimation animation="fadeInRight" delay={0.1} threshold={0.2} className="hidden md:block">
              <HowItWorks />
            </ScrollAnimation>
            
            {/* Supported DEXes Section - Hidden on mobile */}
            <ScrollAnimation animation="scaleIn" delay={0.1} threshold={0.2} className="hidden md:block">
              <SupportedDexes />
            </ScrollAnimation>
            
            {/* Call to Action Section - Hidden on mobile */}
            <ScrollAnimation animation="fadeInUp" delay={0.1} threshold={0.2} className="hidden md:block">
              <CallToAction />
            </ScrollAnimation>
          </StaggerContainer>
        </main>
        
        {/* Footer - Last to appear */}
        <ScrollAnimation animation="fadeInUp" delay={0.1} threshold={0.1}>
          <Footer />
        </ScrollAnimation>
      </div>
    </AnimatedLayout>
  );
}
