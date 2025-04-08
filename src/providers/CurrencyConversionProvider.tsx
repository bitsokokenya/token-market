import React, { ReactNode, useContext, useCallback, useState } from "react";
import { HEDERA_TOKENS, CURRENT_CHAIN_ID } from "../common/constants";
import { ChainID } from "../types/enums";
import { formatCurrency } from "../utils/numbers";
import { useAppSettings } from "./AppSettingsProvider";
import { HederaToken } from "../utils/tokens";

import { useFetchPriceFeed } from "../hooks/fetch";

const CurrencyConversionsContext = React.createContext({
  convertToGlobal: (val: any): number => {
    return 0;
  },
  convertToGlobalFormatted: (val: any): string => {
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

// Base tokens for Hedera using HederaToken class
const baseTokens: { [key: string]: HederaToken } = {
  USDC: new HederaToken(
    CURRENT_CHAIN_ID,
    HEDERA_TOKENS.USDC.tokenId,
    HEDERA_TOKENS.USDC.decimals,
    HEDERA_TOKENS.USDC.symbol,
    HEDERA_TOKENS.USDC.name
  ),
  HBAR: new HederaToken(
    CURRENT_CHAIN_ID,
    HEDERA_TOKENS.HBAR.tokenId,
    HEDERA_TOKENS.HBAR.decimals,
    HEDERA_TOKENS.HBAR.symbol,
    HEDERA_TOKENS.HBAR.name
  ),
};

// Update to use Hedera token addresses
const baseTokenAddresses = Object.values(baseTokens).map((t) => t.address);

export const CurrencyConversionsProvider = ({ children }: Props) => {
  const { getGlobalCurrencyToken } = useAppSettings();

  const [priceFeedLastLoaded, setPriceFeedLastLoaded] = useState(+new Date());

  const { loading: loadingPriceFeed, priceFeed } = useFetchPriceFeed(
    ChainID.HederaTestnet,
    baseTokenAddresses,
    priceFeedLastLoaded
  );

  // Get price relative to HBAR
  const getTokenPrice = useCallback(
    (token: HederaToken) => {
      if (loadingPriceFeed) {
        return 0;
      }

      const tokenAddress = token.address;
      const tick = priceFeed[tokenAddress];
      
      if (!tick) {
        console.error("No matching price pool found for token:", {
          address: tokenAddress,
          symbol: token.symbol
        });
        return 0;
      }
      
      // Simple price calculation based on tick
      return parseFloat(tick.toString()) / Math.pow(10, baseTokens.HBAR.decimals - token.decimals);
    },
    [loadingPriceFeed, priceFeed]
  );

  const convertToGlobal = useCallback(
    (val: any): number => {
      if (!val) {
        console.warn('Attempted to convert undefined value');
        return 0;
      }

      try {
        // Handle different input types
        if (typeof val === 'number') {
          return val; // Already a number, return as is
        }
        
        if (typeof val === 'string') {
          return parseFloat(val); // Convert string to number
        }
        
        // Handle object with toExact method but not a full CurrencyAmount
        if (typeof val === 'object' && 'toExact' in val && typeof val.toExact === 'function') {
          const valStr = val.toExact();
          const valFloat = parseFloat(valStr);
          
          // If this is a plain object with toExact (not a CurrencyAmount), return the parsed value
          if (!('token' in val)) {
            return valFloat;
          }
          
          // Now we know val is a CurrencyAmount
          const globalCurrencyToken = getGlobalCurrencyToken(val.token.chainId);
          
          if (val.token.equals(globalCurrencyToken)) {
            return valFloat;
          }

          let price = 0;
          if (val.token.equals(baseTokens.HBAR)) {
            price = 1;
          } else {
            // Try to find the token by symbol first
            let token = val.token.symbol ? baseTokens[val.token.symbol] : undefined;
            
            if (!token) {
              // If not found by symbol, try to find by token ID
              const tokenId = val.token.getHederaAccountId();
              const foundToken = Object.values(baseTokens).find(t => t.getHederaAccountId() === tokenId);
              
              if (foundToken) {
                token = foundToken;
              } else {
                console.error("Base token not found:", {
                  id: val.token.getHederaAccountId(), 
                  symbol: val.token.symbol
                });
                return 0;
              }
            }
            
            price = getTokenPrice(token);
          }

          if (globalCurrencyToken.symbol === "USDC") {
            const usdcPrice = getTokenPrice(baseTokens.USDC);
            const KES_RATE = 150;
            return valFloat * (price / usdcPrice) * KES_RATE;
          }

          return price * valFloat;
        }
        
        // If we get here, the value is not in a supported format
        console.warn('Unsupported value type in convertToGlobal:', val);
        return 0;
      } catch (error) {
        console.error('Error converting currency amount:', error);
        return 0;
      }
    },
    [getGlobalCurrencyToken, getTokenPrice]
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
    (val: any): string => {
      if (!val) {
        console.warn('Attempted to format undefined CurrencyAmount or token');
        return formatCurrencyWithSymbol(0, ChainID.HederaTestnet);
      }

      try {
        // If val is a string or number, convert it to a number
        if (typeof val === 'string' || typeof val === 'number') {
          const numValue = typeof val === 'string' ? parseFloat(val) : val;
          return formatCurrencyWithSymbol(numValue, ChainID.HederaTestnet);
        }

        // Handle object with toExact method (could be our custom value object from priceFromTick)
        if (typeof val === 'object' && 'toExact' in val) {
          // Check if it's a CurrencyAmount (has token property) or our custom value object
          if (!('token' in val)) {
            // For custom value objects, use default chainId
            const numValue = parseFloat(val.toExact());
            return formatCurrencyWithSymbol(numValue, ChainID.HederaTestnet);
          }
          
          // It's a CurrencyAmount, use its token.chainId
          return formatCurrencyWithSymbol(
            convertToGlobal(val),
            val.token.chainId
          );
        }

        // Unknown value type, use default
        console.warn('Unsupported value type in convertToGlobalFormatted:', val);
        return formatCurrencyWithSymbol(0, ChainID.HederaTestnet);
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
