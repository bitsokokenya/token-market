import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { ROUTES } from '../../common/constants';
import { useCurrencyConversions } from '../../providers/CurrencyConversionProvider';
import { usePools } from '../../providers/CombinedPoolsProvider';
import { HederaToken, getQuoteAndBaseToken } from '../../utils/tokens';
import { useHashConnect } from '../../providers/HashConnectProvider';
import { FinalPoolData } from '../../hooks/usePoolsForNetwork';

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

const PoolDetailsPage = () => {
  const { loading: loadingPools, pools, lastLoaded, refresh, refreshingList } = usePools();
  const { convertToGlobalFormatted } = useCurrencyConversions();
  const { query } = useRouter();
  const { accountId } = useHashConnect();
  const id = query.id as string;
  
  // Enhanced debugging for pool loading
  const debugData = useMemo(() => ({
    loadingPools,
    poolId: id,
    availablePools: pools?.map((p: FinalPoolData) => { // Add type here
       // Use getQuoteAndBaseToken for consistent display in debug
      const [base, quote] = p.token0 && p.token1 ? getQuoteAndBaseToken(p.token0, p.token1) : [null, null];
      return {
        id: p.address,
        tokens: `${base?.symbol ?? '??'}/${quote?.symbol ?? '??'}`,
        baseTokenId: base?.hederaId || 'unknown',
        quoteTokenId: quote?.hederaId || 'unknown',
      };
    })
  }), [loadingPools, pools, id]);

  useEffect(() => {
    console.log('Pool Details Debug:', debugData);
  }, [debugData]);

  // Find pool
  const pool = useMemo(() => {
    if (loadingPools || !id || !pools) return null;
    const foundPool = pools.find((p: FinalPoolData) => p.address === id);
    console.log(`Finding pool for ID: ${id}, Found: ${!!foundPool}`);
    return foundPool;
  }, [loadingPools, pools, id]);

  // Extract entity
  const entity = useMemo(() => pool?.entity, [pool]);

  // --- Determine Base/Quote Tokens for Display --- 
  const [baseToken, quoteToken] = useMemo(() => {
      if (!pool?.token0 || !pool?.token1) {
          return [undefined, undefined];
      }
      // Use the utility function
      return getQuoteAndBaseToken(pool.token0, pool.token1); 
  }, [pool]); // Depends only on the found pool object

  // Calculate current price (using determined base/quote)
  const currentPrice = useMemo(() => {
      if (!entity || !baseToken || !quoteToken) return '-'; 
      // Get price of base token in terms of quote token
      return baseToken.sortsBefore(quoteToken) 
              ? entity.priceOf(baseToken).toSignificant(6) 
              : entity.priceOf(quoteToken).invert().toSignificant(6);
  }, [entity, baseToken, quoteToken]);

  // Calculate loading state
  const isLoading = useMemo(() => {
    const stillLoading = loadingPools || (!loadingPools && !pool);
    // console.log('Pool loading state:', { loadingPools, poolFound: !!pool, calculatedLoading: stillLoading });
    return stillLoading;
  }, [pool, loadingPools]);
  
  // ========================================
  // === CONDITIONAL RETURN CAN BE HERE ===
  // ========================================
  if (isLoading) {
    console.log('Rendering loading state...');
    return (
        <div className="flex flex-col space-y-4">
          {/* ... loading skeleton ... */}
        </div>
    );
  }

  // ====================================================
  // === CODE AFTER THIS POINT RUNS ONLY WHEN LOADED ===
  // ====================================================

  // Pool/Entity checks
  if (!pool || !entity || !baseToken || !quoteToken) { 
      // Added checks for base/quote token derivation
      console.error('Pool/Entity/Tokens missing after loading:', { pool, entity, baseToken, quoteToken });
      return <div>Error: Pool data incomplete.</div>; 
  }

  // Destructure only what's needed directly besides base/quote/entity
  const { address, positions } = pool;
  
  // We also know entity should exist if pool exists and loading is done,
  // but an extra check can prevent render errors.
  if (!entity) {
     console.error('Pool loaded but entity is missing!', pool);
     return <div>Error: Pool data incomplete.</div>; 
  }

  // --- Other non-hook logic --- 
  function handleClickDownloadCSV() {}

  // --- Return JSX --- 
  console.log('Rendering Pool Details UI...');
  return (
    <div className="flex flex-col w-full">
      <Link href={`${ROUTES.HOME}${location.search}`} className="text-0.875 font-medium text-medium flex items-center">
        <BackArrow />
        <span className="ml-2">Home</span>
      </Link>
      <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center mt-4">
        <div className="flex mt-8 md:mt-0">
          {/* Use determined baseToken and quoteToken */} 
          <PoolButton
            baseToken={baseToken} 
            quoteToken={quoteToken}
            fee={entity.fee / 10000}
            showNetwork={true}
            onClick={() => {}}
            size="lg"
          />
          <div className="hidden lg:flex flex-col ml-6 mt-8 md:-mt-3">
            <span className="text-medium text-0.6875">
               {/* Use determined baseToken symbol */}
              Current Price ({baseToken?.symbol ?? '??'})
            </span>
            <span className="text-1.25 lg:text-2 font-semibold text-high">{currentPrice}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 w-full lg:w-1/3">
          <Card>
            <div className="text-0.875 text-medium whitespace-nowrap">Uncollected Fees</div>
            <div className="text-1.25 md:text-1.75 my-1 font-semibold text-high">
              N/A
            </div>
          </Card>
          <Card>
            <div className="text-0.875  text-brand-dark-primary">Total Value</div>
            <div className="text-1.25 md:text-1.75 my-1 font-semibold">
              N/A
            </div>
          </Card>
        </div>
      </div>
      <div className="w-full mt-5 md:mt-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
             {/* Use determined base/quote symbols */} 
            <Button
              href={`/add?baseToken=${baseToken.symbol}&quoteToken=${quoteToken.symbol}&fee=${entity.fee}`}
              size="md"
              className="ml-2"
            >
               {/* Add children back */}
               <div className="flex items-center -ml-1">
                 <Plus />
                 <span className="ml-1">New Position</span>
               </div>
            </Button>
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
          key={address} 
          address={address}
          entity={entity}
          baseToken={baseToken} // Pass determined base
          quoteToken={quoteToken} // Pass determined quote
          positions={positions} 
        />
      </div>
      <div className="mt-8">
        <span className="text-1.25 font-semibold text-high">Price</span>
        <ChartLayout
          address={address}
          baseToken={baseToken} // Pass determined base
          quoteToken={quoteToken} // Pass determined quote
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
          baseToken={baseToken} // Pass determined base
          quoteToken={quoteToken} // Pass determined quote
        />
      </div>
    </div>
  );
};

export default PoolDetailsPage;
