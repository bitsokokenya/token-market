import { Token, Percent } from '@uniswap/sdk-core';
import { BigNumber } from '@ethersproject/bignumber';
import { ChainID } from '../types/enums';
import { AccountId } from '@hashgraph/sdk';

// Function to convert Hedera token ID to EVM address
export function hederaTokenIdToEvmAddress(tokenId: string): string {
  // Split the tokenId into shard, realm, and num
  const [shard, realm, num] = tokenId.split('.').map(Number);

  // Convert the token ID to a Solidity address
  return AccountId.fromString(tokenId).toSolidityAddress();
}

// Simple Hedera Token class for basic token information
export class HederaToken {
  public readonly chainId: number;
  public readonly tokenId: string;
  public readonly decimals: number;
  public readonly symbol: string;
  public readonly name: string;
  public readonly address: string;

  constructor(tokenId: string, decimals: number, symbol: string, name: string) {
    this.chainId = ChainID.HederaTestnet;
    this.tokenId = tokenId;
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
    this.address = hederaTokenIdToEvmAddress(tokenId);
  }

  public equals(other: HederaToken): boolean {
    return this.tokenId === other.tokenId;
  }

  get hederaAccountId(): string {
    return this.tokenId;
  }

  getEvmAddress(): string {
    return this.address;
  }

  getHederaAccountId(): string {
    return this.tokenId;
  }
}

export const ISTESTNET = true;

// Hedera token definitions
//  HBAR: new HederaToken('0.0.1183558', 18, 'HBAR', 'Hedera') > ('tokenid', decimals, 'symbol', 'name')
export const HEDERA_TOKENS = {
  HBAR: new HederaToken('0.0.1183558', 18, 'HBAR', 'Hedera'),
  USDC: new HederaToken('0.0.1183558', 6, 'USDC', 'USD Coin'),
  WETH: new HederaToken('0.0.1183558', 18, 'WETH', 'Wrapped Ether'),
  WBTC: new HederaToken('0.0.1183558', 8, 'WBTC', 'Wrapped Bitcoin'),
  DAI: new HederaToken('0.0.1183558', 18, 'DAI', 'Dai Stablecoin'),
  USDT: new HederaToken('0.0.1183558', 6, 'USDT', 'Tether USD'),
} as const;

// Default slippage settings
export const DEFAULT_SLIPPAGE = new Percent(50, 10_000);
export const SWAP_SLIPPAGE = new Percent(5, 100);
export const ZERO_PERCENT = new Percent('0');
export const Q128 = BigNumber.from(2).pow(128);

// Block explorer URL for Hedera
export const BLOCK_EXPLORER_URL: { [key: number]: string } = {
  [ChainID.HederaTestnet]: 'https://hashscan.io/testnet',
  [ChainID.HederaMainnet]: 'https://hashscan.io/mainnet',
};

// SaucerSwap API URL
// testnet
export const SAUCERSWAP_TESTNET_API_URL = 'https://test-api.saucerswap.finance';
// mainnet
export const SAUCERSWAP_MAINNET_API_URL = 'https://api.saucerswap.finance';


    // Factory address
  export  const FACTORY_TESTNET_ADDRESS = '0x99e7ad739dd689cc8df36ed24ae876a989238b6b';
  export  const FACTORY_MAINNET_ADDRESS = '0x99e7ad739dd689cc8df36ed24ae876a989238b6b';
    
    // Hedera testnet JSON RPC URL
  export  const HEDERA_TESTNET_RPC = 'https://testnet.hashio.io/api';
  // Hedera testnet JSON RPC URL
export  const HEDERA_MAINNET_RPC = 'https://mainnet.hashio.io/api';


    


// Application routes
export const ROUTES = {
  LANDING: '/',
  HOME: '/home',
  ADD: '/add',
  ADD_NEW: '/add?tab=new',
  ADD_EXISTING: '/add?tab=existing',
  ABOUT: '/about',
  POOL_DETAILS: '/pool',
  POOLS: '/pools',
  TOKENS: '/tokens',
  CURRENCIES: '/currencies',
};

// External links
export const EXTERNAL_LINKS = {
  TWITTER: 'https://twitter.com/bitsoko',
  GITHUB: 'https://git.bitsoko.org/bitsoko',
  DISCORD: 'https://discord.gg/bitsoko',
};

// Labels for UI elements
export const LABELS = {
  FEE_APY: 'Annualized fees earned over liquidity',
  NET_RETURN: 'Liquidity gain + fees - gas cost',
  NET_APY: 'Net Annual Percentage Yield',
  POSITION: {
    OUT_OF_RANGE: 'This position is not earning fees',
  },
  LIQUIDITY: 'Total liquidity for a position, excluding fees',
};
