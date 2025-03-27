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
  onPoolClick: (baseToken: Token, quoteToken: Token, fee: number, positions: any[]) => void;
}

function ExistingPools({ chainId, onPoolClick, filter }: Props) {
  const { accountId } = useHashConnect();
  const { loading: positionsLoading, positions, error: positionsError } = useFetchPositions(accountId);
  const { formatCurrencyWithSymbol } = useCurrencyConversions();

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
      {positions.map((position) => (
        <div 
          key={position.tokenSN} 
          className="p-4 border border-element-10 rounded-lg hover:bg-surface-10 cursor-pointer"
          onClick={() => {
            // Convert position data to tokens and call onPoolClick
            const token0 = new HederaToken(
              chainId,
              position.token0.id,
              position.token0.decimals,
              position.token0.symbol,
              position.token0.name
            );

            const token1 = new HederaToken(
              chainId,
              position.token1.id,
              position.token1.decimals,
              position.token1.symbol,
              position.token1.name
            );

            onPoolClick(token0, token1, position.fee, [position]);
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium flex items-center">
              <img 
                src={position.token0.icon} 
                alt={position.token0.symbol} 
                className="w-6 h-6 mr-2"
              />
              <span>{position.token0.symbol}/{position.token1.symbol}</span>
              <img 
                src={position.token1.icon} 
                alt={position.token1.symbol} 
                className="w-6 h-6 ml-2"
              />
            </div>
            <div className="text-sm text-medium">
              Fee: {position.fee / 10000}%
            </div>
          </div>
          <div className="text-sm text-medium mb-2">
            <div>Liquidity: {formatCurrencyWithSymbol(Number(position.liquidity), ChainID.HederaTestnet)}</div>
            <div>Price Range: {position.tickLower} - {position.tickUpper}</div>
          </div>
          <div className="text-sm text-medium">
            <div>Uncollected Fees:</div>
            <div className="ml-2">
              {position.tokensOwed0} {position.token0.symbol} ({formatCurrencyWithSymbol(Number(position.tokensOwed0) * position.token0.priceUsd, ChainID.HederaTestnet)})
            </div>
            <div className="ml-2">
              {position.tokensOwed1} {position.token1.symbol} ({formatCurrencyWithSymbol(Number(position.tokensOwed1) * position.token1.priceUsd, ChainID.HederaTestnet)})
            </div>
          </div>
          <div className="text-xs text-medium mt-2">
            Created: {new Date(Number(position.createdAt) * 1000).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExistingPools;
