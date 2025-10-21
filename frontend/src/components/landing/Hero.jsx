'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { useEffect, useRef, useState } from 'react';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const floatingElement = {
  animate: {
    y: [-20, 20, -20],
    rotate: [-5, 5, -5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function Hero() {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const shapesY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  
  // Mouse movement effects
  const mouseXSpring = useSpring(mousePosition.x, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(mousePosition.y, { stiffness: 500, damping: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x: x * 50, y: y * 50 });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const scrollToExplainers = () => {
    document.getElementById('explainers')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Dynamic background layers with parallax */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 w-full h-[120%]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80 dark:from-blue-950/40 dark:via-gray-900 dark:to-purple-950/40" />
        
        {/* Animated mesh gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, #8b5cf6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f6 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Floating geometric shapes with mouse interaction */}
      <motion.div
        style={{ 
          y: shapesY,
          x: useTransform(mouseXSpring, [-50, 50], [-30, 30]),
          rotateZ: useTransform(mouseXSpring, [-50, 50], [-5, 5])
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Large floating shapes */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))",
            filter: "blur(60px)",
          }}
          variants={floatingElement}
          animate="animate"
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{
            background: "linear-gradient(225deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))",
            filter: "blur(80px)",
          }}
          animate={{
            y: [30, -30, 30],
            scale: [1, 1.1, 1],
            transition: {
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />

        {/* Smaller decorative elements */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-40"
            style={{
              left: `${20 + (i * 10)}%`,
              top: `${15 + (i * 8)}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>

      {/* Main content with parallax */}
      <motion.div 
        style={{ y: textY }}
        className="relative z-10 mx-auto max-w-7xl px-4 text-center"
      >
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-12"
        >
          {/* Kinetic typography */}
          <motion.div variants={fadeInUp} className="space-y-8">
            <motion.h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-tight">
              {COPY.hero.headline.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 100, rotateX: -90 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    rotateX: 0,
                    transition: {
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: [0.6, -0.05, 0.01, 0.99]
                    }
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    color: "#3b82f6",
                    transition: { duration: 0.3 }
                  }}
                  style={{
                    background: "linear-gradient(135deg, #1f2937, #3b82f6, #8b5cf6)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.h1>

            <motion.div
              variants={fadeInUp}
              className="max-w-3xl mx-auto"
            >
              <motion.p 
                className="text-xl sm:text-2xl text-muted-foreground leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                {COPY.hero.subhead.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + (i * 0.01) }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>

            {/* Interactive badges */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-4"
            >
              {COPY.hero.microNotes.map((note, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + (i * 0.1), type: "spring", stiffness: 200 }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="text-sm px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/40 transition-all duration-300 cursor-pointer"
                  >
                    {note}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Interactive CTAs */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button 
                size="lg" 
                asChild 
                className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 min-h-[3.5rem] px-12 text-lg font-medium overflow-hidden group"
              >
                <Link href="/app/funding-comparison">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  <span className="relative z-10">{COPY.hero.primaryCTA}</span>
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button 
                variant="outline" 
                size="lg" 
                onClick={scrollToExplainers}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/40 hover:border-blue-400/50 transition-all duration-300 min-h-[3.5rem] px-12 text-lg font-medium"
              >
                {COPY.hero.secondaryCTA}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-blue-400/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-blue-400 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
