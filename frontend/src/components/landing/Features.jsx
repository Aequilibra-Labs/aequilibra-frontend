'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
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
      staggerChildren: 0.1
    }
  }
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="relative overflow-hidden h-full border-muted/20 hover:border-cyan-400/40 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-400/10">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/0 to-cyan-100/0 group-hover:from-cyan-50/10 group-hover:to-cyan-100/10 dark:group-hover:from-cyan-950/5 dark:group-hover:to-cyan-900/5 transition-all duration-500" />
        
        <CardHeader className="relative">
          <motion.div 
            className="text-3xl mb-2"
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.2 }
            }}
          >
            {feature.icon}
          </motion.div>
          <CardTitle className="group-hover:text-cyan-400 transition-colors duration-300">
            {feature.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <CardDescription className="leading-relaxed">
            {feature.description}
          </CardDescription>
        </CardContent>
        
        {/* Subtle border animation */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300"
          initial={{ width: 0 }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const features = [
    {
      title: 'Aggregated Data',
      description:
        'Compare funding rates across multiple perpetual DEXes in real-time',
      icon: '📊',
    },
    {
      title: 'Historical Charts',
      description: 'Track funding rate trends and APR history over time',
      icon: '📈',
    },
    {
      title: 'Multi-Chain Support',
      description:
        'Access funding data from Arbitrum, Optimism, Base, and more',
      icon: '🔗',
    },
    {
      title: 'Risk Management',
      description:
        'Understand volatility and open interest before making decisions',
      icon: '🛡️',
    },
    {
      title: 'Portfolio Tracking',
      description: 'Monitor your positions and watch your favorite pairs',
      icon: '📱',
    },
    {
      title: 'Non-Custodial',
      description: 'Connect your wallet safely - we never hold your funds',
      icon: '🔐',
    },
  ];

  return (
    <section className="w-full px-2 sm:px-4 space-y-6 sm:space-y-8 py-12 md:py-16 lg:py-20 bg-muted/30" ref={ref}>
      <motion.div 
        className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="font-bold text-2xl sm:text-3xl leading-[1.1] md:text-4xl lg:text-5xl section-title px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Key Features
        </motion.h2>
        <motion.p 
          className="max-w-[85%] leading-normal section-description text-sm sm:text-base md:text-lg sm:leading-7 px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Everything you need to find the best perpetual funding opportunities
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="mx-auto grid justify-center gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-sm sm:max-w-none md:max-w-[64rem] px-4 sm:px-0"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
