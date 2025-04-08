import { useMemo, useEffect, useState } from 'react';
import { CurrencyAmount, Currency, Token } from '@uniswap/sdk-core';
import { Position, Pool, tickToPrice } from '@uniswap/v3-sdk';
import { useFetchPools, Position as APIPosition, PoolStateV2, PoolData } from './fetch';
import { useFetchPositions } from './fetch';
import { HederaToken } from '../utils/tokens';
import { BigNumber } from 'ethers';
import { CustomPosition } from '../types/seedle';
import JSBI from 'jsbi';

export interface FinalPoolData extends Omit<PoolStateV2, 'token0' | 'token1'> {
  entity: Pool;
  token0: HederaToken;
  token1: HederaToken;
  positions: CustomPosition[];
}

export function usePoolsForNetwork(
  chainId: number,
  timestamp: number,
  onlyForInjected: boolean,
  addresses?: string[],
  injectedAddress?: string,
): {
  pools: FinalPoolData[];
  loading: boolean;
  poolAddresses: string[];
} {
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [pools, setPools] = useState<PoolStateV2[]>([]);
  const [poolAddresses, setPoolAddresses] = useState<string[]>([]);
  const [allPositions, setAllPositions] = useState<APIPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);

  const memoizedAddresses = useMemo(() => {
    if (onlyForInjected && injectedAddress) {
      return [injectedAddress];
    }
    if (addresses && addresses.length > 0) {
      return addresses;
    }
    return ['all'];
  }, [onlyForInjected, injectedAddress, addresses]);

  const { loading: poolsFetching, poolStates: fetchedPools } = useFetchPools(
    chainId,
    memoizedAddresses,
  );

  useEffect(() => setPoolsLoading(poolsFetching), [poolsFetching]);
  useEffect(() => {
    if (fetchedPools) {
      setPools(fetchedPools);
    }
  }, [fetchedPools]);

  const { loading: positionsFetching, positions: fetchedRawPositions } = useFetchPositions(
    injectedAddress && onlyForInjected ? injectedAddress : null
  );

  useEffect(() => setPositionsLoading(positionsFetching), [positionsFetching]);
  useEffect(() => {
    if (fetchedRawPositions) {
      setAllPositions(fetchedRawPositions);
    }
  }, [fetchedRawPositions]);

  const memoizedPoolAddresses = useMemo(() => {
    if (!pools.length) return [];
    return Array.from(new Set(pools.map((p) => p.address)));
  }, [pools]);

  useEffect(() => setPoolAddresses(memoizedPoolAddresses), [memoizedPoolAddresses]);

  const finalPools = useMemo(() => {
    if (!pools.length) return [];
    console.log('Recalculating finalPools...', { numPools: pools.length, numPositions: allPositions.length });

    return pools.map((poolState) => {
      const token0 = new HederaToken(
        chainId,
        poolState.token0.address,
        poolState.token0.decimals,
        poolState.token0.symbol ?? '',
        poolState.token0.name ?? 'Unknown'
      );
      const token1 = new HederaToken(
        chainId,
        poolState.token1.address,
        poolState.token1.decimals,
        poolState.token1.symbol ?? '',
        poolState.token1.name ?? 'Unknown'
      );

      const entity = new Pool(
        token0,
        token1,
        poolState.fee,
        poolState.sqrtPriceX96,
        poolState.liquidity,
        poolState.tick,
      );

      const associatedApiPositions = allPositions.filter((p: APIPosition) => {
        return (
          (p.token0.id === token0.hederaId && p.token1.id === token1.hederaId) ||
          (p.token0.id === token1.hederaId && p.token1.id === token0.hederaId)
        ) && p.fee === poolState.fee;
      });

      console.log(`Pool ${poolState.address} (${token0.symbol}/${token1.symbol}) matched ${associatedApiPositions.length} positions.`);

      const finalAssociatedPositions: CustomPosition[] = associatedApiPositions.map((p: APIPosition) => {
        const liquidity = JSBI.BigInt(p.liquidity.toString());
        const positionEntity = new Position({
          pool: entity,
          tickLower: p.tickLower,
          tickUpper: p.tickUpper,
          liquidity: liquidity,
        });
        
        return {
          id: p.positionId,
          entity: positionEntity,
          tickLower: p.tickLower,
          tickUpper: p.tickUpper,
          positionLiquidity: p.liquidity.toString(),
          uncollectedFees: [p.tokensOwed0 || '0', p.tokensOwed1 || '0'],
          positionUncollectedFees: p.tokensOwed0 || '0',
          transactions: p.transactions || []
        } as unknown as CustomPosition;
      });

      return {
        ...poolState,
        entity,
        token0: token0,
        token1: token1,
        positions: finalAssociatedPositions,
      };
    });
  }, [pools, allPositions, chainId]);

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
    loading: poolsLoading || positionsLoading,
    poolAddresses,
  };
}
