'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
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
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const sectionVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col w-full relative">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform-origin-[0%] z-50"
        style={{ scaleX }}
      />
      
      <NavBar />
      <main className="flex-1 w-full">
        <Hero />
        
        {/* Interactive Explainers Section */}
        <motion.section 
          id="explainers" 
          className="w-full px-4 py-16 lg:py-24 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="max-w-7xl mx-auto space-y-16 relative z-10">
            <motion.div 
              className="text-center space-y-6"
              variants={sectionVariants}
            >
              <motion.h2 
                className="text-3xl lg:text-5xl font-bold"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How it works
                </span>
              </motion.h2>
              <motion.p 
                className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Three interactive explainers to get you started with arbitrage strategies
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="space-y-12"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.3,
                    delayChildren: 0.6
                  }
                }
              }}
            >
              <motion.div variants={sectionVariants}>
                <ExplainerArb101 />
              </motion.div>
              <motion.div variants={sectionVariants}>
                <ExplainerFunding />
              </motion.div>
              <motion.div variants={sectionVariants}>
                <ExplainerStrategy />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <SupportedDexes />
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <TrustNotes />
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <Faq />
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <FooterCTA />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
