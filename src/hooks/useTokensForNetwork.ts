import { useMemo } from "react";
import { Token, Fraction } from "@uniswap/sdk-core";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";

import { ChainID } from "../types/enums";
import { useAddress } from "../providers/AddressProvider";
import { useFetchTokenBalances, TokenBalance } from "./fetch";
import { formatInput } from "../utils/numbers";
import { oneTokenUnit, priceFromTick } from "../utils/tokens";
import { hederaTokenIdToEvmAddress } from "../common/constants";

function getToken(chainId: number, address: string, metadata: any) {
  // Convert Hedera account ID to Ethereum-style address
  const evmAddress = hederaTokenIdToEvmAddress(address);
  
  return new Token(
    chainId,
    evmAddress,
    metadata.decimals,
    metadata.symbol,
    metadata.name
  );
}

export function useTokensForNetwork(chainId: number) {
  const { addresses } = useAddress();
  const { loading, tokenBalances } = useFetchTokenBalances(
    chainId,
    addresses[0]
  );

  const tokens = useMemo(() => {
    if (!tokenBalances || !tokenBalances.length) {
      return [];
    }

    return tokenBalances.map(
      ({ address, balance, metadata, priceTick }: TokenBalance) => {
        const token = getToken(chainId, address, metadata);
        const balanceFormatted = formatInput(
          parseFloat(formatUnits(balance, token.decimals))
        );

        const price = priceFromTick(token, priceTick);
        const value = price.multiply(
          new Fraction(BigNumber.from(balance).toString(), oneTokenUnit(token))
        );

        return {
          chainId,
          entity: token,
          balance: balanceFormatted,
          price: price,
          value: value,
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          logo: metadata.logo,
          address,
        };
      }
    );
  }, [chainId, tokenBalances]);

  return { loading, tokens };
}
