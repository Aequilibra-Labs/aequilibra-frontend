'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  return (
    <section className="relative w-full px-4 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-22 mt-12 overflow-hidden">
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

      <motion.div 
        className="relative mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp}>
          <Badge variant="outline" className="text-sm border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
            🚀 Perpetual DEX Funding Aggregator
          </Badge>
        </motion.div>

        <motion.h1 
          className="font-bold text-4xl sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight"
          variants={fadeInUp}
        >
          Find the best funding across perps.{' '}
          <motion.span 
            className="text-primary bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            One dashboard.
          </motion.span>
        </motion.h1>

        <motion.p 
          className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8"
          variants={fadeInUp}
        >
          Aggregate across DEXes • Compare pairs • Track funding history • Build
          neutral strategies
        </motion.p>

        <motion.div 
          className="space-x-4"
          variants={scaleIn}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <a href="/app">Launch App</a>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button variant="outline" size="lg" asChild className="hover:bg-muted/50 transition-colors duration-300">
              <a href="/docs">Learn More</a>
            </Button>
          </motion.div>
        </motion.div>

        <motion.p 
          className="text-sm text-muted-foreground max-w-[42rem]"
          variants={fadeInUp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Crypto derivatives are risky. Nothing here is financial advice. DYOR.
        </motion.p>

        {/* Floating elements */}
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
      </motion.div>
    </section>
  );
}
