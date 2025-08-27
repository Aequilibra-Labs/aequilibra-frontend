// Hyperliquid API integration for real trading data
import { useState, useEffect } from 'react';

const HYPERLIQUID_API_BASE = 'https://api.hyperliquid.xyz';

export class HyperliquidAPI {
  // Get all trading pairs with market data
  static async getAllMids() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'allMids'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid mids:', error);
      throw error;
    }
  }

  // Get meta information about available assets
  static async getMeta() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid meta:', error);
      throw error;
    }
  }

  // Get funding rates for perpetual contracts
  static async getFundingRates() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'metaAndAssetCtxs'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format funding rates from asset contexts
      const [meta, assetCtxs] = data;
      const fundingRates = [];
      
      if (meta && meta.universe && assetCtxs) {
        meta.universe.forEach((asset, index) => {
          const assetCtx = assetCtxs[index];
          if (assetCtx && assetCtx.funding !== undefined) {
            fundingRates.push({
              coin: asset.name,
              fundingRate: assetCtx.funding,
              markPx: assetCtx.markPx,
              openInterest: assetCtx.openInterest
            });
          }
        });
      }
      
      return fundingRates;
    } catch (error) {
      console.error('Error fetching Hyperliquid funding rates:', error);
      throw error;
    }
  }

  // Get 24h statistics for all assets
  static async get24hStats() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'metaAndAssetCtxs'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid 24h stats:', error);
      throw error;
    }
  }

  // Get orderbook for a specific asset
  static async getOrderbook(coin, nSigFigs = 3) {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'l2Book',
          coin,
          nSigFigs
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching orderbook for ${coin}:`, error);
      throw error;
    }
  }

  // Get recent trades for a specific asset
  static async getRecentTrades(coin) {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recentTrades',
          coin
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching recent trades for ${coin}:`, error);
      throw error;
    }
  }

  // Format market data for our components
  static formatMarketData(mids, metaAndAssetCtxs, fundingRates) {
    if (!mids || !metaAndAssetCtxs) return [];

    const formattedData = [];
    const [meta, assetCtxs] = metaAndAssetCtxs;

    if (!meta || !meta.universe || !assetCtxs) return [];

    meta.universe.forEach((asset, index) => {
      const symbol = asset.name;
      const price = parseFloat(mids[symbol]) || 0;
      const assetCtx = assetCtxs[index];
      const fundingRate = fundingRates?.find(rate => rate.coin === symbol);

      if (price > 0 && assetCtx) {
        // Calculate 24h change from prevDayPx
        const prevDayPx = parseFloat(assetCtx.prevDayPx) || price;
        const change24h = prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : 0;

        formattedData.push({
          base: symbol,
          quote: 'USD',
          symbol: `${symbol}/USD`,
          venue: 'hyperliquid',
          price: price,
          change24h: change24h,
          volume24h: parseFloat(assetCtx.dayNtlVlm) || 0,
          high24h: price * 1.02, // Approximate since not provided directly
          low24h: price * 0.98,  // Approximate since not provided directly
          fundingRate: assetCtx.funding ? parseFloat(assetCtx.funding) * 100 : null,
          openInterest: parseFloat(assetCtx.openInterest) || 0,
          maxLeverage: asset.maxLeverage || 1,
          markPx: parseFloat(assetCtx.markPx) || price
        });
      }
    });

    return formattedData;
  }
}

// React hooks for Hyperliquid data
export const useHyperliquidMarkets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchData = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        setError(null);

        // Fetch all required data in parallel
        const [mids, metaAndAssetCtxs, fundingRates] = await Promise.all([
          HyperliquidAPI.getAllMids(),
          HyperliquidAPI.get24hStats(),
          HyperliquidAPI.getFundingRates().catch(() => []) // Don't fail if funding rates unavailable
        ]);

        const formattedData = HyperliquidAPI.formatMarketData(mids, metaAndAssetCtxs, fundingRates);
        setData(formattedData);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Hyperliquid market data:', err);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    // Initial load
    fetchData(true);
    
    // Update every 5 seconds for real-time prices
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, lastUpdate };
};

export const useHyperliquidFunding = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const fundingRates = await HyperliquidAPI.getFundingRates();

        // Format funding data with proper structure
        const formattedFunding = fundingRates.map(rate => {
          const fundingRatePercent = parseFloat(rate.fundingRate) * 100; // Convert to percentage
          const annualizedRate = fundingRatePercent * 24 * 365; // 8h rate to annual APR
          
          return {
            asset: rate.coin, // Use 'asset' property for consistency
            coin: rate.coin,
            fundingRate: fundingRatePercent,
            annualizedRate: annualizedRate,
            markPrice: parseFloat(rate.markPx) || 0,
            openInterest: parseFloat(rate.openInterest) || 0,
            nextFunding: getNextFundingTime(),
            lastUpdate: new Date()
          };
        });

        setData(formattedFunding);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Hyperliquid funding rates:', err);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to calculate next funding time (every 8 hours)
    const getNextFundingTime = () => {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const fundingHours = [0, 8, 16]; // UTC funding times
      
      let nextFundingHour = fundingHours.find(hour => hour > currentHour);
      if (!nextFundingHour) {
        nextFundingHour = fundingHours[0] + 24; // Next day
      }
      
      const hoursUntilFunding = nextFundingHour - currentHour;
      const minutesUntilFunding = 60 - now.getUTCMinutes();
      
      if (hoursUntilFunding === 1 && minutesUntilFunding < 60) {
        return `${minutesUntilFunding}m`;
      } else {
        return `${hoursUntilFunding}h ${minutesUntilFunding}m`;
      }
    };

    fetchData();
    
    // Update every 30 seconds for funding rates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};

export const useHyperliquidOrderbook = (coin) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const orderbook = await HyperliquidAPI.getOrderbook(coin);
        setData(orderbook);
      } catch (err) {
        setError(err.message);
        console.error(`Error fetching orderbook for ${coin}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every 10 seconds for orderbook
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [coin]);

  return { data, loading, error };
};
