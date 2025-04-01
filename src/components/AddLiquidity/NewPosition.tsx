/*
sends an api request to saucerswap api to add new position to the pool



*/


import React, { useState, useEffect, useMemo } from 'react';
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

import {
  DEFAULT_SLIPPAGE,
  ZERO_PERCENT,
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

// Helper function to get pool address from SaucerSwap API
async function getPoolAddress(token0Id: string, token1Id: string, fee: number): Promise<string> {
  try {
    const response = await fetch('/api/saucerswap/pool-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token0Address: token0Id,
        token1Address: token1Id,
        fee
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get pool address');
    }

    const { poolAddress } = await response.json();
    return poolAddress;
  } catch (error) {
    console.error('Error getting pool address:', error);
    throw error;
  }
}

// Helper to find nearest tick that's divisible by tick spacing
function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  if (rounded < MIN_TICK) return MIN_TICK;
  if (rounded > MAX_TICK) return MAX_TICK;
  return rounded;
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
  poolExists,
  poolAddress
}: Props) {
  const chainId = useChainId();
  const { accountId, hashconnect } = useHashConnect();
  const router = useRouter();
  const positionId = router.query.position;
  const { convertToGlobalFormatted } = useCurrencyConversions();
  const NFT_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_SAUCERSWAP_NFT_MANAGER_ADDRESS || '0.0.123456';

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
  const [depositWrapped, setDepositWrapped] = useState<boolean>(false);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [fee, setFee] = useState<number>(initFee);
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
  const [alert, setAlert] = useState<{ message: string; level: AlertLevel } | null>(null);
  const [pool, setPool] = useState<SimplePool | null>(null);

  // Other hooks
  const { getBalances, getAllowances, approveToken } = useTokenFunctions(baseToken || undefined);

  // Initialize pool
  useEffect(() => {
    const initializePool = async () => {
      if (!baseToken || !quoteToken) return;
      
      try {
        // Set up provider
        const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL);

        // If we already know the pool address from the parent component, use it
        // otherwise, get it from the API
        let poolAddr;
        if (poolExists === true && poolAddress) {
          poolAddr = poolAddress;
          console.log('Using existing pool address:', poolAddr);
        } else {
          poolAddr = await getPoolAddress(baseTokenId, quoteTokenId, fee);
          console.log('Got pool address from API:', poolAddr);
        }

        // Get pool data from API
        const response = await fetch(`/api/saucerswap/pool-info?poolId=${poolAddr}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pool info');
        }

        const poolData = await response.json();
        
        // Create simplified pool with the available data
        const newPool = new SimplePool(
          baseToken,
          quoteToken,
          fee,
          poolData.sqrtRatioX96 || '1',
          poolData.liquidity || '0',
          poolData.tickCurrent || 0
        );

        setPool(newPool);

        // Set initial ticks based on current price to create a reasonable range
        const currentTick = newPool.tickCurrent;
        const spacing = newPool.tickSpacing;
        
        // Create a range of ±5% from current price
        // This is a simplified approach compared to Uniswap's implementation
        const rangeSize = 10 * spacing; // Approximately ±5% range
        
        const tickLowerApprox = currentTick - rangeSize;
        const tickUpperApprox = currentTick + rangeSize;

        setTickLower(nearestUsableTick(tickLowerApprox, spacing));
        setTickUpper(nearestUsableTick(tickUpperApprox, spacing));

      } catch (error) {
        console.error('Error initializing pool:', error);
        setAlert({
          message: 'Failed to initialize pool - please check the token pair is valid',
          level: AlertLevel.Error,
        });
      }
    };

    if (baseTokenId && quoteTokenId) {
      console.log('Initializing pool with tokens:', {
        baseTokenId,
        quoteTokenId,
        fee
      });
      initializePool();
    }
  }, [baseToken, quoteToken, baseTokenId, quoteTokenId, fee, poolExists, poolAddress]);

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
      if (poolExists && positionId) {
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
    <div className="w-full flex text-high">
      <div className="lg:w-1/2">
        <div className="flex flex-col my-2">
          <div className="text-xl">Pair</div>
          <div className="w-80 my-2 p-2 text-lg border rounded border-blue-400 dark:border-slate-700 bg-blue-100 dark:bg-slate-700">
            <PoolButton
              baseToken={baseToken}
              quoteToken={quoteToken}
              onClick={() => {}}
              tabIndex={0}
              size="md"
            />
          </div>
        </div>

        <div className="w-72 flex flex-col my-3">
          <div className="flex items-center justify-between">
            <div className="text-xl">Fee tier</div>
            <div className="mx-2">
              <ChartButton selected={showFeeTierData} onClick={handleFeeTierDataClick} />
            </div>
          </div>
          <div className="my-2 flex justify-between">
            <FeeButton fee={0.01} selected={fee === 100} onClick={() => setFee(100)} tabIndex={1} />
            <FeeButton fee={0.05} selected={fee === 500} onClick={() => setFee(500)} tabIndex={2} />
            <FeeButton
              fee={0.3}
              selected={fee === 3000}
              onClick={() => setFee(3000)}
              tabIndex={3}
            />
            <FeeButton
              fee={1}
              selected={fee === 10000}
              onClick={() => setFee(10000)}
              tabIndex={4}
            />
          </div>
        </div>

        <div className="flex flex-col my-2 w-5/6">
          <div className="flex items-center justify-between">
            <div className="text-xl">Range</div>
            <div className="px-6">
              <ChartButton selected={showRangeData} onClick={handleRangeDataClick} />
            </div>
          </div>

          <div className="py-1 text-center">
            Current price:{' '}
            <button onClick={handleCurrentPriceClick} className="font-bold">
              {currentPrice}&nbsp;
            </button>
            <TokenLabel name={baseToken.name} symbol={baseToken.symbol} />
          </div>
          <div className="w-1/3 my-2 flex justify-between">
            <RangeInput
              label="Min"
              initTick={tickLower}
              baseToken={baseToken}
              quoteToken={quoteToken}
              tickSpacing={pool.tickSpacing}
              tabIndex={4}
              reverse={false}
              onChange={tickLowerChange}
              onFocus={(el) => setFocusedRangeInput(el)}
            />
            <RangeInput
              label="Max"
              initTick={tickUpper}
              baseToken={baseToken}
              quoteToken={quoteToken}
              tickSpacing={pool.tickSpacing}
              tabIndex={5}
              reverse={false}
              onChange={tickUpperChange}
              onFocus={(el) => setFocusedRangeInput(el)}
            />
          </div>
        </div>

        <div className="flex flex-col my-6">
          <div className="lg:w-3/4 flex justify-between">
            <div className="text-xl">Deposit</div>
          </div>
          <div className="lg:w-3/4 my-2">
            <DepositInput
              token={quoteToken}
              value={quoteAmount}
              balance={quoteBalance}
              tabIndex={6}
              disabled={quoteTokenDisabled}
              wrapped={depositWrapped}
              onChange={quoteDepositChange}
              onWrapToggle={toggleDepositWrapped}
            />
            <DepositInput
              token={baseToken}
              value={baseAmount}
              balance={baseBalance}
              tabIndex={7}
              disabled={baseTokenDisabled}
              wrapped={depositWrapped}
              onChange={baseDepositChange}
              onWrapToggle={toggleDepositWrapped}
            />
          </div>
          <div className="w-64 mb-2 text-sm">
            Total position value:{' '}
            <span className="font-bold">{convertToGlobalFormatted(totalPositionValue)}</span>
          </div>
        </div>

        <div className="w-64 my-2 flex">
          {baseTokenNeedApproval ? (
            <Button
              onClick={() => onApprove(baseToken, baseAmount)}
              disabled={transactionPending}
              tabIndex={8}
              size="lg"
              className="mr-2"
            >
              Approve {baseToken.symbol}
            </Button>
          ) : quoteTokenNeedApproval ? (
            <Button
              onClick={() => onApprove(quoteToken, quoteAmount)}
              disabled={transactionPending}
              tabIndex={8}
              size="lg"
              className="mr-2"
            >
              Approve {quoteToken.symbol}
            </Button>
          ) : (
            <Button
              onClick={onAddLiquidity}
              disabled={transactionPending}
              tabIndex={8}
              size="lg"
              className="mr-2"
            >
              Add some Liquidity
            </Button>
          )}

          <Button variant="ghost" onClick={onCancel} tabIndex={9}>
            Cancel
          </Button>

          {alert && (
            <Alert level={alert.level} onHide={resetAlert}>
              {alert.message}
            </Alert>
          )}

          {transactionPending && (
            <TransactionModal chainId={chainId} transactionHash={transactionHash} />
          )}
        </div>
      </div>

      <div className="lg:w-1/2">
        <div className="h-64">
          {showFeeTierData && (
            <FeeTierData
              chainId={chainId}
              baseToken={baseToken}
              quoteToken={quoteToken}
              currentValue={fee}
            />
          )}
        </div>

        {showRangeData && (
          <div>
            <RangeData
              chainId={chainId}
              tickLower={tickLower}
              tickUpper={tickUpper}
              baseToken={baseToken}
              quoteToken={quoteToken}
              pool={pool}
            />
          </div>
        )}
      </div>

      {/* Pool status indicator - only show if we have the info */}
      {poolExists !== null && (
        <div className={`mb-4 p-4 rounded ${
          poolExists 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          <p>
            {poolExists ? (
              <>
                <span className="font-bold">✓ Adding to existing pool</span>
                {poolAddress && <span className="text-xs block mt-1">Pool Address: {poolAddress}</span>}
              </>
            ) : (
              <span className="font-bold">⚠ Creating a new liquidity pool with these tokens</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default NewPosition;
