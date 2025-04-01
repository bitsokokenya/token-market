const ethers = require('ethers');

// Convert a Hedera ID (0.0.xxxx format) to a valid EVM address
function hederaIdToEvmAddress(hederaId) {
  // If it's already an EVM address, return as is
  if (hederaId.startsWith('0x')) {
    return hederaId;
  }

  // Parse the Hedera ID
  const parts = hederaId.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid Hedera ID format: ${hederaId}`);
  }

  // Get the last number which is the account/token number
  const number = parseInt(parts[2], 10);
  
  // Convert to hex and pad to 40 characters (20 bytes)
  const hex = number.toString(16).padStart(40, '0');
  
  return `0x${hex}`;
}

/**
 * Check if a pool exists on SaucerSwap
 */
async function checkIfPoolExists({ token0, token1, fee }) {
  try {
    console.log(`Checking if pool exists for tokens: ${token0}, ${token1} with fee: ${fee}`);
    
    // Factory contract ABI with just the getPool function
    const factoryAbi = [
      'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
    ];
    
    // SaucerSwap factory address for testnet
    const FACTORY_ADDRESS = '0x0000000000000000000000000000000000070f24';
    
    // Hedera testnet JSON RPC URL
    const HEDERA_TESTNET_RPC = 'https://testnet.hashio.io/api';
    
    // Set up ethers provider for testnet with explicit network configuration
    const provider = new ethers.providers.JsonRpcProvider(
      HEDERA_TESTNET_RPC,
      {
        name: 'hedera-testnet',
        chainId: 296,
      }
    );
    
    // Create contract interface
    const factoryInterface = new ethers.utils.Interface(factoryAbi);
    
    // Initialize the factory contract
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS, 
      factoryInterface, 
      provider
    );
    
    // Convert Hedera token IDs to EVM addresses
    const token0Evm = hederaIdToEvmAddress(token0);
    const token1Evm = hederaIdToEvmAddress(token1);
    
    console.log(`Converted addresses: ${token0Evm}, ${token1Evm}`);
    
    // Call getPool function to check if pool exists
    const poolAddress = await factoryContract.getPool(token0Evm, token1Evm, fee);
    
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
    token0: '0.0.2997149', // Example token address - replace with your token
    token1: '0.0.2997150', // Example token address - replace with your token
    fee: 3000, // 0.3% fee tier
  });
  
  console.log('Check pool exists result:', result);
}

// Run the example
main().catch(console.error); 