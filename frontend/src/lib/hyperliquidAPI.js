// Hyperliquid API integration for real trading data
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
          type: 'allMids',
        }),
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
          type: 'meta',
        }),
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
          type: 'metaAndAssetCtxs',
        }),
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
              openInterest: assetCtx.openInterest,
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
          type: 'metaAndAssetCtxs',
        }),
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
          nSigFigs,
        }),
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
          coin,
        }),
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
      const fundingRate = fundingRates?.find((rate) => rate.coin === symbol);

      if (price > 0 && assetCtx) {
        // Calculate 24h change from prevDayPx
        const prevDayPx = parseFloat(assetCtx.prevDayPx) || price;
        const change24h =
          prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : 0;

        formattedData.push({
          base: symbol,
          coin: symbol, // Add coin field for consistency
          quote: 'USD',
          symbol: `${symbol}/USD`,
          venue: 'hyperliquid',
          price: price,
          change24h: change24h,
          volume24h: parseFloat(assetCtx.dayNtlVlm) || 0,
          high24h: price * 1.02, // Approximate since not provided directly
          low24h: price * 0.98, // Approximate since not provided directly
          fundingRate: assetCtx.funding
            ? parseFloat(assetCtx.funding) * 100
            : null,
          openInterest: parseFloat(assetCtx.openInterest) || 0,
          maxLeverage: asset.maxLeverage || 1,
          markPx: parseFloat(assetCtx.markPx) || price,
        });
      }
    });

    return formattedData;
  }
}

// React hooks for Hyperliquid data with optimized selective re-rendering
export const useHyperliquidMarkets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Use ref to track if component is mounted
  const mountedRef = useRef(true);

  // Deep comparison function for market data - only update if significant changes
  const hasMarketChanged = useCallback((newMarket, oldMarket) => {
    if (!oldMarket) return true;

    // Only check fields that matter for UI updates with appropriate thresholds
    const criticalFields = [
      'markPrice',
      'change24h',
      'volume24h',
      'fundingRate',
      'midPrice',
    ];

    return criticalFields.some((field) => {
      const newVal = parseFloat(newMarket[field]) || 0;
      const oldVal = parseFloat(oldMarket[field]) || 0;

      // Use different thresholds based on field type and magnitude
      let threshold;
      if (field === 'volume24h') {
        threshold = Math.max(oldVal * 0.01, 1000); // 1% or 1000 minimum
      } else if (field === 'markPrice' || field === 'midPrice') {
        threshold = Math.max(oldVal * 0.001, 0.0001); // 0.1% or 0.0001 minimum
      } else {
        threshold = Math.max(Math.abs(oldVal) * 0.005, 0.001); // 0.5% or 0.001 minimum
      }

      return Math.abs(newVal - oldVal) > threshold;
    });
  }, []);

  const fetchData = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad && mountedRef.current) {
          setLoading(true);
        }
        setError(null);

        // Fetch all required data in parallel
        const [mids, metaAndAssetCtxs, fundingRates] = await Promise.all([
          HyperliquidAPI.getAllMids(),
          HyperliquidAPI.get24hStats(),
          HyperliquidAPI.getFundingRates().catch(() => []), // Don't fail if funding rates unavailable
        ]);

        if (!mountedRef.current) return;

        const formattedData = HyperliquidAPI.formatMarketData(
          mids,
          metaAndAssetCtxs,
          fundingRates
        );

        // Smart update: only update markets that actually changed
        setData((prevData) => {
          const updatedData = [...prevData];
          let hasAnyChange = false;

          // Create a set to track which markets we've processed to avoid duplicates
          const processedMarkets = new Set();

          formattedData.forEach((newMarket) => {
            // Use symbol as the unique identifier for Hyperliquid (e.g. "WLFI/USD")
            const uniqueKey = newMarket.symbol;

            // Skip if we've already processed this market (prevent duplicates)
            if (processedMarkets.has(uniqueKey)) {
              return;
            }
            processedMarkets.add(uniqueKey);

            const existingIndex = prevData.findIndex(
              (p) => p.symbol === uniqueKey
            );
            const oldMarket =
              existingIndex >= 0 ? prevData[existingIndex] : null;

            if (hasMarketChanged(newMarket, oldMarket)) {
              if (existingIndex >= 0) {
                updatedData[existingIndex] = newMarket;
              } else {
                updatedData.push(newMarket);
              }
              hasAnyChange = true;
            }
          });

          // Remove markets that are no longer present
          const currentSymbols = new Set(formattedData.map((m) => m.symbol));
          const filteredData = updatedData.filter((market) => {
            const shouldKeep = currentSymbols.has(market.symbol);
            if (!shouldKeep) hasAnyChange = true;
            return shouldKeep;
          });

          return hasAnyChange ? filteredData : prevData;
        });

        setLastUpdate(new Date());
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Hyperliquid market data:', err);
      } finally {
        if (isInitialLoad && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [hasMarketChanged]
  );

  useEffect(() => {
    mountedRef.current = true;

    // Initial load
    fetchData(true);

    // Adaptive intervals: fast initially, then slower
    const fastInterval = setInterval(() => fetchData(false), 2000); // 2s for first minute

    const slowTimeout = setTimeout(() => {
      clearInterval(fastInterval);
      const slowInterval = setInterval(() => fetchData(false), 10000); // 10s afterwards

      return () => clearInterval(slowInterval);
    }, 60000); // Switch to slow updates after 1 minute

    return () => {
      mountedRef.current = false;
      clearInterval(fastInterval);
      clearTimeout(slowTimeout);
    };
  }, [fetchData]);

  // Memoize the return object to prevent unnecessary re-renders of consuming components
  return useMemo(
    () => ({
      data,
      loading,
      error,
      lastUpdate,
    }),
    [data, loading, error, lastUpdate]
  );
};

export const useHyperliquidFunding = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to track if component is mounted
  const mountedRef = useRef(true);

  // Deep comparison function for funding rate data
  const hasFundingChanged = useCallback((newFunding, oldFunding) => {
    if (!oldFunding) return true;

    // Check critical funding fields
    const criticalFields = [
      'fundingRate',
      'annualizedRate',
      'markPrice',
      'openInterest',
    ];

    return criticalFields.some((field) => {
      const newVal = parseFloat(newFunding[field]) || 0;
      const oldVal = parseFloat(oldFunding[field]) || 0;

      // Use smaller threshold for funding rates since they're typically small numbers
      let threshold;
      if (field === 'fundingRate' || field === 'annualizedRate') {
        threshold = Math.max(Math.abs(oldVal) * 0.001, 0.0001); // 0.1% or 0.0001 minimum
      } else {
        threshold = Math.max(oldVal * 0.01, 1000); // 1% for other fields
      }

      return Math.abs(newVal - oldVal) > threshold;
    });
  }, []);

  const fetchData = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial && mountedRef.current) {
          setLoading(true);
        }
        setError(null);

        const fundingRates = await HyperliquidAPI.getFundingRates();

        if (!mountedRef.current) return;

        // Helper function to calculate next funding time (every 8 hours)
        const getNextFundingTime = () => {
          const now = new Date();
          const currentHour = now.getUTCHours();
          const fundingHours = [0, 8, 16]; // UTC funding times

          let nextFundingHour = fundingHours.find((hour) => hour > currentHour);
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

        // Format funding data with proper structure
        const formattedFunding = fundingRates.map((rate) => {
          const fundingRatePercent = parseFloat(rate.fundingRate) * 100; // Convert to percentage
          const annualizedRate = fundingRatePercent * 24 * 365; // 8h rate to annual APR

          return {
            asset: rate.coin, // Use 'asset' property for consistency
            coin: rate.coin,
            fundingRate: fundingRatePercent,
            funding: fundingRatePercent, // Add alias for compatibility with ComparisonFundingTable
            annualizedRate: annualizedRate,
            predictedFunding: fundingRatePercent, // Use current rate as predicted
            markPrice: parseFloat(rate.markPx) || 0,
            price: parseFloat(rate.markPx) || 0, // Add alias for price
            openInterest: parseFloat(rate.openInterest) || 0,
            nextFunding: getNextFundingTime(),
            lastUpdate: new Date(),
          };
        });

        // Smart update: only update funding rates that actually changed
        setData((prevData) => {
          const updatedData = [...prevData];
          let hasAnyChange = false;

          // Create a set to track which funding rates we've processed
          const processedFunding = new Set();

          formattedFunding.forEach((newFunding) => {
            // Use coin as unique identifier
            const uniqueKey = newFunding.coin;

            // Skip if we've already processed this funding rate
            if (processedFunding.has(uniqueKey)) {
              return;
            }
            processedFunding.add(uniqueKey);

            const existingIndex = prevData.findIndex(
              (f) => f.coin === uniqueKey
            );
            const oldFunding =
              existingIndex >= 0 ? prevData[existingIndex] : null;

            if (hasFundingChanged(newFunding, oldFunding)) {
              if (existingIndex >= 0) {
                updatedData[existingIndex] = newFunding;
              } else {
                updatedData.push(newFunding);
              }
              hasAnyChange = true;
            }
          });

          // Remove funding rates that are no longer present
          const currentCoins = new Set(formattedFunding.map((f) => f.coin));
          const filteredData = updatedData.filter((funding) => {
            const shouldKeep = currentCoins.has(funding.coin);
            if (!shouldKeep) hasAnyChange = true;
            return shouldKeep;
          });

          return hasAnyChange ? filteredData : prevData;
        });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Hyperliquid funding rates:', err);
      } finally {
        if (isInitial && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [hasFundingChanged]
  );

  useEffect(() => {
    mountedRef.current = true;

    fetchData(true);

    // Funding rates update less frequently, so use longer intervals
    const interval = setInterval(() => fetchData(false), 30000); // 30 seconds

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // Memoize the return object
  return useMemo(
    () => ({
      data,
      loading,
      error,
    }),
    [data, loading, error]
  );
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
