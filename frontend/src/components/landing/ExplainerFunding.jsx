'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Info } from 'lucide-react';
import { COPY } from '@/lib/copy';

export function ExplainerFunding() {
  const [perpA, setPerpA] = useState(COPY.explainerFunding.defaults.perpA);
  const [fundingA, setFundingA] = useState(COPY.explainerFunding.defaults.fundingA);
  const [perpB, setPerpB] = useState(COPY.explainerFunding.defaults.perpB);
  const [fundingB, setFundingB] = useState(COPY.explainerFunding.defaults.fundingB);
  const [notional, setNotional] = useState(COPY.explainerFunding.defaults.notional);
  const [fees, setFees] = useState(COPY.explainerFunding.defaults.fees);

  // Calculator function
  const calcPnL = (fa, fb, notional, fees) => ((fa - fb) * notional / 100) - fees;

  const pnlResult = useMemo(() => {
    return calcPnL(fundingA, fundingB, notional, fees);
  }, [fundingA, fundingB, notional, fees]);

  const swapLegs = () => {
    setPerpA(perpB);
    setPerpB(perpA);
    setFundingA(fundingB);
    setFundingB(fundingA);
  };

  return (
    <Card className="rounded-2xl border border-border/50 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Calculator */}
          <div className="p-6 lg:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{COPY.explainerFunding.title}</h3>
              <p className="text-sm text-muted-foreground">
                Compare funding rates across perp DEXes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Perp A */}
              <div className="space-y-2">
                <Label htmlFor="perpA" className="text-sm font-medium">Perp A</Label>
                <Select value={perpA} onValueChange={setPerpA}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select perp" />
                  </SelectTrigger>
                  <SelectContent>
                    {COPY.explainerFunding.perps.map((perp) => (
                      <SelectItem key={perp} value={perp}>{perp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Perp B */}
              <div className="space-y-2">
                <Label htmlFor="perpB" className="text-sm font-medium">Perp B</Label>
                <Select value={perpB} onValueChange={setPerpB}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select perp" />
                  </SelectTrigger>
                  <SelectContent>
                    {COPY.explainerFunding.perps.map((perp) => (
                      <SelectItem key={perp} value={perp}>{perp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Funding A */}
              <div className="space-y-2">
                <Label htmlFor="fundingA" className="text-sm font-medium">Funding A (%/day)</Label>
                <Input
                  id="fundingA"
                  type="number"
                  step="0.001"
                  value={fundingA}
                  onChange={(e) => setFundingA(parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>

              {/* Funding B */}
              <div className="space-y-2">
                <Label htmlFor="fundingB" className="text-sm font-medium">Funding B (%/day)</Label>
                <Input
                  id="fundingB"
                  type="number"
                  step="0.001"
                  value={fundingB}
                  onChange={(e) => setFundingB(parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>

              {/* Notional */}
              <div className="space-y-2">
                <Label htmlFor="notional" className="text-sm font-medium">Notional ($)</Label>
                <Input
                  id="notional"
                  type="number"
                  value={notional}
                  onChange={(e) => setNotional(parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>

              {/* Fees */}
              <div className="space-y-2">
                <Label htmlFor="fees" className="text-sm font-medium">Est. fees ($/day)</Label>
                <Input
                  id="fees"
                  type="number"
                  step="0.1"
                  value={fees}
                  onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={swapLegs}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Swap Legs
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Assumptions
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{COPY.explainerFunding.assumptions}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Result */}
            <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  Illustrative PnL/day (Δ-neutral)
                </div>
                <div className={`text-2xl font-bold font-mono ${pnlResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {pnlResult >= 0 ? '+' : ''}${pnlResult.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {COPY.explainerFunding.disclaimer}
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="aspect-square rounded-xl bg-white/50 dark:bg-black/20 border border-border/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground font-mono">
                    {COPY.explainerFunding.imageTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {COPY.explainerFunding.imageAlt}
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