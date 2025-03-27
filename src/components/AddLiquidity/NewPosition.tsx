import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { TickMath, tickToPrice, Position, nearestUsableTick, priceToClosestTick, Pool } from '@uniswap/v3-sdk';
import { Token, CurrencyAmount, Fraction, Percent, Price } from '@uniswap/sdk-core';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, ContractInterface } from '@ethersproject/contracts';
import V3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import * as ethers from 'ethers';

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
import { getNativeToken, isNativeToken, HederaToken } from '../../utils/tokens';

import RangeInput from './RangeInput';
import DepositInput from './DepositInput';
import FeeButton from './FeeButton';
import TransactionModal from '../../components/TransactionModal';
import {
  positionFromAmounts,
  calculateNewAmounts,
  positionDistance,
  tokenAmountNeedApproval,
  toCurrencyAmount,
  findMatchingPosition,
  findPositionById,
} from './utils';

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
}

// Helper function to get pool address from SaucerSwap API
async function getPoolAddress(token0Id: string, token1Id: string, fee: number): Promise<string> {
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
  onCancel 
}: Props) {
  // Move all hooks to the top
  const chainId = useChainId();
  const { accountId } = useHashConnect();
  const router = useRouter();
  const positionId = router.query.position;
  const { convertToGlobalFormatted } = useCurrencyConversions();

  // Create token instances using HederaToken
  const baseToken = new HederaToken(chainId, baseTokenId, baseTokenDecimals, baseTokenSymbol, baseTokenName);
  const quoteToken = new HederaToken(chainId, quoteTokenId, quoteTokenDecimals, quoteTokenSymbol, quoteTokenName);

  // State hooks
  const [depositWrapped, setDepositWrapped] = useState<boolean>(false);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [fee, setFee] = useState<number>(initFee);
  const [tickLower, setTickLower] = useState<number>(TickMath.MIN_TICK);
  const [tickUpper, setTickUpper] = useState<number>(TickMath.MIN_TICK);
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
  const [pool, setPool] = useState<any>(null);

  // Other hooks
  const { getBalances, getAllowances, approveToken } = useTokenFunctions(baseToken);

  // Initialize pool
  useEffect(() => {
    const initializePool = async () => {
      try {
        // Set up provider
        const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL);

        // Get pool contract
        const poolAddress = await getPoolAddress(baseTokenId, quoteTokenId, fee);
        console.log('Pool address:', poolAddress);

        // Create pool contract instance
        const poolContract = new Contract(poolAddress, V3PoolABI.abi as ContractInterface, provider);

        // Get pool data
        const [slot0, poolLiquidity] = await Promise.all([
          poolContract.slot0(),
          poolContract.liquidity()
        ]);

        // Construct pool using the token instances
        const newPool = new Pool(
          baseToken,
          quoteToken,
          fee,
          slot0.sqrtPriceX96.toString(),
          poolLiquidity.toString(),
          Number(slot0.tick)
        );

        setPool(newPool);

        // Set initial ticks based on current price
        const currentPrice = newPool.token0Price;
        const multiplier = new Fraction(105, 100); // 5% range
        const priceFraction = currentPrice.asFraction.multiply(multiplier);
        const upperPrice = new Price(
          currentPrice.baseCurrency,
          currentPrice.quoteCurrency,
          priceFraction.denominator,
          priceFraction.numerator
        );

        const tickUpperApprox = priceToClosestTick(upperPrice);
        const tickDelta = tickUpperApprox - newPool.tickCurrent;
        const tickLowerApprox = newPool.tickCurrent - tickDelta;

        setTickUpper(nearestUsableTick(tickUpperApprox, newPool.tickSpacing));
        setTickLower(nearestUsableTick(tickLowerApprox, newPool.tickSpacing));

      } catch (error) {
        console.error('Error initializing pool:', error);
        setAlert({
          message: 'Failed to initialize pool',
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
  }, [baseTokenId, quoteTokenId, fee]);

  useEffect(() => {
    const _run = async () => {
      if (!accountId) return;
      
      console.log('Fetching balances for account:', accountId);
      console.log('Using tokens:', {
        baseToken: baseToken.address,
        quoteToken: quoteToken.address
      });

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
    _run();
  }, [getBalances, accountId, baseToken, quoteToken]);

  useEffect(() => {
    if (!getAllowances || !accountId) {
      return;
    }

    const _run = async () => {
      // Use the NFT manager contract address from SaucerSwap
      const spender = process.env.NEXT_PUBLIC_SAUCERSWAP_NFT_MANAGER_ADDRESS;
      if (!spender) {
        console.error('NFT manager address not configured');
        return;
      }

      console.log('Checking allowances:', {
        accountId,
        spender,
        baseToken: baseToken.address,
        quoteToken: quoteToken.address
      });

      try {
        const [val0, val1] = await Promise.all([
          getAllowances(accountId, spender),
          getAllowances(accountId, spender)
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

    _run();
  }, [getAllowances, accountId, baseToken, quoteToken]);

  const rangeReverse = useMemo(() => {
    if (!quoteToken || !baseToken) {
      return false;
    }

    return baseToken.sortsBefore(quoteToken);
  }, [quoteToken, baseToken]);

  const suggestedTicks = useMemo(() => {
    let tickLower = TickMath.MIN_TICK;
    let tickUpper = TickMath.MIN_TICK;
    if (!pool) {
      return [tickLower, tickUpper];
    }

    const { tickCurrent, tickSpacing } = pool;
    if (!positions || !positions.length) {
      tickLower = Math.round((tickCurrent - 10 * tickSpacing) / tickSpacing) * tickSpacing;
      tickUpper = Math.round((tickCurrent + 10 * tickSpacing) / tickSpacing) * tickSpacing;
    } else {
      const position = findPositionById(positions, positionId as string);
      if (position) {
        tickLower = position.entity.tickLower;
        tickUpper = position.entity.tickUpper;
      } else {
        let sortedPositions = positions.sort((posA, posB) => {
          const disA = positionDistance(tickCurrent, posA);
          const disB = positionDistance(tickCurrent, posB);
          return disA - disB;
        });

        tickLower = sortedPositions[0].entity.tickLower;
        tickUpper = sortedPositions[0].entity.tickUpper;
      }
    }

    if (rangeReverse) {
      return [tickUpper, tickLower];
    }
    return [tickLower, tickUpper];
  }, [pool, positions, rangeReverse, positionId]);

  useEffect(() => {
    setTickLower(suggestedTicks[0]);
    setTickUpper(suggestedTicks[1]);
  }, [suggestedTicks]);

  useEffect(() => {
    if (!pool || !baseToken || !quoteToken) {
      return;
    }

    const { tickCurrent } = pool;

    let [lower, upper] = [tickLower, tickUpper];
    if (rangeReverse) {
      [lower, upper] = [tickUpper, tickLower];
    }

    const token0Disabled = tickCurrent > upper;
    const token1Disabled = tickCurrent < lower;

    setBaseTokenDisabled(pool.token0.equals(baseToken) ? token0Disabled : token1Disabled);
    setQuoteTokenDisabled(pool.token1.equals(quoteToken) ? token1Disabled : token0Disabled);
  }, [pool, tickLower, tickUpper, baseToken, quoteToken, rangeReverse]);

  const baseTokenNeedApproval = useMemo(() => {
    if (!baseToken) {
      return false;
    }

    return tokenAmountNeedApproval(
      chainId,
      baseToken,
      baseTokenAllowance,
      baseAmount,
      depositWrapped,
    );
  }, [chainId, baseToken, baseAmount, baseTokenAllowance, depositWrapped]);

  const quoteTokenNeedApproval = useMemo(() => {
    if (!quoteToken) {
      return false;
    }

    return tokenAmountNeedApproval(
      chainId,
      quoteToken,
      quoteTokenAllowance,
      quoteAmount,
      depositWrapped,
    );
  }, [chainId, quoteToken, quoteAmount, quoteTokenAllowance, depositWrapped]);

  const totalPositionValue = useMemo(() => {
    if (!pool) {
      return CurrencyAmount.fromRawAmount(baseToken, 0);
    }

    const quoteRaw = Math.ceil(quoteAmount * Math.pow(10, quoteToken.decimals));
    const baseRaw = Math.ceil(baseAmount * Math.pow(10, baseToken.decimals));
    return pool
      .priceOf(quoteToken)
      .quote(CurrencyAmount.fromRawAmount(quoteToken, quoteRaw))
      .add(CurrencyAmount.fromRawAmount(baseToken, baseRaw));
  }, [pool, quoteToken, baseToken, baseAmount, quoteAmount]);

  const calculateBaseAndQuoteAmounts = (val0: number, val1: number) => {
    if (!pool) {
      return;
    }

    if (tickLower === TickMath.MIN_TICK || tickUpper === TickMath.MIN_TICK) {
      return;
    }

    if (val0 === 0 && val1 === 0) {
      return;
    }

    const [newQuoteAmount, newBaseAmount] = calculateNewAmounts(
      {
        pool,
        tickLower,
        tickUpper,
        val0,
        val1,
      },
      rangeReverse,
    );

    setQuoteAmount(newQuoteAmount);
    setBaseAmount(newBaseAmount);
  };

  const tickLowerChange = (value: number) => {
    setTickLower(value);
    calculateBaseAndQuoteAmounts(quoteAmount, baseAmount);
  };

  const tickUpperChange = (value: number) => {
    setTickUpper(value);
    calculateBaseAndQuoteAmounts(quoteAmount, baseAmount);
  };

  const quoteDepositChange = (value: number) => {
    setQuoteAmount(value);
    calculateBaseAndQuoteAmounts(value, 0);
  };

  const baseDepositChange = (value: number) => {
    setBaseAmount(value);
    calculateBaseAndQuoteAmounts(0, value);
  };

  const currentPrice = useMemo(() => {
    if (!pool || !baseToken || !quoteToken) {
      return '0';
    }

    const { tickCurrent } = pool;
    const price = parseFloat(tickToPrice(quoteToken, baseToken, tickCurrent).toSignificant(16));

    return formatInput(price, false, pool.tickSpacing === 1 ? 8 : 4);
  }, [pool, baseToken, quoteToken]);

  // Add debug logging before the return null check
  if (!pool || !baseToken || !quoteToken) {
    console.log('NewPosition returning null because:', {
      hasPool: !!pool,
      hasBaseToken: !!baseToken,
      hasQuoteToken: !!quoteToken
    });
    return null;
  }

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

  const onAddLiquidity = async () => {
    if (!pool || !baseToken || !quoteToken || !accountId) return;

    setTransactionPending(true);

    try {
      // Validate balances
      if (quoteAmount > 0 && quoteAmount > parseFloat(quoteBalance)) {
        throw new Error(`You don't have enough ${quoteToken.symbol} to complete the transaction`);
      }

      if (baseAmount > 0 && baseAmount > parseFloat(baseBalance)) {
        throw new Error(`You don't have enough ${baseToken.symbol} to complete the transaction`);
      }

      // Create position
      const position = Position.fromAmount0({
        pool,
        tickUpper,
        tickLower,
        amount0: BigNumber.from(baseAmount).mul(BigNumber.from(10).pow(baseToken.decimals)).toString(),
        useFullPrecision: true
      });

      // Get mint amounts
      const amount0Mint = position.mintAmounts.amount0.toString();
      const amount1Mint = position.mintAmounts.amount1.toString();

      // Calculate minimum amounts with slippage
      const slippageTolerance = baseTokenDisabled || quoteTokenDisabled ? ZERO_PERCENT : DEFAULT_SLIPPAGE;
      const minAmounts = position.mintAmountsWithSlippage(slippageTolerance);
      const amount0Min = minAmounts.amount0.toString();
      const amount1Min = minAmounts.amount1.toString();

      // Prepare parameters
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const params = {
        token0: baseToken.address,
        token1: quoteToken.address,
        fee,
        tickLower,
        tickUpper,
        amount0Desired: amount0Mint,
        amount1Desired: amount1Mint,
        amount0Min,
        amount1Min,
        recipient: accountId,
        deadline
      };

      // Send transaction to API
      const response = await fetch('/api/saucerswap/add-liquidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          params,
          deadline,
          slippageTolerance
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add liquidity');
      }

      const result = await response.json();
      setTransactionHash(result.transactionHash);

        setAlert({
        message: 'Liquidity added successfully',
          level: AlertLevel.Success,
        });

    } catch (e: any) {
      handleTxError(e);
    } finally {
      setTransactionPending(false);
    }
  };

  const onApprove = async (token: Token, amount: number, spender: string) => {
    setTransactionPending(true);
    try {
      // Send approval transaction to SaucerSwap API using Hedera account ID format
      const response = await fetch('/api/saucerswap/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId, // Already in Hedera format (0.0.XXXXX)
          tokenAddress: token.address, // Already in Hedera format
          spender, // Already in Hedera format (0.0.XXXXX)
          amount,
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
        setTransactionPending(false);
    } catch (e: any) {
      handleTxError(e);
      setTransactionPending(false);
    }
  };

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
              initTick={suggestedTicks[0]}
              baseToken={baseToken}
              quoteToken={quoteToken}
              tickSpacing={pool.tickSpacing}
              tabIndex={4}
              reverse={rangeReverse}
              onChange={tickLowerChange}
              onFocus={(el) => setFocusedRangeInput(el)}
            />
            <RangeInput
              label="Max"
              initTick={suggestedTicks[1]}
              baseToken={baseToken}
              quoteToken={quoteToken}
              tickSpacing={pool.tickSpacing}
              tabIndex={5}
              reverse={rangeReverse}
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
              onClick={() =>
                onApprove(baseToken, baseAmount, "0.0.123456") // Replace with actual Hedera contract ID
              }
              disabled={transactionPending}
              tabIndex={8}
              size="lg"
              className="mr-2"
            >
              Approve {baseToken.symbol}
            </Button>
          ) : quoteTokenNeedApproval ? (
            <Button
              onClick={() =>
                onApprove(quoteToken, quoteAmount, "0.0.123456") // Replace with actual Hedera contract ID
              }
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
              Add Liquidity
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
    </div>
  );
}

export default NewPosition;
