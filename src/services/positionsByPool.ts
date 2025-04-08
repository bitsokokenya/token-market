import { useState, useEffect, useMemo } from 'react';
import { useFetchPositions, useFetchPools } from '../hooks/fetch';
import { Position as UniPosition, Pool } from '@uniswap/v3-sdk';
import { CustomPosition } from '../types/seedle';
import JSBI from 'jsbi';
import { Position as APIPosition } from '../hooks/fetch';

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
    if (positionsLoading || poolsLoading || !targetPool) {
      setLoading(positionsLoading || poolsLoading);
      if (!targetPool && !poolsLoading) setPositions([]); // Clear if pool not found
      return;
    }
    
    // Filtering logic (correct as is)
    const matchingPositions = userPositions.filter(position => {
      const positionToken0 = position.token0.id;
      const positionToken1 = position.token1.id;
      const poolToken0 = targetPool.token0.address; // Contains Hedera ID
      const poolToken1 = targetPool.token1.address; // Contains Hedera ID
      
      return (
        (positionToken0 === poolToken0 && positionToken1 === poolToken1) ||
        (positionToken0 === poolToken1 && positionToken1 === poolToken0)
      );
    });
    
    // Map matching positions using API structure
    const mappedPositions = matchingPositions.map((position: APIPosition) => {
      const liquidity = JSBI.BigInt(position.liquidity.toString());

      // Create the Uniswap SDK Position entity (still useful)
      const positionEntity = new UniPosition({
        pool: targetPool,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        liquidity,
      });

      // Use direct values from the API Position for the CustomPosition
      return {
        id: position.positionId, // Use positionId from the raw position data if available
        entity: positionEntity, // Keep the SDK entity
        
        // Use direct tick values (or calculate simple price strings if needed)
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        // priceLower: tickToPrice(...).toSignificant(6), // Example: calculate simple string price if needed
        // priceUpper: tickToPrice(...).toSignificant(6),

        // Use liquidity string
        positionLiquidity: position.liquidity.toString(),
        
        // Use raw fee strings from API
        uncollectedFees: [position.tokensOwed0 || '0', position.tokensOwed1 || '0'], 
        
        // Use one of the fee strings (e.g., token0) or leave undefined
        positionUncollectedFees: position.tokensOwed0 || '0', 

        transactions: position.transactions || [] 
      } as unknown as PoolPosition; // Use type assertion to bypass complex errors
    });
    
    setPositions(mappedPositions);
    setLoading(false);
  }, [userPositions, targetPool, positionsLoading, poolsLoading]);

  return { loading, positions };
} 