import React, { useMemo } from 'react';
import { HederaToken, CurrencyAmount } from '../../utils/tokens';
import { HederaPool } from '../../utils/pools';
import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';

interface Props {
  chainId: number | undefined;
  pool: HederaPool;
  inRange: boolean;
  position: {
    liquidity: string;
    tickLower: number;
    tickUpper: number;
  };
  showStats?: boolean;
  showDetails?: boolean;
}

const Position: React.FC<Props> = ({
  chainId,
  pool,
  inRange,
  position,
  showStats = true,
  showDetails = true,
}) => {
  const { convertToGlobalFormatted } = useCurrencyConversions();
  
  const [token0Symbol, token1Symbol] = useMemo(() => {
    if (!pool) return ['', ''];
    return [pool.token0.symbol, pool.token1.symbol];
  }, [pool]);

  const token0Amount = useMemo(() => {
    if (!pool || !position) return '0';
    const [amount0] = pool.getTokenAmountsForLiquidity(
      position.liquidity,
      position.tickLower,
      position.tickUpper
    );
    return amount0.toExact();
  }, [pool, position]);

  const token1Amount = useMemo(() => {
    if (!pool || !position) return '0';
    const [, amount1] = pool.getTokenAmountsForLiquidity(
      position.liquidity,
      position.tickLower,
      position.tickUpper
    );
    return amount1.toExact();
  }, [pool, position]);

  const positionValue = useMemo(() => {
    if (!pool || !position) return '0';
    // Assuming token0PriceUSD = 1 for simplicity; in reality you'd use a price feed
    const value = pool.getPositionValue(
      position.liquidity,
      position.tickLower, 
      position.tickUpper,
      1.0
    );
    // Use the static factory method instead of constructor
    return convertToGlobalFormatted(CurrencyAmount.fromRawAmount(pool.token0, value.toString()));
  }, [pool, position, convertToGlobalFormatted]);

  const minPrice = useMemo(() => {
    if (!position) return '0';
    return HederaPool.tickToPrice(position.tickLower).toFixed(6);
  }, [position]);

  const maxPrice = useMemo(() => {
    if (!position) return '0';
    return HederaPool.tickToPrice(position.tickUpper).toFixed(6);
  }, [position]);

  const currentPrice = useMemo(() => {
    if (!pool) return '0';
    return HederaPool.tickToPrice(pool.tick).toFixed(6);
  }, [pool]);

  return (
    <div className={`relative p-4 border ${inRange ? 'border-green-500' : 'border-red-500'} rounded-md`}>
      <div className="flex justify-between items-center mb-4">
        <div className="font-medium">
          {token0Symbol}/{token1Symbol}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${inRange ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {inRange ? 'In range' : 'Out of range'}
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <div className="text-sm text-gray-500">Liquidity</div>
            <div className="font-medium">{parseFloat(position.liquidity).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Value</div>
            <div className="font-medium">{positionValue}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{token0Symbol}</div>
            <div className="font-medium">{parseFloat(token0Amount).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{token1Symbol}</div>
            <div className="font-medium">{parseFloat(token1Amount).toLocaleString()}</div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-500">Min Price</div>
              <div className="text-sm">{minPrice}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Current Price</div>
              <div className="text-sm font-medium">{currentPrice}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Max Price</div>
              <div className="text-sm">{maxPrice}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Position; 