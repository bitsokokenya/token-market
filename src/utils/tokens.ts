import { Token, Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { tickToPrice } from "@uniswap/v3-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";

import { ChainID } from "../types/enums";
import { HEDERA_TOKENS } from "../common/constants";

// Custom Token class for Hedera that accepts both Hedera native addresses and EVM addresses
export class HederaToken extends Token {
  private readonly hederaAccountId: string;

  constructor(
    chainId: number,
    address: string | undefined, // Can be either 0.0.XXXXX or 0x... format
    decimals: number | undefined,
    symbol?: string,
    name?: string
  ) {
    // Validate address
    if (!address) {
      throw new Error('Address is required');
    }

    // Set default decimals to 18 if undefined
    const tokenDecimals = decimals ?? 18;

    // Validate decimals
    if (!Number.isInteger(tokenDecimals) || tokenDecimals < 0 || tokenDecimals > 255) {
      throw new Error(`Invalid decimals: ${tokenDecimals}. Must be an integer between 0 and 255.`);
    }

    // Check if the address is in Hedera native format (0.0.XXXXX)
    const isHederaNative = /^0\.0\.\d+$/.test(address);
    
    // If it's a Hedera native address, use a dummy EVM address for the base Token class
    // Otherwise, use the provided EVM address
    const evmAddress = isHederaNative 
      ? '0x0000000000000000000000000000000000000000'
      : address;

    super(chainId, evmAddress, tokenDecimals, symbol, name);
    this.hederaAccountId = address;
  }

  // Override the equals method to handle both address formats
  equals(other: Currency): boolean {
    if (this.chainId !== other.chainId) return false;
    
    if (other instanceof HederaToken) {
      return this.hederaAccountId === other.hederaAccountId;
    }
    
    if (other instanceof Token) {
      return this.address === other.address;
    }
    
    return false;
  }

  // Get the original address (either Hedera native or EVM)
  getHederaAccountId(): string {
    return this.hederaAccountId;
  }

  // Implement required Token properties
  readonly isNative: false = false;
  readonly isToken: true = true;

  get wrapped(): Token {
    return this;
  }

  sortsBefore(other: Token): boolean {
    if (this.chainId !== other.chainId) {
      throw new Error('Tokens must be on the same chain');
    }
    return this.address.toLowerCase() < other.address.toLowerCase();
  }
}

// Helper function to check if a token is USDC
const isUSDC = (token: Token): boolean => {
  return token.symbol === 'USDC';
};

// Helper function to convert token to HederaToken if needed
const toHederaToken = (token: Token): HederaToken => {
  if (token instanceof HederaToken) {
    return token;
  }
  return new HederaToken(
    ChainID.HederaTestnet,
    token.address,
    token.decimals,
    token.symbol,
    token.name
  );
};

// Helper function to compare token addresses
const compareTokenAddresses = (token0: Token, token1: Token): boolean => {
  // Convert both tokens to HederaToken to ensure they're on the same chain
  const hederaToken0 = toHederaToken(token0);
  const hederaToken1 = toHederaToken(token1);
  
  return hederaToken0.address.toLowerCase() < hederaToken1.address.toLowerCase();
};

export function getQuoteAndBaseToken(token0: Token, token1: Token) {
  // Convert both tokens to HederaToken to ensure they're on the same chain
  const hederaToken0 = toHederaToken(token0);
  const hederaToken1 = toHederaToken(token1);
//console.log(hederaToken0,hederaToken1);
  // If either token is USDC, use it as the quote token
  if (isUSDC(hederaToken0)) {
    return { quoteToken: hederaToken0, baseToken: hederaToken1 };
  }
  if (isUSDC(hederaToken1)) {
    return { quoteToken: hederaToken1, baseToken: hederaToken0 };
  }

  // If neither token is USDC, use the token with the lower address as token0
  return compareTokenAddresses(hederaToken0, hederaToken1)
    ? { quoteToken: hederaToken0, baseToken: hederaToken1 }
    : { quoteToken: hederaToken1, baseToken: hederaToken0 };
}

export function getNativeToken(): Token {
  // For Hedera, return HBAR token
  return new HederaToken(
    ChainID.HederaTestnet,
    HEDERA_TOKENS.HBAR.tokenId,
    HEDERA_TOKENS.HBAR.decimals,
    HEDERA_TOKENS.HBAR.symbol,
    HEDERA_TOKENS.HBAR.name
  );
}

export function isNativeToken(token: Currency) {
  if (token.isNative) {
    return true;
  }
  // For Hedera, we'll check if the token is HBAR
  return token.chainId === ChainID.HederaMainnet || token.chainId === ChainID.HederaTestnet
    ? token.equals(getNativeToken())
    : false;
}

export function oneTokenUnit(token: Currency): string {
  return `1${"0".repeat(token.decimals)}`;
}

export function priceFromTick(
  token: Currency,
  priceTick: number | null
): CurrencyAmount<Currency> {
  const tokenCurrency = CurrencyAmount.fromRawAmount(
    token,
    BigNumber.from(priceTick || 0).mul(BigNumber.from(10).pow(token.decimals)).toString()
  );
  return tokenCurrency;
}

export function formatTokenAmount(
  token: Currency,
  value: string,
  decimals: number
): CurrencyAmount<Currency> {
  return CurrencyAmount.fromRawAmount(
    token,
    BigNumber.from(value).mul(BigNumber.from(10).pow(decimals)).toString()
  );
}

export function parseTokenAmount(value: string, decimals: number): CurrencyAmount<Currency> {
  const token = new HederaToken(
    ChainID.HederaTestnet,
    HEDERA_TOKENS.USDC.tokenId,
    HEDERA_TOKENS.USDC.decimals,
    HEDERA_TOKENS.USDC.symbol,
    HEDERA_TOKENS.USDC.name
  );
  
  return CurrencyAmount.fromRawAmount(
    token,
    BigNumber.from(value).mul(BigNumber.from(10).pow(decimals)).toString()
  );
}
