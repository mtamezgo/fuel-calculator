import type { Route } from "./+types/api.gas-prices";

// Ticker symbols
const RBOB_SYMBOL = "RB=F"; // RBOB Gasoline
const HEATING_OIL_SYMBOL = "HO=F"; // Heating Oil
const USDMXN_SYMBOL = "USDMXN=X"; // USD/MXN Exchange Rate

async function fetchData(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=30d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${symbol} data`);
  }

  const data = await response.json();
  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error(`Invalid response for ${symbol}`);
  }

  const quote = result.meta;
  const timestamps = result.timestamp || [];
  const prices = result.indicators?.quote?.[0]?.close || [];

  // Build historical data array
  const historicalData = timestamps.map((timestamp: number, index: number) => ({
    date: timestamp,
    price: prices[index],
  })).filter((item: any) => item.price !== null);

  return {
    price: quote.regularMarketPrice || 0,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    timestamp: quote.regularMarketTime || Date.now() / 1000,
    currency: quote.currency || 'USD',
    symbol: symbol,
    historical: historicalData,
  };
}

export async function loader({}: Route.LoaderArgs) {
  try {
    // Fetch all data in parallel
    const [rbobData, heatingOilData, usdMxnData] = await Promise.all([
      fetchData(RBOB_SYMBOL),
      fetchData(HEATING_OIL_SYMBOL),
      fetchData(USDMXN_SYMBOL),
    ]);

    return Response.json({
      rbob: rbobData,
      heatingOil: heatingOilData,
      usdMxn: usdMxnData,
    });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return Response.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    );
  }
}
