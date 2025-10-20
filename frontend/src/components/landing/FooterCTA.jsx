'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { COPY } from '@/lib/copy';

export function FooterCTA() {
  return (
    <section className="w-full px-4 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-white">
            {COPY.footerCTA.text}
          </h2>
          
          <Button 
            size="lg" 
            asChild 
            className="bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 min-h-[3rem] px-8"
          >
            <Link href="/app/funding-comparison">
              {COPY.footerCTA.button}
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}