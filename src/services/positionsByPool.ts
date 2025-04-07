import { useState, useEffect, useMemo } from 'react';
import { useFetchPositions, useFetchPools } from '../hooks/fetch';
import { Position as UniPosition, Pool } from '@uniswap/v3-sdk';
import { CustomPosition } from '../types/seedle';
import { Token, Price, CurrencyAmount } from '@uniswap/sdk-core';
import JSBI from 'jsbi';

export type PoolPosition = CustomPosition;

export function usePositionsByPool(
  accountId: string | null,
  poolId: string,
  chainId: number
): { loading: boolean; positions: PoolPosition[] } {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<PoolPosition[]>([]);
  
  // Get all positions for the account
  const { positions: userPositions, loading: positionsLoading } = useFetchPositions(accountId);
  
  // Get all pools - memoize the addresses array to prevent unnecessary re-renders
  const addresses = useMemo(() => ['all'], []);
  const { poolStates, loading: poolsLoading } = useFetchPools(chainId, addresses);
  
  // Memoize the pool lookup to prevent unnecessary recalculations
  const targetPool = useMemo(() => {
    const poolState = poolStates.find(p => p.address === poolId);
    if (!poolState) return null;

    // Convert pool state to Uniswap Pool instance
    return new Pool(
      poolState.token0,
      poolState.token1,
      poolState.fee,
      poolState.sqrtPriceX96,
      poolState.liquidity,
      poolState.tick,
      undefined // Use default tick data provider
    );
  }, [poolStates, poolId]);

  useEffect(() => {
    if (positionsLoading || poolsLoading) {
      setLoading(true);
      return;
    }
    
    if (!targetPool) {
      setPositions([]);
      setLoading(false);
      return;
    }
    
    // Find positions that match the pool's tokens
    const matchingPositions = userPositions.filter(position => {
      const positionToken0 = position.token0.id;
      const positionToken1 = position.token1.id;
      const poolToken0 = targetPool.token0.address;
      const poolToken1 = targetPool.token1.address;
      
      return (
        (positionToken0 === poolToken0 && positionToken1 === poolToken1) ||
        (positionToken0 === poolToken1 && positionToken1 === poolToken0)
      );
    });
    
    // Map matching positions to CustomPosition format
    const mappedPositions = matchingPositions.map(position => {
      // Convert liquidity to JSBI
      const liquidity = JSBI.BigInt(position.liquidity.toString());

      // Create a Position instance from the position data
      const positionEntity = new UniPosition({
        pool: targetPool,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        liquidity,
      });

      // Create a CustomPosition object
      return {
        id: position.positionId,
        entity: positionEntity,
        priceLower: position.priceLower,
        priceUpper: position.priceUpper,
        positionLiquidity: position.positionLiquidity,
        uncollectedFees: position.uncollectedFees || [],
        positionUncollectedFees: position.positionUncollectedFees || CurrencyAmount.fromRawAmount(targetPool.token0, "0"),
        transactions: position.transactions || []
      };
    });
    
    setPositions(mappedPositions);
    setLoading(false);
  }, [userPositions, targetPool, positionsLoading, poolsLoading]);

  return { loading, positions };
} 