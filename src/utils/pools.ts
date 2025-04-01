import { HederaToken, CurrencyAmount } from './tokens';

// Tick math constants
export const TICK_SPACING = 60;
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

// Simplified pool class for Hedera
export class HederaPool {
  public readonly token0: HederaToken;
  public readonly token1: HederaToken; 
  public readonly fee: number;
  public readonly tickSpacing: number;
  public readonly liquidity: string;
  public readonly sqrtPriceX96: string;
  public readonly tick: number;

  constructor(
    token0: HederaToken,
    token1: HederaToken,
    fee: number,
    tickSpacing: number,
    liquidity: string,
    sqrtPriceX96: string,
    tick: number
  ) {
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.tickSpacing = tickSpacing;
    this.liquidity = liquidity;
    this.sqrtPriceX96 = sqrtPriceX96;
    this.tick = tick;
  }

  // Get the pool's address - for Hedera, this would be a format combining the tokens and fee
  public static getAddress(
    tokenA: HederaToken,
    tokenB: HederaToken,
    fee: number
  ): string {
    // Sort tokens by address to ensure consistent ordering
    const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() 
      ? [tokenA, tokenB] 
      : [tokenB, tokenA];
    
    // Simply combine the token IDs and fee to create a unique identifier
    return `${token0.tokenId}-${token1.tokenId}-${fee}`;
  }

  // Convert a price to a tick
  public static priceToTick(price: number): number {
    // ln(price) / ln(1.0001)
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }

  // Convert a tick to a price
  public static tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick);
  }

  // Find the nearest tick that can be used based on tick spacing
  public static nearestUsableTick(tick: number, tickSpacing: number): number {
    const rounded = Math.round(tick / tickSpacing) * tickSpacing;
    if (rounded < MIN_TICK) return MIN_TICK;
    if (rounded > MAX_TICK) return MAX_TICK;
    return rounded;
  }

  // Get the token amounts for a given amount of liquidity and price range
  public getTokenAmountsForLiquidity(
    liquidity: string,
    tickLower: number,
    tickUpper: number
  ): [CurrencyAmount, CurrencyAmount] {
    const sqrtRatioCurrentX96 = parseFloat(this.sqrtPriceX96);
    const sqrtRatioAX96 = Math.sqrt(Math.pow(1.0001, tickLower));
    const sqrtRatioBX96 = Math.sqrt(Math.pow(1.0001, tickUpper));
    
    const liquidityAmount = parseFloat(liquidity);
    
    let amount0 = 0;
    let amount1 = 0;
    
    // If current price is less than the lower bound, only token0 is needed
    if (this.tick < tickLower) {
      amount0 = liquidityAmount * (1 / sqrtRatioAX96 - 1 / sqrtRatioBX96);
    }
    // If current price is greater than the upper bound, only token1 is needed
    else if (this.tick >= tickUpper) {
      amount1 = liquidityAmount * (sqrtRatioBX96 - sqrtRatioAX96);
    }
    // If current price is within the range, both tokens are needed
    else {
      amount0 = liquidityAmount * (1 / sqrtRatioCurrentX96 - 1 / sqrtRatioBX96);
      amount1 = liquidityAmount * (sqrtRatioCurrentX96 - sqrtRatioAX96);
    }
    
    return [
      CurrencyAmount.fromRawAmount(this.token0, amount0.toString()),
      CurrencyAmount.fromRawAmount(this.token1, amount1.toString())
    ];
  }

  // Calculate the position value in terms of token0
  public getPositionValue(
    liquidity: string,
    tickLower: number,
    tickUpper: number,
    token0PriceUSD: number
  ): number {
    const [amount0, amount1] = this.getTokenAmountsForLiquidity(liquidity, tickLower, tickUpper);
    
    const amount0Value = parseFloat(amount0.toExact()) * token0PriceUSD;
    const amount1Value = parseFloat(amount1.toExact()) * token0PriceUSD * this.getPriceOf(this.token1);
    
    return amount0Value + amount1Value;
  }

  // Get the price of token1 in terms of token0
  public getPriceOf(token: HederaToken): number {
    if (token.equals(this.token0)) return 1;
    if (token.equals(this.token1)) return Math.pow(1.0001, this.tick);
    return 0;
  }

  // Create a default pool with current price
  public static createWithCurrentPrice(
    token0: HederaToken,
    token1: HederaToken,
    fee: number,
    currentPrice: number
  ): HederaPool {
    const tick = HederaPool.priceToTick(currentPrice);
    const sqrtPriceX96 = Math.sqrt(currentPrice).toString();
    
    return new HederaPool(
      token0,
      token1,
      fee,
      TICK_SPACING,
      '0',
      sqrtPriceX96,
      tick
    );
  }
}

export interface Position {
  pool: HederaPool;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
} 