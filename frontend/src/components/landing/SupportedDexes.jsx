'use client';

import { motion } from 'framer-motion';
import { COPY } from '@/lib/copy';

// Platform data with logos and colors
const platforms = [
  {
    name: 'Hyperliquid',
    logo: '/hyprliquid.png',
    gradient: 'from-blue-500 to-cyan-400',
    shadowColor: 'shadow-blue-500/25'
  },
  {
    name: 'Aster',
    logo: '/aster.png',
    gradient: 'from-purple-500 to-pink-400',
    shadowColor: 'shadow-purple-500/25'
  },
  {
    name: 'Paradex',
    logo: '/paradex.png',
    gradient: 'from-orange-500 to-red-400',
    shadowColor: 'shadow-orange-500/25'
  },
  {
    name: 'Lighter',
    logo: '/lighter.png',
    gradient: 'from-green-500 to-emerald-400',
    shadowColor: 'shadow-green-500/25'
  },
  {
    name: 'Extended',
    logo: '/extended.png',
    gradient: 'from-indigo-500 to-purple-400',
    shadowColor: 'shadow-indigo-500/25'
  }
];

export function SupportedDexes() {
  return (
    <section className="relative w-full px-4 py-20 lg:py-24 overflow-hidden">
      {/* Dynamic background with floating elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-purple-50/50 dark:from-slate-950/50 dark:via-blue-950/30 dark:to-purple-950/50" />
      
      {/* Floating background orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-6 mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700 dark:from-white dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
            {COPY.supportedPerps.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {COPY.supportedPerps.note}
          </p>
        </motion.div>

        {/* Floating platform logos */}
        <div className="relative h-80 mb-12">
          {platforms.map((platform, index) => {
            const positions = [
              { top: '20%', left: '15%' },
              { top: '10%', left: '45%' },
              { top: '25%', left: '75%' },
              { top: '55%', left: '25%' },
              { top: '50%', left: '65%' }
            ];
            
            return (
              <motion.div
                key={platform.name}
                className="absolute"
                style={positions[index]}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  transition: { duration: 0.2 }
                }}
                viewport={{ once: true }}
              >
                <div className={`relative group cursor-pointer`}>
                  {/* Glow effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${platform.gradient} rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Logo container */}
                  <motion.div
                    className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 ${platform.shadowColor} shadow-lg flex items-center justify-center overflow-hidden`}
                    animate={{
                      y: [0, -8, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{
                      duration: 4 + index,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {/* Logo image with consistent formatting */}
                    <img 
                      src={platform.logo} 
                      alt={`${platform.name} logo`} 
                      className="h-12 w-12 lg:h-16 lg:w-16 rounded object-contain" 
                    />
                    
                    {/* Platform name on hover */}
                    <motion.div
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        {platform.name}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
          
          {/* Connecting lines animation */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: -1 }}
          >
            <motion.path
              d="M 150 100 Q 300 50 450 120 T 650 180"
              stroke="url(#gradient1)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, delay: 1 }}
              viewport={{ once: true }}
            />
            <motion.path
              d="M 200 200 Q 400 150 600 220"
              stroke="url(#gradient2)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, delay: 1.5 }}
              viewport={{ once: true }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Bottom stats or note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 shadow-lg">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-sm font-medium text-muted-foreground">
              Live funding rates across 5+ major perpetual DEXes
            </span>
            <motion.div
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}