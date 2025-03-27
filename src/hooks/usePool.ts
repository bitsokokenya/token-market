import { useState, useEffect } from 'react';
import { useProvider } from 'wagmi';
import { Pool } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { HederaToken } from '../utils/tokens';

import { usePoolContract } from './useContract';

export function usePool(
  token0: Token | null,
  token1: Token | null,
  fee: number,
): {
  pool: Pool | null;
  poolAddress: string | null;
} {
  const library = useProvider({ chainId: token0 ? token0.chainId : 1 });
  
  // Convert tokens to HederaToken if they aren't already
  const hederaToken0 = token0 instanceof HederaToken ? token0 : token0 ? new HederaToken(
    token0.chainId,
    token0.address,
    token0.decimals,
    token0.symbol,
    token0.name
  ) : null;
  
  const hederaToken1 = token1 instanceof HederaToken ? token1 : token1 ? new HederaToken(
    token1.chainId,
    token1.address,
    token1.decimals,
    token1.symbol,
    token1.name
  ) : null;

  // Get the pool contract using Hedera tokens
  const contract = usePoolContract(hederaToken0, hederaToken1, fee, library, false);

  const [pool, setPool] = useState<Pool | null>(null);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);

  useEffect(() => {
    const call = async () => {
      if (!contract || !hederaToken0 || !hederaToken1) {
        console.log('Missing required data:', { contract, hederaToken0, hederaToken1 });
        return;
      }

      try {
        // Get pool address in Hedera format
        const address = Pool.getAddress(hederaToken0, hederaToken1, fee);
        setPoolAddress(address);

        // Get pool data from contract
        const result = await contract.functions.slot0();
        const sqrtPriceX96 = result[0];
        const tickCurrent = result[1];

        const liquidityResult = await contract.functions.liquidity();
        const liquidity = liquidityResult[0];

        // Create pool instance with Hedera tokens
        setPool(
          new Pool(hederaToken0, hederaToken1, fee, sqrtPriceX96, liquidity, tickCurrent),
        );
      } catch (error) {
        console.error('Error fetching pool data:', error);
      }
    };

    call();
  }, [contract, hederaToken0, hederaToken1, fee]);

  return { pool, poolAddress };
}
