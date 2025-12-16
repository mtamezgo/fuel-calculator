import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoricalData {
  date: number;
  price: number;
}

interface FuelPrice {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  currency: string;
  symbol: string;
  historical: HistoricalData[];
}

interface FuelPricesData {
  rbob: FuelPrice;
  heatingOil: FuelPrice;
  usdMxn: FuelPrice;
}

function FuelPriceCard({
  data,
  title,
  expanded,
  onToggle,
  isExchangeRate = false
}: {
  data: FuelPrice;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  isExchangeRate?: boolean;
}) {
  const isPositive = data.change >= 0;

  const formatPrice = (price: number) => {
    if (isExchangeRate) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    if (isNaN(percent)) return '+0.00%';
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(percent / 100);
  };

  // Format chart data
  const chartData = data.historical.map(item => ({
    date: new Date(item.date * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: item.price,
  }));

  // Calculate stats for the expanded view
  const getStats = () => {
    if (data.historical.length === 0) return null;

    const prices = data.historical.map(item => item.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { high, low, avg };
  };

  const stats = getStats();

  return (
    <div className="flex-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between hover:bg-[#fafafa] p-2 rounded transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Price Info */}
          <div className="text-left">
            <div className="text-xs text-[#8e8e8e] uppercase tracking-wide">{title}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-xl font-bold text-[#262626]">
                {formatPrice(data.price)}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{formatPercent(data.changePercent)}</span>
              </div>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-[#8e8e8e]" /> : <ChevronDown className="h-4 w-4 text-[#8e8e8e]" />}
      </button>

      {/* Expanded Chart */}
      {expanded && stats && (
        <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Chart */}
          <div className="flex-1 h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#8e8e8e' }}
                  stroke="#dbdbdb"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#8e8e8e' }}
                  stroke="#dbdbdb"
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => isExchangeRate ? value.toFixed(2) : `$${value.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [isExchangeRate ? value.toFixed(4) : `$${value.toFixed(4)}`, 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#16a34a' : '#dc2626'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-[#8e8e8e] text-center mt-2">
              30-day price history
            </div>
          </div>

          {/* Key Info Panel */}
          <div className="w-full sm:w-[200px] space-y-4">
            <div className="hidden sm:block">
              <div className="text-xs text-[#8e8e8e] uppercase tracking-wide mb-2">Current Price</div>
              <div className="text-2xl font-bold text-[#262626]">
                {formatPrice(data.price)}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{formatPercent(data.changePercent)}</span>
              </div>
            </div>

            <div className="border-t border-[#dbdbdb] pt-4 grid grid-cols-3 sm:grid-cols-1 gap-3 sm:space-y-3 sm:gap-0">
              <div>
                <div className="text-xs text-[#8e8e8e] uppercase tracking-wide">30-Day High</div>
                <div className="text-base sm:text-lg font-semibold text-[#262626]">
                  {formatPrice(stats.high)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8e8e8e] uppercase tracking-wide">30-Day Low</div>
                <div className="text-base sm:text-lg font-semibold text-[#262626]">
                  {formatPrice(stats.low)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8e8e8e] uppercase tracking-wide">30-Day Avg</div>
                <div className="text-base sm:text-lg font-semibold text-[#262626]">
                  {formatPrice(stats.avg)}
                </div>
              </div>
            </div>

            <div className="border-t border-[#dbdbdb] pt-4 hidden sm:block">
              <div className="text-xs text-[#8e8e8e] uppercase tracking-wide">Symbol</div>
              <div className="text-sm font-medium text-[#262626] mt-1">
                {data.symbol}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GasPriceWidget() {
  const [priceData, setPriceData] = useState<FuelPricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRbob, setExpandedRbob] = useState(false);
  const [expandedHeatingOil, setExpandedHeatingOil] = useState(false);
  const [expandedUsdMxn, setExpandedUsdMxn] = useState(false);

  const fetchPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/gas-prices');

      if (!response.ok) {
        throw new Error('Failed to fetch fuel prices');
      }

      const data = await response.json();
      setPriceData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load fuel prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !priceData) {
    return (
      <Card className="border border-[#dbdbdb]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-[#8e8e8e]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading fuel prices...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-[#dbdbdb]">
        <CardContent className="p-4">
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!priceData) return null;

  const anyExpanded = expandedRbob || expandedHeatingOil || expandedUsdMxn;

  return (
    <Card className="border border-[#dbdbdb]">
      <CardContent className="p-4">
        <div className="space-y-4">
          {anyExpanded ? (
            // Show only the expanded card
            <div>
              {expandedRbob && (
                <FuelPriceCard
                  data={priceData.rbob}
                  title="RBOB Gasoline"
                  expanded={expandedRbob}
                  onToggle={() => setExpandedRbob(!expandedRbob)}
                />
              )}
              {expandedHeatingOil && (
                <FuelPriceCard
                  data={priceData.heatingOil}
                  title="Heating Oil"
                  expanded={expandedHeatingOil}
                  onToggle={() => setExpandedHeatingOil(!expandedHeatingOil)}
                />
              )}
              {expandedUsdMxn && (
                <FuelPriceCard
                  data={priceData.usdMxn}
                  title="USD/MXN"
                  expanded={expandedUsdMxn}
                  onToggle={() => setExpandedUsdMxn(!expandedUsdMxn)}
                  isExchangeRate={true}
                />
              )}
            </div>
          ) : (
            // Show all cards collapsed - stacked on mobile, side by side on desktop
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <FuelPriceCard
                data={priceData.rbob}
                title="RBOB Gasoline"
                expanded={expandedRbob}
                onToggle={() => setExpandedRbob(!expandedRbob)}
              />
              <div className="hidden sm:block h-12 w-px bg-[#dbdbdb]" />
              <div className="sm:hidden w-full h-px bg-[#dbdbdb]" />
              <FuelPriceCard
                data={priceData.heatingOil}
                title="Heating Oil"
                expanded={expandedHeatingOil}
                onToggle={() => setExpandedHeatingOil(!expandedHeatingOil)}
              />
              <div className="hidden sm:block h-12 w-px bg-[#dbdbdb]" />
              <div className="sm:hidden w-full h-px bg-[#dbdbdb]" />
              <FuelPriceCard
                data={priceData.usdMxn}
                title="USD/MXN"
                expanded={expandedUsdMxn}
                onToggle={() => setExpandedUsdMxn(!expandedUsdMxn)}
                isExchangeRate={true}
              />
              <button
                onClick={fetchPrice}
                className="text-[#8e8e8e] hover:text-[#262626] transition-colors flex-shrink-0 sm:mt-2 self-center sm:self-auto"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
