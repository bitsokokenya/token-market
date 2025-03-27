import React, { useState, useEffect, useCallback } from 'react';
import { Token } from '@uniswap/sdk-core';
import Link from 'next/link';
import { useRouter } from 'next/router';

import NewPools from '../../components/AddLiquidity/NewPools';
import ExistingPools from '../../components/AddLiquidity/ExistingPools';
import NewPosition from '../../components/AddLiquidity/NewPosition';
import SearchInput from '../../components/AddLiquidity/SearchInput';

import { useChainId } from '../../hooks/useChainId';
import { usePoolsForNetwork } from '../../hooks/usePoolsForNetwork';

import { getQuoteAndBaseToken } from '../../utils/tokens';
import { loadTokens, findTokens, TokenListItem } from '../../components/AddLiquidity/utils';
import { ROUTES } from '../../common/constants';

function AddLiquidity() {
  const chainId = useChainId();
  const { query } = useRouter();
  const router = useRouter();
  const { baseToken: baseTokenSymbol, quoteToken: quoteTokenSymbol, fee } = query;

  // keep timestamp static
  // This page ends up being re-rendered this prevents it
  const timestamp = 1234;
  const onlyForInjected = true;
  const { pools } = usePoolsForNetwork(chainId || 1, timestamp, onlyForInjected);

  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [selectedBaseToken, setSelectedBaseToken] = useState<Token | null>(null);
  const [selectedQuoteToken, setSelectedQuoteToken] = useState<Token | null>(null);
  const [selectedFee, setSelectedFee] = useState<number | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<any[] | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');

  // Load tokens only once when chainId changes
  useEffect(() => {
    if (!chainId) return;

    const loadTokensData = async () => {
      const results = await loadTokens(chainId as number);
      setTokens(results);
    };

    loadTokensData();
  }, [chainId]);

  // Set selected tokens when URL parameters change
  useEffect(() => {
    if (!chainId || !tokens.length || !baseTokenSymbol || !quoteTokenSymbol || !fee) return;

    const matches = findTokens(chainId as number, tokens, [
      baseTokenSymbol as string,
      quoteTokenSymbol as string,
    ]);

    // invalid tokens
    if (matches.length !== 2) return;

    const toToken = ({ address, decimals, symbol, name }: TokenListItem) => {
      return new Token(chainId as number, address, decimals, symbol, name);
    };

    const [quoteToken, baseToken] = getQuoteAndBaseToken(
      chainId as number,
      toToken(matches[0]),
      toToken(matches[1]),
    );

    // Only update if values are different
    if (!selectedBaseToken?.equals(baseToken) || !selectedQuoteToken?.equals(quoteToken) || selectedFee !== parseInt(fee as string, 10)) {
      setSelectedBaseToken(baseToken);
      setSelectedQuoteToken(quoteToken);
      setSelectedFee(parseInt(fee as string, 10));
    }
  }, [chainId, tokens, baseTokenSymbol, quoteTokenSymbol, fee, selectedBaseToken, selectedQuoteToken, selectedFee]);

  // Set positions when pool changes
  useEffect(() => {
    if (!pools || !selectedBaseToken || !selectedQuoteToken || !selectedFee) return;

    const matchingPool = pools.find(
      (p) =>
        p.baseToken.equals(selectedBaseToken) &&
        p.quoteToken.equals(selectedQuoteToken) &&
        p.entity.fee === selectedFee,
    );

    if (matchingPool && (!selectedPositions || selectedPositions.length !== matchingPool.positions.length)) {
      setSelectedPositions(matchingPool.positions);
    }
  }, [pools, selectedBaseToken, selectedQuoteToken, selectedFee, selectedPositions]);

  const resetSelections = useCallback(() => {
    setSelectedBaseToken(null);
    setSelectedQuoteToken(null);
    setSelectedFee(null);
    setSelectedPositions(null);
  }, []);

  const handlePoolClick = useCallback((baseToken: Token, quoteToken: Token, fee: number, positions: any[]) => {
    setSelectedBaseToken(baseToken);
    setSelectedQuoteToken(quoteToken);
    setSelectedFee(fee);
    setSelectedPositions(positions);

    router.push(
      {
        pathname: ROUTES.ADD,
        query: { quoteToken: quoteToken.symbol, baseToken: baseToken.symbol, fee },
      },
      undefined,
      { shallow: true },
    );
  }, [router]);

  const handleNewTabClick = useCallback(() => {
    resetSelections();
    router.push(
      {
        pathname: ROUTES.ADD,
      },
      undefined,
      { shallow: true },
    );
  }, [router, resetSelections]);

  const handleExistingTabClick = useCallback(() => {
    resetSelections();
    router.push(
      {
        pathname: ROUTES.ADD,
        query: { tab: 'existing' },
      },
      undefined,
      { shallow: true },
    );
  }, [router, resetSelections]);

  const handleCancelNewPosition = useCallback(() => {
    resetSelections();
    router.push(
      {
        pathname: ROUTES.ADD,
        query: { tab: 'new' },
      },
      undefined,
      { shallow: true },
    );
  }, [router, resetSelections]);

  const handleClickBack = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  }, [router]);

  const selectedTab = query.tab === 'existing' ? 'existing' : 'new';

  return (
    <div className="w-full flex flex-col h-full">
      <div className="py-4 mb-4 flex items-center">
        <button
          onClick={handleClickBack}
          className="flex justify-center items-center text-high w-8 h-8 flex-shrink-0 mr-4 rounded-full hover:bg-surface-20"
        >
          ←
        </button>
        <h1 className="text-2 text-high font-bold tracking-tighter leading-tight">Add Liquidity</h1>
      </div>
      <div className="md:w-1/2">
        <SearchInput onChange={setSearchInput} />
      </div>

      <div className="w-full h-full py-4 my-4">
        <div className="flex border-b border-element-10">
          <button
            className={`p-2 mr-2 border-b-4 focus:outline-none text-medium ${
              selectedTab === 'new' ? 'border-green-500' : 'border-transparent'
            }`}
            onClick={handleNewTabClick}
          >
            New
          </button>
          <button
            className={`p-2 border-b-4 focus:outline-none text-medium ${
              selectedTab === 'existing' ? 'border-green-500' : 'border-transparent'
            }`}
            onClick={handleExistingTabClick}
          >
            Existing
          </button>
        </div>
        <div className="py-4 h-full">
          {selectedBaseToken !== null && selectedQuoteToken !== null && selectedFee != null ? (
            <NewPosition
              baseToken={selectedBaseToken as Token}
              quoteToken={selectedQuoteToken as Token}
              initFee={selectedFee}
              positions={selectedPositions}
              onCancel={handleCancelNewPosition}
            />
          ) : selectedTab === 'new' ? (
            <NewPools onPoolClick={handlePoolClick} filter={searchInput} />
          ) : (
            <ExistingPools
              chainId={chainId || 1}
              onPoolClick={handlePoolClick}
              filter={searchInput}
              pools={pools}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AddLiquidity;
