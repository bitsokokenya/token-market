import React, { useMemo, useEffect } from 'react';

import { ROUTES } from '../../common/constants';
import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';
import { usePools } from '../../providers/CombinedPoolsProvider';
import { HederaToken } from '../../utils/tokens';
import { useFetchPositions } from '../../hooks/fetch';
import { useHashConnect } from '../../providers/HashConnectProvider';
import { usePositionsByPool } from '../../services/positionsByPool';

import BackArrow from '../../components/icons/LeftArrow';
import Card from '../../components/Card';
import PoolButton from '../../components/PoolButton';
import LastUpdatedStamp from '../../components/LastUpdatedStamp';
import Pool from './Pool';
import Positions from './Positions';
import ChartLayout from './Chart';
import DropdownMenu from '../../components/DropdownMenu';
import IconDownload from '../../components/icons/Download';
import Button from '../../components/Button';
import IconOptions from '../../components/icons/Options';
import Plus from '../../components/icons/Plus';
import { useRouter } from 'next/router';
import Link from 'next/link';

const PoolDetailsPage = () => {
  const { loading: loadingPools, pools, lastLoaded, refresh, refreshingList } = usePools();
  const { convertToGlobalFormatted } = useCurrencyConversions();
  const { query } = useRouter();
  const { accountId } = useHashConnect();
  const { loading: positionsLoading, positions } = usePositionsByPool(accountId, query.id as string, 1); // Using chainId 1 for Hedera

  const id = query.id as string;

  // Enhanced debugging for pool loading - memoize the debug data
  const debugData = useMemo(() => ({
    loadingPools,
    poolId: id,
    availablePools: pools?.map(p => ({
      id: p.address,
      tokens: `${p.baseToken?.symbol}/${p.quoteToken?.symbol}`,
      baseTokenId: p.baseToken instanceof HederaToken ? p.baseToken.getHederaAccountId() : p.baseToken?.address || 'unknown',
      quoteTokenId: p.quoteToken instanceof HederaToken ? p.quoteToken.getHederaAccountId() : p.quoteToken?.address || 'unknown',
    }))
  }), [loadingPools, pools, id]);

  useEffect(() => {
    console.log('Pool Details Debug:', debugData);
  }, [debugData]);

  // Select a single pool - memoize the pool finding logic
  const pool = useMemo(() => {
    if (loadingPools) {
      console.log('Still loading pools...');
      return null;
    }

    if (!id) {
      console.log('No pool ID provided in URL');
      return null;
    }

    // Try to find pool by Hedera account ID
    const foundPool = pools.find((pool) => {
      const poolAddress = pool.address;
      const matches = poolAddress === id;
      
      // Add null checks before accessing token properties
      const baseTokenSymbol = pool?.baseToken?.symbol || '???';
      const quoteTokenSymbol = pool?.quoteToken?.symbol || '???';
      
      console.log('Pool matching:', {
        poolAddress,
        urlId: id,
        matches,
        tokens: `${baseTokenSymbol}/${quoteTokenSymbol}`,
        baseTokenId: pool?.baseToken instanceof HederaToken 
          ? pool.baseToken.getHederaAccountId() 
          : pool?.baseToken?.address || 'unknown',
        quoteTokenId: pool?.quoteToken instanceof HederaToken 
          ? pool.quoteToken.getHederaAccountId() 
          : pool?.quoteToken?.address || 'unknown',
      });
      
      return matches;
    });

    if (!foundPool) {
      console.log('No matching pool found for ID:', id);
    } else {
      // Add null checks before accessing token properties
      const baseTokenSymbol = foundPool?.baseToken?.symbol || '???';
      const quoteTokenSymbol = foundPool?.quoteToken?.symbol || '???';
      
      console.log('Found matching pool:', {
        id: foundPool.address,
        tokens: `${baseTokenSymbol}/${quoteTokenSymbol}`,
        baseTokenId: foundPool?.baseToken instanceof HederaToken 
          ? foundPool.baseToken.getHederaAccountId() 
          : foundPool?.baseToken?.address || 'unknown',
        quoteTokenId: foundPool?.quoteToken instanceof HederaToken 
          ? foundPool.quoteToken.getHederaAccountId() 
          : foundPool?.quoteToken?.address || 'unknown',
      });
    }

    return foundPool;
  }, [loadingPools, pools, id]);

  // Memoize the loading state check
  const isLoading = useMemo(() => {
    const state = {
      hasPool: !!pool,
      positionsLoading,
      poolId: id,
      loadingPools
    };
    console.log('Pool loading state:', state);
    return !pool || positionsLoading;
  }, [pool, positionsLoading, id, loadingPools]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex items-center">
          <Link href={`${ROUTES.HOME}${location.search}`} className="text-0.875 font-medium text-medium flex items-center">
            <BackArrow />
            <span className="ml-2">Home</span>
          </Link>
        </div>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className="flex flex-col">
              <div className="bg-surface-10 rounded w-32 h-4"></div>
              <div className="bg-surface-10 rounded-sm w-96 h-12 mt-4"></div>
            </div>
          </div>
          <div className="bg-surface-10 rounded w-full h-20 mt-8"></div>
          <div className="bg-surface-10 rounded w-full h-20 mt-4"></div>
        </div>
      </div>
    );
  }

  const {
    key,
    address,
    entity,
    quoteToken,
    baseToken,
    currentPrice,
    rawPoolLiquidity,
    poolLiquidity,
    currencyPoolUncollectedFees,
    poolUncollectedFees,
  } = pool;

  function handleClickDownloadCSV() {}

  return (
    <div className="flex flex-col w-full">
      <Link href={`${ROUTES.HOME}${location.search}`} className="text-0.875 font-medium text-medium flex items-center">
        <BackArrow />
        <span className="ml-2">Home</span>
      </Link>
      <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center mt-4">
        <div className="flex mt-8 md:mt-0">
          {baseToken && quoteToken ? (
            <PoolButton
              baseToken={baseToken}
              quoteToken={quoteToken}
              fee={entity.fee / 10000}
              showNetwork={true}
              onClick={() => {}}
              size="lg"
            />
          ) : (
            <div className="text-lg font-medium">Unknown Pool</div>
          )}
          <div className="hidden lg:flex flex-col ml-6 mt-8 md:-mt-3">
            <span className="text-medium text-0.6875">
              Current Price ({baseToken?.symbol === 'WETH' ? 'ETH' : baseToken?.symbol || '???'})
            </span>
            <span className="text-1.25 lg:text-2 font-semibold text-high">{currentPrice}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 w-full lg:w-1/3">
          <Card>
            <div className="text-0.875 text-medium whitespace-nowrap">Uncollected Fees</div>
            <div className="text-1.25 md:text-1.75 my-1 font-semibold text-high">
              {poolUncollectedFees ? convertToGlobalFormatted(poolUncollectedFees) : '0'}
            </div>
          </Card>
          <Card>
            <div className="text-0.875  text-brand-dark-primary">Total Value</div>
            <div className="text-1.25 md:text-1.75 my-1 font-semibold">
              {poolUncollectedFees && poolLiquidity ? convertToGlobalFormatted(poolUncollectedFees.add(poolLiquidity)) : '0'}
            </div>
          </Card>
        </div>
      </div>
      <div className="w-full mt-5 md:mt-10">
        <div className="flex justify-between items-center">
          <LastUpdatedStamp
            loading={loadingPools || refreshingList}
            lastLoaded={lastLoaded}
            refresh={refresh}
            className="text-0.75"
          />
          <div className="flex items-center">
            {baseToken && quoteToken ? (
              <Button
                href={`/add?quoteToken=${quoteToken.symbol}&baseToken=${baseToken.symbol}&fee=3000`}
                size="md"
                className="ml-2"
              >
                <div className="flex items-center -ml-1">
                  <Plus />
                  <span className="ml-1">New Position</span>
                </div>
              </Button>
            ) : (
              <Button size="md" className="ml-2" disabled>
                <div className="flex items-center -ml-1">
                  <Plus />
                  <span className="ml-1">New Position</span>
                </div>
              </Button>
            )}
            <DropdownMenu
              options={[
                {
                  label: 'Download CSV',
                  cb: handleClickDownloadCSV,
                  icon: <IconDownload />,
                },
              ]}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <IconOptions />
              </div>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <span className="text-1.25 font-semibold text-high">Overview</span>
        <Pool
          key={key}
          address={address}
          entity={entity}
          quoteToken={quoteToken}
          baseToken={baseToken}
          positions={positions}
          rawPoolLiquidity={rawPoolLiquidity}
          poolLiquidity={poolLiquidity}
          currencyPoolUncollectedFees={currencyPoolUncollectedFees}
          poolUncollectedFees={poolUncollectedFees}
        />
      </div>
      <div className="mt-8">
        <span className="text-1.25 font-semibold text-high">Price</span>
        <ChartLayout
          address={address}
          baseToken={baseToken}
          quoteToken={quoteToken}
          entity={entity}
          currentPrice={currentPrice}
          className="mt-4"
        />
      </div>
      <div className="mt-8">
        <span className="text-1.25 font-semibold text-high">Positions</span>
        <Positions
          positions={positions}
          pool={entity}
          baseToken={baseToken}
          quoteToken={quoteToken}
        />
      </div>
    </div>
  );
};

export default PoolDetailsPage;
