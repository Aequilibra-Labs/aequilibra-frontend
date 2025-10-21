'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { COPY } from '@/lib/copy';

export function ExplainerArb101() {
  const [activeToggle, setActiveToggle] = useState(null);
  const [viewMode, setViewMode] = useState('retail'); // 'retail' or 'institutional'
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  const toggles = COPY.explainerArb101.toggles;

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  return (
    <motion.section 
      className="relative w-full py-16 overflow-hidden"
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20" />
      
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 rounded-full bg-blue-400/10 dark:bg-blue-400/20"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-10 right-10 w-16 h-16 rounded-lg bg-purple-400/10 dark:bg-purple-400/20"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 items-center"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Content */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Sparkles className="h-6 w-6 text-blue-500" />
                <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {COPY.explainerArb101.title}
                </h3>
              </motion.div>
              
              <motion.p 
                className="text-muted-foreground text-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Click to explore the basics
              </motion.p>
            </div>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
            >
              {Object.entries(toggles).map(([key, toggle], index) => (
                <motion.div 
                  key={key} 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + (index * 0.1) }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-6 h-auto text-left bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:border-blue-400/50 transition-all duration-300 rounded-xl"
                      onClick={() => setActiveToggle(activeToggle === key ? null : key)}
                    >
                      <span className="font-medium text-lg">{toggle.question}</span>
                      <motion.div
                        animate={{ rotate: activeToggle === key ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-5 w-5 text-blue-500" />
                      </motion.div>
                    </Button>
                  </motion.div>
                  
                  <AnimatePresence>
                    {activeToggle === key && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ 
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1]
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div 
                          className="px-6 pb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-muted-foreground leading-relaxed bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg border-l-4 border-blue-400">
                            {toggle.answer}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

            {/* Interactive perspective toggle */}
            <motion.div 
              className="space-y-6 pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl backdrop-blur-sm">
                <span className="font-medium text-lg">View perspective:</span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex items-center gap-3 bg-white/70 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300"
                    onClick={() => setViewMode(viewMode === 'retail' ? 'institutional' : 'retail')}
                  >
                    <motion.div
                      animate={{ rotate: viewMode === 'retail' ? 0 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      {viewMode === 'retail' ? (
                        <ToggleLeft className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ToggleRight className="h-5 w-5 text-purple-500" />
                      )}
                    </motion.div>
                    <span className="font-medium capitalize">{viewMode}</span>
                  </Button>
                </motion.div>
              </div>

              <motion.div 
                className="space-y-3"
                key={viewMode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {COPY.explainerArb101.comparison[viewMode]?.map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start gap-3 text-muted-foreground"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Interactive visual */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="relative w-full max-w-md mx-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Main visual container */}
              <motion.div
                className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-blue-900/40 dark:via-gray-800/50 dark:to-purple-900/40 p-8 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30 shadow-2xl"
                style={{
                  rotateX: useTransform(rotateX, [-5, 5], [-2, 2]),
                  rotateY: useTransform(rotateY, [-5, 5], [-2, 2]),
                }}
              >
                <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0] 
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
                  >
                    <Sparkles className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-muted-foreground">
                      {COPY.explainerArb101.imageTitle}
                    </div>
                    <div className="text-sm text-muted-foreground opacity-75">
                      {COPY.explainerArb101.imageAlt}
                    </div>
                  </div>
                </div>

                {/* Floating particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-60"
                    style={{
                      left: `${20 + (i * 12)}%`,
                      top: `${15 + (i * 10)}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 3 + (i * 0.5),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3
                    }}
                  />
                ))}
              </motion.div>

              {/* Orbiting elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 opacity-80"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 rounded-lg bg-gradient-to-br from-green-400 to-blue-400 opacity-80"
                animate={{
                  rotate: [360, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}