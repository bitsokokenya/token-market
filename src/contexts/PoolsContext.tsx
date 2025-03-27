import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPools, getPoolDetails, getPoolStats } from '../services/saucerswap';

interface Pool {
  address: string;
  token0: {
    address: string;
    symbol: string;
    decimals: number;
  };
  token1: {
    address: string;
    symbol: string;
    decimals: number;
  };
  fee: number;
  tickSpacing: number;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  token0Price: string;
  token1Price: string;
  volume24h: string;
  tvl: string;
}

interface PoolsContextType {
  pools: Pool[];
  loading: boolean;
  error: string | null;
  refreshPools: () => Promise<void>;
  getPool: (address: string) => Promise<Pool>;
  getPoolStats: (address: string) => Promise<any>;
}

const PoolsContext = createContext<PoolsContextType | null>(null);

export const usePools = () => {
  const context = useContext(PoolsContext);
  if (!context) {
    throw new Error('usePools must be used within a PoolsProvider');
  }
  return context;
};

export const PoolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = async () => {
    try {
      setLoading(true);
      setError(null);
      const poolsData = await getPools();
      setPools(poolsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
    // Refresh pools every 5 minutes
    const interval = setInterval(fetchPools, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPool = async (address: string) => {
    try {
      return await getPoolDetails(address);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch pool details');
    }
  };

  const getPoolStatsData = async (address: string) => {
    try {
      return await getPoolStats(address);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch pool stats');
    }
  };

  return (
    <PoolsContext.Provider
      value={{
        pools,
        loading,
        error,
        refreshPools: fetchPools,
        getPool,
        getPoolStats: getPoolStatsData,
      }}
    >
      {children}
    </PoolsContext.Provider>
  );
}; 