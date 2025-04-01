/*
Fetch Pool Token Ratio
Retrieve the current token price ratio for a existing pool.

Code Overview
The code below demonstrates one of the methods for retrieving the current price ratio of two tokens of an existing liquidity pool, which is needed to calculate the precise amounts required for each token when establishing a new liquidity position. The token ratio allows you to calculate the amount needed for the other token.


import * as uniswap_sdk from '@uniswap/v3-sdk';
import * as uniswap_core from '@uniswap/sdk-core';
import * as ethers from 'ethers'; //V6

//Set one of Hedera's JSON RPC Relay as the provider
const provider = new ethers.JsonRpcProvider(hederaJsonRelayUrl, '', {
  batchMaxCount: 1, //workaround for V6
});

//load the ABI data containing Pool's liquidity() and slot0()
const abiInterfaces = new ethers.Interface(abi);

//construct the pool contract
const poolContract = new ethers.Contract(poolEvmAddress, abiInterfaces.fragments, provider);

//construct the tokens
const token0 = new uniswap_core.Token(hederaChainId, token0Address, token0Decimals);
const token1 = new uniswap_core.Token(hederaChainId, token1Address, token1Decimals);

//get current slot0 and liquidity data from JSON-RPC
const [slot0, liquidity] = await Promise.all([
  poolContract.slot0(),
  poolContract.liquidity()
]);

//construct the pool using the latest on-chain data
const pool = new uniswap_sdk.Pool(
  token0, token1, 
  feeTierBip, slot0.sqrtPriceX96.toString(),
  liquidity.toString(), Number(slot0.tick)
);

// Get the price of token0 in terms of token1:
const priceOfToken0InToken1 = pool.token0Price.toFixed(token1Decimals);

// Get the price of token1 in terms of token0:
const priceOfToken1InToken0 = pool.token1Price.toFixed(token0Decimals);

console.log(`Current price: ${priceOfToken1InToken0} Token0 per Token1`);
console.log(`Current price: ${priceOfToken0InToken1} Token1 per Token0`);

*/