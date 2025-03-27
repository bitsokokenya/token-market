import React, { ReactNode, useContext, useCallback, useMemo } from 'react';
import { Token } from '@uniswap/sdk-core';
import createPersistedState from 'use-persisted-state';

import { ChainID } from '../types/enums';
import { HEDERA_TOKENS, hederaTokenIdToEvmAddress } from '../common/constants';

const AppSettingsContext = React.createContext(null as any);
export const useAppSettings = () => useContext(AppSettingsContext);

const useFilterClosedState = createPersistedState('app-filter-closed');
const useGlobalCurrencyState = createPersistedState('app-global-currency');
const useThemeState = createPersistedState('app-theme');

interface Props {
  children: ReactNode;
}

function ClientOnly({ children, ...delegated }: Props) {
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <div {...delegated}>{children}</div>;
}

const AppSettingsProvider = ({ children }: Props) => {
  const [filterClosed, setFilterClosed] = useFilterClosedState(false);
  const [globalCurrency, setGlobalCurrency] = useGlobalCurrencyState('kes');
  const [theme, setTheme] = useThemeState('');

  const getGlobalCurrencyToken = useCallback(
    (chainId: number): Token => {
      // For Hedera, we'll use USDC as the base token for KES conversion
      return new Token(
        ChainID.HederaTestnet,
        hederaTokenIdToEvmAddress(HEDERA_TOKENS.USDC.tokenId),
        HEDERA_TOKENS.USDC.decimals,
        HEDERA_TOKENS.USDC.symbol,
        HEDERA_TOKENS.USDC.name
      );
    },
    []
  );

  const computedTheme = useMemo(() => {
    if (
      theme === 'dark' ||
      (theme === '' && window?.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      return 'dark';
    } else {
      return 'light';
    }
  }, [theme]);

  return (
    <AppSettingsContext.Provider
      value={{
        filterClosed,
        setFilterClosed,
        globalCurrency,
        getGlobalCurrencyToken,
        setGlobalCurrency,
        theme: computedTheme,
        setTheme,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

const AppSettingsProviderWithWrapper = ({ children }: Props) => {
  return (
    <ClientOnly>
      <AppSettingsProvider>{children}</AppSettingsProvider>
    </ClientOnly>
  );
};

export default AppSettingsProviderWithWrapper;
