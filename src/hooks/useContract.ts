import { useMemo } from 'react';
import { useAccount, useProvider, useSigner } from 'wagmi';
import { getAddress } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { AddressZero } from '@ethersproject/constants';
import { JsonRpcSigner, BaseProvider } from '@ethersproject/providers';
import { Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';

import NFTPositionManagerABI from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json';
import V3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import ERC20_ABI from '../abis/erc20.json';
import ERC20_BYTES32_ABI from '../abis/erc20_bytes32.json';

import PerpMainMetadataOptimism from '@perp/curie-contract/metadata/optimism.json';
import PerpOrderBookABI from '@perp/curie-contract/artifacts/contracts/OrderBook.sol/OrderBook.json';

import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '../common/constants';

import { NonfungiblePositionManager } from '../types/v3/NonfungiblePositionManager';

import { useChainId } from './useChainId';

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

// Helper function to convert Hedera account ID to EVM address
function hederaToEvmAddress(accountId: string): string {
  // Remove any dots and convert to number
  const num = parseInt(accountId.replace(/\./g, ''), 10);
  // Convert to hex and pad to 40 characters (20 bytes)
  return `0x${num.toString(16).padStart(40, '0')}`;
}

// Helper function to convert EVM address to Hedera account ID
function evmToHederaAddress(address: string): string {
  // Remove 0x prefix and convert to number
  const num = parseInt(address.replace('0x', ''), 16);
  // Convert to Hedera account ID format (0.0.XXXXX)
  return `0.0.${num}`;
}

export function useContract(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
  providerLibrary?: BaseProvider,
): Contract | null {
  const provider = useProvider();
  const chainId = useChainId();

  // Safely get signer
  let signer: JsonRpcSigner | undefined;
  try {
    const { data } = useSigner();
    if (data) {
      signer = data as JsonRpcSigner;
    }
  } catch (error) {
    console.log('Signer not available:', error);
  }

  return useMemo(() => {
    if (!address || !ABI || !provider) {
      console.log('Missing required data:', { address, ABI, provider });
      return null;
    }

    try {
      // Convert address to Hedera format if it's an EVM address
      const hederaAddress = address.startsWith('0x') ? evmToHederaAddress(address) : address;
      console.log('Contract address in Hedera format:', hederaAddress);

      // Convert back to EVM format for contract creation
      const evmAddress = hederaToEvmAddress(hederaAddress);

      if (withSignerIfPossible && signer) {
        return new Contract(evmAddress, ABI, signer);
      }

      return new Contract(evmAddress, ABI, providerLibrary || provider);
    } catch (error) {
      console.error('Error creating contract:', error);
      return null;
    }
  }, [address, ABI, provider, providerLibrary, signer, withSignerIfPossible]);
}

// account is optional
export function getProviderOrSigner(
  library: BaseProvider,
  signer: JsonRpcSigner,
  account?: string,
): BaseProvider | JsonRpcSigner {
  return account && signer ? signer : library;
}

export function getContract(
  address: string,
  ABI: any,
  library: BaseProvider,
  signer: JsonRpcSigner,
  account?: string,
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(address, ABI, getProviderOrSigner(library, signer, account) as any);
}

// Helper function to validate Hedera account ID format
const isValidHederaAccountId = (address: string): boolean => {
  return /^0\.0\.\d+$/.test(address);
};

// returns null on errors
export function useContractBulk(
  addresses: (string | undefined)[],
  ABI: any,
  withSignerIfPossible = true,
  customProvider?: BaseProvider,
): (Contract | null)[] {
  const { address: account } = useAccount();
  const defaultProvider = useProvider();
  
  // Safely get signer
  let signer: JsonRpcSigner | undefined;
  try {
    const { data } = useSigner();
    if (data) {
      signer = data as JsonRpcSigner;
    }
  } catch (error) {
    console.log('Signer not available:', error);
  }

  const library = customProvider || defaultProvider;

  return useMemo(() => {
    try {
      return addresses.map((address) => {
        if (!address || !ABI || !library) return null;
        return getContract(
          address,
          ABI,
          library,
          signer! as JsonRpcSigner,
          withSignerIfPossible && account ? account : undefined,
        );
      });
    } catch (error) {
      console.error('Failed to get contract', error);
      return [];
    }
  }, [addresses, ABI, library, signer, withSignerIfPossible, account]);
}

export function useV3NFTPositionManagerContract(): NonfungiblePositionManager | null {
  const chainId = useChainId();
  // For now, return null since we don't have the NFT position manager on Hedera
  return null;
}

export function useTokenContracts(
  addresses: string[],
  withSignerIfPossible?: boolean,
): (Contract | null)[] {
  return useContractBulk(addresses, ERC20_ABI, withSignerIfPossible);
}

export function useBytes32TokenContracts(
  addresses: string[],
  withSignerIfPossible?: boolean,
): (Contract | null)[] {
  return useContractBulk(addresses, ERC20_BYTES32_ABI, withSignerIfPossible);
}

export function usePoolContract(
  token0: Token | null,
  token1: Token | null,
  fee: number,
  providerLibrary?: BaseProvider,
  withSignerIfPossible?: boolean,
): Contract | null {
  if (!token0 || !token1 || token0.equals(token1)) {
    console.log('Invalid tokens for pool contract:', { token0, token1 });
    return null;
  }

  try {
    const address = Pool.getAddress(token0, token1, fee);
    console.log('Pool contract address:', address);
    return useContract(address, V3PoolABI, withSignerIfPossible, providerLibrary);
  } catch (error) {
    console.error('Error getting pool contract address:', error);
    return null;
  }
}

export interface PoolParams {
  key: string;
  token0: Token | null;
  token1: Token | null;
  fee: number;
  quoteToken?: Token;
  baseToken?: Token;
}

export function usePoolContracts(
  addresses: string[],
  providerLibrary?: BaseProvider,
  withSignerIfPossible?: boolean,
): (Contract | null)[] {
  return useContractBulk(addresses, V3PoolABI, withSignerIfPossible, providerLibrary);
}

export function usePerpOrderBookContract(
  providerLibrary?: BaseProvider,
  withSignerIfPossible?: boolean,
) {
  const { contracts } = PerpMainMetadataOptimism;
  const { address } = contracts.OrderBook;

  return useContract(address, PerpOrderBookABI, withSignerIfPossible, providerLibrary);
}
