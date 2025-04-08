import React, { ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { usePoolsForNetwork, FinalPoolData } from '../hooks/usePoolsForNetwork';
import { ChainID } from '../types/enums';
import { useHashConnect } from './HashConnectProvider';

const PoolsContext = React.createContext({
  pools: [] as FinalPoolData[],
  loading: true,
  empty: false,
  lastLoaded: +new Date(),
  refreshingList: false,
  refresh: () => {},
});

export const usePools = () => useContext(PoolsContext);

interface Props {
  children: ReactNode;
}

export const CombinedPoolsProvider = ({ children }: Props) => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState(+new Date());
  const { accountId } = useHashConnect();

  const {
    loading: hederaLoading,
    pools: hederaPools,
  } = usePoolsForNetwork(
    ChainID.HederaTestnet,
    lastLoaded,
    false,
    undefined,
    accountId ?? undefined
  );

  useEffect(() => {
    console.log('CombinedPoolsProvider Debug:', {
      hederaLoading,
      hederaPoolsLength: hederaPools?.length,
      initialLoading,
      accountId
    });
  }, [hederaLoading, hederaPools, initialLoading, accountId]);

  const loading = useMemo(() => {
    return hederaLoading;
  }, [hederaLoading]);

  useEffect(() => {
    if (initialLoading && !loading) {
      setInitialLoading(false);
    }
  }, [initialLoading, loading]);

  const refreshingList = useMemo(() => {
    return loading;
  }, [loading]);

  const pools = useMemo(() => {
    console.log('Setting pools:', {
      hederaPoolsLength: hederaPools?.length,
      hederaPools
    });
    return hederaPools || [];
  }, [hederaPools]);

  const empty = useMemo(() => {
    if (loading) {
      return false;
    }
    return !pools.length;
  }, [loading, pools]);

  const refresh = () => {
    setLastLoaded(+new Date());
  };

  return (
    <PoolsContext.Provider
      value={{
        pools,
        empty,
        loading: initialLoading,
        lastLoaded,
        refreshingList,
        refresh,
      }}
    >
      {children}
    </PoolsContext.Provider>
  );
};
