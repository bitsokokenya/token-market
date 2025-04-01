import React, { useEffect, useState } from 'react';
import { Token, CurrencyAmount } from '@uniswap/sdk-core';
import { BigNumber } from '@ethersproject/bignumber';
import { Pool } from '@uniswap/v3-sdk';
import { HederaToken } from '../../utils/tokens';
import { PoolState } from '../../types/seedle';
import { useFetchPositions } from '../../hooks/fetch';
import { useHashConnect } from '../../providers/HashConnectProvider';
import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';
import { ChainID } from '../../types/enums';

interface Props {
  chainId: number;
  filter: string;
  onPoolClick: (baseToken: any, quoteToken: any, fee: number, positions: any[]) => void;
}

// Interface for position data
interface PositionData {
  tokenSN: string | number;
  token0: {
    id: string;
    decimals: number;
    symbol: string;
    name: string;
    icon?: string;
    priceUsd: number;
  };
  token1: {
    id: string;
    decimals: number;
    symbol: string;
    name: string;
    icon?: string;
    priceUsd: number;
  };
  fee: number;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  lowerPrice?: number;
  upperPrice?: number;
  amount0?: string;
  amount1?: string;
  tokensOwed0: string;
  tokensOwed1: string;
  createdAt: number;
}

function ExistingPools({ chainId, onPoolClick, filter }: Props) {
  const { accountId } = useHashConnect();
  const { loading: positionsLoading, positions, error: positionsError } = useFetchPositions(accountId);
  const { formatCurrencyWithSymbol } = useCurrencyConversions();

  // Function to calculate estimated APR based on fees and liquidity
  const calculateEstimatedAPR = (feesUsd: number, liquidityUsd: number, createdAt: number): number => {
    if (!liquidityUsd || liquidityUsd === 0) return 0;
    
    // Calculate how many days the position has been active
    const now = Date.now();
    const creationTime = Number(createdAt) * 1000;
    const daysActive = Math.max(1, (now - creationTime) / (1000 * 60 * 60 * 24));
    
    // Calculate daily fee rate
    const dailyFeeRate = feesUsd / daysActive / liquidityUsd;
    
    // Annualize and convert to percentage
    return dailyFeeRate * 365 * 100;
  };

  // Function to calculate total position value
  const calculateTotalValue = (position: PositionData): number => {
    const token0Value = Number(position.amount0 || 0) * position.token0.priceUsd;
    const token1Value = Number(position.amount1 || 0) * position.token1.priceUsd;
    const fees0Value = Number(position.tokensOwed0) * position.token0.priceUsd;
    const fees1Value = Number(position.tokensOwed1) * position.token1.priceUsd;
    
    return token0Value + token1Value + fees0Value + fees1Value;
  };

  if (positionsLoading) {
    return (
      <div className="flex justify-center items-center text-low h-full">
        Loading positions...
      </div>
    );
  }

  if (positionsError) {
    return (
      <div className="flex justify-center items-center text-red-500 h-full">
        Error: {positionsError.message}
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="flex justify-center items-center text-low h-full">
        No open positions found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(positions as unknown as PositionData[]).map((position: PositionData) => {
        // Calculate fees in USD
        const fees0Usd = Number(position.tokensOwed0) * position.token0.priceUsd;
        const fees1Usd = Number(position.tokensOwed1) * position.token1.priceUsd;
        const totalFeesUsd = fees0Usd + fees1Usd;
        
        // Calculate total liquidity in USD - handle cases where amount0/amount1 might be missing
        const liquidity0Usd = Number(position.amount0 || 0) * position.token0.priceUsd;
        const liquidity1Usd = Number(position.amount1 || 0) * position.token1.priceUsd;
        const totalLiquidityUsd = liquidity0Usd + liquidity1Usd;
        
        // Calculate total position value
        const totalValue = calculateTotalValue(position);
        
        // Calculate estimated APR
        const estimatedAPR = calculateEstimatedAPR(totalFeesUsd, totalLiquidityUsd, position.createdAt);
        
        return (
          <div 
            key={position.tokenSN.toString()} 
            className="p-4 border border-element-10 rounded-lg hover:bg-surface-10 cursor-pointer"
            onClick={() => {
              // Get the token IDs directly from the position data in Hedera format (0.0.xxxxx)
              const token0Id = position.token0.id;
              const token1Id = position.token1.id;

              // Create tokens using the constructor with tokenId first (Format 1)
              // Constructor:
              // 1. (tokenId, decimals, symbol, name, logoURI?, chainId?)
              const token0 = new HederaToken(
                token0Id,                  // tokenId
                position.token0.decimals,  // decimals
                position.token0.symbol,    // symbol
                position.token0.name,      // name
                position.token0.icon,      // logoURI
                chainId                    // chainId
              );

              const token1 = new HederaToken(
                token1Id,                  // tokenId
                position.token1.decimals,  // decimals
                position.token1.symbol,    // symbol
                position.token1.name,      // name
                position.token1.icon,      // logoURI
                chainId                    // chainId
              );

              // Log what we're passing to make debugging easier
              console.log('Clicking position with tokens:', {
                token0Id: token0.tokenId,
                token1Id: token1.tokenId,
                fee: position.fee
              });

              onPoolClick(token0, token1, position.fee, [position]);
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium flex items-center">
                {position.token0.icon && (
                  <img 
                    src={position.token0.icon} 
                    alt={position.token0.symbol} 
                    className="w-6 h-6 mr-2"
                  />
                )}
                <span>{position.token0.symbol}/{position.token1.symbol}</span>
                {position.token1.icon && (
                  <img 
                    src={position.token1.icon} 
                    alt={position.token1.symbol} 
                    className="w-6 h-6 ml-2"
                  />
                )}
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                  {position.fee / 10000}%
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Est. APR: {estimatedAPR.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-surface-5 rounded-lg p-3">
                <div className="text-xs text-medium mb-1">Token Prices</div>
                <div className="flex justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{position.token0.symbol}:</span> {formatCurrencyWithSymbol(position.token0.priceUsd, ChainID.HederaTestnet)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{position.token1.symbol}:</span> {formatCurrencyWithSymbol(position.token1.priceUsd, ChainID.HederaTestnet)}
                  </div>
                </div>
              </div>
              <div className="bg-surface-5 rounded-lg p-3">
                <div className="text-xs text-medium mb-1">Position Value</div>
                <div className="text-sm font-medium">
                  {formatCurrencyWithSymbol(totalValue, ChainID.HederaTestnet)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-surface-5 rounded-lg p-3">
                <div className="text-xs text-medium mb-1">Liquidity</div>
                <div className="text-sm">
                  <div>{formatCurrencyWithSymbol(totalLiquidityUsd, ChainID.HederaTestnet)}</div>
                  <div className="text-xs text-medium mt-1">
                    {Number(position.amount0 || 0).toFixed(6)} {position.token0.symbol} + {Number(position.amount1 || 0).toFixed(6)} {position.token1.symbol}
                  </div>
                </div>
              </div>
              <div className="bg-surface-5 rounded-lg p-3">
                <div className="text-xs text-medium mb-1">Price Range</div>
                <div className="text-sm">
                  <div>Min: {formatCurrencyWithSymbol(position.lowerPrice || 0, ChainID.HederaTestnet)}</div>
                  <div>Max: {formatCurrencyWithSymbol(position.upperPrice || 0, ChainID.HederaTestnet)}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-5 rounded-lg p-3 mb-2">
              <div className="text-xs text-medium mb-1">Uncollected Fees</div>
              <div className="flex justify-between">
                <div className="text-sm">
                  <div>{position.tokensOwed0} {position.token0.symbol}</div>
                  <div>{position.tokensOwed1} {position.token1.symbol}</div>
                </div>
                <div className="text-sm font-medium">
                  {formatCurrencyWithSymbol(totalFeesUsd, ChainID.HederaTestnet)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-medium">
                ID: #{position.tokenSN}
              </div>
              <div className="text-xs text-medium">
                Created: {new Date(Number(position.createdAt) * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ExistingPools;
