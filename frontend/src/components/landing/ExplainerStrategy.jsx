'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';

export function ExplainerStrategy() {
  const [ideaInput, setIdeaInput] = useState('');

  // Simple keyword mapping for demo
  const generateOutline = (input) => {
    const lowercaseInput = input.toLowerCase();
    
    if (lowercaseInput.includes('funding') || lowercaseInput.includes('rate')) {
      return {
        objective: COPY.explainerStrategy.template.objective,
        legs: COPY.explainerStrategy.template.legs,
        hedge: COPY.explainerStrategy.template.hedge,
        monitors: COPY.explainerStrategy.template.monitors,
        nextStep: COPY.explainerStrategy.template.nextStep
      };
    }
    
    if (lowercaseInput.includes('arbitrage') || lowercaseInput.includes('spread')) {
      return {
        objective: 'Capture price differences across venues',
        legs: 'Long spot / Short perp',
        hedge: 'Market-neutral, monitor basis',
        monitors: 'Spread width, execution costs, timing',
        nextStep: 'Open in Strategy Builder'
      };
    }
    
    if (lowercaseInput.includes('momentum') || lowercaseInput.includes('trend')) {
      return {
        objective: 'Follow directional price movement',
        legs: 'Long trending asset',
        hedge: 'Stop-loss, position sizing',
        monitors: 'Trend strength, reversal signals',
        nextStep: 'Open in Strategy Builder'
      };
    }
    
    if (input.trim()) {
      return {
        objective: 'Custom strategy objective',
        legs: 'Define position legs',
        hedge: 'Risk management approach',
        monitors: 'Key metrics to track',
        nextStep: 'Open in Strategy Builder'
      };
    }
    
    return null;
  };

  const outline = useMemo(() => generateOutline(ideaInput), [ideaInput]);

  return (
    <Card className="rounded-2xl border border-border/50 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Input */}
          <div className="p-6 lg:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{COPY.explainerStrategy.title}</h3>
              <p className="text-sm text-muted-foreground">
                Type your strategy idea and see it structured
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ideaInput" className="text-sm font-medium">Strategy Idea</Label>
                <Input
                  id="ideaInput"
                  placeholder={COPY.explainerStrategy.placeholder}
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  className="min-h-[2.5rem]"
                />
              </div>

              {outline && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="text-sm font-medium text-muted-foreground">
                    Generated Outline:
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-3">
                      <span className="font-medium text-muted-foreground min-w-[80px]">Objective:</span>
                      <span>{outline.objective}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-medium text-muted-foreground min-w-[80px]">Legs:</span>
                      <span>{outline.legs}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-medium text-muted-foreground min-w-[80px]">Hedge:</span>
                      <span>{outline.hedge}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-medium text-muted-foreground min-w-[80px]">Monitors:</span>
                      <span>{outline.monitors}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <Button asChild className="w-full" size="sm">
                      <Link href="/app/funding-comparison" className="flex items-center gap-2">
                        <span>{outline.nextStep}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}

              {!ideaInput.trim() && (
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                  <div className="text-sm text-muted-foreground text-center">
                    Start typing to see your idea structured...
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    Try: "funding rate arbitrage", "momentum trading", "cross-exchange spread"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visual */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="aspect-square rounded-xl bg-white/50 dark:bg-black/20 border border-border/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground font-mono">
                    {COPY.explainerStrategy.imageTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {COPY.explainerStrategy.imageAlt}
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