import { useMemo } from 'react';
import { Token as UniswapToken, CurrencyAmount as UniswapCurrencyAmount } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
import { usePoolFeeAPY } from '../../hooks/calculations';
import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';
import { HederaToken, CurrencyAmount } from '../../utils/tokens';
import { ChainID } from '../../types/enums';

import PoolButton from '../../components/PoolButton';
import TokenLabel from '../../components/TokenLabel';
import PositionStatuses from '../../components/PositionStatuses';

import { CustomPosition } from '../../types/seedle';

// Create a unified token type that works with both Uniswap Token and HederaToken
type TokenType = UniswapToken | HederaToken;

interface Props {
  onClick: () => void;
  entity: Pool;
  quoteToken?: TokenType;
  baseToken?: TokenType;
  poolLiquidity: UniswapCurrencyAmount<UniswapToken> | CurrencyAmount | any;
  poolUncollectedFees: UniswapCurrencyAmount<UniswapToken> | CurrencyAmount | any;
  currencyPoolUncollectedFees: (UniswapCurrencyAmount<UniswapToken> | CurrencyAmount | any)[];
  positions: CustomPosition[];
  currentPrice: number;
}

function PoolRow({
  onClick,
  entity,
  quoteToken,
  baseToken,
  poolLiquidity,
  poolUncollectedFees,
  currencyPoolUncollectedFees,
  positions,
  currentPrice,
}: Props) {
  const { convertToGlobalFormatted, formatCurrencyWithSymbol } = useCurrencyConversions();

  // Get raw values for calculations
  const rawPoolLiquidity = poolLiquidity && poolLiquidity.toExact ? parseFloat(poolLiquidity.toExact()) : 0;
  const rawPoolFees = poolUncollectedFees && poolUncollectedFees.toExact ? parseFloat(poolUncollectedFees.toExact()) : 0;

  // Wrap the usePoolFeeAPY call in a try-catch to handle potential issues with undefined tokens
  const feeAPY = useMemo(() => {
    try {
      // Cast baseToken to any to bypass TypeScript error since usePoolFeeAPY should handle undefined internally
      return usePoolFeeAPY(entity, baseToken as any, positions);
    } catch (error) {
      console.warn('Error calculating APY:', error);
      return 0;
    }
  }, [entity, baseToken, positions]);
  
  // Default token names and symbols if tokens are undefined
  const baseTokenName = baseToken?.name || 'Unknown';
  const baseTokenSymbol = baseToken?.symbol || '???';
  const quoteTokenName = quoteToken?.name || 'Unknown';
  const quoteTokenSymbol = quoteToken?.symbol || '???';
  
  // Convert tokens to HederaToken if needed
  const hederaBaseToken = baseToken && 'tokenId' in baseToken 
    ? baseToken as HederaToken 
    : baseToken 
      ? new HederaToken(
          baseToken.address || '', // tokenId
          baseToken.decimals, 
          baseToken.symbol || '', 
          baseToken.name || '',
          undefined,              // logo
          baseToken.chainId       // chainId
        ) 
      : undefined;
      
  const hederaQuoteToken = quoteToken && 'tokenId' in quoteToken 
    ? quoteToken as HederaToken 
    : quoteToken 
      ? new HederaToken(
          quoteToken.address || '', // tokenId
          quoteToken.decimals, 
          quoteToken.symbol || '', 
          quoteToken.name || '',
          undefined,               // logo
          quoteToken.chainId       // chainId
        ) 
      : undefined;

  // Calculate volume and other metrics (this would normally come from an API)
  const estimatedDailyVolume = rawPoolLiquidity * 0.05; // Estimate 5% of liquidity as daily volume
  const estimatedMonthlyFees = rawPoolFees * 30 / (positions.length ? positions.length : 1); // Estimate average fees per position per month

  // Calculate health score (0-100) based on liquidity, fees, and positions
  const healthScore = Math.min(100, Math.round(
    (rawPoolLiquidity > 0 ? 50 : 0) + 
    (feeAPY > 0 ? Math.min(40, feeAPY) : 0) + 
    (positions.length > 0 ? 10 : 0)
  ));
  
  // Determine health status
  let healthStatus = 'Low';
  let healthColor = 'text-red-500';
  
  if (healthScore >= 70) {
    healthStatus = 'High';
    healthColor = 'text-green-500';
  } else if (healthScore >= 40) {
    healthStatus = 'Medium';
    healthColor = 'text-yellow-500';
  }

  // Calculate position count in ranges
  const activePositions = positions.filter(pos => 
    pos.entity.tickLower <= entity.tickCurrent && entity.tickCurrent <= pos.entity.tickUpper
  ).length;
  
  return (
    <tr onClick={onClick} className="hover:bg-surface-5 cursor-pointer border-b border-element-5">
      <td className="pl-4 pr-8 py-4 md:pl-6 md:pr-12 md:py-6">
        <div className="flex flex-col">
          {hederaBaseToken && hederaQuoteToken ? (
            <div className="mb-2">
              <PoolButton
                baseToken={hederaBaseToken}
                quoteToken={hederaQuoteToken}
                fee={entity.fee / 10000}
                showNetwork={true}
                size="md"
                onClick={() => {}}
              />
            </div>
          ) : (
            <div className="text-md rounded-md text-high font-medium mb-2">
              Unknown Pool
            </div>
          )}
          
          <div className="flex items-center mt-1">
            <div className="text-xs text-medium bg-surface-10 rounded-full px-2 py-0.5 mr-2">
              Fee: {entity.fee / 10000}%
            </div>
            <div className="text-xs text-medium">
              <span className="text-high">Positions:</span> {positions.length} ({activePositions} active)
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <div className="text-md rounded-md text-high font-medium text-right">
            {currentPrice !== undefined && !isNaN(currentPrice) 
              ? currentPrice.toFixed(6) 
              : '0.000000'}
          </div>
          <div className="flex justify-end items-center mt-1">
            <span className="text-xs text-medium mr-1">1 {baseTokenSymbol} =</span>
            <span className="text-xs font-medium">
              {currentPrice !== undefined && !isNaN(currentPrice) 
                ? currentPrice.toFixed(4) 
                : '0.0000'} {quoteTokenSymbol}
            </span>
          </div>
          <div className="text-xs text-right mt-1">
            <span className={`inline-block rounded-full px-2 py-0.5 ${
              feeAPY > 10 ? 'bg-green-100 text-green-800' : 
              feeAPY > 5 ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              Vol: ~${formatNumber(estimatedDailyVolume)}
            </span>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col items-end">
          <div className="text-md rounded-md text-high font-medium text-right">
            {poolLiquidity && poolLiquidity.toExact ? convertToGlobalFormatted(poolLiquidity) : '0'}
          </div>
          <div className="text-xs text-medium text-right mt-1">
            Depth: {rawPoolLiquidity > 0 ? 
              formatNumber(Math.sqrt(rawPoolLiquidity) * 2) : '0'} {baseTokenSymbol}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-24">
            <div 
              className="bg-purple-600 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, rawPoolLiquidity / 1000)}%` }}
            ></div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col items-end">
          <div className="text-md rounded-md text-high font-medium text-right">
            {poolUncollectedFees && poolUncollectedFees.toExact ? convertToGlobalFormatted(poolUncollectedFees) : '0'}
          </div>
          <div className="text-xs text-medium text-right mt-1">
            Est. monthly: ${formatNumber(estimatedMonthlyFees)}
          </div>
          <div className="text-xs text-right mt-1">
            <span className={`inline-block rounded-full px-2 py-0.5 ${
              rawPoolFees > 100 ? 'bg-green-100 text-green-800' : 
              rawPoolFees > 10 ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {positions.length > 0 ? rawPoolFees / positions.length : 0 > 0 ? 'Collecting' : 'No fees'}
            </span>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col items-end">
          <div className={`text-md rounded-md font-medium text-right ${feeAPY < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {feeAPY.toFixed(2)}%
          </div>
          <div className="text-xs text-medium text-right mt-1">
            24h: {(feeAPY / 365).toFixed(2)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-24">
            <div 
              className={`h-1.5 rounded-full ${
                feeAPY > 20 ? 'bg-green-500' : 
                feeAPY > 10 ? 'bg-green-400' : 
                feeAPY > 5 ? 'bg-blue-400' : 
                feeAPY > 0 ? 'bg-gray-400' : 
                'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, feeAPY * 2)}%` }}
            ></div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col items-end">
          <div className={`text-md rounded-md font-medium text-right ${healthColor}`}>
            {healthStatus}
          </div>
          <div className="text-xs text-medium text-right mt-1">
            Score: {healthScore}/100
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-24">
            <div 
              className={`h-1.5 rounded-full ${
                healthScore > 70 ? 'bg-green-500' : 
                healthScore > 40 ? 'bg-yellow-400' : 
                'bg-red-400'
              }`}
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// Helper function to format numbers nicely
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
}

export default PoolRow;
