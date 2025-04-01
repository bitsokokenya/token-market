import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Brush,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

import { HederaToken } from '../../utils/tokens';
import { usePoolPriceData } from '../../hooks/usePoolPriceData';
import { usePoolLiquidityData } from '../../hooks/usePoolLiquidityData';
import Menu from '../Menu/Menu';
import ChartPeriodSelector from '../ChartPeriodSelector';

// Helper function to convert tick to price
const tickToPrice = (tick: number): number => {
  return Math.pow(1.0001, tick);
};

// Constants for tick math
const MIN_TICK = -887272;
const MAX_TICK = 887272;

// Simple pool interface for RangeData
interface SimplePool {
  token0: HederaToken;
  token1: HederaToken;
  fee: number;
  tickSpacing: number;
  tickCurrent: number;
  liquidity: string;
}

interface Props {
  chainId: number | undefined;
  pool: SimplePool;
  tickLower: number;
  tickUpper: number;
  baseToken: HederaToken;
  quoteToken: HederaToken;
}

function RangeData({ chainId, pool, tickLower, tickUpper, quoteToken, baseToken }: Props) {
  const [menuOpened, setMenuOpened] = useState(false);
  const [period, setPeriod] = useState<number>(30);
  const [chart, setChart] = useState(0);

  // Generate a pool address for the API (simplified from Uniswap's implementation)
  const poolAddress = useMemo(() => {
    // Simple hash-like combination of token addresses and fee
    const combinedString = `${quoteToken.address}-${baseToken.address}-${pool.fee}`;
    return combinedString;
  }, [quoteToken, baseToken, pool.fee]);

  const { priceData, minPrice, maxPrice, meanPrice, stdev } = usePoolPriceData(
    chainId || 1,
    poolAddress,
    quoteToken,
    baseToken,
    period,
  );

  const liquidityData = usePoolLiquidityData(
    chainId || 1,
    poolAddress,
    quoteToken,
    baseToken,
    pool,
  );

  const [priceLower, priceUpper] = useMemo(() => {
    if (!tickLower || !tickUpper || !baseToken || !quoteToken) {
      return [0, 0];
    }

    // Convert tick to price using simplified function
    return [tickToPrice(tickLower), tickToPrice(tickUpper)];
  }, [tickLower, tickUpper, baseToken, quoteToken]);

  const domain = useMemo(() => {
    if (!pool) {
      return [0, 0];
    }
    const multiplier = (pool.tickSpacing / 10000) * pool.tickSpacing;
    return [minPrice - minPrice * multiplier, maxPrice + maxPrice * multiplier];
  }, [pool, minPrice, maxPrice]);

  const handleSelect = (item: number) => {
    setMenuOpened(false);
    setChart(item);
  };

  const handlePeriod = (days: number) => {
    setPeriod(days);
  };

  const chartTitles = ['Price', 'Liquidity'];

  return (
    <div className="w-full flex flex-col flex-wrap items-center mt-8 border border-slate-200 dark:border-slate-700 rounded p-2">
      <div className="mb-2">
        <button className="text-lg text-center" onClick={() => setMenuOpened(!menuOpened)}>
          <span>{chartTitles[chart]}</span>
        </button>
        {menuOpened && (
          <Menu onClose={() => setMenuOpened(false)}>
            <button onClick={() => handleSelect(0)}>{chartTitles[0]}</button>
            <button onClick={() => handleSelect(1)}>{chartTitles[1]}</button>
          </Menu>
        )}
      </div>

      {chart === 0 && (
        <div className="w-full flex flex-col">
          <ChartPeriodSelector current={period} onSelect={handlePeriod} />
          <ResponsiveContainer width={'100%'} height={200}>
            <LineChart data={priceData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis dataKey="date" />
              <YAxis width={100} mirror={true} domain={domain} />
              <Tooltip />
              <Legend />
              <ReferenceLine
                y={priceLower}
                stroke="#9a3b38"
                strokeWidth={1}
                ifOverflow="extendDomain"
              />
              <ReferenceLine
                y={priceUpper}
                stroke="#9a3b38"
                strokeWidth={1}
                ifOverflow="extendDomain"
              />
              <Brush dataKey="date" height={30} stroke="#3390d6" />
              <Line type="monotone" dot={false} dataKey="price" stroke="#3390d6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-high">Min</td>
                <td className="text-medium">{minPrice}</td>
              </tr>
              <tr>
                <td className="text-high">Max</td>
                <td className="text-medium">{maxPrice}</td>
              </tr>
              <tr>
                <td className="text-high">Mean</td>
                <td className="text-medium">{meanPrice.toFixed(8)}</td>
              </tr>
              <tr>
                <td className="text-high">Standard deviation</td>
                <td className="text-medium">{stdev.toFixed(8)}</td>
              </tr>
              <tr>
                <td className="text-high">Optimal range</td>
                <td className="text-medium">
                  {(meanPrice - stdev).toFixed(8)} - {(meanPrice + stdev).toFixed(8)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {chart === 1 && (
        <ResponsiveContainer width={'100%'} height={200}>
          <AreaChart data={liquidityData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <XAxis dataKey="price" domain={domain} />
            <YAxis hide={true} />
            <Tooltip />
            <Legend />
            <Brush dataKey="price" height={30} stroke="#3390d6" />
            <Area dataKey="liquidity" fill="#3390d6" fillOpacity={0.9} stroke="#3390d6" />
            <ReferenceLine
              x={priceLower}
              stroke="#9a3b38"
              strokeWidth={2}
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              x={priceUpper}
              stroke="#9a3b38"
              strokeWidth={2}
              ifOverflow="extendDomain"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default RangeData;
