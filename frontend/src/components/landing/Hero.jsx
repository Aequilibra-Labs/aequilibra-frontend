'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export function Hero() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isLight = mounted && currentTheme === 'light';

  return (
    <section className={`relative w-full px-4 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-22 mt-12 overflow-hidden ${isLight ? 'hero-light-theme' : ''}`}>
      {/* Background gradient - only in DARK mode */}
      {!isLight && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 to-purple-950/20 pointer-events-none" />
      )}
      
      {/* Animated background shapes - only in DARK mode */}
      {!isLight && (
        <>
          <motion.div
            className="absolute -top-4 -left-4 w-72 h-72 bg-blue-800/20 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-800/20 rounded-full blur-3xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}

      <motion.div 
        className="relative mx-auto flex max-w-[68rem] flex-col items-center justify-center space-y-16 text-center px-8 sm:px-12"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Tagline */}
        <motion.div 
          className="text-center"
          variants={fadeInUp}
        >
          <motion.p 
            className={`text-sm sm:text-base font-mono tracking-wider uppercase font-medium ${isLight ? 'hero-tagline' : 'text-cyan-300'}`}
            variants={fadeInUp}
          >
            // Perpetual DEX Funding Aggregator
          </motion.p>
        </motion.div>

        {/* Main Title */}
        <motion.div className="space-y-8 text-center w-full" variants={fadeInUp}>
          <motion.h1 
            className={`font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight tracking-tight whitespace-nowrap overflow-hidden ${isLight ? 'hero-title' : 'text-white hero-dark-title'}`}
            variants={fadeInUp}
          >
            Delta-neutral{' '}
            <motion.span 
              className={`font-bold ${isLight ? 'hero-accent' : 'text-cyan-400 hero-dark-accent'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              yield
            </motion.span>
            {' '}for everyone
          </motion.h1>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 items-center justify-center"
          variants={scaleIn}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              asChild 
              className={`font-semibold text-lg px-8 py-4 h-auto uppercase tracking-wider shadow-lg ${isLight ? 'hero-button' : 'bg-cyan-400 hover:bg-cyan-300 text-black'}`}
            >
              <a href="/app/funding-comparison">Launch App</a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Separator and Product Description */}
        <motion.div className="space-y-12 w-full text-center" variants={fadeInUp}>
          <motion.div 
            className={`w-24 h-0.5 mx-auto ${isLight ? 'hero-separator' : 'bg-cyan-300'}`}
            variants={fadeInUp}
          />

          <motion.h2 
            className={`font-light text-xl sm:text-2xl md:text-3xl leading-relaxed max-w-[48rem] mx-auto ${isLight ? 'hero-subtitle' : 'text-gray-300'}`}
            variants={fadeInUp}
          >
            Find the best funding across perps.{' '}
            <motion.span 
              className={`font-normal ${isLight ? 'hero-accent' : 'text-cyan-400'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              One dashboard.
            </motion.span>
          </motion.h2>

          <motion.p 
            className={`text-lg leading-relaxed font-light max-w-[48rem] mx-auto ${isLight ? 'hero-text' : 'text-gray-400'}`}
            variants={fadeInUp}
          >
            Aggregate across DEXes • Compare pairs • Track funding history • Build neutral strategies
          </motion.p>
        </motion.div>

        {/* Floating elements - only in DARK mode */}
        {!isLight && (
          <>
            <motion.div
              className="absolute top-20 left-10 opacity-20"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg" />
            </motion.div>
            
            <motion.div
              className="absolute top-32 right-16 opacity-20"
              animate={{
                y: [0, 15, 0],
                rotate: [0, -8, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-6 h-6 bg-purple-500 rounded-full" />
            </motion.div>
          </>
        )}
      </motion.div>
    </section>
  );
}
