// Extended Exchange API Integration
// Based on: https://api.docs.extended.exchange

import { useState, useEffect } from 'react';

// Base configuration - Using Starknet Mainnet
const EXTENDED_BASE_URL = 'https://api.starknet.extended.exchange/api/v1';

// Rate limiting: 1,000 requests per minute (as per documentation)
let requestCount = 0;
let requestWindow = Date.now();

const enforceRateLimit = () => {
  const now = Date.now();
  if (now - requestWindow > 60000) {
    requestCount = 0;
    requestWindow = now;
  }

  if (requestCount >= 900) {
    // Keep some buffer
    throw new Error(
      'Rate limit exceeded. Please wait before making more requests.'
    );
  }

  requestCount++;
};

// Generic API request function with proper headers
const extendedRequest = async (endpoint, options = {}) => {
  enforceRateLimit();

  const url = `${EXTENDED_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Aequilibra-Frontend/1.0', // Required by Extended API
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `Extended API HTTP Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Check Extended API response format
    if (data.status === 'ERROR') {
      throw new Error(
        `Extended API Error: ${data.error?.message || 'Unknown error'}`
      );
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
    const response = await extendedRequest('/info/markets');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching Extended markets:', error);
    throw error; // Let calling code handle fallback
  }
};

export const getExtendedMarketStats = async (market) => {
  try {
    const response = await extendedRequest(`/info/markets/${market}/stats`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Extended market stats for ${market}:`, error);
    throw error;
  }
};

export const getExtendedFundingRates = async () => {
  try {
    const markets = await getExtendedMarkets();

    // Extract funding rates from market data (they come with market stats)
    const fundingRates = markets.map((market) => ({
      market: market.name,
      fundingRate: market.marketStats?.fundingRate || '0',
      nextFundingTime:
        market.marketStats?.nextFundingRate || Date.now() + 60 * 60 * 1000,
      timestamp: Date.now(),
    }));

    return fundingRates;
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

// React hooks for real-time data with error handling
export const useExtendedMarkets = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        const data = await getExtendedMarkets();
        setMarkets(data);
        setError(null);
      } catch (err) {
        console.error('Extended markets fetch error:', err);
        setError(err.message);
        // Don't set markets to empty array on error, keep previous data
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();

    // Update every 10 seconds (reasonable for market data)
    const interval = setInterval(fetchMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  return { markets, loading, error };
};

export const useExtendedFunding = () => {
  const [funding, setFunding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFunding = async () => {
      try {
        setLoading(true);
        const data = await getExtendedFundingRates();
        setFunding(data);
        setError(null);
      } catch (err) {
        console.error('Extended funding fetch error:', err);
        setError(err.message);
        // Don't set funding to empty array on error, keep previous data
      } finally {
        setLoading(false);
      }
    };

    fetchFunding();

    // Update every 30 seconds (funding rates change less frequently)
    const interval = setInterval(fetchFunding, 30000);
    return () => clearInterval(interval);
  }, []);

  return { funding, loading, error };
};

// Extended API class for more complex operations
export class ExtendedAPI {
  constructor() {
    this.baseURL = EXTENDED_BASE_URL;
  }

  async getMarkets(marketNames = []) {
    const endpoint =
      marketNames.length > 0
        ? `/info/markets?${marketNames
            .map((name) => `market=${name}`)
            .join('&')}`
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

  async getCandles(
    market,
    candleType = 'trades',
    interval = 'PT1H',
    limit = 100,
    endTime = null
  ) {
    const params = new URLSearchParams({
      interval,
      limit: limit.toString(),
    });

    if (endTime) {
      params.append('endTime', endTime.toString());
    }

    return extendedRequest(`/info/candles/${market}/${candleType}?${params}`);
  }

  async getOpenInterestHistory(
    market,
    interval = 'P1H',
    startTime,
    endTime,
    limit = 100
  ) {
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
