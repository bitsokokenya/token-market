import React from 'react';
import { usePools } from '../contexts/PoolsContext';

const PoolsList: React.FC = () => {
  const { pools, loading, error, refreshPools } = usePools();

  if (loading) {
    return <div>Loading pools...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refreshPools}>Retry</button>
      </div>
    );
  }

  return (
    <div className="pools-list">
      <h2>Available Pools</h2>
      <div className="pools-grid">
        {pools.map((pool) => (
          <div key={pool.address} className="pool-card">
            <h3>{pool.token0.symbol}/{pool.token1.symbol}</h3>
            <div className="pool-details">
              <p>Fee: {pool.fee}%</p>
              <p>TVL: ${parseFloat(pool.tvl).toLocaleString()}</p>
              <p>24h Volume: ${parseFloat(pool.volume24h).toLocaleString()}</p>
              <p>Token0 Price: ${parseFloat(pool.token0Price).toFixed(6)}</p>
              <p>Token1 Price: ${parseFloat(pool.token1Price).toFixed(6)}</p>
            </div>
            <div className="pool-address">
              <p>Address: {pool.address}</p>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .pools-list {
          padding: 20px;
        }

        .pools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .pool-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .pool-card h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .pool-details {
          margin-bottom: 16px;
        }

        .pool-details p {
          margin: 8px 0;
          color: #666;
        }

        .pool-address {
          font-size: 0.9em;
          color: #999;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
};

export default PoolsList; 