'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Target,
  Wallet,
  Activity,
  PieChart,
} from 'lucide-react';
import { useHyperliquidFunding, useHyperliquidMarkets } from '@/lib/hyperliquidAPI';
import { useExtendedFunding, useExtendedMarkets } from '@/lib/extendedAPI';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetName = params.asset?.toUpperCase();

  // State for user inputs
  const [hlAmount, setHlAmount] = useState('');
  const [exAmount, setExAmount] = useState('');

  // Get data from both exchanges
  const { data: hlFundingData, loading: hlFundingLoading } = useHyperliquidFunding();
  const { data: hlPairsData, loading: hlPairsLoading } = useHyperliquidMarkets();
  const { data: exFundingData, loading: exFundingLoading } = useExtendedFunding();
  const { data: exPairsData, loading: exPairsLoading } = useExtendedMarkets();

  // Mock historical data for 30 days (in real app, this would come from API)
  const historicalData = useMemo(() => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate mock data with some realistic patterns
      const hlFundingBase = 0.02 + Math.sin(i * 0.3) * 0.01;
      const exFundingBase = 0.025 + Math.sin(i * 0.25) * 0.012;
      const volumeBase = 50000000 + Math.sin(i * 0.2) * 20000000;
      const openInterestBase = 200000000 + Math.sin(i * 0.15) * 50000000;

      data.push({
        date: date.toISOString().split('T')[0],
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hlFunding: Number((hlFundingBase + Math.random() * 0.005 - 0.0025).toFixed(4)),
        exFunding: Number((exFundingBase + Math.random() * 0.005 - 0.0025).toFixed(4)),
        hlVolume: Math.round(volumeBase + Math.random() * 10000000 - 5000000),
        exVolume: Math.round(volumeBase * 0.8 + Math.random() * 8000000 - 4000000),
        hlOpenInterest: Math.round(openInterestBase + Math.random() * 20000000 - 10000000),
        exOpenInterest: Math.round(openInterestBase * 0.9 + Math.random() * 18000000 - 9000000),
        spread: Number((Math.abs(hlFundingBase - exFundingBase) * 100).toFixed(2)),
      });
    }
    return data;
  }, []);

  // Find current asset data
  const assetData = useMemo(() => {
    if (!assetName) return null;

    const hlFunding = hlFundingData?.find(
      (item) => item.coin?.toUpperCase() === assetName
    );
    const hlPairs = hlPairsData?.find(
      (item) => item.coin?.toUpperCase() === assetName
    );
    const exFunding = exFundingData?.find(
      (item) => item.base?.toUpperCase() === assetName
    );
    const exPairs = exPairsData?.find(
      (item) => item.base?.toUpperCase() === assetName
    );

    return {
      asset: assetName,
      hyperliquid: {
        funding: hlFunding,
        pairs: hlPairs,
        fundingRate: hlFunding?.funding || 0,
        price: hlPairs?.markPx || 0,
        volume24h: hlPairs?.volume24h || 0,
        openInterest: hlFunding?.openInterest || 0,
      },
      extended: {
        funding: exFunding,
        pairs: exPairs,
        fundingRate: exFunding?.fundingRate || 0,
        price: exPairs?.price || 0,
        volume24h: exPairs?.volume24h || 0,
        openInterest: exFunding?.openInterest || 0,
      },
    };
  }, [assetName, hlFundingData, hlPairsData, exFundingData, exPairsData]);

  // Mock user balances (in real app, this would come from wallet connection)
  const userBalances = {
    hyperliquid: {
      total: 15420.50,
      available: 12330.25,
      inPosition: 3090.25,
    },
    extended: {
      total: 8750.30,
      available: 7200.15,
      inPosition: 1550.15,
    },
  };

  // Mock open positions (in real app, this would come from API)
  const openPositions = [
    // No positions by default - user starts with empty portfolio
  ];

  const loading = hlFundingLoading || hlPairsLoading || exFundingLoading || exPairsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Asset Not Found</h1>
            <p className="text-muted-foreground">
              The asset {assetName} was not found on either exchange.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleNeutralTrade = () => {
    if (!hlAmount || !exAmount) {
      alert('Please enter amounts for both exchanges');
      return;
    }
    
    // In real app, this would execute the neutral strategy
    alert(`Executing neutral strategy with $${hlAmount} on Hyperliquid and $${exAmount} on Extended Exchange`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">
              {assetData.asset}/USD
            </h1>
            <p className="text-lg text-muted-foreground">
              Cross-exchange analysis and trading
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Side - Charts (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Funding Rate Chart */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    Funding Rate - Last 30 Days
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Hyperliquid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-sm">Extended Exchange</span>
                    </div>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dateFormatted" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${(value * 100).toFixed(4)}%`,
                          name === 'hlFunding' ? 'Hyperliquid' : 'Extended Exchange'
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="hlFunding" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Hyperliquid Funding"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="exFunding" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Extended Funding"
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Volume + Open Interest Chart */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    Volume & Open Interest + Spread
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">HL Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-sm">EX Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Spread</span>
                    </div>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dateFormatted" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="volume"
                        orientation="left"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                      />
                      <YAxis 
                        yAxisId="spread"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}bp`}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name.includes('Volume') || name.includes('Interest')) {
                            return [`$${(value / 1000000).toFixed(2)}M`, name];
                          }
                          return [`${value}bp`, name];
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="volume"
                        dataKey="hlVolume" 
                        fill="#3b82f6" 
                        name="HL Volume"
                        opacity={0.7}
                      />
                      <Bar 
                        yAxisId="volume"
                        dataKey="exVolume" 
                        fill="#8b5cf6" 
                        name="EX Volume"
                        opacity={0.7}
                      />
                      <Line 
                        yAxisId="spread"
                        type="monotone" 
                        dataKey="spread" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Funding Spread"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - Trading Panel (1/4 width) */}
          <div className="space-y-6">
            {/* User Balances */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Your Balances</h3>
                </div>
                
                {/* Hyperliquid Balance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Hyperliquid</span>
                  </div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-mono">${userBalances.hyperliquid.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-mono text-green-600">${userBalances.hyperliquid.available.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Position:</span>
                      <span className="font-mono text-yellow-600">${userBalances.hyperliquid.inPosition.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Extended Balance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Extended Exchange</span>
                  </div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-mono">${userBalances.extended.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-mono text-green-600">${userBalances.extended.available.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Position:</span>
                      <span className="font-mono text-yellow-600">${userBalances.extended.inPosition.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Trading Inputs */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Neutral Strategy</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Hyperliquid Amount ($)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={hlAmount}
                      onChange={(e) => setHlAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Extended Amount ($)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={exAmount}
                      onChange={(e) => setExAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleNeutralTrade}
                    disabled={!hlAmount || !exAmount}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Execute Neutral Trade
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    This will execute opposite positions on both exchanges to capture funding rate differences while remaining market neutral.
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Metrics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">HL Funding:</span>
                    <span className={`font-mono text-sm ${
                      assetData.hyperliquid.fundingRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {assetData.hyperliquid.fundingRate > 0 ? '+' : ''}
                      {(assetData.hyperliquid.fundingRate * 100).toFixed(3)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">EX Funding:</span>
                    <span className={`font-mono text-sm ${
                      assetData.extended.fundingRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {assetData.extended.fundingRate > 0 ? '+' : ''}
                      {(assetData.extended.fundingRate * 100).toFixed(3)}%
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Price Diff:</span>
                    <span className="font-mono text-sm">
                      ${Math.abs(assetData.hyperliquid.price - assetData.extended.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Funding Spread:</span>
                    <span className="font-mono text-sm">
                      {Math.abs((assetData.hyperliquid.fundingRate - assetData.extended.fundingRate) * 10000).toFixed(1)}bp
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Open Positions */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <h2 className="text-2xl font-semibold">Open Positions</h2>
            </div>

            {openPositions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Exchange</th>
                      <th className="text-left p-4 font-semibold">Side</th>
                      <th className="text-right p-4 font-semibold">Size</th>
                      <th className="text-right p-4 font-semibold">Entry Price</th>
                      <th className="text-right p-4 font-semibold">Current Price</th>
                      <th className="text-right p-4 font-semibold">PnL</th>
                      <th className="text-right p-4 font-semibold">Margin Used</th>
                      <th className="text-center p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((position) => (
                      <tr key={position.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              position.exchange === 'Hyperliquid' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                            {position.exchange}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={position.side === 'Long' ? 'default' : 'destructive'}>
                            {position.side}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-mono">
                          {position.size} {assetData.asset}
                        </td>
                        <td className="p-4 text-right font-mono">
                          ${position.entryPrice.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-mono">
                          ${position.currentPrice.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-mono ${
                            position.pnl > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {position.pnl > 0 ? '+' : ''}${position.pnl.toFixed(2)}
                            <div className="text-xs">
                              ({position.pnl > 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono">
                          ${position.margin.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <Button size="sm" variant="outline" className="text-xs">
                            Close
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Open Positions</h3>
                <p>You don&apos;t have any open positions for {assetData.asset} at the moment.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
