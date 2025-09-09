'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Target,
} from 'lucide-react';
import { useHyperliquidFunding, useHyperliquidMarkets } from '@/lib/hyperliquidAPI';
import { useExtendedFunding, useExtendedMarkets } from '@/lib/extendedAPI';

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetName = params.asset?.toUpperCase();

  // Get data from both exchanges
  const { data: hlFundingData, loading: hlFundingLoading } = useHyperliquidFunding();
  const { data: hlPairsData, loading: hlPairsLoading } = useHyperliquidMarkets();
  const { data: exFundingData, loading: exFundingLoading } = useExtendedFunding();
  const { data: exPairsData, loading: exPairsLoading } = useExtendedMarkets();

  // Find asset data
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
        available: !!hlFunding || !!hlPairs,
      },
      extended: {
        funding: exFunding,
        pairs: exPairs,
        available: !!exFunding || !!exPairs,
      },
    };
  }, [assetName, hlFundingData, hlPairsData, exFundingData, exPairsData]);

  const loading = hlFundingLoading || hlPairsLoading || exFundingLoading || exPairsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
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
              The requested asset could not be found.
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

  const fundingDiff = assetData.hyperliquid.funding && assetData.extended.funding
    ? ((assetData.extended.funding.fundingRate || 0) - (assetData.hyperliquid.funding.funding || 0)) * 100
    : null;

  const priceDiff = assetData.hyperliquid.pairs && assetData.extended.pairs
    ? ((assetData.extended.pairs.price || 0) - (assetData.hyperliquid.pairs.markPx || 0)) / (assetData.hyperliquid.pairs.markPx || 1) * 100
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{assetName}/USD</h1>
            <div className="flex items-center gap-2">
              {assetData.hyperliquid.available && (
                <Badge variant="outline" className="px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  Hyperliquid
                </Badge>
              )}
              {assetData.extended.available && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                  Extended
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Exchange Comparison Overview */}
        {assetData.hyperliquid.available && assetData.extended.available && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Price Difference</h3>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {priceDiff !== null
                    ? `${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(2)}%`
                    : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">
                  Extended vs Hyperliquid
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Funding Rate Difference</h3>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {fundingDiff !== null
                    ? `${fundingDiff > 0 ? '+' : ''}${fundingDiff.toFixed(1)}bp`
                    : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">
                  Extended vs Hyperliquid
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Arbitrage Opportunity</h3>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {Math.abs(fundingDiff || 0) > 10 || Math.abs(priceDiff || 0) > 0.5 ? (
                    <Badge variant="destructive">High</Badge>
                  ) : Math.abs(fundingDiff || 0) > 5 || Math.abs(priceDiff || 0) > 0.2 ? (
                    <Badge variant="secondary">Moderate</Badge>
                  ) : (
                    <Badge variant="outline">Low</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on price & funding spreads
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Exchange Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hyperliquid */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h2 className="text-xl font-semibold">Hyperliquid</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://app.hyperliquid.xyz/trade/${assetName}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Trade
              </Button>
            </div>

            {assetData.hyperliquid.available ? (
              <div className="space-y-4">
                {assetData.hyperliquid.pairs && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mark Price</p>
                      <p className="text-lg font-semibold">
                        ${(assetData.hyperliquid.pairs.markPx || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Change</p>
                      <p
                        className={`text-lg font-semibold ${
                          (assetData.hyperliquid.pairs.change24h || 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(assetData.hyperliquid.pairs.change24h || 0) >= 0 ? '+' : ''}
                        {(assetData.hyperliquid.pairs.change24h || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Volume</p>
                      <p className="text-lg font-semibold">
                        ${((assetData.hyperliquid.pairs.volume24h || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Leverage</p>
                      <p className="text-lg font-semibold">
                        {assetData.hyperliquid.pairs.maxLeverage || 'N/A'}x
                      </p>
                    </div>
                  </div>
                )}

                {assetData.hyperliquid.funding && (
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Funding Rate</p>
                        <p
                          className={`text-lg font-semibold ${
                            (assetData.hyperliquid.funding.funding || 0) > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(assetData.hyperliquid.funding.funding || 0) > 0 ? '+' : ''}
                          {((assetData.hyperliquid.funding.funding || 0) * 100).toFixed(4)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open Interest</p>
                        <p className="text-lg font-semibold">
                          ${((assetData.hyperliquid.funding.openInterest || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {assetName} is not available on Hyperliquid
                </p>
              </div>
            )}
          </Card>

          {/* Extended Exchange */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h2 className="text-xl font-semibold">Extended Exchange</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://app.extended.exchange/trade/${assetName}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Trade
              </Button>
            </div>

            {assetData.extended.available ? (
              <div className="space-y-4">
                {assetData.extended.pairs && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mark Price</p>
                      <p className="text-lg font-semibold">
                        ${(assetData.extended.pairs.price || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Change</p>
                      <p
                        className={`text-lg font-semibold ${
                          (assetData.extended.pairs.change24h || 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(assetData.extended.pairs.change24h || 0) >= 0 ? '+' : ''}
                        {(assetData.extended.pairs.change24h || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Volume</p>
                      <p className="text-lg font-semibold">
                        ${((assetData.extended.pairs.volume24h || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Leverage</p>
                      <p className="text-lg font-semibold">
                        {assetData.extended.pairs.maxLeverage || 'N/A'}x
                      </p>
                    </div>
                  </div>
                )}

                {assetData.extended.funding && (
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Funding Rate</p>
                        <p
                          className={`text-lg font-semibold ${
                            (assetData.extended.funding.fundingRate || 0) > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(assetData.extended.funding.fundingRate || 0) > 0 ? '+' : ''}
                          {((assetData.extended.funding.fundingRate || 0) * 100).toFixed(4)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open Interest</p>
                        <p className="text-lg font-semibold">
                          ${((assetData.extended.funding.openInterest || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {assetName} is not available on Extended Exchange
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Trading Strategy */}
        {assetData.hyperliquid.available && assetData.extended.available && fundingDiff !== null && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-semibold">Recommended Strategy</h3>
            </div>
            
            {Math.abs(fundingDiff) > 10 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    High Arbitrage Opportunity ({Math.abs(fundingDiff).toFixed(1)}bp spread)
                  </h4>
                  <div className="space-y-2 text-sm">
                    {fundingDiff > 0 ? (
                      <>
                        <p><span className="font-semibold text-red-600">Short</span> {assetName} on Extended Exchange</p>
                        <p><span className="font-semibold text-green-600">Long</span> {assetName} on Hyperliquid</p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-semibold text-red-600">Short</span> {assetName} on Hyperliquid</p>
                        <p><span className="font-semibold text-green-600">Long</span> {assetName} on Extended Exchange</p>
                      </>
                    )}
                    <p className="text-muted-foreground">
                      Expected profit: ~{Math.abs(fundingDiff).toFixed(0)}bp every 8 hours
                    </p>
                  </div>
                </div>
              </div>
            ) : Math.abs(fundingDiff) > 5 ? (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Moderate Arbitrage Opportunity ({Math.abs(fundingDiff).toFixed(1)}bp spread)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Consider monitoring for better entry points or larger position sizes.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Low Arbitrage Opportunity ({Math.abs(fundingDiff).toFixed(1)}bp spread)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Funding rates are relatively aligned. Monitor for changes.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
