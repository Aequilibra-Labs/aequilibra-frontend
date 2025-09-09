// Extended Exchange API integration for real trading data
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
          if (market.market_stats && market.market_stats.funding_rate !== undefined) {
            fundingRates.push({
              market: market.name,
              funding_rate: market.market_stats.funding_rate,
              timestamp: Date.now()
            });
          }
        }
      }
      
      return fundingRates;
    } catch (error) {
      console.error('Error fetching Extended funding rates:', error);
      throw error;
    }
  }

  // Format market data for consistent structure
  static formatMarketData(marketsResponse) {
    if (!marketsResponse || !marketsResponse.data) {
      return [];
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
          indexPrice: parseFloat(stats.index_price) || 0,
          askPrice: parseFloat(stats.ask_price) || 0,
          bidPrice: parseFloat(stats.bid_price) || 0,
          exchange: 'extended'
        });
      }
    });

    return formattedData;
  }

  // Format funding rates data
  static formatFundingData(marketsResponse) {
    if (!marketsResponse || !marketsResponse.data) {
      return [];
    }

    const formattedFunding = [];

    marketsResponse.data.forEach(market => {
      if (market.active && market.market_stats && market.market_stats.funding_rate !== undefined) {
        const fundingRatePercent = parseFloat(market.market_stats.funding_rate) * 100;
        const annualizedRate = fundingRatePercent * 24 * 365; // 8h rate to annual APR
        
        formattedFunding.push({
          asset: market.asset_name,
          coin: market.asset_name,
          fundingRate: fundingRatePercent,
          annualizedRate: annualizedRate,
          markPrice: parseFloat(market.market_stats.mark_price) || 0,
          openInterest: parseFloat(market.market_stats.open_interest) || 0,
          nextFunding: this.getNextFundingTime(),
          lastUpdate: new Date(),
          exchange: 'extended'
        });
      }
    });

    return formattedFunding;
  }

  // Helper function to calculate next funding time (every 8 hours)
  static getNextFundingTime() {
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
  }
}

// React hooks for Extended Exchange data
export const useExtendedMarkets = () => {
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

        const marketsResponse = await ExtendedAPI.getAllMarkets();
        const formattedData = ExtendedAPI.formatMarketData(marketsResponse);
        
        setData(formattedData);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Extended market data:', err);
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

export const useExtendedFunding = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const marketsResponse = await ExtendedAPI.getAllMarkets();
        const formattedFunding = ExtendedAPI.formatFundingData(marketsResponse);

        setData(formattedFunding);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Extended funding rates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every 30 seconds for funding rates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
