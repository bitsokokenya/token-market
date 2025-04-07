/*
sends an api request to saucerswap api to add new position to the pool



*/


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, ContractInterface } from '@ethersproject/contracts';
import * as ethers from 'ethers';
import { 
  ContractExecuteTransaction, 
  ContractFunctionParameters,
  Hbar 
} from "@hashgraph/sdk";

import { useChainId } from '../../hooks/useChainId';
import { useTokenFunctions } from '../../hooks/useTokenFunctions';
import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';
import { useHashConnect } from '../../providers/HashConnectProvider';
import PoolButton from '../../components/PoolButton';
import TokenLabel from '../../components/TokenLabel';
import Alert, { AlertLevel } from '../../components/Alert/Alert';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';
import ChartButton from './ChartButton';
import FeeTierData from './FeeTierData';
import RangeData from './RangeData';

import { ABI } from '../../abis/abi'
import {
  DEFAULT_SLIPPAGE,
  ZERO_PERCENT,
  ISTESTNET,
  SAUCERSWAP_API_URL,
  FACTORY_ADDRESS,
  HEDERA_RPC_URL,
  MIRROR_NODE_URL
} from '../../common/constants';

import { formatInput } from '../../utils/numbers';
import { 
  HederaToken, 
  CurrencyAmount, 
  getNativeToken, 
  isNativeToken, 
  parseTokenAmount,
  formatDisplayAmount
} from '../../utils/tokens';

import RangeInput from './RangeInput';
import DepositInput from './DepositInput';
import FeeButton from './FeeButton';
import TransactionModal from '../../components/TransactionModal';
import { useFetchPositions } from '../../hooks/fetch';
import { Position as FetchPosition } from '../../hooks/fetch';

// Custom minimal Pool implementation
class SimplePool {
  public readonly token0: HederaToken;
  public readonly token1: HederaToken;
  public readonly fee: number;
  public readonly tickSpacing: number;
  public readonly tickCurrent: number;
  public readonly liquidity: string;
  public readonly sqrtPriceX96: string;

  constructor(
    token0: HederaToken,
    token1: HederaToken,
    fee: number,
    sqrtPriceX96: string,
    liquidity: string,
    tickCurrent: number
  ) {
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.tickCurrent = tickCurrent;
    this.liquidity = liquidity;
    this.sqrtPriceX96 = sqrtPriceX96;
    
    // Set tickSpacing based on fee tier
    if (fee === 100) this.tickSpacing = 1;
    else if (fee === 500) this.tickSpacing = 10;
    else if (fee === 3000) this.tickSpacing = 60;
    else if (fee === 10000) this.tickSpacing = 200;
    else this.tickSpacing = 60; // Default
  }

  // Helper method to get price ratio between tokens
  getPrice(): number {
    // Simple price calculation based on tick - this is a simplification
    return Math.pow(1.0001, this.tickCurrent);
  }

  // Check if two tokens are the same
  equals(other: SimplePool): boolean {
    return (
      this.token0.equals(other.token0) &&
      this.token1.equals(other.token1) &&
      this.fee === other.fee
    );
  }
}

// Constants for tick math
const MIN_TICK = -887272;
const MAX_TICK = 887272;

// Global pool data interface
interface PoolData {
  exists: boolean;
  address: string | null;
  fee: number;
  token0: string;
  token1: string;
  liquidity: string;
  tickCurrent: number;
  sqrtPriceX96: string;
  positions?: any[]; // Add positions array to pool data
}

// Add proper type definitions
interface Position {
  token0: {
    id: string;
  };
  token1: {
    id: string;
  };
  fee: number;
  deleted: boolean;
  liquidity: {
    gt: (value: number) => boolean;
  };
}

interface AlertComponentProps {
  level: AlertLevel;
  children: React.ReactNode;
  onClose?: () => void;
}

interface FeeButtonComponentProps {
  fee: number;
  onChange: (newFee: number) => void;
  disabled: boolean;
}

interface RangeInputComponentProps {
  pool: SimplePool;
  tickLower: number;
  tickUpper: number;
  onTickLowerChange: (value: number) => void;
  onTickUpperChange: (value: number) => void;
  disabled: boolean;
}

interface RangeDataComponentProps {
  pool: SimplePool;
  chainId: number;
  tickLower: number;
  tickUpper: number;
  baseToken: HederaToken;
  quoteToken: HederaToken;
}

interface DepositInputComponentProps {
  token: HederaToken;
  amount: number;
  onChange: (value: number) => void;
  balance: string;
  disabled: boolean;
}

interface Props {
  baseTokenId: string; // Hedera token ID in 0.0.XXXXX format
  quoteTokenId: string; // Hedera token ID in 0.0.XXXXX format
  baseTokenDecimals: number;
  quoteTokenDecimals: number;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  baseTokenName: string;
  quoteTokenName: string;
  initFee: number;
  positions: any[] | null;
  onCancel: () => void;
  poolExists?: boolean | null; // Pool existence status
  poolAddress?: string | null; // Pool address if it exists
}

// Helper function to get pool data from SaucerSwap API
async function getPoolData(token0Id: string, token1Id: string, fee: number, isTestnet: boolean): Promise<PoolData | null> {
  try {
    // Verify this path segment -> "/v2/pools/"
    const apiUrl = `${SAUCERSWAP_API_URL}/v2/pools/`;
    console.log(`Fetching pool data from: ${apiUrl}`); // Check console output
    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    const pools = await response.json();

    // Find matching pool
    const matchingPool = pools.find((pool: any) => {
      const tokenAId = pool.tokenA.id;
      const tokenBId = pool.tokenB.id;
      const poolFee = pool.fee;
      
      return (
        ((tokenAId === token0Id && tokenBId === token1Id) ||
         (tokenAId === token1Id && tokenBId === token0Id)) &&
        poolFee === fee
      );
    });

    if (matchingPool) {
      // Fetch positions using the correct API URL constant
      const positionsUrl = `${SAUCERSWAP_API_URL}/v2/positions?poolId=${matchingPool.contractId}`;
      console.log(`Fetching positions from: ${positionsUrl}`); // Add log for debugging
      const positionsResponse = await fetch(positionsUrl);
      const positionsData = await positionsResponse.json();

      return {
        exists: true,
        address: matchingPool.contractId,
        fee: matchingPool.fee,
        token0: matchingPool.tokenA.id,
        token1: matchingPool.tokenB.id,
        liquidity: matchingPool.liquidity,
        tickCurrent: matchingPool.tickCurrent,
        sqrtPriceX96: matchingPool.sqrtRatioX96,
        positions: positionsData?.positions || [] // Use optional chaining and provide default
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting pool data from API:', error);
    return null;
  }
}

// Helper function to get pool address from ethers
async function getPoolAddressFromEthers(
  token0Id: string,
  token1Id: string,
  fee: number,
  networkConfig: any
): Promise<string | null> {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      networkConfig.rpcUrl,
      {
        name: networkConfig.isTestnet ? 'hedera-testnet' : 'hedera-mainnet',
        chainId: networkConfig.chainId,
      }
    );

    const factoryInterface = new ethers.utils.Interface(ABI);
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS,
      factoryInterface,
      provider
    );

    const token0Evm = hederaIdToEvmAddress(token0Id);
    const token1Evm = hederaIdToEvmAddress(token1Id);

    const poolAddress = await factoryContract.getPool(token0Evm, token1Evm, fee);
    return poolAddress !== '0x0000000000000000000000000000000000000000' ? poolAddress : null;
  } catch (error) {
    console.error('Error getting pool address from ethers:', error);
    return null;
  }
}

// Convert Hedera ID to proper EVM address format
const hederaIdToEvmAddress = (hederaId: string): string => {
  // If it's already an EVM address, return as is
  if (hederaId && hederaId.startsWith('0x') && hederaId.length >= 40) {
    return hederaId;
  }
  
  try {
    // Parse the Hedera ID (assuming format like 0.0.12345)
    const parts = hederaId.split('.');
    if (parts.length === 3) {
      // Get the last number which is the account/token number
      const number = parseInt(parts[2], 10);
      // Convert to hex and pad to 40 characters (20 bytes)
      const hex = number.toString(16).padStart(40, '0');
      return `0x${hex}`;
    } else {
      // If not in Hedera format but looks like a number
      const number = parseInt(hederaId, 10);
      if (!isNaN(number)) {
        const hex = number.toString(16).padStart(40, '0');
        return `0x${hex}`;
      }
    }
  } catch (e) {
    console.error("Error converting Hedera ID to EVM address:", e);
  }
  
  throw new Error(`Invalid token address format: ${hederaId}`);
};

// Placeholder for the missing function - needs implementation
async function calculatePoolCreateFee(isTestnet: boolean): Promise<string> {
  console.warn("calculatePoolCreateFee function needs implementation");
  return "0 HBAR"; // Return a default value
}

// Placeholder for the missing function - needs implementation
async function getPoolAddress(token0Id: string, token1Id: string, fee: number): Promise<string | null> {
    console.warn("getPoolAddress function needs implementation");
    return null; // Return a default value
}

function NewPosition({ 
  baseTokenId,
  quoteTokenId,
  baseTokenDecimals,
  quoteTokenDecimals,
  baseTokenSymbol,
  quoteTokenSymbol,
  baseTokenName,
  quoteTokenName,
  initFee,
  positions,
  onCancel,
  poolExists: poolExistsProp,
  poolAddress: poolAddressProp
}: Props) {
  const chainId = useChainId();
  const { accountId, hashconnect } = useHashConnect();
  const router = useRouter();
  const positionId = router.query.position;
  const { convertToGlobalFormatted } = useCurrencyConversions();
  const NFT_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_SAUCERSWAP_NFT_MANAGER_ADDRESS || '0.0.123456';

  // Use the useFetchPositions hook
  const { loading: positionsLoading, positions: userPositions } = useFetchPositions(accountId);

  // Create token instances using HederaToken
  const baseToken = useMemo(() => {
    if (!baseTokenId || !baseTokenDecimals) {
      console.warn('Missing base token info', { baseTokenId, baseTokenDecimals });
      return null;
    }
    try {
      return new HederaToken(
        chainId, 
        baseTokenId, 
        baseTokenDecimals, 
        baseTokenSymbol, 
        baseTokenName
      );
    } catch (error: any) {
      console.error('Error creating base token:', error);
      setAlert({
        message: `Invalid base token: ${error.message}`,
        level: AlertLevel.Error,
      });
      return null;
    }
  }, [chainId, baseTokenId, baseTokenDecimals, baseTokenSymbol, baseTokenName]);

  const quoteToken = useMemo(() => {
    if (!quoteTokenId || !quoteTokenDecimals) {
      console.warn('Missing quote token info', { quoteTokenId, quoteTokenDecimals });
      return null;
    }
    try {
      return new HederaToken(
        chainId, 
        quoteTokenId, 
        quoteTokenDecimals, 
        quoteTokenSymbol, 
        quoteTokenName
      );
    } catch (error: any) {
      console.error('Error creating quote token:', error);
      setAlert({
        message: `Invalid quote token: ${error.message}`,
        level: AlertLevel.Error,
      });
      return null;
    }
  }, [chainId, quoteTokenId, quoteTokenDecimals, quoteTokenSymbol, quoteTokenName]);

  // State hooks
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [poolCreateFee, setPoolCreateFee] = useState<string>('Calculating...');
  const [depositWrapped, setDepositWrapped] = useState<boolean>(false);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [fee, setFee] = useState<number>(initFee || 3000);
  const [tickLower, setTickLower] = useState<number>(MIN_TICK);
  const [tickUpper, setTickUpper] = useState<number>(MAX_TICK);
  const [baseBalance, setBaseBalance] = useState<string>('0');
  const [quoteBalance, setQuoteBalance] = useState<string>('0');
  const [baseTokenDisabled, setBaseTokenDisabled] = useState<boolean>(false);
  const [quoteTokenDisabled, setQuoteTokenDisabled] = useState<boolean>(false);
  const [baseTokenAllowance, setBaseTokenAllowance] = useState<number>(0);
  const [quoteTokenAllowance, setQuoteTokenAllowance] = useState<number>(0);
  const [transactionPending, setTransactionPending] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [showFeeTierData, setShowFeeTierData] = useState<boolean>(false);
  const [showRangeData, setShowRangeData] = useState<boolean>(false);
  const [focusedRangeInput, setFocusedRangeInput] = useState<HTMLInputElement | null>(null);
  const [alert, setAlert] = useState<{ level: AlertLevel; message: string } | null>(null);
  const [pool, setPool] = useState<SimplePool | null>(null);

  // Global pool data state
  const [poolData, setPoolData] = useState<PoolData | null>(null);

  // Other hooks
  const { getBalances, getAllowances, approveToken } = useTokenFunctions(baseToken || undefined);

  // New state for loading status
  const [loadingPool, setLoadingPool] = useState<boolean>(false);

  // State for pool existence status
  const [internalPoolExists, setInternalPoolExists] = useState<boolean | null>(poolExistsProp === undefined ? null : poolExistsProp);

  // --- Define poolAddress state ---
  const [poolAddress, setPoolAddress] = useState<string | null>(poolAddressProp || null);

  // Step 1: Check if pool exists and get creation fee
  useEffect(() => {
    const checkPoolAndFee = async () => {
      if (!baseToken || !quoteToken) {
        console.log('Base or quote token not ready, skipping pool check.');
        return;
      }

      console.log('Tokens ready, proceeding with pool check and fee calculation.');
      setLoadingPool(true);
      setPoolData(null);
      setCurrentStep(1);
      // --- Use renamed state setter ---
      setInternalPoolExists(null);
      setPoolAddress(null); // Use the defined setter

      try {
        const feeHbar = await calculatePoolCreateFee(ISTESTNET);
        setPoolCreateFee(feeHbar);
        console.log('Pool create fee calculated:', feeHbar);

        const ethersPoolAddress = await getPoolAddressFromEthers(
          baseToken.address,
          quoteToken.address,
          fee,
          ISTESTNET
        );
        console.log('Ethers check result:', ethersPoolAddress);

        const apiPoolData = await getPoolData(
          baseToken.address,
          quoteToken.address,
          fee,
          ISTESTNET
        );
        console.log('API check result:', apiPoolData);

        if (apiPoolData) {
          console.log('Using API pool data');
          setPoolData(apiPoolData);
          // --- Use renamed state setter ---
          setInternalPoolExists(true);
          setPoolAddress(apiPoolData.address); // Use defined setter
          setCurrentStep(2);
        } else if (ethersPoolAddress) {
          console.log('API data missing, using ethers address. Pool likely exists but needs data fetch.');
          setPoolData({
            exists: true,
            address: ethersPoolAddress,
            fee: fee,
            token0: baseToken.address,
            token1: quoteToken.address,
            liquidity: '0',
            tickCurrent: 0,
            sqrtPriceX96: '0',
            positions: []
          });
          // --- Use renamed state setter ---
          setInternalPoolExists(true);
          setPoolAddress(ethersPoolAddress); // Use defined setter
          setCurrentStep(2);
        } else {
          console.log('Pool does not exist according to both methods.');
          // --- Use renamed state setter ---
          setInternalPoolExists(false);
          setPoolAddress(null); // Use defined setter
          setCurrentStep(2);
        }
      } catch (error: any) {
        console.error('Error checking pool existence or calculating fee:', error);
        setAlert({ level: AlertLevel.Error, message: `Error checking pool status: ${error.message}` });
        // --- Use renamed state setter ---
        setInternalPoolExists(false);
      } finally {
        setLoadingPool(false);
      }
    };

    checkPoolAndFee();

  }, [baseToken, quoteToken, fee, accountId]);

  // Initialize pool
  useEffect(() => {
    const initializePool = async () => {
      if (!baseToken || !quoteToken) return;
      
      // Use the state variable `poolAddress` which is set in the previous effect
      const currentPoolAddress = poolAddress;
      console.log('Initializing pool with address:', currentPoolAddress);

      // Fetch pool data only if address exists but poolData is not yet set
      let dataToUse = poolData;
      if (currentPoolAddress && !dataToUse) {
          console.log('Fetching pool data again for initialization as it was missing...');
          dataToUse = await getPoolData(baseToken.address, quoteToken.address, fee, ISTESTNET);
      }

      if (!dataToUse || !dataToUse.exists) {
          console.log('Pool data not available or pool does not exist, cannot initialize pool object yet.');
          // Maybe set pool to null explicitly if needed
          // setPool(null);
          return; // Don't proceed if pool data is missing
      }

      try {
        // Create simplified pool with the available data
        const newPool = new SimplePool(
          baseToken,
          quoteToken,
          fee,
          // Use optional chaining and provide default for potentially missing properties
          dataToUse.sqrtPriceX96 ?? '0',
          dataToUse.liquidity ?? '0',
          dataToUse.tickCurrent ?? 0
        );

        setPool(newPool);
        setShowFeeTierData(true); // Show fee tier data after pool is initialized
      } catch (error: any) { // Catch unknown error type
        console.error('Error initializing pool:', error);
        setAlert({
          message: `Error initializing pool: ${error.message || 'Unknown error'}`,
          level: AlertLevel.Error,
        });
      }
    };

    // Rerun initialization if poolData changes or if the determined address changes
    initializePool();
  }, [baseToken, quoteToken, fee, poolData, poolAddress]); // Depend on poolData and poolAddress state

  // Load balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!accountId || !baseToken || !quoteToken) return;
      
      console.log('Fetching balances for account:', accountId);
      try {
        const [bal0, bal1] = await Promise.all([
          getBalances(accountId),
          getBalances(accountId)
        ]);
        setBaseBalance(formatInput(parseFloat(bal0)));
        setQuoteBalance(formatInput(parseFloat(bal1)));
      } catch (error) {
        console.error('Error fetching balances:', error);
        setAlert({
          message: 'Failed to fetch token balances',
          level: AlertLevel.Error,
        });
      }
    };
    
    fetchBalances();
  }, [getBalances, accountId, baseToken, quoteToken]);

  // Check allowances
  useEffect(() => {
    const checkAllowances = async () => {
      if (!getAllowances || !accountId || !baseToken || !quoteToken) return;

      try {
        const [val0, val1] = await Promise.all([
          getAllowances(accountId, NFT_MANAGER_ADDRESS),
          getAllowances(accountId, NFT_MANAGER_ADDRESS)
        ]);
        setBaseTokenAllowance(Number(val0));
        setQuoteTokenAllowance(Number(val1));
      } catch (error) {
        console.error('Error checking allowances:', error);
        setAlert({
          message: 'Failed to check token allowances',
          level: AlertLevel.Error,
        });
      }
    };
    
    checkAllowances();
  }, [getAllowances, accountId, baseToken, quoteToken, NFT_MANAGER_ADDRESS]);

  // Check if tokens need approval
  const baseTokenNeedApproval = useMemo(() => {
    if (!baseToken) return false;
    return baseTokenAllowance < baseAmount;
  }, [baseToken, baseAmount, baseTokenAllowance]);

  const quoteTokenNeedApproval = useMemo(() => {
    if (!quoteToken) return false;
    return quoteTokenAllowance < quoteAmount;
  }, [quoteToken, quoteAmount, quoteTokenAllowance]);

  // Calculate total position value
  const totalPositionValue = useMemo(() => {
    if (!pool || !baseToken || !quoteToken) {
      return CurrencyAmount.fromRawAmount(baseToken || getNativeToken(), "0");
    }
    
    if (baseAmount <= 0 && quoteAmount <= 0) {
      return CurrencyAmount.fromRawAmount(baseToken, "0");
    }

    // Simple calculation for position value in base token
    const price = pool.getPrice(); 
    const quoteAmountInBase = quoteAmount * price;
    
    // Create currency amount for the total value
    return CurrencyAmount.fromRawAmount(
      baseToken,
      parseTokenAmount(baseAmount + quoteAmountInBase, baseToken)
    );
  }, [pool, baseToken, quoteToken, baseAmount, quoteAmount]);

  // Update amounts based on price and range
  const calculateAmounts = (quoteVal: number, baseVal: number) => {
    if (!pool || !baseToken || !quoteToken) return;
    
    if (tickLower === MIN_TICK || tickUpper === MAX_TICK) return;
    
    if (quoteVal === 0 && baseVal === 0) return;
    
    // This is a simplified calculation compared to Uniswap SDK
    // Adjust based on price and range to get approximate values
    const price = pool.getPrice();
    const currentTick = pool.tickCurrent;
    
    if (quoteVal > 0 && baseVal === 0) {
      // User entered quote amount, calculate base amount
      let baseAmount = 0;
      
      // If price is in range, calculate proportional amount
      if (currentTick >= tickLower && currentTick <= tickUpper) {
        baseAmount = quoteVal * price * 0.5; // Simplified 50/50 distribution
      } else if (currentTick < tickLower) {
        baseAmount = 0; // All in quote token
      } else if (currentTick > tickUpper) {
        baseAmount = quoteVal * price; // All in base token
      }
      
      setBaseAmount(baseAmount);
    } else if (baseVal > 0 && quoteVal === 0) {
      // User entered base amount, calculate quote amount
      let quoteAmount = 0;
      
      // If price is in range, calculate proportional amount
      if (currentTick >= tickLower && currentTick <= tickUpper) {
        quoteAmount = baseVal / price * 0.5; // Simplified 50/50 distribution
      } else if (currentTick < tickLower) {
        quoteAmount = baseVal / price; // All in quote token
      } else if (currentTick > tickUpper) {
        quoteAmount = 0; // All in base token
      }
      
      setQuoteAmount(quoteAmount);
    }
  };

  // Update tick ranges
  const tickLowerChange = (value: number) => {
    setTickLower(value);
    calculateAmounts(quoteAmount, baseAmount);
  };

  const tickUpperChange = (value: number) => {
    setTickUpper(value);
    calculateAmounts(quoteAmount, baseAmount);
  };

  // Handle deposit input changes
  const quoteDepositChange = (value: number) => {
    setQuoteAmount(value);
    calculateAmounts(value, 0);
  };

  const baseDepositChange = (value: number) => {
    setBaseAmount(value);
    calculateAmounts(0, value);
  };

  // Get current price for display
  const currentPrice = useMemo(() => {
    if (!pool || !baseToken || !quoteToken) {
      return '0';
    }

    return formatInput(pool.getPrice(), false, pool.tickSpacing === 1 ? 8 : 4);
  }, [pool, baseToken, quoteToken]);

  // Handle transaction errors
  const handleTxError = (e: any) => {
    console.error(e);
    if (e.error) {
      setAlert({
        message: `Transaction failed. (reason: ${e.error.message} code: ${e.error.code})`,
        level: AlertLevel.Error,
      });
    } else if (e.data) {
      setAlert({
        message: `Transaction failed. (reason: ${e.data.message} code: ${e.data.code})`,
        level: AlertLevel.Error,
      });
    } else if (e.message) {
      setAlert({
        message: `Transaction failed. (reason: ${e.message} code: ${e.code})`,
        level: AlertLevel.Error,
      });
    } else {
      setAlert({
        message: e.toString(),
        level: AlertLevel.Error,
      });
    }
  };

  // Add liquidity function
  const onAddLiquidity = async () => {
    if (!pool || !baseToken || !quoteToken || !accountId) return;

    setTransactionPending(true);

    try {
      console.log("Starting add liquidity process...");
      
      // Fetch current pool token ratio before proceeding
      console.log("Fetching current pool token ratio...");
      const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL);
      
      // Get poolId from state or fetch it
      let poolAddr = poolAddress;
      if (!poolAddr && pool) {
        try {
          poolAddr = await getPoolAddress(baseToken.address, quoteToken.address, fee);
          console.log('Got pool address for ratio check:', poolAddr);
        } catch (error) {
          console.warn('Could not get pool address for ratio check:', error);
        }
      }
      
      if (poolAddr) {
        try {
          // Load pool contract interface with minimal ABI for slot0 and liquidity
          const poolAbi = [
            'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
            'function liquidity() external view returns (uint128)'
          ];
          
          const abiInterface = new ethers.utils.Interface(poolAbi);
          const poolContract = new Contract(poolAddr, abiInterface, provider);
          
          // Get current pool data
          const [slot0, liquidity] = await Promise.all([
            poolContract.slot0(),
            poolContract.liquidity()
          ]);
          
          // Create tokens for SDK
          const token0 = { chainId, address: baseToken.address, decimals: baseToken.decimals };
          const token1 = { chainId, address: quoteToken.address, decimals: quoteToken.decimals };
          
          // Calculate and log price ratio
          console.log("Current pool data:", {
            sqrtPriceX96: slot0.sqrtPriceX96.toString(),
            tick: Number(slot0.tick),
            liquidity: liquidity.toString()
          });
          
          // Calculate price based on tick (simplified)
          const currentPrice = Math.pow(1.0001, Number(slot0.tick));
          console.log(`Current price ratio: ${currentPrice} ${quoteToken.symbol} per ${baseToken.symbol}`);
          console.log(`Current price ratio: ${1/currentPrice} ${baseToken.symbol} per ${quoteToken.symbol}`);
        } catch (error) {
          console.warn("Could not fetch current pool ratio:", error);
        }
      } else {
        console.log("No pool address available for ratio check - creating new pool");
      }

      // Validate balances
      console.log("Validating token balances...");
      if (quoteAmount > 0 && quoteAmount > parseFloat(quoteBalance)) {
        throw new Error(`You don't have enough ${quoteToken.symbol} to complete the transaction`);
      }

      if (baseAmount > 0 && baseAmount > parseFloat(baseBalance)) {
        throw new Error(`You don't have enough ${baseToken.symbol} to complete the transaction`);
      }

      // Calculate token amounts
      const baseTokenAmount = parseTokenAmount(baseAmount, baseToken);
      const quoteTokenAmount = parseTokenAmount(quoteAmount, quoteToken);

      // Calculate minimum amounts with 0.5% slippage
      const slippage = 0.995; // 0.5% slippage
      const baseTokenAmountMin = BigNumber.from(baseTokenAmount).mul(BigNumber.from(Math.floor(slippage * 1000))).div(BigNumber.from(1000)).toString();
      const quoteTokenAmountMin = BigNumber.from(quoteTokenAmount).mul(BigNumber.from(Math.floor(slippage * 1000))).div(BigNumber.from(1000)).toString();

      // Prepare parameters
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      // NFT Manager contract ID for SaucerSwap V2
      const nftManagerContractId = NFT_MANAGER_ADDRESS;
      
      if (!hashconnect) {
        throw new Error("HashConnect not initialized");
      }
      
      // Convert token addresses to proper EVM format
      console.log("Converting token addresses to EVM format");
      const baseTokenEvmAddress = hederaIdToEvmAddress(baseToken.address);
      const quoteTokenEvmAddress = hederaIdToEvmAddress(quoteToken.address);
      
      // Convert account ID to EVM format for the recipient parameter
      const accountIdEvmAddress = hederaIdToEvmAddress(accountId);
      
      console.log("EVM Addresses:", {
        baseToken: baseTokenEvmAddress,
        quoteToken: quoteTokenEvmAddress,
        account: accountIdEvmAddress
      });
      
      // Determine if we're adding to an existing position or creating a new one
      if (internalPoolExists && positionId) {
        // ADDING TO EXISTING POSITION
        console.log("Adding to existing position:", positionId);
        
        // Build parameters for increaseLiquidity function
        const params = new ContractFunctionParameters()
          .addUint256(Number(positionId)) // tokenSN (position ID)
          .addUint256(Number(baseTokenAmount))  // amount0Desired
          .addUint256(Number(quoteTokenAmount)) // amount1Desired
          .addUint256(Number(baseTokenAmountMin)) // amount0Min
          .addUint256(Number(quoteTokenAmountMin)) // amount1Min
          .addUint256(deadline); // deadline
        
        // Create the contract execute transaction
        const transaction = new ContractExecuteTransaction()
          .setContractId(nftManagerContractId)
          .setGas(330000) // Recommended gas for this operation
          .setFunction("increaseLiquidity", params)
          .setPayableAmount(new Hbar(0)); // Change if one token is HBAR
        
        console.log("Sending transaction to increase liquidity...");
        
        // Use HashConnect to sign and execute transaction
        try {
          const response = await hashconnect.sendTransaction(
            accountId,
            transaction
          );
          
          if (response && response.success) {
            setTransactionHash(response.response.transactionId);
            setAlert({
              message: 'Liquidity added successfully to existing position',
              level: AlertLevel.Success,
            });
          } else {
            throw new Error(response?.error || "Transaction failed");
          }
        } catch (txError) {
          console.error("HashConnect transaction error:", txError);
          throw new Error(`HashConnect transaction failed: ${txError}`);
        }
      } else {
        // CREATING A NEW POSITION
        console.log("Creating new position with tokens:", baseToken.address, quoteToken.address);
        
        // Build parameters for mint function
        const params = new ContractFunctionParameters()
          .addAddress(baseTokenEvmAddress) // token0 - use EVM format
          .addAddress(quoteTokenEvmAddress) // token1 - use EVM format
          .addUint24(fee) // fee tier
          .addInt24(tickLower) // tickLower
          .addInt24(tickUpper) // tickUpper
          .addUint256(Number(baseTokenAmount)) // amount0Desired
          .addUint256(Number(quoteTokenAmount)) // amount1Desired
          .addUint256(Number(baseTokenAmountMin)) // amount0Min
          .addUint256(Number(quoteTokenAmountMin)) // amount1Min
          .addAddress(accountIdEvmAddress) // recipient - use EVM format
          .addUint256(deadline); // deadline
        
        // Create the contract execute transaction
        const transaction = new ContractExecuteTransaction()
          .setContractId(nftManagerContractId)
          .setGas(600000) // Higher gas for new position creation
          .setFunction("mint", params)
          .setPayableAmount(new Hbar(0)); // Change if one token is HBAR
        
        console.log("Sending transaction to create new position...");
        
        // Use HashConnect to sign and execute transaction
        try {
          const response = await hashconnect.sendTransaction(
            accountId,
            transaction
          );
          
          if (response && response.success) {
            setTransactionHash(response.response.transactionId);
            setAlert({
              message: 'New liquidity position created successfully',
              level: AlertLevel.Success,
            });
          } else {
            throw new Error(response?.error || "Transaction failed");
          }
        } catch (txError) {
          console.error("HashConnect transaction error:", txError);
          throw new Error(`HashConnect transaction failed: ${txError}`);
        }
      }

    } catch (e: any) {
      handleTxError(e);
    } finally {
      setTransactionPending(false);
    }
  };

  // Approve token spending
  const onApprove = async (token: HederaToken, amount: number) => {
    setTransactionPending(true);
    try {
      // Calculate token amount with decimals
      const tokenAmount = parseTokenAmount(amount, token);

      // Send approval transaction to SaucerSwap API
      const response = await fetch('/api/saucerswap/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          tokenAddress: token.address,
          spender: NFT_MANAGER_ADDRESS,
          amount: tokenAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve token');
      }

      const result = await response.json();
      setTransactionHash(result.transactionHash);

      setAlert({
        message: 'Token approval confirmed.',
        level: AlertLevel.Success,
      });
      
      // Refresh allowances
      if (baseToken && token.equals(baseToken)) {
        setBaseTokenAllowance(amount);
      } else {
        setQuoteTokenAllowance(amount);
      }
    } catch (e: any) {
      handleTxError(e);
    } finally {
      setTransactionPending(false);
    }
  };

  // UI interaction handlers
  const resetAlert = () => {
    setAlert(null);
  };

  const handleCurrentPriceClick = () => {
    if (focusedRangeInput) {
      const curLength = focusedRangeInput.value.length;
      focusedRangeInput.setRangeText(currentPrice, 0, curLength, 'start');
      focusedRangeInput.dispatchEvent(new Event('input', { bubbles: true }));
      focusedRangeInput.focus();
    }
  };

  const handleFeeTierDataClick = () => {
    setShowFeeTierData(!showFeeTierData);
  };

  const handleRangeDataClick = () => {
    setShowRangeData(!showRangeData);
  };

  const toggleDepositWrapped = () => {
    setDepositWrapped(!depositWrapped);
  };

  // Update pool status display with proper typing
  const poolStatusDisplay = useMemo(() => {
    if (!poolData) {
      return (
        <div className="text-yellow-600">
          ⚠ New pool will be created (Fee: {poolCreateFee} HBAR)
        </div>
      );
    }

    // Filter positions for this specific pool with proper typing
    const poolPositions = userPositions.filter((position: FetchPosition) => {
      const positionToken0Id = position.token0.id;
      const positionToken1Id = position.token1.id;
      const positionFee = position.fee;
      
      return (
        ((positionToken0Id === poolData.token0 && positionToken1Id === poolData.token1) ||
         (positionToken0Id === poolData.token1 && positionToken1Id === poolData.token0)) &&
        positionFee === poolData.fee &&
        !position.deleted &&
        !position.liquidity.isZero()
      );
    });

    const hasActivePositions = poolPositions.length > 0;

    return (
      <div className="space-y-2">
        <div className="text-green-600">
          ✓ Pool exists at address: {poolData.address}
        </div>
        {hasActivePositions && (
          <div className="text-blue-600">
            • {poolPositions.length} active position{poolPositions.length !== 1 ? 's' : ''} in this pool
          </div>
        )}
      </div>
    );
  }, [poolData, poolCreateFee, userPositions]);

  // Add debug logging before the return null check
  if (!pool || !baseToken || !quoteToken) {
    console.log('NewPosition returning null because:', {
      hasPool: !!pool,
      hasBaseToken: !!baseToken,
      hasQuoteToken: !!quoteToken
    });
    return null;
  }

  return (
    <div className="w-full">
      {alert && (
        <Alert level={alert.level} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Step 1: Pool Status */}
      <div className={`mb-4 p-4 bg-gray-50 rounded-lg ${currentStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Step 1: Pool Status</h3>
          {currentStep > 1 && <span className="text-green-500">✓</span>}
        </div>
        {poolStatusDisplay}
      </div>

      {/* Step 2: Fee Selection */}
      <div className={`mb-4 ${currentStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Step 2: Select Fee Tier</h3>
          {currentStep > 2 && <span className="text-green-500">✓</span>}
        </div>
        <FeeButton
          fee={fee}
          onChange={(newFee: number) => {
            setFee(newFee);
            setCurrentStep(3);
          }}
          disabled={currentStep < 2}
        />
        {showFeeTierData && <FeeTierData fee={fee} />}
      </div>

      {/* Step 3: Range Selection */}
      <div className={`mb-4 ${currentStep >= 3 ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Step 3: Set Price Range</h3>
          {currentStep > 3 && <span className="text-green-500">✓</span>}
        </div>
        <RangeInput
          pool={pool}
          tickLower={tickLower}
          tickUpper={tickUpper}
          onTickLowerChange={tickLowerChange}
          onTickUpperChange={tickUpperChange}
          disabled={currentStep < 3}
        />
        {showRangeData && (
          <RangeData
            pool={pool}
            chainId={chainId}
            tickLower={tickLower}
            tickUpper={tickUpper}
            baseToken={baseToken}
            quoteToken={quoteToken}
          />
        )}
      </div>

      {/* Step 4: Deposit Amounts */}
      <div className={`mb-4 ${currentStep >= 4 ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Step 4: Enter Deposit Amounts</h3>
        </div>
        <DepositInput
          token={baseToken}
          amount={baseAmount}
          onChange={setBaseAmount}
          balance={baseBalance}
          disabled={currentStep < 4}
        />
        <DepositInput
          token={quoteToken}
          amount={quoteAmount}
          onChange={setQuoteAmount}
          balance={quoteBalance}
          disabled={currentStep < 4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-4">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button 
          onClick={onAddLiquidity}
          disabled={currentStep < 4 || !baseAmount || !quoteAmount}
        >
          Add Liquidity
        </Button>
      </div>

      {/* Transaction Modal */}
      {transactionPending && (
        <TransactionModal
          hash={transactionHash}
          onClose={() => setTransactionPending(false)}
        />
      )}
    </div>
  );
}

export default NewPosition;
