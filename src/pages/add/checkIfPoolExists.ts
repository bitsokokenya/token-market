const ethers = require('ethers');
const { Client } = require('@hashgraph/sdk');

import { FACTORY_ADDRESS, HEDERA_TESTNET_RPC } from '../common/constants';
// Add an empty export to make it a module
export {};

interface CheckPoolExistsParams {
  token0: string;
  token1: string;
  fee: number;
}

/**
 * Check if a pool exists on SaucerSwap
 */
async function checkIfPoolExists({ token0, token1, fee }: CheckPoolExistsParams): Promise<string | null> {
  try {
    console.log(`Checking if pool exists for tokens: ${token0}, ${token1} with fee: ${fee}`);
    
    // Factory contract ABI with just the getPool function
    const factoryAbi = [
      'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
    ];
    // Set up ethers provider for testnet
    const provider = new ethers.providers.JsonRpcProvider(HEDERA_TESTNET_RPC);
    
    // Create contract interface
    const factoryInterface = new ethers.utils.Interface(factoryAbi);
    
    // Initialize the factory contract
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS, 
      factoryInterface, 
      provider
    );
    
    // Call getPool function to check if pool exists
    const poolAddress = await factoryContract.getPool(token0, token1, fee);
    
    console.log(`Pool address: ${poolAddress}`);
    
    // If the pool doesn't exist, this will be the zero address
    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      console.log('Pool does not exist');
      return null;
    }
    
    return poolAddress;
  } catch (error) {
    console.error('Error checking if pool exists:', error);
    return null;
  }
}

// Example usage
async function main() {
  const result = await checkIfPoolExists({
    token0: '0.0.2997149', // Example token address
    token1: '0.0.2997150', // Example token address
    fee: 3000, // 0.3% fee tier
  });
  
  console.log('Check pool exists result:', result);
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Use module.exports for CommonJS compatibility
module.exports = { checkIfPoolExists };