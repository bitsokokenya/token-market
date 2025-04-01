import React, { useEffect, useState } from 'react';

import { HederaToken } from '../../utils/tokens';

interface FeeTierItem {
  feeTier: number;
  tvl: number;
  volume24h: number;
  fee: number;
  apy: number;
}

interface Props {
  chainId: number | undefined;
  baseToken: HederaToken;
  quoteToken: HederaToken;
  currentValue: number;
}

function FeeTierData({ chainId, baseToken, quoteToken, currentValue }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FeeTierItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!baseToken || !quoteToken) return;
      
      setLoading(true);
      
      try {
        // This would fetch fee tier data from an API
        // For now, let's just create simulated data
        const simulatedData: FeeTierItem[] = [
          {
            feeTier: 100, // 0.01%
            tvl: 100000,
            volume24h: 50000,
            fee: 0.01,
            apy: 2.5,
          },
          {
            feeTier: 500, // 0.05%
            tvl: 500000,
            volume24h: 200000,
            fee: 0.05,
            apy: 7.3,
          },
          {
            feeTier: 3000, // 0.3%
            tvl: 800000,
            volume24h: 350000,
            fee: 0.3,
            apy: 12.8,
          },
          {
            feeTier: 10000, // 1%
            tvl: 300000,
            volume24h: 100000,
            fee: 1,
            apy: 9.1,
          },
        ];
        
        setData(simulatedData);
      } catch (error) {
        console.error('Error fetching fee tier data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [baseToken, quoteToken, chainId]);

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-10 dark:bg-slate-700">
            <th className="p-2 text-left">Fee Tier</th>
            <th className="p-2 text-right">TVL</th>
            <th className="p-2 text-right">Volume (24h)</th>
            <th className="p-2 text-right">Fee APY</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.feeTier}
              className={`border-b border-surface-5 dark:border-slate-700 ${
                item.feeTier === currentValue ? 'bg-blue-50 dark:bg-slate-800' : ''
              }`}
            >
              <td className="p-2 font-medium">{item.fee}%</td>
              <td className="p-2 text-right">${item.tvl.toLocaleString()}</td>
              <td className="p-2 text-right">${item.volume24h.toLocaleString()}</td>
              <td className="p-2 text-right">{item.apy.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-sm text-medium italic">
        Note: Fee APY is calculated based on 24h volume and TVL. Actual returns may vary.
      </div>
    </div>
  );
}

export default FeeTierData;
