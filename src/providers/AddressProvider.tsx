import React, { ReactNode, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Helper function to convert Hedera native address to EVM address
const convertHederaToEvmAddress = (hederaAddress: string): string => {
  // Split the address into shard, realm, and number
  const [shard, realm, number] = hederaAddress.split('.').map(Number);
  
  // Convert each component to hex and pad with zeros
  const shardHex = shard.toString(16).padStart(8, '0');
  const realmHex = realm.toString(16).padStart(8, '0');
  const numberHex = number.toString(16).padStart(8, '0');
  
  // Concatenate all components with leading zeros
  return `0x${shardHex}${realmHex}${numberHex}`;
};

// Use account IDs in the format 0.0.XXXXX injected by hach connect event
// For Hedera, we expect account IDs in the format 0.0.XXXXX
// use accountid from pairing event of hashconnectprovider
const AddressContext = React.createContext({
  addresses: [] as string[],
  injectedAddress: null as string | null | undefined,
  addressReady: false,
});

export const useAddress = () => useContext(AddressContext);

interface Props {
  children: ReactNode;
}

export const AddressProvider = ({ children }: Props) => {
  const router = useRouter();
  const [addresses, setAddresses] = useState<string[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      const { location } = window;
      const searchParams = new URLSearchParams(location.search);
      const inputAddresses = searchParams.getAll('addr');

      if (inputAddresses.length) {
        // For Hedera, we expect account IDs in the format 0.0.XXXXX
        const validAddresses = inputAddresses
          .filter(addr => /^0\.0\.\d+$/.test(addr))
          .map(addr => convertHederaToEvmAddress(addr));
        setAddresses(validAddresses);
      }
    };

    fetchAddresses();
  }, [router]);

  return (
    <AddressContext.Provider
      value={{
        addresses,
        injectedAddress: null,
        addressReady: addresses.length > 0,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};
