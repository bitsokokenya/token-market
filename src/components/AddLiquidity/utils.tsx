import JSBI from 'jsbi';
import { BigNumber } from '@ethersproject/bignumber';
import { Pool, Position } from '@uniswap/v3-sdk';
import { Token, CurrencyAmount, MaxUint256 } from '@uniswap/sdk-core';

import { HederaToken } from '../../utils/tokens';
import { isNativeToken } from '../../utils/tokens';
import { HEDERA_TOKENS } from '../../common/constants';

export function positionFromAmounts(
  {
    pool,
    tickLower,
    tickUpper,
    val0,
    val1,
  }: {
    pool: Pool;
    tickLower: number;
    tickUpper: number;
    val0: number;
    val1: number;
  },
  reverse: boolean,
): Position {
  if (reverse) {
    [tickLower, tickUpper] = [tickUpper, tickLower];
    [val0, val1] = [val1, val0];
  }

  const amount0 =
    val0 === 0 ? MaxUint256 : JSBI.BigInt(Math.floor(val0 * Math.pow(10, pool.token0.decimals)));

  const amount1 =
    val1 === 0 ? MaxUint256 : JSBI.BigInt(Math.floor(val1 * Math.pow(10, pool.token1.decimals)));

  return Position.fromAmounts({
    pool,
    tickLower,
    tickUpper,
    amount0,
    amount1,
    useFullPrecision: false,
  });
}

export function toCurrencyAmount(token: Token, amount: number, wrapped: boolean = false) {
  const bigIntish = amount > 0 ? JSBI.BigInt(Math.floor(amount * Math.pow(10, token.decimals))) : 0;
  // For Hedera, we don't need to convert to native token
  return CurrencyAmount.fromRawAmount(token, bigIntish);
}

export function calculateNewAmounts(
  {
    pool,
    tickLower,
    tickUpper,
    val0,
    val1,
  }: {
    pool: Pool;
    tickLower: number;
    tickUpper: number;
    val0: number;
    val1: number;
  },
  reverse: boolean,
): [number, number] {
  const pos = positionFromAmounts({ pool, tickLower, tickUpper, val0, val1 }, reverse);

  let newVal0 = parseFloat(pos.amount0.toSignificant(16));
  let newVal1 = parseFloat(pos.amount1.toSignificant(16));

  if (reverse) {
    [newVal0, newVal1] = [newVal1, newVal0];
  }

  return [newVal0, newVal1];
}

export function positionDistance(tickCurrent: number, position: { entity: Position }): number {
  const { tickLower, tickUpper } = position.entity;
  if (tickLower <= tickCurrent && tickCurrent <= tickUpper) {
    //within range
    return Math.min(tickUpper - tickCurrent, tickCurrent - tickLower);
  } else if (tickCurrent > tickUpper) {
    // above range
    return tickCurrent - tickUpper;
  } else {
    // below range
    return tickLower - tickCurrent;
  }
}

export function tokenAmountNeedApproval(
  chainId: number,
  token: Token,
  allowance: number,
  amount: number,
  wrapped: boolean = false,
): boolean {
  if (!token || !chainId) {
    return false;
  }

  // For Hedera, we don't need approval for HBAR
  if (token instanceof HederaToken && token.getHederaAccountId() === HEDERA_TOKENS.HBAR.tokenId) {
    return false;
  }

  if (isNaN(allowance) || isNaN(amount)) {
    return false;
  }

  const allowanceRaw = Math.floor(allowance * Math.pow(10, token.decimals));
  const amountRaw = Math.ceil(amount * Math.pow(10, token.decimals));

  const res = CurrencyAmount.fromRawAmount(token, allowanceRaw).lessThan(
    CurrencyAmount.fromRawAmount(token, amountRaw),
  );

  return res;
}

export interface TokenListItem {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export async function loadTokens(chainId: number): Promise<Token[]> {
  try {
    // Fetch pools from SaucerSwap API
    const res = await fetch('https://api.saucerswap.finance/v2/pools/full');
    if (!res.ok) {
      console.error('Failed to fetch pools from SaucerSwap API');
      return [];
    }

    const pools = await res.json();
    
    // Convert pool data to tokens
    const tokens = new Set<Token>();
    
    // Add HBAR as the native token
    tokens.add(HEDERA_TOKENS.HBAR);
    
    pools.forEach((pool: any) => {
      // Add tokenA if it's not HBAR
      if (pool.tokenA.id !== HEDERA_TOKENS.HBAR.tokenId) {
        tokens.add(new HederaToken(
          chainId,
          pool.tokenA.id,
          pool.tokenA.decimals,
          pool.tokenA.symbol,
          pool.tokenA.name
        ));
      }
      
      // Add tokenB if it's not HBAR
      if (pool.tokenB.id !== HEDERA_TOKENS.HBAR.tokenId) {
        tokens.add(new HederaToken(
          chainId,
          pool.tokenB.id,
          pool.tokenB.decimals,
          pool.tokenB.symbol,
          pool.tokenB.name
        ));
      }
    });

    return Array.from(tokens);
  } catch (error) {
    console.error('Error loading tokens:', error);
    return [];
  }
}

export function findTokens(chainId: number, tokens: TokenListItem[], symbols: string[]) {
  const symbolsFormatted = symbols.map((sym) => {
    const s = sym.toUpperCase();
    if (s === 'ETH') {
      return 'WETH';
    }
    // in Polygon, return ETH instead of WETH to match
    if (chainId === 137 && s === 'WETH') {
      return 'ETH';
    }
    return s;
  });

  let matches: TokenListItem[] = [];
  symbolsFormatted.forEach((sym) => {
    const matched = tokens.find((token: TokenListItem) => {
      return token.chainId === chainId && token.symbol === sym;
    });
    if (matched) {
      matches.push(matched);
    }
  });

  return matches;
}

export function findMatchingPosition(
  positions: any[] | null,
  fee: number,
  tickLower: number,
  tickUpper: number,
) {
  if (!positions || !positions.length) {
    return null;
  }

  return positions.find((position) => {
    const { entity } = position;
    if (
      entity.pool.fee === fee &&
      entity.tickLower === tickLower &&
      entity.tickUpper === tickUpper
    ) {
      return true;
    }
    return false;
  });
}

export function getApprovalAmount(val1: number, val2: number) {
  return Math.max(val1, val2);
}

export function findPositionById(positions: any[], id: string | null) {
  if (!id || id === '') {
    return null;
  }

  return positions.find((pos) => BigNumber.from(pos.id).eq(BigNumber.from(id)));
}
