'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { PairsTable } from '@/components/markets/PairsTable';
import FundingTable from '@/components/markets/FundingTable';

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState('pairs'); // 'pairs' or 'funding'
  const [searchQuery, setSearchQuery] = useState(''); // Shared search state

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Markets</h1>
            <p className="text-lg text-muted-foreground">
              Real-time trading pairs and funding rates from Hyperliquid
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Live Data
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">Hyperliquid</Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={activeTab === 'pairs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('pairs')}
              className="min-w-[140px] px-6"
            >
              Trading Pairs
            </Button>
            <Button
              variant={activeTab === 'funding' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('funding')}
              className="min-w-[140px] px-6"
            >
              Funding Rates
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'pairs' ? "Search pairs (e.g., BTC, ETH, BTC/USD)..." : "Search assets (e.g., BTC, ETH)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 h-10"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {activeTab === 'pairs' ? (
            <PairsTable searchQuery={searchQuery} />
          ) : (
            <FundingTable searchQuery={searchQuery} />
          )}
        </div>
      </div>
    </div>
  );
}
