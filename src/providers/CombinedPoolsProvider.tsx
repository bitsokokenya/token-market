import React, { ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { usePoolsForNetwork } from '../hooks/usePoolsForNetwork';
import { ChainID } from '../types/enums';

const PoolsContext = React.createContext({
  pools: [] as any[],
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

  const {
    loading: hederaLoading,
    pools: hederaPools,
    feesLoading: hederaFeesLoading,
  } = usePoolsForNetwork(ChainID.HederaTestnet, lastLoaded);

  useEffect(() => {
    console.log('CombinedPoolsProvider Debug:', {
      hederaLoading,
      hederaPoolsLength: hederaPools?.length,
      hederaFeesLoading,
      initialLoading
    });
  }, [hederaLoading, hederaPools, hederaFeesLoading, initialLoading]);

  const loading = useMemo(() => {
    return hederaLoading;
  }, [hederaLoading]);

  const feesLoading = useMemo(() => {
    return hederaFeesLoading;
  }, [hederaFeesLoading]);

  useEffect(() => {
    if (initialLoading && !loading) {
      setInitialLoading(false);
    }
  }, [initialLoading, loading]);

  const refreshingList = useMemo(() => {
    return loading || feesLoading;
  }, [loading, feesLoading]);

  const pools = useMemo(() => {
    console.log('Setting pools:', {
      hederaPoolsLength: hederaPools?.length,
      hederaPools
    });
    return [...hederaPools];
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
