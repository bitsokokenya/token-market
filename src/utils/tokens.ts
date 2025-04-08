import { BigNumber } from "@ethersproject/bignumber";
import { Token, TokenConstructorArgs } from '@uniswap/sdk-core';
import { AccountId } from '@hashgraph/sdk';

import { ChainID } from "../types/enums";
import { HEDERA_TOKENS } from "../common/constants";

// Helper function (keep if not already defined/imported elsewhere)
function hederaIdToEvmAddress(hederaId: string): string {
 
  try {
    return AccountId.fromString(hederaId).toSolidityAddress();
  } catch (e) {
    console.error(`Failed to convert Hedera ID ${hederaId} to EVM address:`, e);
    return '0x0000000000000000000000000000000000000000'; // Return zero address on error
  }
}

// Extend the Uniswap Token class
export class HederaToken extends Token {
  public readonly hederaId: string; // Store original Hedera ID
  // The 'address' property inherited from Token will store the EVM address
  public readonly logoURI?: string;

  // Adjust constructor arguments if needed, but ensure hederaId is captured
  constructor(
    chainId: number,
    hederaId: string, // Expect Hedera ID here
    decimals: number,
    symbol?: string,
    name?: string,
    bypassChecksum?: boolean,
    logoURI?: string
  ) {
    // Convert Hedera ID to EVM address for the parent Token constructor
    const evmAddress = hederaIdToEvmAddress(hederaId);
    console.log('evmAddress', evmAddress, 'hederaId', hederaId);
    // Call the parent constructor with the EVM address
    super(chainId, '0x'+evmAddress, decimals, symbol, name, bypassChecksum);
    //super(chainId, hederaId, decimals, symbol, name, bypassChecksum);
    
    // Store the original Hedera ID
    this.hederaId = hederaId;
    this.logoURI = logoURI;
  }

  // Optional: Override equals if necessary, though parent might suffice
  // public equals(other: HederaToken): boolean {
  //   return super.equals(other) && this.hederaId === other.hederaId;
  // }

  // Optional: Method to easily get Hedera ID
  public getHederaAccountId(): string {
      return this.hederaId;
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

// Keep getQuoteAndBaseToken if used elsewhere, otherwise remove
export function getQuoteAndBaseToken(token0: HederaToken, token1: HederaToken): [HederaToken, HederaToken] {
  // Simplified logic: Assume HBAR or stablecoin is quote
  const quoteSymbols = ['HBAR', 'WHBAR', 'USDC', 'USDT', 'DAI']; 
  if (quoteSymbols.includes(token0.symbol ?? '')) {
      return [token1, token0]; // token0 is quote, token1 is base
  }
  if (quoteSymbols.includes(token1.symbol ?? '')) {
      return [token0, token1]; // token1 is quote, token0 is base
  }
  // Default or further logic needed if neither is a common quote token
  return [token0, token1]; // Default: token0 is base, token1 is quote
}

export function getNativeToken(): HederaToken {
  // For Hedera, return HBAR token
  return new HederaToken(
    ChainID.HederaTestnet,
    '0.0.1', // HBAR token ID
    8,       // HBAR has 8 decimals
    'HBAR',
    'Hedera',
    false,
    'https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png'
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
  ChainID.HederaTestnet,
  '0.0.1', // HBAR token ID
  8,       // HBAR has 8 decimals
  'HBAR',
  'Hedera',
  false,
  'https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png'
);

export const USDC = new HederaToken(
  ChainID.HederaTestnet,
  '0.0.456', // Example token ID for USDC on Hedera
  6,         // USDC has 6 decimals
  'USDC',
  'USD Coin',
  false,
  'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
);

// Add other common tokens as needed
