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
      <Card className="relative overflow-hidden h-full border-muted/20 hover:border-muted/40 transition-all duration-300 group hover:shadow-lg">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:to-purple-50/30 dark:group-hover:from-blue-950/10 dark:group-hover:to-purple-950/10 transition-all duration-500" />
        
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
          <CardTitle className="group-hover:text-primary transition-colors duration-300">
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
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
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
          Key Features
        </motion.h2>
        <motion.p 
          className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Everything you need to find the best perpetual funding opportunities
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3"
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
