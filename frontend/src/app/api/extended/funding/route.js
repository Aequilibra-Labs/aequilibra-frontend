// Next.js API Route - Extended Exchange Funding Rates Proxy
// This route acts as a proxy to avoid CORS issues

export async function GET() {
  try {
    // Extended Exchange provides funding rates within the markets data
    const response = await fetch('https://api.starknet.extended.exchange/api/v1/info/markets', {
      method: 'GET',
      headers: {
        'User-Agent': 'Aequilibra-Frontend/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Extended API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const marketsData = await response.json();
    
    // Extract funding rates from market data
    const fundingRates = marketsData.data
      ?.filter(market => market.active && market.marketStats)
      ?.map(market => {
        const stats = market.marketStats;
        const fundingRate = parseFloat(stats.fundingRate) * 100 || 0; // Convert to percentage
        
        return {
          symbol: market.name,
          coin: market.assetName,
          base: market.assetName,
          quote: market.collateralAssetName,
          market: market.name,
          fundingRate: fundingRate,
          predictedFundingRate: fundingRate, // Use current rate as predicted (Extended doesn't provide separate predicted rate)
          dailyFundingRate: fundingRate * 3, // Approximate daily rate (8h rate * 3)
          nextFundingTime: stats.nextFundingRate || Date.now() + (60 * 60 * 1000),
          timestamp: Date.now(),
          price: parseFloat(stats.lastPrice) || 0, // Add price field for the table
          markPrice: parseFloat(stats.markPrice) || 0,
          indexPrice: parseFloat(stats.indexPrice) || 0,
          openInterest: parseFloat(stats.openInterest) || 0,
          maxLeverage: parseFloat(market.tradingConfig?.maxLeverage) || 1,
        };
      }) || [];
    
    // Return successful response with CORS headers
    return Response.json(
      {
        status: 'OK',
        data: fundingRates
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Extended funding rates API error:', error);
    
    // Return error response
    return Response.json(
      { 
        status: 'ERROR', 
        error: { message: error.message },
        data: [] 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
