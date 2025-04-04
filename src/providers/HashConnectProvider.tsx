import React, { createContext, useContext, useEffect, useState } from 'react';
import { LedgerId } from '@hashgraph/sdk';

interface HashConnectContextType {
  hashconnect: any | null;
  pairingString: string | null;
  connected: boolean;
  accountId: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (accountId: string, transaction: any) => Promise<any>;
}

const HashConnectContext = createContext<HashConnectContextType | null>(null);

export const useHashConnect = () => {
  const context = useContext(HashConnectContext);
  if (!context) {
    throw new Error('useHashConnect must be used within a HashConnectProvider');
  }
  return context;
};

export const HashConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hashconnect, setHashconnect] = useState<any | null>(null);
  const [pairingString, setPairingString] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    const initializeHashConnect = async () => {
      try {
        const { HashConnect } = await import('hashconnect');
        const hashconnectInstance = new HashConnect(LedgerId.TESTNET, "9df3e28adeb5dbd1df0939d8dfe489f0", {
          name: "BITS | finance",
          description: "token market for managing SME's investments",
          icons: ["https://tm.bitsoko.org/favicon128.png"],
          url: "http://tm.bitsoko.org"
        }, true);

        setHashconnect(hashconnectInstance);

        // Set up event listeners
        hashconnectInstance.pairingEvent.on((data: any) => {
          console.log("Paired", data);
          if (data.accountIds && data.accountIds.length > 0) {
            setAccountId(data.accountIds[0]);
            setConnected(true);
            setTopic(data.topic);
            console.log("Paired:", data);
            // Save session data so it can be reused after a reload
            localStorage.setItem("hashconnectSession", JSON.stringify(data));
          }
        });

        // Handle connection status changes
        hashconnectInstance.connectionStatusChangeEvent.on((connectionStatus: string) => {
          console.log("Connection status changed:", connectionStatus);
          setConnected(connectionStatus === "connected");
          
          // Handle disconnection via the connection status change
          if (connectionStatus !== "connected") {
            setAccountId(null);
            setTopic(null);
            localStorage.removeItem("hashconnectSession");
          }
        });

        // Initialize HashConnect
        await hashconnectInstance.init();

        // Check for existing session
        const existingSession = localStorage.getItem("hashconnectSession");
        if (existingSession) {
          const sessionData = JSON.parse(existingSession);
          console.log("Existing session found, reconnecting...");
          setAccountId(sessionData.accountIds[0]);
          setTopic(sessionData.topic);
          setConnected(true);
        } else {
          console.log("No existing session found");
          setConnected(false);
        }
      } catch (error) {
        console.error("Failed to initialize HashConnect:", error);
      }
    };

    initializeHashConnect();

    return () => {
      if (hashconnect) {
        //  hashconnect.disconnect();
      }
    };
  }, []);

  const connect = async () => {
    if (hashconnect) {
      try {
        await hashconnect.openPairingModal();
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    }
  };

  const disconnect = async () => {
    if (hashconnect) {
      try {
        if (topic) {
          await hashconnect.disconnect(topic);
        }
        setConnected(false);
        setAccountId(null);
        setTopic(null);
        localStorage.removeItem("hashconnectSession");
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }
  };

  const sendTransaction = async (accountId: string, transaction: any) => {
    if (!hashconnect || !connected || !topic) {
      console.error("HashConnect not ready or not connected");
      return { success: false, error: "HashConnect not ready or not connected" };
    }

    try {
      console.log("Sending transaction via HashConnect...");
      
      // Create transaction data
      const transactionBytes = await transaction.freezeWithSigner(() => { });
      
      // Request signature from the wallet
      const response = await hashconnect.sendTransaction(topic, {
        topic: topic,
        byteArray: transactionBytes,
        metadata: {
          accountToSign: accountId,
          returnTransaction: false
        }
      });
      
      console.log("Transaction response:", response);
      
      return {
        success: true,
        response: response
      };
    } catch (error) {
      console.error("Failed to send transaction:", error);
      return {
        success: false,
        error: error
      };
    }
  };

  return (
    <HashConnectContext.Provider
      value={{
        hashconnect,
        pairingString,
        connected,
        accountId,
        connect,
        disconnect,
        sendTransaction
      }}
    >
      {children}
    </HashConnectContext.Provider>
  );
}; 