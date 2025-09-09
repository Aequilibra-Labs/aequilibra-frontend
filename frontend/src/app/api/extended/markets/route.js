// Next.js API Route - Extended Exchange Markets Proxy
// This route acts as a proxy to avoid CORS issues

export async function GET() {
  try {
    const response = await fetch(
      'https://api.starknet.extended.exchange/api/v1/info/markets',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Aequilibra-Frontend/1.0',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Extended API HTTP Error: ${response.status} ${response.statusText}`
      );
    }

    const extendedData = await response.json();

    // Transform the data on the server side to avoid client-side issues
    const transformedData =
      extendedData.data
        ?.filter(
          (market) => market.active && market.visibleOnUi && market.marketStats
        )
        ?.map((market) => {
          const stats = market.marketStats;

          return {
            symbol: market.name,
            base: market.assetName,
            quote: market.collateralAssetName,
            price: parseFloat(stats.lastPrice) || 0,
            change24h: parseFloat(stats.dailyPriceChangePercentage) * 100 || 0,
            priceChange24h: parseFloat(stats.dailyPriceChange) || 0,
            volume24h: parseFloat(stats.dailyVolume) || 0,
            volumeBase24h: parseFloat(stats.dailyVolumeBase) || 0,
            high24h: parseFloat(stats.dailyHigh) || 0,
            low24h: parseFloat(stats.dailyLow) || 0,
            bid: parseFloat(stats.bidPrice) || 0,
            ask: parseFloat(stats.askPrice) || 0,
            markPrice: parseFloat(stats.markPrice) || 0,
            indexPrice: parseFloat(stats.indexPrice) || 0,
            fundingRate: parseFloat(stats.fundingRate) * 100 || 0,
            nextFundingTime:
              stats.nextFundingRate || Date.now() + 60 * 60 * 1000,
            openInterest: parseFloat(stats.openInterest) || 0,
            openInterestBase: parseFloat(stats.openInterestBase) || 0,
            maxLeverage: parseFloat(market.tradingConfig?.maxLeverage) || 1,
            category: market.category || 'Unknown',
            active: market.active,
            status: market.status,
          };
        }) || [];

    // Return successful response with CORS headers
    return Response.json(
      {
        status: 'OK',
        data: transformedData,
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
    console.error('Extended markets API error:', error);

    // Return error response
    return Response.json(
      {
        status: 'ERROR',
        error: { message: error.message },
        data: [],
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
