'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  TrendingUp, 
  TrendingDown,
  Info,
  ArrowUpDown
} from 'lucide-react';
import { useHyperliquidFunding } from '@/lib/hyperliquidAPI';
import { useExtendedFunding } from '@/lib/extendedAPI';

export function ComparisonFundingTable({ searchQuery = '' }) {
  const [sortBy, setSortBy] = useState('fundingDiff');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Get data from both exchanges
  const { data: hlData, loading: hlLoading, lastUpdate: hlUpdate } = useHyperliquidFunding();
  const { data: exData, loading: exLoading, lastUpdate: exUpdate } = useExtendedFunding();

  // Combine and compare funding data
  const comparisonData = useMemo(() => {
    if (!hlData || !exData) return [];

    const combined = [];
    
    // Find common pairs between both exchanges
    hlData.forEach(hlItem => {
      const exItem = exData.find(ex => ex.base.toLowerCase() === hlItem.coin.toLowerCase());
      
      if (exItem) {
        const fundingDiff = ((exItem.fundingRate || 0) - (hlItem.funding || 0)) * 100; // Convert to basis points
        const openInterestDiff = (exItem.openInterest || 0) && (hlItem.openInterest || 0)
          ? (((exItem.openInterest || 0) - (hlItem.openInterest || 0)) / (hlItem.openInterest || 1)) * 100
          : null;

        combined.push({
          base: hlItem.coin,
          symbol: hlItem.coin,
          // Hyperliquid data
          hl: {
            fundingRate: hlItem.funding || 0,
            predictedFundingRate: hlItem.predictedFunding || hlItem.funding || 0, // Fallback if not available
            dailyFundingRate: (hlItem.funding || 0) * 3 * 365, // 3 times per day * 365 days
            openInterest: hlItem.openInterest || 0,
            price: hlItem.markPrice || hlItem.price || 0
          },
          // Extended data
          ex: {
            fundingRate: exItem.fundingRate || 0,
            predictedFundingRate: exItem.predictedFundingRate || 0,
            dailyFundingRate: exItem.dailyFundingRate || 0,
            openInterest: exItem.openInterest || 0,
            price: exItem.price || 0
          },
          // Comparison metrics
          fundingDiff,
          openInterestDiff,
          // Arbitrage opportunity indicator
          isArbitrageOpportunity: Math.abs(fundingDiff) > 10, // More than 10 basis points difference
          // For sorting
          avgOpenInterest: ((hlItem.openInterest || 0) + (exItem.openInterest || 0)) / 2
        });
      }
    });

    return combined;
  }, [hlData, exData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!comparisonData) return [];

    let filtered = comparisonData.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const baseLower = item.base.toLowerCase();
      const displayPair = `${item.base}/usd`.toLowerCase();
      
      return baseLower.includes(searchLower) ||
             displayPair.includes(searchLower) ||
             `${item.base}usd`.toLowerCase().includes(searchLower);
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'symbol':
          aVal = a.base.toLowerCase();
          bVal = b.base.toLowerCase();
          break;
        case 'fundingDiff':
          aVal = Math.abs(a.fundingDiff || 0);
          bVal = Math.abs(b.fundingDiff || 0);
          break;
        case 'openInterestDiff':
          aVal = Math.abs(a.openInterestDiff || 0);
          bVal = Math.abs(b.openInterestDiff || 0);
          break;
        case 'avgOpenInterest':
          aVal = a.avgOpenInterest;
          bVal = b.avgOpenInterest;
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [comparisonData, searchQuery, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate arbitrage opportunities
  const arbitrageOpportunities = filteredData.filter(item => item.isArbitrageOpportunity).length;

  const loading = hlLoading || exLoading;

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4 mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="bg-muted h-4 w-20 rounded"></div>
                <div className="bg-muted h-4 w-16 rounded"></div>
                <div className="bg-muted h-4 w-24 rounded"></div>
                <div className="bg-muted h-4 w-20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Funding Rate Comparison</h2>
            <Badge variant="outline" className="px-3 py-1">{filteredData.length} common markets</Badge>
            {arbitrageOpportunities > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                {arbitrageOpportunities} Arbitrage Ops
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium">HL</span>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-medium">EX</span>
              </div>
            </div>
            {(hlUpdate || exUpdate) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Clock className="h-3 w-3" />
                  <span>Live Data</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('symbol')}>
                  Asset
                </th>
                <th className="text-center p-4 font-semibold">
                  Current Rates
                </th>
                <th className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('fundingDiff')}>
                  <div className="flex items-center justify-center gap-1">
                    Rate Diff
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">
                  Daily APR
                </th>
                <th className="text-center p-4 font-semibold">
                  Open Interest
                </th>
                <th className="text-center p-4 font-semibold">
                  Mark Prices
                </th>
                <th className="text-center p-4 font-semibold">
                  Strategy
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const fundingDiffAbs = Math.abs(item.fundingDiff);
                const isSignificantDiff = fundingDiffAbs > 10; // More than 10 basis points
                
                return (
                  <tr 
                    key={item.symbol}
                    className={`hover:bg-muted/30 transition-all duration-200 group ${
                      item.isArbitrageOpportunity ? 'bg-yellow-50/20 dark:bg-yellow-900/10' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">{item.base}/USD</div>
                        {item.isArbitrageOpportunity && (
                          <Badge variant="destructive" className="text-xs px-2">
                            Arbitrage
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className={`font-mono text-sm font-semibold ${
                            item.hl.fundingRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.hl.fundingRate > 0 ? '+' : ''}{(item.hl.fundingRate || 0).toFixed(4)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className={`font-mono text-sm font-semibold ${
                            item.ex.fundingRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.ex.fundingRate > 0 ? '+' : ''}{(item.ex.fundingRate || 0).toFixed(4)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 text-center">
                      <div className={`font-semibold text-base ${
                        isSignificantDiff 
                          ? 'text-red-600' 
                          : fundingDiffAbs > 5 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {item.fundingDiff > 0 ? '+' : ''}{(item.fundingDiff || 0).toFixed(1)}bp
                      </div>
                      {isSignificantDiff && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          High Spread
                        </Badge>
                      )}
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className={`font-mono text-sm ${
                            item.hl.dailyFundingRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.hl.dailyFundingRate > 0 ? '+' : ''}{(item.hl.dailyFundingRate || 0).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className={`font-mono text-sm ${
                            item.ex.dailyFundingRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.ex.dailyFundingRate > 0 ? '+' : ''}{(item.ex.dailyFundingRate || 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-sm">
                            ${((item.hl.openInterest || 0) / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-mono text-sm">
                            ${((item.ex.openInterest || 0) / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-sm">
                            ${(item.hl.price || 0).toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 6 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-mono text-sm">
                            ${(item.ex.price || 0).toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 6 
                            })}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 text-center">
                      {item.isArbitrageOpportunity ? (
                        <div className="space-y-1">
                          {item.fundingDiff > 0 ? (
                            <div className="text-xs space-y-0.5">
                              <div className="text-red-600 font-medium">Short EX</div>
                              <div className="text-green-600 font-medium">Long HL</div>
                            </div>
                          ) : (
                            <div className="text-xs space-y-0.5">
                              <div className="text-red-600 font-medium">Short HL</div>
                              <div className="text-green-600 font-medium">Long EX</div>
                            </div>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {(fundingDiffAbs || 0).toFixed(0)}bp/8h
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Neutral
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium">Funding Arbitrage Strategy:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>• <strong>bp</strong>: Basis points (1bp = 0.01%) - Rate difference between exchanges</p>
                <p>• <strong>High Spread (&gt;10bp)</strong>: Potential arbitrage opportunity every 8 hours</p>
                <p>• <strong>Strategy</strong>: Go long on the exchange with lower funding, short on higher funding</p>
                <p>• <strong>Risk</strong>: Consider price impact, liquidity, and position size limits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
