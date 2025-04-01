import { useMemo } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { Token, CurrencyAmount } from "@uniswap/sdk-core";
import { Pool as UniPool } from "@uniswap/v3-sdk";

import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';
import { HederaToken } from '../../utils/tokens';

import LoadingSpinner from "../../components/Spinner";
import Tooltip from "../../components/Tooltip";
import IconHelper from "../../components/icons/Helper";
import TokenLabel from "../../components/TokenLabel";
import { CustomPosition } from "../../types/seedle";
import { LABELS } from "../../common/constants";

interface TokenInfo {
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
}

interface PoolInfo {
  id: number;
  contractId: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  amountA: string;
  amountB: string;
  fee: number;
  sqrtRatioX96: string;
  tickCurrent: number;
  liquidity: string;
}

interface PoolProps {
  address: string;
  entity: UniPool;
  quoteToken?: Token;
  baseToken?: Token;
  rawPoolLiquidity: BigNumber;
  poolLiquidity: CurrencyAmount<Token>;
  currencyPoolUncollectedFees: CurrencyAmount<Token>[];
  poolUncollectedFees: CurrencyAmount<Token>;
  positions: CustomPosition[];
  poolInfo?: PoolInfo;
}

function Pool({
  address,
  entity,
  quoteToken,
  baseToken,
  positions,
  poolLiquidity,
  rawPoolLiquidity,
  currencyPoolUncollectedFees,
  poolUncollectedFees,
  poolInfo,
}: PoolProps) {
  const { convertToGlobalFormatted } = useCurrencyConversions();

  const totalValue = useMemo(() => {
    if (!poolLiquidity || !poolUncollectedFees) {
      return CurrencyAmount.fromRawAmount(entity.token0, "0");
    }
    return poolLiquidity.add(poolUncollectedFees);
  }, [poolLiquidity, poolUncollectedFees, entity.token0]);

  const distribution = useMemo(() => {
    let amount0 = CurrencyAmount.fromRawAmount(entity.token0, "0");
    let amount1 = CurrencyAmount.fromRawAmount(entity.token1, "0");

    positions.forEach((position) => {
      amount0 = amount0.add(position.entity.amount0);
      amount1 = amount1.add(position.entity.amount1);
    });

    return [amount0, amount1];
  }, [entity, positions]);

  const totalFees = useMemo(() => {
    if (!poolUncollectedFees) return CurrencyAmount.fromRawAmount(entity.token0, "0");
    return poolUncollectedFees;
  }, [poolUncollectedFees, entity.token0]);

  if (!baseToken || !quoteToken || !entity) {
    return (
      <div className="my-4 p-4 border rounded-md">
        <LoadingSpinner />
      </div>
    );
  }

  // Get token symbols with fallbacks
  const baseTokenSymbol = baseToken?.symbol || '???';
  const quoteTokenSymbol = quoteToken?.symbol || '???';

  return (
    <div className="space-y-6">
      {/* Pool Header */}
      <div className="bg-surface-0 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              <img 
                src={poolInfo?.tokenA?.icon || '/images/tokens/default.png'} 
                alt={poolInfo?.tokenA?.symbol || baseTokenSymbol}
                className="w-12 h-12 rounded-full border-2 border-surface-0"
              />
              <img 
                src={poolInfo?.tokenB?.icon || '/images/tokens/default.png'} 
                alt={poolInfo?.tokenB?.symbol || quoteTokenSymbol}
                className="w-12 h-12 rounded-full border-2 border-surface-0"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {poolInfo?.tokenA?.symbol || baseTokenSymbol}/{poolInfo?.tokenB?.symbol || quoteTokenSymbol}
              </h2>
              <p className="text-medium text-sm">Pool #{poolInfo?.id || 'Unknown'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-medium">Fee Tier</div>
            <div className="text-lg font-semibold">{poolInfo?.fee ? (poolInfo.fee / 10000).toFixed(2) : '0'}%</div>
          </div>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-0 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-medium">Total Liquidity</div>
          <div className="text-xl font-semibold mt-1">
            {poolLiquidity ? 
              // Convert to string to avoid type incompatibility
              convertToGlobalFormatted(poolLiquidity.toExact ? poolLiquidity.toExact() : '0') 
              : '0'
            }
          </div>
          <div className="text-sm text-medium mt-2">USD Value</div>
          <div className="text-lg">
            ${((Number(poolInfo?.amountA || 0) * (poolInfo?.tokenA?.priceUsd || 0) + 
                Number(poolInfo?.amountB || 0) * (poolInfo?.tokenB?.priceUsd || 0)).toFixed(2))}
          </div>
        </div>

        <div className="bg-surface-0 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-medium">Uncollected Fees</div>
          <div className="text-xl font-semibold mt-1">
            {poolUncollectedFees ? 
              // Convert to string to avoid type incompatibility
              convertToGlobalFormatted(poolUncollectedFees.toExact ? poolUncollectedFees.toExact() : '0') 
              : '0'
            }
          </div>
          <div className="text-sm text-medium mt-2">USD Value</div>
          <div className="text-lg">
            ${((poolUncollectedFees ? Number(poolUncollectedFees.toExact()) : 0) * (poolInfo?.tokenA?.priceUsd || 0)).toFixed(2)}
          </div>
        </div>

        <div className="bg-surface-0 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-medium">Current Tick</div>
          <div className="text-xl font-semibold mt-1">{poolInfo?.tickCurrent || '0'}</div>
          <div className="text-sm text-medium mt-2">Sqrt Price X96</div>
          <div className="text-sm font-mono break-all">{poolInfo?.sqrtRatioX96 || '0'}</div>
        </div>

        <div className="bg-surface-0 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-medium">Total Value</div>
          <div className="text-xl font-semibold mt-1">
            {totalValue ? 
              // Convert to string to avoid type incompatibility
              convertToGlobalFormatted(totalValue.toExact ? totalValue.toExact() : '0') 
              : '0'
            }
          </div>
          <div className="text-sm text-medium mt-2">USD Value</div>
          <div className="text-lg">
            ${((totalValue ? Number(totalValue.toExact()) : 0) * (poolInfo?.tokenA?.priceUsd || 0)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Token Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-0 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{poolInfo?.tokenA?.symbol || baseTokenSymbol} Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-medium">Amount</span>
              <span>{Number(poolInfo?.amountA || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium">Price</span>
              <span>${(poolInfo?.tokenA?.priceUsd || 0).toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium">Decimals</span>
              <span>{poolInfo?.tokenA?.decimals || baseToken?.decimals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium">Contract ID</span>
              <span className="font-mono text-sm">{poolInfo?.tokenA?.id || baseToken?.address || 'Unknown'}</span>
            </div>
            {poolInfo?.tokenA?.description && (
              <div className="mt-4">
                <span className="text-medium">Description</span>
                <p className="text-sm mt-1">{poolInfo?.tokenA?.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-0 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{poolInfo?.tokenB?.symbol || quoteTokenSymbol} Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-medium">Amount</span>
              <span>{Number(poolInfo?.amountB || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium">Price</span>
              <span>${(poolInfo?.tokenB?.priceUsd || 0).toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium">Decimals</span>
              <span>{poolInfo?.tokenB?.decimals || quoteToken?.decimals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium">Contract ID</span>
              <span className="font-mono text-sm">{poolInfo?.tokenB?.id || quoteToken?.address || 'Unknown'}</span>
            </div>
            {poolInfo?.tokenB?.description && (
              <div className="mt-4">
                <span className="text-medium">Description</span>
                <p className="text-sm mt-1">{poolInfo?.tokenB?.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pool;
