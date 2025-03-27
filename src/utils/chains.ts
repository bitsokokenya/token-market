export function getChainNameAndColor(chainId: number) {
  const chains: { [id: number]: string[] } = {
    295: ['Hedera Mainnet', 'bg-green-200 text-green-700', 'hedera'],
    296: ['Hedera Testnet', 'bg-green-200 text-green-700', 'hedera'],
  };

  return chains[chainId] || ['Unknown', 'bg-gray-200 text-gray-700', 'unknown'];
}
