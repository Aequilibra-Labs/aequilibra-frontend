'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { COPY } from '@/lib/copy';

export function ExplainerArb101() {
  const [activeToggle, setActiveToggle] = useState(null);
  const [viewMode, setViewMode] = useState('retail'); // 'retail' or 'institutional'

  const toggles = COPY.explainerArb101.toggles;

  return (
    <Card className="rounded-2xl border border-border/50 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Content */}
          <div className="p-6 lg:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{COPY.explainerArb101.title}</h3>
              <p className="text-sm text-muted-foreground">
                Click to explore the basics
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(toggles).map(([key, toggle]) => (
                <div key={key} className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50"
                    onClick={() => setActiveToggle(activeToggle === key ? null : key)}
                  >
                    <span className="font-medium">{toggle.question}</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${
                        activeToggle === key ? 'rotate-180' : ''
                      }`} 
                    />
                  </Button>
                  
                  <AnimatePresence>
                    {activeToggle === key && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-2">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {toggle.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Retail vs Institutional Toggle */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">View perspective:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setViewMode(viewMode === 'retail' ? 'institutional' : 'retail')}
                >
                  {viewMode === 'retail' ? (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      <span>Retail</span>
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4" />
                      <span>Institutional</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {COPY.explainerArb101.comparison.retail.map((item, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="aspect-square rounded-xl bg-white/50 dark:bg-black/20 border border-border/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground font-mono">
                    {COPY.explainerArb101.imageTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {COPY.explainerArb101.imageAlt}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}