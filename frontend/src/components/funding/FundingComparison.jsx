'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Search,
  RefreshCw,
  BarChart3,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useHyperliquidFunding } from '@/hooks/protocols/hyperliquid';
import { useExtendedFunding } from '@/lib/protocols/extended/rest';
import { useAsterFunding } from '@/hooks/protocols/aster/useAsterFunding';

const AVAILABLE_PLATFORMS = [
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    description: 'Perpetual futures DEX',
    icon: '⚡',
    image: '/hyprliquid.png'
  },
  {
    id: 'extended',
    name: 'Extended',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    description: 'Advanced derivatives',
    icon: '�'
  },
  {
    id: 'aster',
    name: 'Aster',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    description: 'Decentralized exchange',
    icon: '⭐',
    image: '/aster.png'
  }
];

export function FundingComparison() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['hyperliquid', 'extended', 'aster']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('fundingRate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Function to normalize asset names across platforms
  const normalizeAssetName = (assetName) => {
    if (!assetName) return '';

    // Remove common suffixes and separators
    return assetName
      .replace(/[-\/]USD[T]?$/i, '') // Remove -USD, -USDT, /USD, /USDT
      .replace(/USDT$/i, '') // Remove USDT suffix
      .toUpperCase();
  };

  // Fetch data for all platforms
  const hyperliquidData = useHyperliquidFunding();
  const extendedData = useExtendedFunding();
  const asterData = useAsterFunding();

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedPlatforms([]);
  };

  // Combine data from all selected platforms
  const combinedData = useMemo(() => {
    const data = [];

    if (selectedPlatforms.includes('hyperliquid') && hyperliquidData.data) {
      hyperliquidData.data.forEach(item => {
        const asset = item.asset || item.coin;
        const normalizedAsset = normalizeAssetName(asset);
        data.push({
          ...item,
          platform: 'hyperliquid',
          platformName: 'Hyperliquid',
          platformColor: 'bg-blue-500',
          platformTextColor: 'text-blue-600',
          asset: asset,
          normalizedAsset: normalizedAsset,
          fundingRate: item.fundingRate,
          annualizedRate: (item.fundingRate !== null && item.fundingRate !== undefined && !isNaN(item.fundingRate))
            ? parseFloat(item.fundingRate) * 3 * (365 / 8) // Annualized rate calculation
            : null,
          nextFunding: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          volume24h: item.volume24h || 0,
          openInterest: item.openInterest || 0,
          markPx: item.markPx || 0
        });
      });
    }

    if (selectedPlatforms.includes('extended') && extendedData.data) {
      extendedData.data.forEach(item => {
        const asset = item.asset || item.coin;
        const normalizedAsset = normalizeAssetName(asset);
        data.push({
          ...item,
          platform: 'extended',
          platformName: 'Extended',
          platformColor: 'bg-green-500',
          platformTextColor: 'text-green-600',
          asset: asset,
          normalizedAsset: normalizedAsset,
          fundingRate: item.fundingRate,
          annualizedRate: (item.fundingRate !== null && item.fundingRate !== undefined && !isNaN(item.fundingRate))
            ? parseFloat(item.fundingRate) * 3 * (365 / 8) // Annualized rate calculation
            : null,
          nextFunding: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          volume24h: item.volume24h || 0,
          openInterest: item.openInterest || 0,
          markPx: item.markPx || 0
        });
      });
    }

    if (selectedPlatforms.includes('aster') && asterData.data) {
      asterData.data.forEach(item => {
        const asset = item.asset || item.coin;
        const normalizedAsset = normalizeAssetName(asset);
        data.push({
          ...item,
          platform: 'aster',
          platformName: 'Aster',
          platformColor: 'bg-purple-500',
          platformTextColor: 'text-purple-600',
          asset: asset,
          normalizedAsset: normalizedAsset,
          fundingRate: item.fundingRate,
          annualizedRate: (item.fundingRate !== null && item.fundingRate !== undefined && !isNaN(item.fundingRate))
            ? parseFloat(item.fundingRate) * 3 * (365 / 8) // Annualized rate calculation
            : null,
          nextFunding: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          volume24h: item.volume24h || 0,
          openInterest: item.openInterest || 0,
          markPx: item.markPx || 0
        });
      });
    }

    return data;
  }, [selectedPlatforms, hyperliquidData.data, extendedData.data, asterData.data]);

  // Group data by asset for horizontal comparison
  const groupedData = useMemo(() => {
    const assetMap = new Map();

    // Group data by normalized asset name
    combinedData.forEach(item => {
      const normalizedAsset = item.normalizedAsset;
      if (!assetMap.has(normalizedAsset)) {
        assetMap.set(normalizedAsset, {
          asset: normalizedAsset, // Use normalized name as display name
          platforms: {},
          volume24h: 0,
          openInterest: 0
        });
      }

      const assetData = assetMap.get(normalizedAsset);
      assetData.platforms[item.platform] = {
        fundingRate: item.fundingRate,
        annualizedRate: item.annualizedRate,
        volume24h: item.volume24h,
        openInterest: item.openInterest,
        markPx: item.markPx,
        platformName: item.platformName,
        platformColor: item.platformColor,
        platformTextColor: item.platformTextColor
      };

      // Use the highest volume and open interest across platforms
      assetData.volume24h = Math.max(assetData.volume24h, item.volume24h || 0);
      assetData.openInterest = Math.max(assetData.openInterest, item.openInterest || 0);
    });

    // Filter to only include assets with data from at least 2 platforms
    const filteredAssets = Array.from(assetMap.values()).filter(assetData => {
      const platformsWithData = Object.values(assetData.platforms).filter(platform =>
        platform.fundingRate !== null &&
        platform.fundingRate !== undefined &&
        !isNaN(platform.fundingRate)
      );

      return platformsWithData.length >= 2;
    });

    return filteredAssets;
  }, [combinedData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = groupedData.filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.asset?.toLowerCase().includes(query) ||
        Object.values(item.platforms).some(platform => platform.platformName?.toLowerCase().includes(query))
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === 'asset') {
        aVal = a.asset?.toLowerCase() || '';
        bVal = b.asset?.toLowerCase() || '';
      } else if (sortBy === 'fundingRate') {
        // Sort by the highest funding rate across platforms
        const aRates = Object.values(a.platforms).map(p => p.fundingRate).filter(r => r !== null && r !== undefined && !isNaN(r));
        const bRates = Object.values(b.platforms).map(p => p.fundingRate).filter(r => r !== null && r !== undefined && !isNaN(r));
        aVal = aRates.length > 0 ? Math.max(...aRates) : (sortOrder === 'asc' ? -Infinity : Infinity);
        bVal = bRates.length > 0 ? Math.max(...bRates) : (sortOrder === 'asc' ? -Infinity : Infinity);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [groupedData, searchQuery, sortBy, sortOrder]);

  // Update last update time
  useEffect(() => {
    const updates = [];
    if (hyperliquidData.lastUpdate) updates.push(hyperliquidData.lastUpdate);
    if (extendedData.lastUpdate) updates.push(extendedData.lastUpdate);
    if (asterData.lastUpdate) updates.push(asterData.lastUpdate);

    if (updates.length > 0) {
      setLastUpdate(new Date(Math.max(...updates.map(u => u.getTime()))));
    }
  }, [hyperliquidData.lastUpdate, extendedData.lastUpdate, asterData.lastUpdate]);

  const formatFundingRate = (rate) => {
    if (rate === null || rate === undefined || isNaN(rate)) return 'N/A';
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'N/A';
    const percentage = (numRate * 100).toFixed(4);
    return `${percentage >= 0 ? '+' : ''}${percentage}%`;
  };

  const formatVolume = (volume) => {
    if (!volume) return '$0';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const getFundingRateColor = (rate) => {
    if (rate === null || rate === undefined || isNaN(rate)) return 'text-slate-400 dark:text-slate-500';
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'text-slate-400 dark:text-slate-500';
    return numRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  const isLoading = (
    (selectedPlatforms.includes('hyperliquid') && hyperliquidData.loading) ||
    (selectedPlatforms.includes('extended') && extendedData.loading) ||
    (selectedPlatforms.includes('aster') && asterData.loading)
  );

  const hasError = (
    (selectedPlatforms.includes('hyperliquid') && hyperliquidData.error) ||
    (selectedPlatforms.includes('extended') && extendedData.error) ||
    (selectedPlatforms.includes('aster') && asterData.error)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Funding Rate Comparison
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Cross-platform perpetual funding rates
              </p>
            </div>

            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className={`w-2 h-2 rounded-full ${
                    isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                  }`}></div>
                  <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                disabled={isLoading}
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Platform Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Checkboxes */}
                <div className="space-y-3">
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                        className="border-slate-300 dark:border-slate-600"
                      />
                      <label
                        htmlFor={platform.id}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <img src={platform.image} alt={platform.name} className="h-5 w-5 rounded" />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {platform.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {platform.description}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Platform Summary */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedPlatforms.length} of {AVAILABLE_PLATFORMS.length} platforms selected
                    </span>
                    {selectedPlatforms.length > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm mb-6">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === 'fundingRate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'fundingRate') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('fundingRate');
                          setSortOrder('desc');
                        }
                      }}
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Rate {sortBy === 'fundingRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>

                    <Button
                      variant={sortBy === 'asset' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'asset') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('asset');
                          setSortOrder('asc');
                        }
                      }}
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Asset {sortBy === 'asset' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading funding rates...</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Fetching data from selected platforms</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {hasError && (
              <Card className="border-red-200 dark:border-red-800 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <div className="text-red-600 dark:text-red-400 mb-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3" />
                    <p className="font-semibold text-sm">Failed to load funding data</p>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 max-w-md mx-auto">
                    {selectedPlatforms.includes('hyperliquid') && hyperliquidData.error && (
                      <p>• Hyperliquid: {hyperliquidData.error}</p>
                    )}
                    {selectedPlatforms.includes('extended') && extendedData.error && (
                      <p>• Extended: {extendedData.error}</p>
                    )}
                    {selectedPlatforms.includes('aster') && asterData.error && (
                      <p>• Aster: {asterData.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Selection State */}
            {selectedPlatforms.length === 0 && (
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <div className="text-slate-500 dark:text-slate-400 mb-4">
                    <EyeOff className="h-8 w-8 mx-auto mb-3" />
                    <p className="font-semibold text-sm">No platforms selected</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select platforms to view funding rates</p>
                </CardContent>
              </Card>
            )}

            {/* Data Table */}
            {!isLoading && !hasError && selectedPlatforms.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Funding Rates
                  </CardTitle>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {filteredData.length} assets available
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                            Asset
                          </th>
                          {selectedPlatforms.includes('hyperliquid') && (
                            <th className="text-center py-4 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                              <div className="flex items-center justify-center gap-2">
                                <img src="/hyprliquid.png" alt="Hyperliquid" className="h-5 w-5 rounded" />
                                <span>Hyperliquid</span>
                              </div>
                            </th>
                          )}
                          {selectedPlatforms.includes('extended') && (
                            <th className="text-center py-4 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                              <div className="flex items-center justify-center gap-2">
                                <img src="/extended.png" alt="Extended" className="h-5 w-5 rounded" />
                                <span>Extended</span>
                              </div>
                            </th>
                          )}
                          {selectedPlatforms.includes('aster') && (
                            <th className="text-center py-4 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                              <div className="flex items-center justify-center gap-2">
                                <img src="/aster.png" alt="Aster" className="h-5 w-5 rounded" />
                                <span>Aster</span>
                              </div>
                            </th>
                          )}
                          <th className="text-right py-4 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                            Volume (24h)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((item, index) => (
                          <tr key={`${item.asset}-${index}`} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 hover:shadow-sm">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                {item.asset}
                              </div>
                            </td>
                            {selectedPlatforms.includes('hyperliquid') && (
                              <td className="py-4 px-6 text-center">
                                {item.platforms.hyperliquid ? (
                                  <div className="space-y-1">
                                    <div className={`font-mono font-bold text-sm ${getFundingRateColor(item.platforms.hyperliquid.fundingRate)}`}>
                                      {formatFundingRate(item.platforms.hyperliquid.fundingRate)}
                                    </div>
                                    <div className={`text-xs font-mono ${getFundingRateColor(item.platforms.hyperliquid.annualizedRate)} opacity-75`}>
                                      {formatFundingRate(item.platforms.hyperliquid.annualizedRate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 dark:text-slate-500 text-sm font-mono">—</div>
                                )}
                              </td>
                            )}
                            {selectedPlatforms.includes('extended') && (
                              <td className="py-4 px-6 text-center">
                                {item.platforms.extended ? (
                                  <div className="space-y-1">
                                    <div className={`font-mono font-bold text-sm ${getFundingRateColor(item.platforms.extended.fundingRate)}`}>
                                      {formatFundingRate(item.platforms.extended.fundingRate)}
                                    </div>
                                    <div className={`text-xs font-mono ${getFundingRateColor(item.platforms.extended.annualizedRate)} opacity-75`}>
                                      {formatFundingRate(item.platforms.extended.annualizedRate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 dark:text-slate-500 text-sm font-mono">—</div>
                                )}
                              </td>
                            )}
                            {selectedPlatforms.includes('aster') && (
                              <td className="py-4 px-6 text-center">
                                {item.platforms.aster ? (
                                  <div className="space-y-1">
                                    <div className={`font-mono font-bold text-sm ${getFundingRateColor(item.platforms.aster.fundingRate)}`}>
                                      {formatFundingRate(item.platforms.aster.fundingRate)}
                                    </div>
                                    <div className={`text-xs font-mono ${getFundingRateColor(item.platforms.aster.annualizedRate)} opacity-75`}>
                                      {formatFundingRate(item.platforms.aster.annualizedRate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 dark:text-slate-500 text-sm font-mono">—</div>
                                )}
                              </td>
                            )}
                            <td className="py-4 px-6 text-right">
                              <span className="font-mono text-slate-600 dark:text-slate-400 text-sm font-medium">
                                {formatVolume(item.volume24h)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredData.length === 0 && searchQuery && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No assets match "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  )}

                  {filteredData.length === 0 && !searchQuery && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">No Opportunities</p>
                      <p className="text-xs">No assets available on 2+ platforms</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
