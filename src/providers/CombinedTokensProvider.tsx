import React, {
  ReactNode,
  useContext,
  useCallback,
  useMemo,
  useState,
} from "react";

import { ChainID } from "../types/enums";
import { useTokensForNetwork } from "../hooks/useTokensForNetwork";
import { useFetchPriceFeed } from "../hooks/fetch";
import { priceFromTick } from "../utils/tokens";
import { useCurrencyConversions } from "./CurrencyConversionProvider";

const TokensContext = React.createContext({
  tokens: [] as any[],
  loading: true,
  empty: false,
  totalTokenValue: 0,
  refreshTokenPrices: () => {},
});

export const useTokens = () => useContext(TokensContext);

interface Props {
  children: ReactNode;
}

export const CombinedTokensProvider = ({ children }: Props) => {
  const { convertToGlobal } = useCurrencyConversions();

  const { loading: hederaLoading, tokens: hederaTokens } =
    useTokensForNetwork(ChainID.HederaTestnet);

  const loading = useMemo(() => {
    return hederaLoading;
  }, [hederaLoading]);

  const [refreshingTokenAddresses, setRefreshingTokenAddresses] = useState<
    string[]
  >([]);
  const { priceFeed } = useFetchPriceFeed(
    ChainID.HederaTestnet,
    refreshingTokenAddresses
  );

  const tokens = useMemo(() => {
    return hederaTokens
      .map((token) => {
        const priceTick = priceFeed[token.address];
        
        // Make sure we can safely pass token.value to convertToGlobal
        let globalValue = 0;
        try {
          globalValue = convertToGlobal(token.value);
        } catch (error) {
          console.warn(`Failed to convert token value for ${token.symbol}:`, error);
          // Fallback: try to extract the number value directly
          if (token.value && typeof token.value.valueOf === 'function') {
            globalValue = token.value.valueOf();
          } else if (token.value && typeof token.value === 'object' && token.value.toString) {
            globalValue = parseFloat(token.value.toString());
          }
        }
        
        return {
          ...token,
          globalValue,
          price: priceTick
            ? priceFromTick(token.entity, priceTick)
            : token.price,
        };
      })
      .sort((a, b) => (a.globalValue < b.globalValue ? 1 : -1));
  }, [hederaTokens, convertToGlobal, priceFeed]);

  const empty = useMemo(() => {
    if (loading) {
      return false;
    }
    return !tokens.length;
  }, [loading, tokens]);

  const totalTokenValue = useMemo(() => {
    if (loading) {
      return 0;
    }
    return tokens.reduce((accm, token) => accm + token.globalValue, 0);
  }, [loading, tokens]);

  const refreshTokenPrices = useCallback(() => {
    setRefreshingTokenAddresses(
      tokens
        .filter(
          (token) =>
            token.address !== "native" && token.chainId === ChainID.HederaTestnet
        )
        .map((token) => token.address)
    );
  }, [tokens]);

  return (
    <TokensContext.Provider
      value={{
        tokens,
        empty,
        loading,
        totalTokenValue,
        refreshTokenPrices,
      }}
    >
      {children}
    </TokensContext.Provider>
  );
};
