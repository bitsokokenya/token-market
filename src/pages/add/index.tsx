import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { HederaToken } from '../../utils/tokens';

import NewPosition from '../../components/AddLiquidity/NewPosition';
import SearchInput from '../../components/AddLiquidity/SearchInput';
import ExistingPools from '../../components/AddLiquidity/ExistingPools';

import { useChainId } from '../../hooks/useChainId';
import { loadTokens, findTokens, TokenListItem } from '../../components/AddLiquidity/utils';
import { useHashConnect } from '../../providers/HashConnectProvider';

import { FACTORY_TESTNET_ADDRESS,
   FACTORY_MAINNET_ADDRESS,
   HEDERA_MAINNET_RPC,
   HEDERA_TESTNET_RPC,
   ISTESTNET } from '../../common/constants';

import { ABI } from '../../abis/abi'


// Import the Hedera ID to EVM address conversion function
function hederaIdToEvmAddress(hederaId: string): string {
  // If it's already an EVM address, return as is
  if (hederaId.startsWith('0x')) {
    return hederaId;
  }

  // Parse the Hedera ID
  const parts = hederaId.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid Hedera ID format: ${hederaId}`);
  }

  // Get the last number which is the account/token number
  const number = parseInt(parts[2], 10);
  
  // Convert to hex and pad to 40 characters (20 bytes)
  const hex = number.toString(16).padStart(40, '0');
  
  return `0x${hex}`;
}

// Add function to check if a pool exists and get creation fee
async function checkIfPoolExists(
  token0: string, 
  token1: string, 
  fee: number, 
  isTestnet = ISTESTNET
): Promise<{ exists: boolean; address: string | null; feeInHbar?: string; error?: any }> {
  try {
    // Get appropriate network configuration based on environment
    // accordion start step 1
    const networkConfig = isTestnet 
      ? {
          rpcUrl: HEDERA_TESTNET_RPC,
          factoryAddress: FACTORY_TESTNET_ADDRESS,
          chainId: 296
        }
      : {
          rpcUrl: HEDERA_MAINNET_RPC,
          factoryAddress: FACTORY_MAINNET_ADDRESS,
          chainId: 295
        };
    
    // ethers provider
    const ethers = require('ethers');
    const provider = new ethers.providers.JsonRpcProvider(
      networkConfig.rpcUrl,
      {
        name: isTestnet ? 'hedera-testnet' : 'hedera-mainnet',
        chainId: networkConfig.chainId,
      }
    );
    
    // Create contract interface
    const factoryInterface = new ethers.utils.Interface(ABI);
    
    // Initialize the factory contract
    const factoryContract = new ethers.Contract(
      networkConfig.factoryAddress, 
      factoryInterface, 
      provider
    );


    // Convert Hedera token IDs to EVM addresses
    const token0Evm = hederaIdToEvmAddress(token0);
    const token1Evm = hederaIdToEvmAddress(token1);
    
    // Call getPool function to check if pool exists
    const poolAddress = await factoryContract.getPool(token0Evm, token1Evm, fee);
    
    // If the pool doesn't exist, this will be the zero address
    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      console.log({ exists: false, address: null, });
      //return { exists: false, address: null };
    }
    
    console.log({ exists: true, address: poolAddress });
    //return { exists: true, address: poolAddress };

    // accordion end step 1

    // accordion start step 2


    // Get pool creation fee in tinycent
    //const result = await factoryContract.mintFee();
    //const tinycent = Number(result);
    const tinycent = 3000;
    // Get the current exchange rate via REST API
    const url = `https://${isTestnet ? 'testnet' : 'mainnet'}.mirrornode.hedera.com/api/v1/network/exchangerate`;
    const response = await fetch(url);
    const data = await response.json();
    const currentRate = data.current_rate;
    const centEquivalent = Number(currentRate.cent_equivalent);
    const hbarEquivalent = Number(currentRate.hbar_equivalent);
    const centToHbarRatio = centEquivalent/hbarEquivalent;

    // Calculate the fee in terms of HBAR
    const tinybar = Math.floor(tinycent / centToHbarRatio);
    const poolCreateFeeInHbar = (tinybar / 100_000_000).toFixed(8); // Convert tinybar to HBAR


    console.log({ feeInHbar: poolCreateFeeInHbar });

    // accordion end step 2

    // accordion start step 3


  } catch (error) {
    console.error('Error checking if pool exists:', error);
    return { exists: false, address: null, error };
  }
}

function AddLiquidity() {
  //const chainId = useChainId();
  const chainId = 296;
  const { query } = useRouter();
  const router = useRouter();
  const { baseToken: baseTokenSymbol, quoteToken: quoteTokenSymbol, fee, tab } = query;
  const { accountId } = useHashConnect();

  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Add state for pool existence
  const [poolStatus, setPoolStatus] = useState<{
    checking: boolean;
    exists: boolean | null;
    address: string | null;
  }>({
    checking: false,
    exists: null,
    address: null
  });

  // Set active tab based on URL query
  useEffect(() => {
    if (tab === 'existing') {
      setActiveTab('existing');
    } else if (tab === 'new' || query.baseTokenId || query.quoteTokenId || baseTokenSymbol || quoteTokenSymbol) {
      setActiveTab('new');
    }
  }, [tab, query.baseTokenId, query.quoteTokenId, baseTokenSymbol, quoteTokenSymbol]);

  // Load tokens only once when chainId changes
  useEffect(() => {
    if (!chainId) return;

    const loadTokensData = async () => {
      try {
        setIsLoading(true);
        const results = await loadTokens(chainId as number);
        // Convert Token[] to TokenListItem[]
        const tokenListItems: TokenListItem[] = results.map(token => ({
          chainId: chainId as number,
          address: token.address,
          decimals: token.decimals,
          symbol: token.symbol || '',
          name: token.name || ''
        }));
        setTokens(tokenListItems);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading tokens:', error);
        setError('Failed to load tokens. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadTokensData();
  }, [chainId]);

  // Check if pool exists when token IDs and fee are provided
  useEffect(() => {
    if (!query.baseTokenId || !query.quoteTokenId || !query.fee) return;

    const checkPool = async () => {
      setPoolStatus(prev => ({ ...prev, checking: true }));
      try {
        // Determine if we're on testnet based on chain ID
        const isTestnet = chainId === 296; // 296 is Hedera Testnet
        
        const result = await checkIfPoolExists(
          query.baseTokenId as string,
          query.quoteTokenId as string,
          Number(query.fee),
          isTestnet
        );
        
        setPoolStatus({
          checking: false,
          exists: result.exists,
          address: result.address
        });
        
        console.log(`Pool ${result.exists ? 'exists' : 'does not exist'}`, 
          result.exists ? `at address ${result.address}` : '');
      } catch (error) {
        console.error('Error checking pool existence:', error);
        setPoolStatus({
          checking: false,
          exists: null,
          address: null
        });
      }
    };
    
    checkPool();
  }, [query.baseTokenId, query.quoteTokenId, query.fee, chainId]);

  // Handle direct token IDs if they are provided
  useEffect(() => {
    if (!chainId) return;
    
    // If direct token IDs are provided, use them without matching
    if (query.baseTokenId && query.quoteTokenId) {
      console.log('Using direct token IDs:', query.baseTokenId, query.quoteTokenId);
      
      // Try to find the token details in our loaded tokens list
      const findTokenDetails = (tokenId: string) => {
        const matchingToken = tokens.find(t => t.address === tokenId);
        return {
          address: tokenId,
          decimals: matchingToken?.decimals || 8, // Default to 8 decimals if not found
          symbol: matchingToken?.symbol || tokenId.split('.').pop() || 'Token', // Use last part of ID as symbol
          name: matchingToken?.name || `Token ${tokenId}` // Use ID in name
        };
      };
      
      // Get token details if available, or use defaults
      const baseTokenDetails = findTokenDetails(query.baseTokenId as string);
      const quoteTokenDetails = findTokenDetails(query.quoteTokenId as string);
      
      // Update URL with all required parameters
      const url = new URL(window.location.href);
      
      // Keep the original IDs in the URL
      url.searchParams.set('baseTokenId', query.baseTokenId as string);
      url.searchParams.set('quoteTokenId', query.quoteTokenId as string);
      
      // Add additional parameters needed by the form
      url.searchParams.set('baseTokenDecimals', baseTokenDetails.decimals.toString());
      url.searchParams.set('quoteTokenDecimals', quoteTokenDetails.decimals.toString());
      url.searchParams.set('baseTokenSymbol', baseTokenDetails.symbol);
      url.searchParams.set('quoteTokenSymbol', quoteTokenDetails.symbol);
      url.searchParams.set('baseTokenName', baseTokenDetails.name);
      url.searchParams.set('quoteTokenName', quoteTokenDetails.name);
      url.searchParams.set('initFee', query.fee as string || '3000');
      
      window.history.replaceState({}, '', url.toString());
      return;
    }
    
    // Only run symbol matching if we have tokens loaded and symbols to match
    if (!tokens.length || !baseTokenSymbol || !quoteTokenSymbol) return;

    try {
      const matches = findTokens(chainId as number, tokens, [
        baseTokenSymbol as string,
        quoteTokenSymbol as string,
      ]);

      if (matches.length !== 2) {
        setError(`Could not find tokens: ${baseTokenSymbol}, ${quoteTokenSymbol}`);
        return;
      }

      // Update URL with token IDs
      const url = new URL(window.location.href);
      
      // Make sure we use Hedera format addresses
      url.searchParams.set('baseTokenId', matches[0].address);
      url.searchParams.set('quoteTokenId', matches[1].address);
      url.searchParams.set('baseTokenDecimals', matches[0].decimals.toString());
      url.searchParams.set('quoteTokenDecimals', matches[1].decimals.toString());
      url.searchParams.set('baseTokenSymbol', matches[0].symbol);
      url.searchParams.set('quoteTokenSymbol', matches[1].symbol);
      url.searchParams.set('baseTokenName', matches[0].name);
      url.searchParams.set('quoteTokenName', matches[1].name);
      url.searchParams.set('initFee', fee as string || '3000');
      
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Error setting tokens:', error);
      setError('Error setting tokens. Please verify token parameters.');
    }
  }, [chainId, tokens, baseTokenSymbol, quoteTokenSymbol, fee, query.baseTokenId, query.quoteTokenId]);

  const handlePoolClick = (baseToken: any, quoteToken: any, fee: number, positions: any[]) => {
    // Get token IDs, preserving the Hedera format (0.0.xxxxx)
    const baseTokenId = baseToken.tokenId;
    const quoteTokenId = quoteToken.tokenId;
    
    console.log('Router pushing to add page with:', {
      baseTokenId,
      quoteTokenId,
      fee
    });
    
    router.push({
      pathname: '/add',
      query: {
        baseTokenId: baseTokenId,
        quoteTokenId: quoteTokenId,
        fee: fee,
        tab: 'new' // Force switch to the "new" tab
      },
    });
  };

  // Render pool status message
  const renderPoolStatus = () => {
    if (poolStatus.checking) {
      return (
        <div className="flex items-center mb-4 p-4 bg-blue-50 text-blue-700 rounded">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Checking if pool exists...
        </div>
      );
    }
    
    if (poolStatus.exists === true) {
      return (
        <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded">
          <p>
            <span className="font-bold">✓ Pool exists!</span> {' '}
            You can add liquidity to the existing pool at address: {poolStatus.address}
          </p>
        </div>
      );
    }
    
    if (poolStatus.exists === false) {
      return (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
          <p>
            <span className="font-bold">⚠ Pool does not exist yet.</span> {' '}
            You will be creating a new liquidity pool with these tokens.
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full h-full">
      <div className="w-full flex justify-between py-4 border-b border-element-10 mb-8">
        <div className="w-2/3 flex items-center">
          <h2 className="font-bold text-1.25 text-high">Add Liquidity</h2>
        </div>
      </div>

      {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex border-b border-element-10 mb-4">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'new'
              ? 'text-purple-700 border-b-2 border-purple-700'
              : 'text-medium hover:text-high'
          }`}
          onClick={() => setActiveTab('new')}
        >
          New Position
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'existing'
              ? 'text-purple-700 border-b-2 border-purple-700'
              : 'text-medium hover:text-high'
          }`}
          onClick={() => setActiveTab('existing')}
        >
          Existing Positions
        </button>
      </div>

      {activeTab === 'new' && (
        <>
          <div className="w-full">
            <SearchInput onChange={setSearchInput} />
          </div>

          {/* Pool Status Message */}
          {query.baseTokenId && query.quoteTokenId && renderPoolStatus()}

          <div className="w-full mt-4">
            {query.baseTokenId && query.quoteTokenId ? (
              // Log outside the JSX for debugging
              (() => {
                console.log('Rendering NewPosition with:', {
                  baseTokenId: query.baseTokenId,
                  quoteTokenId: query.quoteTokenId,
                  fee: query.initFee || query.fee || 3000
                });
                
                return (
                  <NewPosition
                    baseTokenId={query.baseTokenId as string}
                    quoteTokenId={query.quoteTokenId as string}
                    baseTokenDecimals={Number(query.baseTokenDecimals || 8)}
                    quoteTokenDecimals={Number(query.quoteTokenDecimals || 8)}
                    baseTokenSymbol={query.baseTokenSymbol as string || 'Token0'}
                    quoteTokenSymbol={query.quoteTokenSymbol as string || 'Token1'}
                    baseTokenName={query.baseTokenName as string || 'Base Token'}
                    quoteTokenName={query.quoteTokenName as string || 'Quote Token'}
                    initFee={Number(query.initFee || query.fee || 3000)}
                    positions={null}
                    onCancel={() => window.history.back()}
                    poolExists={poolStatus.exists}
                    poolAddress={poolStatus.address}
                  />
                );
              })()
            ) : isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>Select tokens to add liquidity or provide token IDs directly in URL</p>
                <p className="text-xs text-medium mt-2">Example: /add?baseTokenId=0.0.xxxxx&quoteTokenId=0.0.yyyyy&fee=3000</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'existing' && (
        <div className="w-full mt-4">
          <ExistingPools
            chainId={chainId || 0}
            filter={searchInput}
            onPoolClick={handlePoolClick}
          />
        </div>
      )}
    </div>
  );
}

export default AddLiquidity;
