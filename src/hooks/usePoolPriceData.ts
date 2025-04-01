import { useState, useEffect, useMemo } from 'react';
import { HederaToken } from '../utils/tokens';
import { format, subDays } from 'date-fns';

interface PriceDataPoint {
  date: string;
  price: number;
}

export function usePoolPriceData(
  chainId: number,
  poolAddress: string,
  quoteToken: HederaToken,
  baseToken: HederaToken,
  period: number = 30
) {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!chainId || !poolAddress || !quoteToken || !baseToken) {
        setPriceData([]);
        setLoading(false);
        return;
      }

      try {
        // Mock data for now - this would be replaced with actual API call
        setLoading(true);
        
        // Generate some mock price data
        const today = new Date();
        const mockData: PriceDataPoint[] = [];
        
        // Generate a random starting price
        let price = 10 + Math.random() * 40;
        
        // Create daily price data for the specified period
        for (let i = period; i >= 0; i--) {
          const currentDate = subDays(today, i);
          
          // Add some random movement each day
          price = price * (0.95 + Math.random() * 0.1);
          
          mockData.push({
            date: format(currentDate, 'MMM dd'),
            price
          });
        }
        
        setPriceData(mockData);
      } catch (err) {
        console.error('Error fetching price data', err);
        setPriceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [chainId, poolAddress, quoteToken, baseToken, period]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!priceData.length) {
      return { minPrice: 0, maxPrice: 0, meanPrice: 0, stdev: 0 };
    }
    
    const prices = priceData.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Calculate mean
    const sum = prices.reduce((acc, price) => acc + price, 0);
    const meanPrice = sum / prices.length;
    
    // Calculate standard deviation
    const squareDiffs = prices.map(price => {
      const diff = price - meanPrice;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / squareDiffs.length;
    const stdev = Math.sqrt(avgSquareDiff);
    
    return { minPrice, maxPrice, meanPrice, stdev };
  }, [priceData]);

  return { 
    priceData, 
    loading, 
    ...stats 
  };
}
