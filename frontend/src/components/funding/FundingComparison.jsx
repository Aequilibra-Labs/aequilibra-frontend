'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Zap,
  Clock,
  Filter,
  Eye,
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
    if (rate === null || rate === undefined || isNaN(rate)) return 'text-muted-foreground';
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'text-muted-foreground';
    return numRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Multi-Platform Funding Rates
              </h1>
              <p className="text-muted-foreground mt-2">
                Compare funding rates across Hyperliquid, Extended, and Aster platforms
              </p>
            </div>

            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      isLoading ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <Clock className="h-3 w-3" />
                    <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Platform Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Selection Controls */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex-1"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Platform Checkboxes */}
                <div className="space-y-3">
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                      />
                      <label
                        htmlFor={platform.id}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <img src={platform.image} alt={platform.name} className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {platform.description}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Selected Platforms Summary */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">
                    Selected: {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedPlatforms.map(platformId => {
                      const platform = AVAILABLE_PLATFORMS.find(p => p.id === platformId);
                      return platform ? (
                        <Badge
                          key={platformId}
                          variant="secondary"
                          className="text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <img src={platform.image} alt={platform.name} className="h-3 w-3" />
                            {platform.name}
                          </div>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
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
                    >
                      Asset {sortBy === 'asset' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading funding rates...</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {hasError && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="text-destructive mb-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Failed to load funding data</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {selectedPlatforms.includes('hyperliquid') && hyperliquidData.error && (
                      <p>Hyperliquid: {hyperliquidData.error}</p>
                    )}
                    {selectedPlatforms.includes('extended') && extendedData.error && (
                      <p>Extended: {extendedData.error}</p>
                    )}
                    {selectedPlatforms.includes('aster') && asterData.error && (
                      <p>Aster: {asterData.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Selection State */}
            {selectedPlatforms.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <EyeOff className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">No platforms selected</p>
                  </div>
                  <p className="text-sm">Select platforms above to view funding rates</p>
                </CardContent>
              </Card>
            )}

            {/* Data Table */}
            {!isLoading && !hasError && selectedPlatforms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Multi-Platform Funding Rates
                    <Badge variant="outline" className="ml-2">
                      {filteredData.length} assets
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Asset</th>
                          {selectedPlatforms.includes('hyperliquid') && (
                            <th className="text-center py-3 px-4 font-semibold">
                              <div className="flex items-center justify-center gap-2">
                                <img src="/hyprliquid.png" alt="Hyperliquid" className="h-5 w-5" />
                                <span>Hyperliquid</span>
                              </div>
                            </th>
                          )}
                          {selectedPlatforms.includes('extended') && (
                            <th className="text-center py-3 px-4 font-semibold">
                              <div className="flex items-center justify-center gap-2">
                                <img src="/extended.png" alt="Extended" className="h-5 w-5" />
                                <span>Extended</span>
                              </div>
                            </th>
                          )}
                          {selectedPlatforms.includes('aster') && (
                            <th className="text-center py-3 px-4 font-semibold">
                              <div className="flex items-center justify-center gap-2">
                                <img src="/aster.png" alt="Aster" className="h-5 w-5" />
                                <span>Aster</span>
                              </div>
                            </th>
                          )}
                          <th className="text-right py-3 px-4 font-semibold">24h Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((item, index) => (
                          <tr key={`${item.asset}-${index}`} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-4">
                              <div className="font-medium">{item.asset}</div>
                            </td>
                            {selectedPlatforms.includes('hyperliquid') && (
                              <td className="py-3 px-4 text-center">
                                {item.platforms.hyperliquid ? (
                                  <div className="space-y-1">
                                    <div className={`font-mono font-semibold ${getFundingRateColor(item.platforms.hyperliquid.fundingRate)}`}>
                                      {formatFundingRate(item.platforms.hyperliquid.fundingRate)}
                                    </div>
                                    <div className={`text-xs font-mono ${getFundingRateColor(item.platforms.hyperliquid.annualizedRate)}`}>
                                      {formatFundingRate(item.platforms.hyperliquid.annualizedRate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-sm">N/A</div>
                                )}
                              </td>
                            )}
                            {selectedPlatforms.includes('extended') && (
                              <td className="py-3 px-4 text-center">
                                {item.platforms.extended ? (
                                  <div className="space-y-1">
                                    <div className={`font-mono font-semibold ${getFundingRateColor(item.platforms.extended.fundingRate)}`}>
                                      {formatFundingRate(item.platforms.extended.fundingRate)}
                                    </div>
                                    <div className={`text-xs font-mono ${getFundingRateColor(item.platforms.extended.annualizedRate)}`}>
                                      {formatFundingRate(item.platforms.extended.annualizedRate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-sm">N/A</div>
                                )}
                              </td>
                            )}
                            {selectedPlatforms.includes('aster') && (
                              <td className="py-3 px-4 text-center">
                                {item.platforms.aster ? (
                                  <div className="space-y-1">
                                    <div className={`font-mono font-semibold ${getFundingRateColor(item.platforms.aster.fundingRate)}`}>
                                      {formatFundingRate(item.platforms.aster.fundingRate)}
                                    </div>
                                    <div className={`text-xs font-mono ${getFundingRateColor(item.platforms.aster.annualizedRate)}`}>
                                      {formatFundingRate(item.platforms.aster.annualizedRate)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-sm">N/A</div>
                                )}
                              </td>
                            )}
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono text-muted-foreground">
                                {formatVolume(item.volume24h)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredData.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-muted-foreground">
                      No assets match your search "{searchQuery}"
                    </div>
                  )}

                  {filteredData.length === 0 && !searchQuery && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No Opportunities</div>
                      <div className="text-sm">No assets have funding data from at least 2 platforms</div>
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
