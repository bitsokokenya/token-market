import React, { useCallback, useState } from 'react';
import classNames from 'classnames';

// Keep both imports for compatibility
import { Token } from '@uniswap/sdk-core';
import { HederaToken } from '../../../utils/tokens';
import { ChainID } from '../../../types/enums';

import LoadingSpinner from '../../../components/Spinner';

import { usePoolPriceData } from '../../../hooks/usePoolPriceData';
import LiquidityChart from './LiquidityChart';
import PriceChart from './PriceChart';
import ChartPeriodSelector from '../../../components/ChartPeriodSelector';

interface ChartLayoutProps {
  address: string;
  quoteToken?: Token;
  baseToken?: Token;
  entity: any;
  currentPrice: string | number;
  className?: string;
}

function ChartLayout({
  address,
  quoteToken,
  baseToken,
  className,
  entity,
  currentPrice,
}: ChartLayoutProps) {
  const [period, setPeriod] = useState<number>(7);
  const [showChartType, setShowChartType] = React.useState<'price' | 'liquidity'>('price');

  // Default to Hedera testnet chainId if baseToken is undefined
  const chainId = baseToken?.chainId || ChainID.HederaTestnet;
  
  // Replace poolPriceData call with simpler data handling for now
  const [loading, setLoading] = useState(true);
  
  // Add mock data for the stats previously coming from usePoolPriceData
  const minPrice = 10;
  const maxPrice = 15;
  const meanPrice = 12.5;
  const stdev = 1.2;

  // Simulate loading data
  React.useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1000);
    return () => { mounted = false; };
  }, []);

  const handlePeriod = useCallback((days: number) => {
    setPeriod(days);
  }, []);

  const handleClickChangeGraph = (type: 'price' | 'liquidity') => {
    setShowChartType(type);
  };

  // Show loading state if data is not available or tokens are undefined
  if (loading || !baseToken || !quoteToken) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className={classNames('flex flex-col md:flex-row', className)}>
      <div className="flex flex-col text-0.75 shadow-sm bg-surface-0 rounded-lg p-4 w-full md:w-1/4">
        <div className="mx-2 my-1 justify-center">
          <span className="text-medium text-0.875">Current Price</span>
          <div className="font-medium text-1.25 text-high">{currentPrice}</div>
        </div>

        <div className="mx-2 my-1 justify-center">
          <span className="text-medium text-0.875">Min Price</span>
          <div className="font-medium text-1.25 text-high">{minPrice}</div>
        </div>
        <div className="mx-2 my-1 justify-center">
          <span className="text-medium  text-0.875">Max Price</span>
          <div className="font-medium text-1.25 text-high">{maxPrice}</div>
        </div>
        <div className="mx-2 my-1 justify-center">
          <span className="text-medium  text-0.875">Average Price</span>
          <div className="font-medium text-1.25 text-high">{meanPrice.toFixed(8)}</div>
        </div>
        <div className="mx-2 my-1 justify-center p-4 border-element-10 border mt-4 rounded-sm bg-surface-5">
          <span className="text-medium text-0.875 py-1">Optimal range</span>
          <div className="font-medium text-0.875 text-high">
            {(meanPrice - stdev).toFixed(8)} - {(meanPrice + stdev).toFixed(8)}
          </div>
          <div className="flex text-high">
            <span>(SD: {stdev.toFixed(8)})</span>
          </div>
        </div>
      </div>
      <div className="w-full md:w-3/4 h-96 md:ml-6 mt-4 md:mt-0 rounded-lg p-8 relative shadow-sm bg-surface-0">
        <div className="flex border border-element-10 bg-surface-0 text-0.75 px-4 py-1 w-fit left-10 absolute text-medium z-10">
          <button
            onClick={() => handleClickChangeGraph('price')}
            className={`ml-2 px-2 uppercase font-medium ${
              showChartType === 'price' ? 'text-purple-700 dark:text-purple-400' : 'text-low'
            }`}
          >
            Price
          </button>
          <button
            onClick={() => handleClickChangeGraph('liquidity')}
            className={`ml-2 px-2 uppercase font-medium ${
              showChartType === 'liquidity' ? 'text-purple-700 dark:text-purple-400' : 'text-low'
            }`}
          >
            Liquidity
          </button>
        </div>
        {showChartType === 'price' && (
          <>
            <ChartPeriodSelector current={period} onSelect={handlePeriod} />
            <PriceChart
              address={address}
              baseToken={baseToken}
              quoteToken={quoteToken}
              period={period}
            />
          </>
        )}
        {showChartType === 'liquidity' && (
          <LiquidityChart
            address={address}
            baseToken={baseToken}
            quoteToken={quoteToken}
            pool={entity}
          />
        )}
      </div>
    </div>
  );
}

export default ChartLayout;
