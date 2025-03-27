import React, { ReactNode, useContext, useCallback, useState } from "react";
import { Token, Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { tickToPrice } from "@uniswap/v3-sdk";

import { HEDERA_TOKENS, hederaTokenIdToEvmAddress } from "../common/constants";
import { ChainID } from "../types/enums";
import { formatCurrency } from "../utils/numbers";
import { useAppSettings } from "./AppSettingsProvider";

import { useFetchPriceFeed } from "../hooks/fetch";

const CurrencyConversionsContext = React.createContext({
  convertToGlobal: (val: CurrencyAmount<Currency>): number => {
    return 0;
  },
  convertToGlobalFormatted: (val: CurrencyAmount<Token>): string => {
    return "$0";
  },
  formatCurrencyWithSymbol: (val: number, chainId: number): string => {
    return "$0";
  },
  refreshPriceFeed: () => {},
});

export const useCurrencyConversions = () =>
  useContext(CurrencyConversionsContext);

interface Props {
  children: ReactNode;
}

// Base tokens for Hedera
const baseTokens: { [key: string]: Token } = {
  USDC: new Token(
    ChainID.HederaTestnet,
    hederaTokenIdToEvmAddress(HEDERA_TOKENS.USDC.tokenId),
    HEDERA_TOKENS.USDC.decimals,
    HEDERA_TOKENS.USDC.symbol,
    HEDERA_TOKENS.USDC.name
  ),
  HBAR: new Token(
    ChainID.HederaTestnet,
    hederaTokenIdToEvmAddress(HEDERA_TOKENS.HBAR.tokenId),
    HEDERA_TOKENS.HBAR.decimals,
    HEDERA_TOKENS.HBAR.symbol,
    HEDERA_TOKENS.HBAR.name
  ),
};

const baseTokenAddresses = Object.values(baseTokens).map((t) => t.address);

export const CurrencyConversionsProvider = ({ children }: Props) => {
  const { getGlobalCurrencyToken } = useAppSettings();

  const [priceFeedLastLoaded, setPriceFeedLastLoaded] = useState(+new Date());

  const { loading: loadingPriceFeed, priceFeed } = useFetchPriceFeed(
    ChainID.HederaTestnet,
    baseTokenAddresses,
    priceFeedLastLoaded
  );

  const getHBARPrice = useCallback(
    (token: Token) => {
      if (loadingPriceFeed) {
        return 0;
      }

      const tick = priceFeed[token.address];
      if (!tick) {
        console.error("no matching price pool found for base token ", token);
        return 0;
      }
      return parseFloat(
        tickToPrice(token, baseTokens.HBAR, tick).toSignificant(8)
      );
    },
    [loadingPriceFeed, priceFeed]
  );

  const convertToGlobal = useCallback(
    (val: CurrencyAmount<Currency>): number => {
      if (!val) {
        console.warn('Attempted to convert undefined CurrencyAmount');
        return 0;
      }

      try {
        const valFloat = parseFloat(val.toSignificant(15));
        const globalCurrencyToken = getGlobalCurrencyToken(val.currency.chainId);
        if (val.currency.equals(globalCurrencyToken)) {
          return valFloat;
        }

        let price = 0;
        if (
          val.currency.isNative ||
          val.currency.equals(baseTokens.HBAR)
        ) {
          price = 1;
        } else {
          let currency = baseTokens[val.currency.symbol as string];
          if (!currency) {
            console.error("base token not found", val.currency);
            return 0;
          }
          price = getHBARPrice(currency);
        }

        if (globalCurrencyToken.symbol === "USDC") {
          const usdcPrice = getHBARPrice(baseTokens.USDC);
          // Convert USDC to KES (assuming 1 USDC = 150 KES)
          const KES_RATE = 150;
          return valFloat * (price / usdcPrice) * KES_RATE;
        }

        return price * valFloat;
      } catch (error) {
        console.error('Error converting currency amount:', error);
        return 0;
      }
    },
    [getGlobalCurrencyToken, getHBARPrice]
  );

  const formatCurrencyWithSymbol = useCallback(
    (val: number, chainId: number): string => {
      const currencySymbol = getGlobalCurrencyToken(chainId).equals(
        baseTokens.USDC
      )
        ? "KSh"
        : "ℏ";
      return formatCurrency(val, currencySymbol);
    },
    [getGlobalCurrencyToken]
  );

  const convertToGlobalFormatted = useCallback(
    (val: CurrencyAmount<Token>): string => {
      if (!val || !val.currency) {
        console.warn('Attempted to format undefined CurrencyAmount or currency');
        return formatCurrencyWithSymbol(0, ChainID.HederaTestnet);
      }

      try {
        return formatCurrencyWithSymbol(
          convertToGlobal(val),
          val.currency.chainId
        );
      } catch (error) {
        console.error('Error formatting currency amount:', error);
        return formatCurrencyWithSymbol(0, ChainID.HederaTestnet);
      }
    },
    [formatCurrencyWithSymbol, convertToGlobal]
  );

  const refreshPriceFeed = () => {
    setPriceFeedLastLoaded(+new Date());
  };

  return (
    <CurrencyConversionsContext.Provider
      value={{
        convertToGlobal,
        formatCurrencyWithSymbol,
        convertToGlobalFormatted,
        refreshPriceFeed,
      }}
    >
      {children}
    </CurrencyConversionsContext.Provider>
  );
};
