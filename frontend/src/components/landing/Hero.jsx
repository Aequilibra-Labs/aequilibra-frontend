'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { COPY } from '@/lib/copy';

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

export function Hero() {
  const scrollToExplainers = () => {
    document.getElementById('explainers')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full px-4 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16 mt-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />
      
      {/* Animated background shapes */}
      <motion.div
        className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl"
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
        className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl"
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

      <div className="relative mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Content - Left side */}
          <motion.div 
            className="lg:col-span-7 space-y-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp} className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                  {COPY.hero.headline}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {COPY.hero.subhead}
              </p>

              <div className="flex flex-wrap gap-3">
                {COPY.hero.microNotes.map((note, i) => (
                  <Badge key={i} variant="secondary" className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20">
                    {note}
                  </Badge>
                ))}
              </div>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="lg" 
                asChild 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-h-[3rem] px-8"
              >
                <Link href="/app/funding-comparison">
                  {COPY.hero.primaryCTA}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={scrollToExplainers}
                className="hover:bg-muted/50 transition-colors duration-300 min-h-[3rem] px-8"
              >
                {COPY.hero.secondaryCTA}
              </Button>
            </motion.div>
          </motion.div>

          {/* Visual - Right side */}
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-border/50 overflow-hidden">
                <div className="p-6 h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground font-mono">
                      {COPY.hero.heroImageTitle}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {COPY.hero.heroImageAlt}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500/60 rounded-full"
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-purple-500/60 rounded-lg"
                animate={{
                  y: [0, 8, 0],
                  rotate: [0, 15, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
