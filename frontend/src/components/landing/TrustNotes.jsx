'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lightbulb, Eye, AlertTriangle } from 'lucide-react';
import { COPY } from '@/lib/copy';

const iconMap = {
  'Non-custodial exploration': Shield,
  'Idea-first tooling': Lightbulb,
  'Transparent math': Eye,
  'Disclaimer': AlertTriangle
};

export function TrustNotes() {
  return (
    <section className="w-full px-4 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold">{COPY.trustNotes.title}</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COPY.trustNotes.points.map((point, index) => {
            const Icon = iconMap[point.title];
            
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">{point.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {point.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Image placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border border-border/50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground font-mono">
                {COPY.trustNotes.imageTitle}
              </div>
              <div className="text-xs text-muted-foreground">
                {COPY.trustNotes.imageAlt}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}