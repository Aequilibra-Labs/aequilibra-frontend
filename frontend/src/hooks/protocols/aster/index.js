'use client';

import { useState, useEffect, useCallback } from 'react';
import { asterDataService } from '@/lib/protocols/aster';

/**
 * Hook for fetching Aster Finance market data with auto-refresh
 * @param {string} symbol - Trading symbol
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAsterMarketData = (symbol, refreshInterval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setError(null);
      const marketData = await asterDataService.marketData(symbol);
      setData(marketData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

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
    refetch: fetchData
  };
};

/**
 * Hook for fetching Aster Finance spread data
 * @param {string} symbol - Trading symbol
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { spreadData, orderBookData, loading, error, refetch }
 */
export const useAsterSpread = (symbol, refreshInterval = 10000) => {
  const [spreadData, setSpreadData] = useState(null);
  const [orderBookData, setOrderBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setError(null);
      const [spread, orderBook] = await Promise.all([
        asterDataService.spread(symbol),
        asterDataService.orderBook(symbol, 10)
      ]);
      
      setSpreadData(spread);
      setOrderBookData(orderBook);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    spreadData,
    orderBookData,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for fetching available Aster Finance markets
 * @returns {Object} { markets, loading, error, refetch }
 */
export const useAsterMarkets = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setError(null);
      const marketList = await asterDataService.getAllMarkets();
      setMarkets(marketList);
    } catch (err) {
  setError(err.message);
  // No fallback/mocked markets — keep the list empty on error
  setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    loading,
    error,
    refetch: fetchMarkets
  };
};

/**
 * Hook for fetching specific metric for multiple symbols
 * @param {string[]} symbols - Array of symbols
 * @param {string} metric - Metric to fetch ('price', 'volume', 'openInterest', etc.)
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAsterBatchData = (symbols, metric = 'price', refreshInterval = 10000) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!symbols?.length || !metric) return;

    try {
      setError(null);
      const batchData = await asterDataService.batchData(symbols, metric);
      setData(batchData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbols, metric]);

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
    refetch: fetchData
  };
};
