import { configureChains, createClient } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  ledgerWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { Chain } from 'wagmi';

// Define Hedera chain configuration
const hederaChain: Chain = {
  id: 296, // Hedera mainnet chain ID
  name: 'Hedera',
  network: 'hedera',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.hashio.io/api'],
    },
    public: {
      http: ['https://mainnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/mainnet',
    },
  },
  testnet: false,
};

const { chains, provider } = configureChains(
  [hederaChain],
  [
    jsonRpcProvider({
      rpc: (chain: Chain) => {
        const urls: { [index: number]: string } = {
          296: 'https://mainnet.hashio.io/api', // Hedera mainnet
          297: 'https://testnet.hashio.io/api', // Hedera testnet
          298: 'https://previewnet.hashio.io/api', // Hedera previewnet
        };

        return {
          http: urls[chain.id],
        };
      },
    }),
  ],
);

const appName = 'Bits SME Investments';

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet({ chains }),
      ledgerWallet({ chains }),
      coinbaseWallet({ appName, chains }),
      rainbowWallet({ chains }),
      walletConnectWallet({ chains }),
    ],
  },
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export { wagmiClient, chains };
