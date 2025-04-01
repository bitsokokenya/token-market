import { BigNumber } from "@ethersproject/bignumber";

import { ChainID } from "../types/enums";
import { HEDERA_TOKENS } from "../common/constants";

// Custom Hedera token class that doesn't rely on Uniswap SDK
export class HederaToken {
  public readonly tokenId: string; // Hedera token ID format: 0.0.12345
  public readonly address: string; // HTS format
  public readonly decimals: number;
  public readonly symbol: string;
  public readonly name: string;
  public readonly logoURI?: string;
  public readonly chainId: number; // Added to maintain compatibility

  constructor(
    tokenIdOrChainId: string | number,
    decimalsOrTokenId: number | string,
    symbolOrDecimals: string | number,
    name: string,
    logoURIOrSymbol?: string | string,
    chainIdOrName?: number | string
  ) {
    // Handle both constructor forms:
    // 1. (tokenId, decimals, symbol, name, logoURI?, chainId?)
    // 2. (chainId, tokenId, decimals, symbol, name)
    
    // Detect which format is being used based on the first parameter type
    if (typeof tokenIdOrChainId === 'number') {
      // Format 2: old format with chainId first
      this.chainId = tokenIdOrChainId;
      this.tokenId = decimalsOrTokenId as string;
      this.decimals = symbolOrDecimals as number;
      this.symbol = logoURIOrSymbol as string || '';
      this.name = chainIdOrName as string || '';
      this.logoURI = undefined;
    } else {
      // Format 1: new format with tokenId first
      this.tokenId = tokenIdOrChainId;
      this.decimals = decimalsOrTokenId as number;
      this.symbol = symbolOrDecimals as string;
      this.name = name;
      this.logoURI = logoURIOrSymbol as string;
      this.chainId = chainIdOrName as number || ChainID.HederaTestnet;
    }
    
    // Convert tokenId to address format - make sure it's a string first
    if (typeof this.tokenId === 'string' && this.tokenId.includes('.')) {
      this.address = this.tokenId.split('.').join('');
    } else {
      // Fall back to using tokenId as the address if it doesn't contain dots
      this.address = String(this.tokenId);
    }
  }

  public equals(other?: HederaToken): boolean {
    if (!other) return false;
    return this.tokenId === other.tokenId;
  }

  public sortsBefore(other: HederaToken): boolean {
    return this.tokenId.toLowerCase() < other.tokenId.toLowerCase();
  }

  public toString(): string {
    return this.tokenId;
  }

  // Get the Hedera account ID (same as address)
  getHederaAccountId(): string {
    return this.address;
  }
}

// Custom Currency Amount class
export class CurrencyAmount {
  public readonly token: HederaToken;
  public readonly amount: string; // Decimal string representation

  constructor(token: HederaToken, amount: string) {
    this.token = token;
    this.amount = amount;
  }

  public toExact(): string {
    return this.amount;
  }

  // Get amount as fixed string with specified decimal places
  toFixed(decimalPlaces: number = 6): string {
    const value = BigNumber.from(this.amount);
    const divisor = BigNumber.from(10).pow(this.token.decimals);
    const result = parseFloat(value.toString()) / parseFloat(divisor.toString());
    return result.toFixed(decimalPlaces);
  }

  // Format with token symbol and significant digits
  toSignificant(significantDigits: number = 6): string {
    // Simple implementation to get significant digits
    const [whole, fraction] = this.amount.split('.');
    if (!fraction) return whole;
    
    const combined = whole + fraction;
    let firstNonZero = 0;
    while (firstNonZero < combined.length && combined[firstNonZero] === '0') {
      firstNonZero++;
    }
    
    const significant = combined.slice(firstNonZero, firstNonZero + significantDigits);
    return parseFloat(significant) / Math.pow(10, significant.length) + '';
  }

  // Format with token symbol
  toSignificantWithSymbol(significantDigits: number = 6): string {
    return `${this.toFixed(significantDigits)} ${this.token.symbol}`;
  }

  public static fromRawAmount(token: HederaToken, amount: string): CurrencyAmount {
    const decimals = token.decimals;
    const parsedAmount = parseFloat(amount) / Math.pow(10, decimals);
    return new CurrencyAmount(token, parsedAmount.toString());
  }

  // Add two currency amounts
  add(other: CurrencyAmount): CurrencyAmount {
    if (!this.token.equals(other.token)) {
      throw new Error('Cannot add different tokens');
    }
    const sum = BigNumber.from(this.amount).add(BigNumber.from(other.amount));
    return CurrencyAmount.fromRawAmount(this.token, sum.toString());
  }
}

// Get a token pair in the correct order
export function getQuoteAndBaseToken(token0: HederaToken, token1: HederaToken): [HederaToken, HederaToken] {
  // Sort tokens by address to ensure consistent ordering
  if (token0.address.toLowerCase() < token1.address.toLowerCase()) {
    return [token0, token1];
  } else {
    return [token1, token0];
  }
}

export function getNativeToken(): HederaToken {
  // For Hedera, return HBAR token
  return new HederaToken(
    '0.0.1', // HBAR token ID
    8,       // HBAR has 8 decimals
    'HBAR',
    'Hedera',
    'https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png',
    ChainID.HederaTestnet // Hedera testnet
  );
}

export function isNativeToken(token: HederaToken) {
  // For Hedera, check if the token is HBAR
  return token.chainId === ChainID.HederaMainnet || token.chainId === ChainID.HederaTestnet
    ? token.equals(getNativeToken())
    : false;
}

export function formatTokenAmount(
  token: HederaToken,
  value: string,
  decimals: number
): CurrencyAmount {
  return CurrencyAmount.fromRawAmount(
    token,
    BigNumber.from(value).mul(BigNumber.from(10).pow(decimals)).toString()
  );
}

// Utility function to parse token amount with decimals
export function parseTokenAmount(amount: number, token: HederaToken): string {
  return BigNumber.from(Math.floor(amount * Math.pow(10, token.decimals))).toString();
}

// Utility function to format token amount for display
export function formatDisplayAmount(amount: string, decimals: number): string {
  const value = BigNumber.from(amount);
  const divisor = BigNumber.from(10).pow(decimals);
  return (parseFloat(value.toString()) / parseFloat(divisor.toString())).toFixed(6);
}

// Convert a tick to a price for a token pair
export function priceFromTick(token: HederaToken, tick: number): { 
  multiply: (fraction: any) => { 
    toExact: () => string;
    toString: () => string;
    valueOf: () => number;
  } 
} {
  if (!token) return { 
    multiply: () => ({ 
      toExact: () => "0", 
      toString: () => "0",
      valueOf: () => 0
    }) 
  };
  
  // In Uniswap v3, price = 1.0001^tick
  const price = Math.pow(1.0001, tick);
  
  // Create a simple object with a multiply method similar to what the SDK provided
  return {
    multiply: (fraction: any) => {
      // Calculate the value
      let multipliedValue = 0;
      
      if (typeof fraction === 'number') {
        multipliedValue = price * fraction;
      } else if (fraction && fraction.numerator && fraction.denominator) {
        const fractionValue = parseFloat(fraction.numerator.toString()) / parseFloat(fraction.denominator.toString());
        multipliedValue = price * fractionValue;
      } else if (fraction && fraction.toString) {
        multipliedValue = price * parseFloat(fraction.toString());
      }
      
      // Return an object with toExact method to be compatible with CurrencyAmount
      return {
        toExact: () => multipliedValue.toString(),
        toString: () => multipliedValue.toString(),
        valueOf: () => multipliedValue
      };
    }
  };
}

// Define a Fraction class to replace the SDK's Fraction
export class Fraction {
  public readonly numerator: BigNumber;
  public readonly denominator: BigNumber;

  constructor(numerator: string | number | BigNumber, denominator: string | number | BigNumber = 1) {
    this.numerator = BigNumber.from(numerator);
    this.denominator = BigNumber.from(denominator);
  }

  public toString(): string {
    const numeratorStr = this.numerator.toString();
    const denominatorStr = this.denominator.toString();
    if (denominatorStr === '1') {
      return numeratorStr;
    }
    return `${numeratorStr}/${denominatorStr}`;
  }
}

// Helper function to get one token unit (10^decimals)
export function oneTokenUnit(token: HederaToken): string {
  return BigNumber.from(10).pow(token.decimals).toString();
}

// Predefined tokens
export const HBAR = new HederaToken(
  '0.0.1', // HBAR token ID
  8,       // HBAR has 8 decimals
  'HBAR',
  'Hedera',
  'https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png',
  ChainID.HederaTestnet // Hedera testnet
);

export const USDC = new HederaToken(
  '0.0.456', // Example token ID for USDC on Hedera
  6,         // USDC has 6 decimals
  'USDC',
  'USD Coin',
  'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  ChainID.HederaTestnet // Hedera testnet
);

// Add other common tokens as needed
