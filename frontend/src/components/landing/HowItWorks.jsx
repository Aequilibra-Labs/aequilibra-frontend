'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stepVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

function StepCard({ step, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      variants={stepVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      whileHover={{ 
        y: -10,
        transition: { duration: 0.3 }
      }}
    >
      <Card className="relative overflow-hidden h-full border-muted/20 hover:border-primary/20 transition-all duration-300 group hover:shadow-lg">
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />
        
        {/* Step connector line (except for last step) */}
        {index < 3 && (
          <motion.div
            className="absolute top-8 -right-2 w-8 h-0.5 bg-gradient-to-r from-primary/30 to-transparent hidden md:block"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        )}
        
        <CardHeader className="relative">
          <motion.div 
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold mb-4 shadow-lg"
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.2 }
            }}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {step.step}
          </motion.div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
            {step.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </CardContent>
        
        {/* Subtle border animation */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/50"
          initial={{ width: 0 }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const steps = [
    {
      step: '1',
      title: 'Connect Your Wallet',
      description: 'Safely connect your Web3 wallet to access the platform',
    },
    {
      step: '2',
      title: 'Browse Markets',
      description:
        'Explore funding rates across multiple DEXes and trading pairs',
    },
    {
      step: '3',
      title: 'Analyze Data',
      description:
        'View historical charts, compare rates, and assess risk metrics',
    },
    {
      step: '4',
      title: 'Track Opportunities',
      description:
        'Add pairs to your watchlist and monitor funding rate changes',
    },
  ];

  return (
    <section className="w-full px-4 space-y-8 py-12 md:py-16 lg:py-20 bg-muted/30" ref={ref}>
      <motion.div 
        className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          How It Works
        </motion.h2>
        <motion.p 
          className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Get started with Aequilibra in just a few simple steps
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4 relative"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {steps.map((step, index) => (
          <StepCard key={index} step={step} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
