import axios from 'axios';

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
// use only v2 api
const SAUCERSWAP_API_BASE_URL = 'https://api.saucerswap.finance/';

export const getPools = async (): Promise<Pool[]> => {
  try {
    const response = await axios.get(`${SAUCERSWAP_API_BASE_URL}/v2/pools/full`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pools from Saucerswap:', error);
    throw error;
  }
};

export const getPoolDetails = async (poolAddress: string): Promise<Pool> => {
  try {
    const response = await axios.get(`${SAUCERSWAP_API_BASE_URL}/v2/pools/${poolAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pool details from Saucerswap:', error);
    throw error;
  }
};
