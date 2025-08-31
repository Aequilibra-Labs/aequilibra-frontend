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
  
  if (requestCount >= 900) { // Keep some buffer
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
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
    const fundingRates = markets.map(market => ({
      market: market.name,
      fundingRate: market.marketStats?.fundingRate || '0',
      nextFundingTime: market.marketStats?.nextFundingRate || Date.now() + (60 * 60 * 1000),
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
import { useState, useEffect } from 'react';

const EXTENDED_API_BASE = 'https://api.extended.exchange/api/v1';

// Mock data for development/fallback
const MOCK_MARKETS_DATA = [
  {
    symbol: 'BTCUSD',
    base: 'BTC',
    quote: 'USD',
    price: 64250.75,
    volume24h: 1250000000,
    change24h: 2.45,
    fundingRate: 0.0085,
    maxLeverage: 20,
    openInterest: 850000000,
    predictedFundingRate: 0.0092,
    dailyFundingRate: 0.0255
  },
  {
    symbol: 'ETHUSD',
    base: 'ETH',
    quote: 'USD',
    price: 2748.30,
    volume24h: 680000000,
    change24h: 1.85,
    fundingRate: 0.0045,
    maxLeverage: 20,
    openInterest: 420000000,
    predictedFundingRate: 0.0052,
    dailyFundingRate: 0.0135
  },
  {
    symbol: 'SOLUSD',
    base: 'SOL',
    quote: 'USD',
    price: 145.82,
    volume24h: 320000000,
    change24h: -0.65,
    fundingRate: -0.0025,
    maxLeverage: 15,
    openInterest: 180000000,
    predictedFundingRate: -0.0018,
    dailyFundingRate: -0.0075
  },
  {
    symbol: 'ADAUSD',
    base: 'ADA',
    quote: 'USD',
    price: 0.3485,
    volume24h: 125000000,
    change24h: 3.25,
    fundingRate: 0.0115,
    maxLeverage: 10,
    openInterest: 95000000,
    predictedFundingRate: 0.0125,
    dailyFundingRate: 0.0345
  },
  {
    symbol: 'AVAXUSD',
    base: 'AVAX',
    quote: 'USD',
    price: 28.45,
    volume24h: 85000000,
    change24h: 1.15,
    fundingRate: 0.0055,
    maxLeverage: 15,
    openInterest: 65000000,
    predictedFundingRate: 0.0062,
    dailyFundingRate: 0.0165
  }
];

export class ExtendedAPI {
  // Get all trading pairs with market data
  static async getAllMarkets() {
    try {
      // Try the real API first
      const response = await fetch(`${EXTENDED_API_BASE}/info/markets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Extended Exchange API unavailable, using mock data:', error.message);
      // Return mock data as fallback
      return MOCK_MARKETS_DATA;
    }
  }

  // Get market statistics for a specific market
  static async getMarketStats(marketName) {
    try {
      const response = await fetch(`${EXTENDED_API_BASE}/info/markets/${marketName}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Extended Exchange API unavailable for ${marketName} stats, using mock data:`, error.message);
      // Return mock data for the specific market
      const mockMarket = MOCK_MARKETS_DATA.find(m => m.base.toLowerCase() === marketName.toLowerCase());
      return mockMarket || MOCK_MARKETS_DATA[0];
    }
  }

  // Get funding rates history for a specific market
  static async getFundingRatesHistory(marketName, startTime, endTime) {
    try {
      const response = await fetch(`${EXTENDED_API_BASE}/info/${marketName}/funding?startTime=${startTime}&endTime=${endTime}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Extended Exchange API unavailable for ${marketName} funding history, using mock data:`, error.message);
      // Return mock funding history
      const mockMarket = MOCK_MARKETS_DATA.find(m => m.base.toLowerCase() === marketName.toLowerCase());
      return {
        data: mockMarket ? [mockMarket] : [],
        success: true
      };
    }
  }

  // Get current funding rates for all markets
  static async getCurrentFundingRates() {
    try {
      const markets = await this.getAllMarkets();
      // If getAllMarkets returns mock data, it will be in the correct format already
      return Array.isArray(markets) ? markets : markets.data || MOCK_MARKETS_DATA;
    } catch (error) {
      console.warn('Extended Exchange API unavailable for funding rates, using mock data:', error.message);
      return MOCK_MARKETS_DATA;
    }
  }

  // Format market data for consistent structure
  static formatMarketData(marketsResponse) {
    // If it's already mock data, return as is
    if (Array.isArray(marketsResponse)) {
      return marketsResponse;
    }

    if (!marketsResponse || !marketsResponse.data) {
      return MOCK_MARKETS_DATA;
    }

    const formattedData = [];

    marketsResponse.data.forEach(market => {
      if (market.active && market.market_stats) {
        const stats = market.market_stats;
        
        formattedData.push({
          symbol: market.name,
          base: market.asset_name,
          quote: market.collateral_asset_name,
          price: parseFloat(stats.last_price) || 0,
          change24h: parseFloat(stats.daily_price_change) || 0,
          volume24h: parseFloat(stats.daily_volume) || 0,
          high24h: parseFloat(stats.daily_high) || 0,
          low24h: parseFloat(stats.daily_low) || 0,
          fundingRate: stats.funding_rate ? parseFloat(stats.funding_rate) * 100 : null,
          openInterest: parseFloat(stats.open_interest) || 0,
          maxLeverage: parseFloat(market.trading_config?.max_leverage) || 1,
          markPx: parseFloat(stats.mark_price) || 0,
        });
      }
    });

    return formattedData.length > 0 ? formattedData : MOCK_MARKETS_DATA;
  }

  // Format funding data for consistent structure
  static formatFundingData(marketsResponse) {
    // If it's already mock data, return formatted for funding
    if (Array.isArray(marketsResponse)) {
      return marketsResponse.map(market => ({
        ...market,
        coin: market.base,
        funding: market.fundingRate,
        predictedFunding: market.predictedFundingRate,
        dailyFunding: market.dailyFundingRate
      }));
    }

    if (!marketsResponse || !marketsResponse.data) {
      return MOCK_MARKETS_DATA.map(market => ({
        ...market,
        coin: market.base,
        funding: market.fundingRate,
        predictedFunding: market.predictedFundingRate,
        dailyFunding: market.dailyFundingRate
      }));
    }

    const formattedData = [];

    marketsResponse.data.forEach(market => {
      if (market.active && market.market_stats) {
        const stats = market.market_stats;
        
        formattedData.push({
          symbol: market.name,
          base: market.asset_name,
          coin: market.asset_name,
          fundingRate: stats.funding_rate ? parseFloat(stats.funding_rate) * 100 : 0,
          funding: stats.funding_rate ? parseFloat(stats.funding_rate) * 100 : 0,
          predictedFundingRate: stats.predicted_funding_rate ? parseFloat(stats.predicted_funding_rate) * 100 : 0,
          predictedFunding: stats.predicted_funding_rate ? parseFloat(stats.predicted_funding_rate) * 100 : 0,
          dailyFundingRate: stats.funding_rate ? parseFloat(stats.funding_rate) * 100 * 3 * 365 : 0,
          dailyFunding: stats.funding_rate ? parseFloat(stats.funding_rate) * 100 * 3 * 365 : 0,
          openInterest: parseFloat(stats.open_interest) || 0,
          price: parseFloat(stats.last_price) || 0,
          maxLeverage: parseFloat(market.trading_config?.max_leverage) || 1
        });
      }
    });

    return formattedData.length > 0 ? formattedData : MOCK_MARKETS_DATA.map(market => ({
      ...market,
      coin: market.base,
      funding: market.fundingRate,
      predictedFunding: market.predictedFundingRate,
      dailyFunding: market.dailyFundingRate
    }));
  }

  // Get next funding time (Extended Exchange typically uses 8-hour intervals)
  static getNextFundingTime() {
    const now = new Date();
    const hours = now.getUTCHours();
    const nextFundingHour = Math.ceil((hours + 1) / 8) * 8; // Next 8-hour interval
    const nextFunding = new Date(now);
    nextFunding.setUTCHours(nextFundingHour, 0, 0, 0);
    
    if (nextFunding <= now) {
      nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
    }
    
    const timeDiff = nextFunding - now;
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
  }
}

// React hook for Extended Exchange markets data
export const useExtendedMarkets = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const marketsData = await ExtendedAPI.getAllMarkets();
        const formattedData = ExtendedAPI.formatMarketData(marketsData);
        setData(formattedData);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Extended markets fetch error:', err);
        setError(err.message);
        // Set mock data on error
        setData(MOCK_MARKETS_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, lastUpdate };
};

// React hook for Extended Exchange funding data
export const useExtendedFunding = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fundingData = await ExtendedAPI.getCurrentFundingRates();
        const formattedData = ExtendedAPI.formatFundingData(fundingData);
        setData(formattedData);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Extended funding fetch error:', err);
        setError(err.message);
        // Set mock data on error
        const mockFundingData = MOCK_MARKETS_DATA.map(market => ({
          ...market,
          coin: market.base,
          funding: market.fundingRate,
          predictedFunding: market.predictedFundingRate,
          dailyFunding: market.dailyFundingRate
        }));
        setData(mockFundingData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, lastUpdate };
};
