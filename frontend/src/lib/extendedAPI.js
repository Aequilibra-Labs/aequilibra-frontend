// Extended Exchange API Integration
// Based on: https://api.docs.extended.exchange
// Uses Next.js API routes as proxy to avoid CORS issues

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Base configuration - Using local API routes as proxy
const EXTENDED_BASE_URL = '/api/extended';

// Generic API request function through Next.js API routes
const extendedRequest = async (endpoint, options = {}) => {
  const url = `${EXTENDED_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Extended API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check Extended API response format
    if (data.status === 'ERROR') {
      throw new Error(`Extended API Error: ${data.error?.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error(`Extended API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Market data functions following Extended API documentation
export const getExtendedMarkets = async () => {
  try {
    const response = await extendedRequest('/markets');
    
    // Data is already transformed by the API route
    return response.data || [];
  } catch (error) {
    console.error('Error fetching Extended markets:', error);
    throw error; // Let calling code handle fallback
  }
};

export const getExtendedMarketStats = async (market) => {
  try {
    // For now, get all markets and filter - Extended doesn't seem to have individual market endpoints
    const markets = await getExtendedMarkets();
    const marketData = markets.find(m => m.name === market);
    return marketData?.marketStats || null;
  } catch (error) {
    console.error(`Error fetching Extended market stats for ${market}:`, error);
    throw error;
  }
};

export const getExtendedFundingRates = async () => {
  try {
    const response = await extendedRequest('/funding');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching Extended funding rates:', error);
    throw error;
  }
};

export const getExtendedFundingHistory = async (market, startTime, endTime) => {
  try {
    const response = await extendedRequest(
      `/info/${market}/funding?startTime=${startTime}&endTime=${endTime}&limit=100`
    );
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching funding history for ${market}:`, error);
    throw error;
  }
};

// React hooks for real-time data with optimized selective re-rendering
export const useExtendedMarkets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Use ref to track if component is mounted and previous data
  const mountedRef = useRef(true);
  
  // Deep comparison function for market data - only update if significant changes
  const hasMarketChanged = useCallback((newMarket, oldMarket) => {
    if (!oldMarket) return true;
    
    // Only check fields that matter for UI updates with appropriate thresholds
    const criticalFields = ['price', 'change24h', 'volume24h', 'fundingRate', 'markPrice'];
    
    return criticalFields.some(field => {
      const newVal = parseFloat(newMarket[field]) || 0;
      const oldVal = parseFloat(oldMarket[field]) || 0;
      
      // Use different thresholds based on field type and magnitude
      let threshold;
      if (field === 'volume24h') {
        threshold = Math.max(oldVal * 0.01, 1000); // 1% or 1000 minimum
      } else if (field === 'price' || field === 'markPrice') {
        threshold = Math.max(oldVal * 0.001, 0.0001); // 0.1% or 0.0001 minimum
      } else {
        threshold = Math.max(Math.abs(oldVal) * 0.005, 0.001); // 0.5% or 0.001 minimum
      }
      
      return Math.abs(newVal - oldVal) > threshold;
    });
  }, []);
  
  // Memoized fetch function to prevent unnecessary re-renders
  const fetchMarkets = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      
      const marketData = await getExtendedMarkets();
      
      // Only update if component is still mounted
      if (!mountedRef.current) return;
      
      // Smart update: only update markets that actually changed
      setData(prevData => {
        const updatedData = [...prevData];
        let hasAnyChange = false;
        
        // Create a set to track which markets we've processed to avoid duplicates
        const processedMarkets = new Set();
        
        marketData.forEach(newMarket => {
          // Use symbol as the unique identifier (e.g., "WLFI/USD") instead of just base
          const uniqueKey = newMarket.symbol || `${newMarket.base}/${newMarket.quote}`;
          
          // Skip if we've already processed this market (prevent duplicates)
          if (processedMarkets.has(uniqueKey)) {
            return;
          }
          processedMarkets.add(uniqueKey);
          
          const existingIndex = prevData.findIndex(p => {
            const prevKey = p.symbol || `${p.base}/${p.quote}`;
            return prevKey === uniqueKey;
          });
          const oldMarket = existingIndex >= 0 ? prevData[existingIndex] : null;
          
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
        const currentKeys = new Set(marketData.map(m => m.symbol || `${m.base}/${m.quote}`));
        const filteredData = updatedData.filter(market => {
          const marketKey = market.symbol || `${market.base}/${market.quote}`;
          const shouldKeep = currentKeys.has(marketKey);
          if (!shouldKeep) hasAnyChange = true;
          return shouldKeep;
        });
        
        return hasAnyChange ? filteredData : prevData;
      });
      
      setError(null);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Extended markets fetch error:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isInitial && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasMarketChanged]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMarkets(true);
    
    // Adaptive interval: faster updates initially, then slower
    const fastInterval = setInterval(() => fetchMarkets(false), 3000); // 3s for first minute
    
    const slowTimeout = setTimeout(() => {
      clearInterval(fastInterval);
      const slowInterval = setInterval(() => fetchMarkets(false), 15000); // 15s afterwards
      
      return () => clearInterval(slowInterval);
    }, 60000); // Switch to slow updates after 1 minute
    
    return () => {
      mountedRef.current = false;
      clearInterval(fastInterval);
      clearTimeout(slowTimeout);
    };
  }, [fetchMarkets]);

  // Memoize the return object to prevent unnecessary re-renders of consuming components
  return useMemo(() => ({ 
    data, 
    loading, 
    error, 
    lastUpdate 
  }), [data, loading, error, lastUpdate]);
};

export const useExtendedFunding = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Use ref to track if component is mounted
  const mountedRef = useRef(true);
  
  // Deep comparison function for funding rate data
  const hasFundingChanged = useCallback((newFunding, oldFunding) => {
    if (!oldFunding) return true;
    
    // Check critical funding fields
    const criticalFields = ['fundingRate', 'nextFundingTime', 'openInterest'];
    
    return criticalFields.some(field => {
      if (field === 'nextFundingTime') {
        return newFunding[field] !== oldFunding[field];
      }
      
      const newVal = parseFloat(newFunding[field]) || 0;
      const oldVal = parseFloat(oldFunding[field]) || 0;
      
      // Use smaller threshold for funding rates since they're typically small numbers
      const threshold = field === 'fundingRate' 
        ? Math.max(Math.abs(oldVal) * 0.001, 0.0001) // 0.1% or 0.0001 minimum
        : Math.max(oldVal * 0.01, 1000); // 1% for other fields
      
      return Math.abs(newVal - oldVal) > threshold;
    });
  }, []);
  
  // Memoized fetch function
  const fetchFunding = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      
      const fundingData = await getExtendedFundingRates();
      
      // Only update if component is still mounted
      if (!mountedRef.current) return;
      
      // Smart update: only update funding rates that actually changed
      setData(prevData => {
        const updatedData = [...prevData];
        let hasAnyChange = false;
        
        // Create a set to track which funding rates we've processed
        const processedFunding = new Set();
        
        fundingData.forEach(newFunding => {
          // Use symbol as unique identifier, fallback to coin
          const uniqueKey = newFunding.symbol || newFunding.coin;
          
          // Skip if we've already processed this funding rate
          if (processedFunding.has(uniqueKey)) {
            return;
          }
          processedFunding.add(uniqueKey);
          
          const existingIndex = prevData.findIndex(f => {
            const prevKey = f.symbol || f.coin;
            return prevKey === uniqueKey;
          });
          const oldFunding = existingIndex >= 0 ? prevData[existingIndex] : null;
          
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
        const currentKeys = new Set(fundingData.map(f => f.symbol || f.coin));
        const filteredData = updatedData.filter(funding => {
          const fundingKey = funding.symbol || funding.coin;
          const shouldKeep = currentKeys.has(fundingKey);
          if (!shouldKeep) hasAnyChange = true;
          return shouldKeep;
        });
        
        return hasAnyChange ? filteredData : prevData;
      });
      
      setError(null);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Extended funding fetch error:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isInitial && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasFundingChanged]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFunding(true);
    
    // Funding rates update less frequently, so use longer intervals
    const interval = setInterval(() => fetchFunding(false), 30000); // 30 seconds
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchFunding]);

  // Memoize the return object
  return useMemo(() => ({ 
    data, 
    loading, 
    error, 
    lastUpdate 
  }), [data, loading, error, lastUpdate]);
};

// Extended API class for more complex operations
export class ExtendedAPI {
  constructor() {
    this.baseURL = EXTENDED_BASE_URL;
  }

  async getMarkets(marketNames = []) {
    const endpoint = marketNames.length > 0 
      ? `/info/markets?${marketNames.map(name => `market=${name}`).join('&')}`
      : '/info/markets';
    
    return extendedRequest(endpoint);
  }

  async getMarketStats(market) {
    return extendedRequest(`/info/markets/${market}/stats`);
  }

  async getOrderBook(market) {
    return extendedRequest(`/info/markets/${market}/orderbook`);
  }

  async getRecentTrades(market) {
    return extendedRequest(`/info/markets/${market}/trades`);
  }

  async getFundingHistory(market, startTime, endTime, limit = 100) {
    const params = new URLSearchParams({
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      limit: limit.toString(),
    });
    
    return extendedRequest(`/info/${market}/funding?${params}`);
  }

  async getCandles(market, candleType = 'trades', interval = 'PT1H', limit = 100, endTime = null) {
    const params = new URLSearchParams({
      interval,
      limit: limit.toString(),
    });
    
    if (endTime) {
      params.append('endTime', endTime.toString());
    }
    
    return extendedRequest(`/info/candles/${market}/${candleType}?${params}`);
  }

  async getOpenInterestHistory(market, interval = 'P1H', startTime, endTime, limit = 100) {
    const params = new URLSearchParams({
      interval,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      limit: limit.toString(),
    });
    
    return extendedRequest(`/info/${market}/open-interests?${params}`);
  }
}

export default ExtendedAPI;
