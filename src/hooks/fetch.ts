import { useState, useEffect } from 'react';
import { uniqBy } from 'lodash';
import { BigNumber } from '@ethersproject/bignumber';
import { useHashConnect } from '../providers/HashConnectProvider';
import { AccountBalanceQuery, Long, TokenId } from '@hashgraph/sdk';
import { Client } from '@hashgraph/sdk';

import { TxTypes } from '../types/enums';
import { SAUCERSWAP_TESTNET_API_URL, SAUCERSWAP_MAINNET_API_URL } from '../common/constants';

export interface TransactionV2 {
  id: string;
  tokenId: number;
  amount0: string;
  amount1: string;
  transactionType: number;
  liquidity: string;
  transactionHash: string;
  timestamp: string;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  l1Fee?: string;
}

export interface PositionStateV2 {
  positionId: number;
  tickLower: number;
  tickUpper: number;
  pool: string;
  owner: string;
  liquidity: BigNumber;
  transactions: TransactionV2[];
}

export interface PoolStateV2 {
  address: string;
  tickSpacing: number;
  fee: number;
  token0: any;
  token1: any;
  sqrtPriceX96: string;
  liquidity: string;
  tick: number;
}

interface UncollectedFeesInputPosition {
  tokenId: number;
  tickLower: number;
  tickUpper: number;
}

interface UncollectedFeesInput {
  address: string;
  currentTick: number;
  positions: UncollectedFeesInputPosition[];
}

interface UncollectedFeesResult {
  tokenId: number;
  amount0: number;
  amount1: number;
}

export interface TokenBalance {
  address: string;
  balance: string;
  metadata: { symbol: string; name: string; logo: string; decimals: number };
  priceTick: number | null;
}

export interface PoolData {
  id: number;
  contractId: string;
  tokenA: {
    decimals: number;
    icon: string;
    id: string;
    name: string;
    price: string;
    priceUsd: number;
    symbol: string;
    dueDiligenceComplete: boolean;
    isFeeOnTransferToken: boolean;
    description: string;
    website: string;
    twitterHandle: string;
    timestampSecondsLastListingChange: number;
  };
  tokenB: {
    decimals: number;
    icon: string;
    id: string;
    name: string;
    price: string;
    priceUsd: number;
    symbol: string;
    dueDiligenceComplete: boolean;
    isFeeOnTransferToken: boolean;
    description: string;
    website: string;
    twitterHandle: string;
    timestampSecondsLastListingChange: number;
  };
  amountA: string;
  amountB: string;
  fee: number;
  sqrtRatioX96: string;
  tickCurrent: number;
  liquidity: string;
}

export interface Position {
  tokenSN: number;
  accountId: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  token0: {
    decimals: number;
    icon: string;
    id: string;
    name: string;
    price: string;
    priceUsd: number;
    symbol: string;
    dueDiligenceComplete: boolean;
    isFeeOnTransferToken: boolean;
    description: string;
    website: string;
    twitterHandle: string;
    timestampSecondsLastListingChange: number;
  };
  token1: {
    decimals: number;
    icon: string;
    id: string;
    name: string;
    price: string;
    priceUsd: number;
    symbol: string;
    dueDiligenceComplete: boolean;
    isFeeOnTransferToken: boolean;
    description: string;
    website: string;
    twitterHandle: string;
    timestampSecondsLastListingChange: number;
  };
  fee: number;
  tickUpper: number;
  tickLower: number;
  liquidity: {
    isZero: () => boolean;
    toString: () => string;
    gte: (other: any) => boolean;
  };
  feeGrowthInside0LastX128: string;
  feeGrowthInside1LastX128: string;
  tokensOwed0: string;
  tokensOwed1: string;
  positionId: number;
  transactions?: {
    id: string;
    transactionHash: string;
    transactionType: string;
    amount0: string;
    amount1: string;
    gas: string;
    gasUsed?: string;
    gasPrice?: string;
    effectiveGasPrice?: string;
    l1Fee?: string;
    timestamp: string;
  }[];
}

export function useFetchPositions(accountId: string | null) {
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { connected } = useHashConnect();

  useEffect(() => {
    const fetchPositions = async () => {
      // Don't fetch if wallet is not connected or no accountId
      if (!connected || !accountId) {
        console.log('Wallet not connected or no accountId, skipping fetch');
        setPositions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `${SAUCERSWAP_TESTNET_API_URL}/v2/nfts/${accountId}/positions`;
        console.log('Fetching positions from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch positions: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        /*
        sample response:
        [
  {
    "tokenSN": 160,
    "accountId": "0.0.12345",
    "deleted": false,
    "createdAt": "1697779560.762467685",
    "updatedAt": "1698287867.747005303",
    "token0": {
      "decimals": 8,
      "icon": "/images/tokens/hbar.png",
      "id": "0.0.59042",
      "name": "WHBAR [new]",
      "price": "100000000",
      "priceUsd": 0.0598982,
      "symbol": "HBAR",
      "dueDiligenceComplete": true,
      "isFeeOnTransferToken": false,
      "description": "Hedera is a public, open source, proof-of-stake network, with native cryptocurrency HBAR...",
      "website": "https://hedera.com/",
      "twitterHandle": "hedera",
      "timestampSecondsLastListingChange": 0
    },
    "token1": {
      "decimals": 6,
      "icon": "/images/tokens/sauce.png",
      "id": "0.0.61266",
      "name": "SAUCE",
      "price": "24609831",
      "priceUsd": 0.0147408436767304,
      "symbol": "SAUCE",
      "dueDiligenceComplete": true,
      "isFeeOnTransferToken": false,
      "description": "SaucerSwap is an open source and non-custodial AMM protocol native to Hedera...",
      "website": "https://www.saucerswap.finance/",
      "twitterHandle": "SaucerSwapLabs",
      "timestampSecondsLastListingChange": 1
    },
    "fee": 3000,
    "tickUpper": -1620,
    "tickLower": -2820,
    "liquidity": "3249809842",
    "feeGrowthInside0LastX128": "2546890053379859378523505791149585",
    "feeGrowthInside1LastX128": "1232345435623984092384092380932840",
    "tokensOwed0": "10",
    "tokensOwed1": "20"
  }
]
        */
        console.log('Raw API Response:', data);

        // Check if data is an array
        if (!Array.isArray(data)) {
          console.error('API Response is not an array:', data);
          throw new Error('Invalid API response format');
        }

        // Validate and transform the data
        const validPositions = data.filter((position: Position) => {
          const isValid = position &&
            position.tokenSN &&
            position.accountId &&
            position.token0 &&
            position.token1 &&
            !position.deleted;

          if (!isValid) {
            console.log('Invalid position found:', position);
          }

          return isValid;
        });

        console.log('Valid positions found:', validPositions.length);
        setPositions(validPositions);
      } catch (err) {
        console.error('Error fetching positions:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch positions'));
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure wallet is fully initialized
    const timeoutId = setTimeout(fetchPositions, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [accountId, connected]);

  return { loading, positions, error };
}

export function useFetchPools(
  chainId: number,
  addresses: string[],
): { loading: boolean; poolStates: PoolStateV2[] } {
  const [loading, setLoading] = useState(true);
  const [poolStates, setPoolStates] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const _call = async () => {
      console.log('Fetching pools:', {
        chainId,
        addressesLength: addresses.length,
        addresses,
        isFetchingAll: addresses.includes('all')
      });

      if (!isMounted) return;
      setLoading(true);

      try {
        const url = `${SAUCERSWAP_TESTNET_API_URL}/v2/pools/full`;
        console.log('Fetching from URL:', url);
        const res = await fetch(url);

        /*
        sample response:
        [
  {
    "id": 1,
    "contractId": "0.0.3948521",
    "tokenA": {
      "decimals": 6,
      "icon": "/images/tokens/usdc.png",
      "id": "0.0.456858",
      "name": "USD Coin",
      "price": "1678944894",
      "priceUsd": 1.00375771,
      "symbol": "USDC",
      "dueDiligenceComplete": true,
      "isFeeOnTransferToken": false,
      "description": "USDC is a fully collateralized U.S. dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges...",
      "website": "https://www.circle.com/en/usdc-multichain/hedera",
      "twitterHandle": "circle",
      "timestampSecondsLastListingChange": 0
    },
    "tokenB": {
      "decimals": 6,
      "icon": "/images/tokens/usdc.png",
      "id": "0.0.1055459",
      "name": "USD Coin",
      "price": "1681384187",
      "priceUsd": 1.00521604,
      "symbol": "USDC[hts]",
      "dueDiligenceComplete": true,
      "isFeeOnTransferToken": false,
      "description": "USDC is a fully collateralized U.S. dollar stablecoin...",
      "website": "https://www.circle.com/en/usdc-multichain/ethereum",
      "twitterHandle": "circle",
      "timestampSecondsLastListingChange": 0
    },
    "amountA": "6313040",
    "amountB": "6313042",
    "fee": 500,
    "sqrtRatioX96": "79228162514992909706099547250",
    "tickCurrent": 0,
    "liquidity": "10878982596"
  }
]

        */
        if (!res.ok) {
          console.error('Failed to fetch pools:', {
            status: res.status,
            statusText: res.statusText
          });
          if (isMounted) {
            setPoolStates([]);
            setLoading(false);
          }
          return;
        }

        const pools = await res.json();
        console.log('Received pools:', {
          totalPools: pools.length,
          samplePool: pools[0]
        });


        // Filter pools if not fetching all
        const filteredPools = addresses.includes('all') 
          ? pools 
          : pools.filter((pool: any) => addresses.includes(pool.contractId.toLowerCase()));

        const formattedPools = filteredPools.map((pool: any) => ({
          address: pool.contractId,
          tickSpacing: 1, // SaucerSwap uses fixed tick spacing
          fee: pool.fee,
          token0: {
            address: pool.tokenA.id,
            decimals: pool.tokenA.decimals,
            symbol: pool.tokenA.symbol,
            name: pool.tokenA.name,
          },
          token1: {
            address: pool.tokenB.id,
            decimals: pool.tokenB.decimals,
            symbol: pool.tokenB.symbol,
            name: pool.tokenB.name,
          },
          sqrtPriceX96: pool.sqrtRatioX96,
          liquidity: pool.liquidity,
          tick: pool.tickCurrent,
        }));

        console.log('Formatted pools:', {
          totalFormattedPools: formattedPools.length,
          sampleFormattedPool: formattedPools[0],
          isFetchingAll: addresses.includes('all')
        });

        if (isMounted) {
          setPoolStates(formattedPools);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching pools:', error);
        if (isMounted) {
          setPoolStates([]);
          setLoading(false);
        }
      }
    };

    if (!addresses.length) {
      console.log('No addresses provided, skipping pool fetch');
      setPoolStates([]);
      setLoading(false);
      return;
    }

    _call();

    return () => {
      isMounted = false;
    };
  }, [chainId, addresses]);

  return { loading, poolStates };
}

export function useFetchUncollectedFees(
  chainId: number,
  pools: UncollectedFeesInput[],
): { loading: boolean; uncollectedFees: UncollectedFeesResult[][] } {
  const [loading, setLoading] = useState(true);
  const [uncollectedFees, setUncollectedFees] = useState<UncollectedFeesResult[][]>([]);

  useEffect(() => {
    const _call = async () => {
      setLoading(true);

      try {
        // For now, we'll return empty fees as SaucerSwap handles fees differently
        const emptyFees: UncollectedFeesResult[][] = pools.map(() => []);
        setUncollectedFees(emptyFees);
      } catch (error) {
        console.error('Error fetching uncollected fees:', error);
        setUncollectedFees([]);
      } finally {
        setLoading(false);
      }
    };

    if (!pools.length) {
      setUncollectedFees([]);
      setLoading(false);
      return;
    }

    _call();
  }, [chainId, pools]);

  return { loading, uncollectedFees };
}

export function useFetchPriceFeed(
  chainId: number,
  tokens: string[],
  timestamp?: number,
): { loading: boolean; priceFeed: { [pool: string]: number } } {
  const [loading, setLoading] = useState(true);
  const [priceFeedResult, setPriceFeedResult] = useState({});

  useEffect(() => {
    const _call = async () => {
      setLoading(true);

      try {
        const url = `${SAUCERSWAP_TESTNET_API_URL}/v2/pools/full`;
        const res = await fetch(url);
        if (!res.ok) {
          console.error('Failed to fetch price feed');
          setPriceFeedResult({});
          setLoading(false);
          return;
        }

        const pools = await res.json();
        const priceFeed: { [pool: string]: number } = {};

        pools.forEach((pool: any) => {
          if (pool.tokenA && pool.tokenB) {
            priceFeed[pool.contractId] = parseFloat(pool.tokenA.priceUsd) / parseFloat(pool.tokenB.priceUsd);
          }
        });

        setPriceFeedResult(priceFeed);
      } catch (error) {
        console.error('Error fetching price feed:', error);
        setPriceFeedResult({});
      } finally {
        setLoading(false);
      }
    };

    _call();
  }, [chainId, tokens, timestamp]);

  return { loading, priceFeed: priceFeedResult };
}

// Helper function to convert EVM address to Hedera native format
const convertEvmToHederaAddress = (evmAddress: string): string => {
  // Remove 0x prefix if present
  const cleanAddress = evmAddress.replace('0x', '');
  
  // Extract the last 8 characters which represent the account number
  const accountNumber = parseInt(cleanAddress.slice(-16), 16);
  
  // Return in Hedera native format (0.0.XXXXX)
  return `0.0.${accountNumber}`;
};

// Cache for token metadata
let tokenMetadataCache: Map<string, any> = new Map();
let lastTokenMetadataFetch: number = 0;
const TOKEN_METADATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to fetch and cache token metadata
async function fetchTokenMetadata(): Promise<Map<string, any>> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (now - lastTokenMetadataFetch < TOKEN_METADATA_CACHE_DURATION && tokenMetadataCache.size > 0) {
    return tokenMetadataCache;
  }

  try {
    const response = await fetch(`${SAUCERSWAP_TESTNET_API_URL}/tokens/full`);
    if (!response.ok) {
      throw new Error('Failed to fetch token metadata');
    }
    const tokens = await response.json();

    // Clear old cache
    tokenMetadataCache.clear();

    // Create new cache
    tokens.forEach((token: any) => {
      tokenMetadataCache.set(token.id, {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: token.icon,
        price: token.price,
        priceUsd: token.priceUsd,
        description: token.description,
        website: token.website,
        twitterHandle: token.twitterHandle
      });
    });

    lastTokenMetadataFetch = now;
    return tokenMetadataCache;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    // If there's an error but we have cached data, return it
    if (tokenMetadataCache.size > 0) {
      return tokenMetadataCache;
    }
    throw error;
  }
}

export function useFetchTokenBalances(
  chainId: number,
  address: string | null,
): { loading: boolean; tokenBalances: TokenBalance[] } {
  const [loading, setLoading] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const { accountId, hashconnect } = useHashConnect();

  useEffect(() => {
    const _call = async () => {
      if (!address) {
        setTokenBalances([]);
        return;
      }

      setLoading(true);
      try {
        // Get token metadata from cache or fetch if needed
        const tokenMetadataMap = await fetchTokenMetadata();

        // Use the accountId from HashConnect provider if available, otherwise fallback to the provided address
        
        // To-Do
        // if targetAddress is not a valid Hedera address, search  from tokenMetadataMap where the symbol or name is the same as the targetAddress
        // if found, set targetAddress to the Hedera address
        // if not found, set targetAddress to null
        // check if targetAddress is a valid Hedera address
        //get address from url. for example
        //  ?addr=0.0....
        // if found, set address to the Hedera address
        // if not found, set address to null
        const urlParams = new URLSearchParams(window.location.search);
        var address = urlParams.get('addr');
        address = address || accountId;
        console.log('address', address, 'accountId', accountId);
        
        console.log(JSON.stringify(Array.from(tokenMetadataMap.values())),address);

        if (!address.startsWith('0.0.')) {
          const foundToken = Array.from(tokenMetadataMap.values()).find(token => token.symbol === address || token.name === address);
          if (foundToken) {
            address = foundToken.id;
          }
        }
        const targetAddress = address;

        

        console.log('url', urlParams.get('addr'),'address', address, 'accountId', accountId);










        if (!targetAddress) {
          console.error('No account ID available');
          setTokenBalances([]);
          setLoading(false);
          return;
        }

        // Create a client instance
        const client = Client.forTestnet();
        
        // Create the query
        const query = new AccountBalanceQuery()
          .setAccountId(targetAddress);

        // Execute the query
        const balance = await query.execute(client);

        if (!balance.tokens) {
          setTokenBalances([]);
          setLoading(false);
          return;
        }

        // Format the token balances
        const formattedBalances: TokenBalance[] = [];
        const tokenIds = Array.from(balance.tokens.keys());
        
        tokenIds.forEach((tokenId: TokenId) => {
          const tokenBalance = balance.tokens?.get(tokenId);
          const tokenIdStr = tokenId.toString();
          const metadata = tokenMetadataMap.get(tokenIdStr) || {
            symbol: 'Unknown',
            name: 'Unknown Token',
            decimals: 18,
            logo: '',
            price: '0',
            priceUsd: 0
          };

          if (tokenBalance) {
            formattedBalances.push({
              address: tokenIdStr,
              balance: tokenBalance.toString(),
              metadata: {
                symbol: metadata.symbol,
                name: metadata.name,
                logo: metadata.logo,
                decimals: metadata.decimals
              },
              priceTick: null
            });
          }
        });

        setTokenBalances(formattedBalances);
      } catch (error) {
        console.error('Error fetching token balances:', error);
        setTokenBalances([]);
      } finally {
        setLoading(false);
      }
    };

    if (!address && !accountId) {
      setTokenBalances([]);
      setLoading(false);
      return;
    }

    _call();
  }, [chainId, address, accountId]);

  return { loading, tokenBalances };
}

export function useFetchPoolData(poolId: number): { loading: boolean; poolData: PoolData | null } {
  const [loading, setLoading] = useState(true);
  const [poolData, setPoolData] = useState<PoolData | null>(null);

  useEffect(() => {
    const _call = async () => {
      setLoading(true);

      try {
        const url = `${SAUCERSWAP_TESTNET_API_URL}/v2/pools/${poolId}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.error('Failed to fetch pool data');
          setPoolData(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setPoolData(data);
      } catch (error) {
        console.error('Error fetching pool data:', error);
        setPoolData(null);
      } finally {
        setLoading(false);
      }
    };

    if (!poolId) {
      setPoolData(null);
      setLoading(false);
      return;
    }

    _call();
  }, [poolId]);

  return { loading, poolData };
}

export function useFilteredPools(
  pools: any[],
  positions: Position[],
  showOnlyUserPositions: boolean
): any[] {
  // If we're showing all pools or have no positions data, return all pools
  if (!showOnlyUserPositions || !positions.length) {
    return pools;
  }

  // Extract token pairs from positions
  const userPositionPairs = positions.map(position => ({
    token0Id: position.token0.id,
    token1Id: position.token1.id
  }));

  // Filter pools to only include those where the user has a position
  return pools.filter(pool => {
    // Extract pool token IDs
    const poolTokenAId = pool.token0?.address || pool.tokenA?.id;
    const poolTokenBId = pool.token1?.address || pool.tokenB?.id;

    // Check if any user position matches this pool's tokens (in either order)
    return userPositionPairs.some(
      pair => (
        // Check both possible token orderings
        (pair.token0Id === poolTokenAId && pair.token1Id === poolTokenBId) ||
        (pair.token0Id === poolTokenBId && pair.token1Id === poolTokenAId)
      )
    );
  });
}
