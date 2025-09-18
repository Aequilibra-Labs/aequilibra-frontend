'use client';

import { useState, useEffect, useCallback } from 'react';
import { asterDataService } from '@/lib/protocols/aster';

/**
 * Hook for fetching Aster Finance funding rates for all markets
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAsterFunding = (refreshInterval = 30000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Get all trading symbols first
      const markets = await asterDataService.getAllMarkets();

      // Fetch funding rates for all symbols in parallel (prioritize major coins)
      const majorCoins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT'];
      const prioritizedMarkets = [
        ...majorCoins.filter(coin => markets.includes(coin)),
        ...markets.filter(coin => !majorCoins.includes(coin))
      ];

      console.log('🔍 Aster markets available:', markets.length);
      console.log('🎯 Prioritized markets (first 10):', prioritizedMarkets.slice(0, 10));
      console.log('📊 BTCUSDT in markets:', markets.includes('BTCUSDT'));

      const fundingPromises = prioritizedMarkets.slice(0, 100).map(async (symbol) => { // Increased limit and prioritized major coins
        try {
          const fundingRate = await asterDataService.fundingRate(symbol);
          const marketData = await asterDataService.marketData(symbol);

          if (symbol === 'BTCUSDT') {
            console.log('🐄 BTCUSDT funding rate:', fundingRate);
            console.log('🐄 BTCUSDT market data:', marketData ? 'available' : 'null');
          }

          if (fundingRate !== null && marketData) {
            return {
              asset: symbol.replace('USDT', ''),
              coin: symbol.replace('USDT', ''),
              fundingRate: fundingRate,
              predictedFundingRate: fundingRate, // Aster doesn't provide separate predicted rate
              dailyFundingRate: fundingRate * 3, // Approximate daily rate
              nextFundingTime: marketData.nextFundingTime || Date.now() + 8 * 60 * 60 * 1000,
              volume24h: marketData.quoteVolume || 0,
              openInterest: marketData.openInterest || 0,
              markPx: marketData.markPrice || 0
            };
          }
          return null;
        } catch (err) {
          // Skip symbols that don't have funding data
          return null;
        }
      });

      const fundingResults = await Promise.all(fundingPromises);
      const validData = fundingResults.filter(item => item !== null);

      console.log('🎯 Aster funding data fetched:', validData.length, 'valid items');
      const btcData = validData.find(item => item.asset === 'BTC');
      if (btcData) {
        console.log('🐄 BTC data from Aster hook:', btcData);
      } else {
        console.log('❌ No BTC data found in Aster results');
      }

      setData(validData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdate,
  };
};
