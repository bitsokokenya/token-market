import { Token, Percent } from '@uniswap/sdk-core';
import { BigNumber } from '@ethersproject/bignumber';
import { AccountId } from '@hashgraph/sdk';

// --- Ensure these are exported ---
export const HEDERA_TESTNET_CHAIN_ID = 296;
export const HEDERA_MAINNET_CHAIN_ID = 295;

// Environment flag - THIS SHOULD BE THE SOURCE OF TRUTH
export const ISTESTNET = true; // Or false for mainnet

// Determine current Chain ID based on ISTESTNET flag
export const CURRENT_CHAIN_ID = ISTESTNET ? HEDERA_TESTNET_CHAIN_ID : HEDERA_MAINNET_CHAIN_ID;

// Hedera RPC URLs - Use ISTESTNET flag
export const HEDERA_RPC_URL = ISTESTNET
  ? 'https://testnet.hashio.io/api'
  : 'https://mainnet.hashio.io/api';

// Factory contract addresses - Use ISTESTNET flag
export const FACTORY_ADDRESS = ISTESTNET
  ? '0x99e7ad739dd689cc8df36ed24ae876a989238b6b' // Actual testnet factory address
  : '0x0000000000000000000000000000000000000000'; // Replace with actual mainnet factory address

// Mirror Node API URL - Use ISTESTNET flag
export const MIRROR_NODE_URL = ISTESTNET
  ? 'https://testnet.mirrornode.hedera.com'
  : 'https://mainnet.mirrornode.hedera.com';

export const SAUCERSWAP_API_URL = ISTESTNET
  ? 'https://test-api.saucerswap.finance'
  : 'https://api.saucerswap.finance';
// --- End Exports ---

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
    this.chainId = CURRENT_CHAIN_ID;
    this.tokenId = tokenId;
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
    this.address = hederaTokenIdToEvmAddress(tokenId);
  }

  public equals(other: HederaToken): boolean {
    return this.tokenId === other.tokenId;
  }
}

// Hedera token definitions
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
  [HEDERA_TESTNET_CHAIN_ID]: 'https://hashscan.io/testnet',
  [HEDERA_MAINNET_CHAIN_ID]: 'https://hashscan.io/mainnet',
};

// SaucerSwap API URL
export const SAUCERSWAP_TESTNET_API_URL = 'https://test-api.saucerswap.finance';
export const SAUCERSWAP_MAINNET_API_URL = 'https://api.saucerswap.finance';

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
