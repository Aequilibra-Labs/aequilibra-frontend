'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FooterCTA() {
  return (
    <section className="relative w-full px-4 py-24 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, #ffffff 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Floating particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative max-w-5xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
            viewport={{ once: true }}
          >
            <Sparkles className="h-8 w-8 text-yellow-300" />
            <span className="text-yellow-300 font-medium text-lg">Ready to start?</span>
          </motion.div>

          <motion.h2 
            className="text-4xl lg:text-6xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {COPY.footerCTA.text.split(' ').map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-4"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.4 + (i * 0.1),
                  ease: [0.6, -0.05, 0.01, 0.99]
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05, 
                  color: "#fbbf24",
                  transition: { duration: 0.2 }
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h2>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button 
                size="lg" 
                asChild 
                className="relative group bg-white text-blue-600 hover:bg-yellow-50 hover:text-blue-700 shadow-2xl hover:shadow-white/25 transition-all duration-500 min-h-[4rem] px-12 text-xl font-semibold overflow-hidden"
              >
                <Link href="/app/funding-comparison" className="flex items-center gap-3">
                  <span className="relative z-10">{COPY.footerCTA.button}</span>
                  <motion.div
                    className="relative z-10"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight className="h-6 w-6" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                </Link>
              </Button>
            </motion.div>
            
            <motion.p 
              className="text-blue-100 text-lg max-w-md"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              viewport={{ once: true }}
            >
              Join thousands of traders optimizing their strategies
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}