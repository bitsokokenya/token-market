import { useMemo, useEffect, useState } from 'react';
import { CurrencyAmount, Currency, Token } from '@uniswap/sdk-core';
import { Position, Pool, tickToPrice } from '@uniswap/v3-sdk';
import { useFetchPools, Position as FetchPosition, PoolStateV2 } from './fetch';
import { useFetchPositions } from './fetch';
import { HederaToken } from '../utils/tokens';
import { getQuoteAndBaseToken } from '../utils/tokens';
import { BigNumber } from 'ethers';

interface SaucerSwapPosition {
  positionId: number;
  token0: {
    id: string;
  };
  token1: {
    id: string;
  };
  fee: number;
  liquidity: CurrencyAmount<Currency>;
  tickLower: number;
  tickUpper: number;
  poolAddress: string;
}

export function usePoolsForNetwork(
  chainId: number,
  timestamp: number,
  onlyForInjected: boolean,
  addresses?: string[],
  injectedAddress?: string,
) {
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [pools, setPools] = useState<PoolStateV2[]>([]);
  const [poolAddresses, setPoolAddresses] = useState<string[]>([]);
  const [allPositions, setAllPositions] = useState<SaucerSwapPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  // Memoize the addresses array to prevent unnecessary re-renders
  const memoizedAddresses = useMemo(() => {
    if (onlyForInjected && injectedAddress) {
      return [injectedAddress];
    }
    if (addresses && addresses.length > 0) {
      return addresses;
    }
    return ['all'];
  }, [onlyForInjected, injectedAddress, addresses]);

  // Fetch pools with memoized parameters
  const { loading: poolsFetching, poolStates: fetchedPools } = useFetchPools(
    chainId,
    memoizedAddresses,
  );

  // Update pools state only when fetchedPools changes
  useEffect(() => {
    if (fetchedPools) {
      setPools(fetchedPools);
      setPoolsLoading(false);
    }
  }, [fetchedPools]);

  // Fetch positions only when needed
  const { loading: positionsFetching, positions } = useFetchPositions(
    onlyForInjected ? injectedAddress || null : null
  );

  // Update positions when they change
  useEffect(() => {
    if (positions) {
      // Convert Position[] to SaucerSwapPosition[]
      const convertedPositions: SaucerSwapPosition[] = positions.map(pos => {
        const token0 = new Token(
          chainId,
          pos.token0.id,
          parseInt(pos.token0.decimals.toString(), 10),
          pos.token0.symbol,
          pos.token0.name,
        );
        const token1 = new Token(
          chainId,
          pos.token1.id,
          parseInt(pos.token1.decimals.toString(), 10),
          pos.token1.symbol,
          pos.token1.name,
        );

        return {
          positionId: pos.positionId,
          token0: { id: pos.token0.id },
          token1: { id: pos.token1.id },
          fee: pos.fee,
          liquidity: CurrencyAmount.fromRawAmount(token0, pos.liquidity.toString()),
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
          poolAddress: `${pos.token0.id}-${pos.token1.id}-${pos.fee}`,
        };
      });
      setAllPositions(convertedPositions);
      setPositionsLoading(false);
    }
  }, [positions, chainId]);

  // Memoize the pool addresses calculation
  const memoizedPoolAddresses = useMemo(() => {
    if (!allPositions.length) return [];
    return Array.from(new Set(allPositions.map((p) => p.poolAddress)));
  }, [allPositions]);

  // Update pool addresses only when memoizedPoolAddresses changes
  useEffect(() => {
    setPoolAddresses(memoizedPoolAddresses);
  }, [memoizedPoolAddresses]);

  // Memoize the final pools array
  const finalPools = useMemo(() => {
    if (!pools.length) return [];

    return pools.map((pool) => {
      const token0 = new HederaToken(
        chainId,
        pool.token0.address,
        parseInt(pool.token0.decimals, 10),
        pool.token0.symbol,
        pool.token0.name,
      );
      const token1 = new HederaToken(
        chainId,
        pool.token1.address,
        parseInt(pool.token1.decimals, 10),
        pool.token1.symbol,
        pool.token1.name,
      );

      const entity = new Pool(
        token0,
        token1,
        pool.fee,
        pool.sqrtPriceX96,
        pool.liquidity,
        pool.tick,
      );

      const { quoteToken, baseToken } = getQuoteAndBaseToken(token0, token1);
      const positions = allPositions.filter((p) => p.poolAddress === pool.address);

      return {
        ...pool,
        entity,
        baseToken,
        quoteToken,
        positions,
      };
    });
  }, [pools, allPositions, chainId]);

  // Debug logging
  useEffect(() => {
    console.log('Pool fetching status:', {
      poolsLoading,
      poolsLength: pools.length,
      poolAddressesLength: poolAddresses.length,
      onlyForInjected,
    });
  }, [poolsLoading, pools.length, poolAddresses.length, onlyForInjected]);

  return {
    pools: finalPools,
    loading: poolsLoading || positionsLoading || poolsFetching || positionsFetching,
    poolAddresses,
  };
}
