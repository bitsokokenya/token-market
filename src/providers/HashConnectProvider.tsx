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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeHashConnect = async () => {
      if (isInitialized) return;

      try {
        const { HashConnect } = await import('hashconnect');
        const hashconnectInstance = new HashConnect(LedgerId.TESTNET, "9df3e28adeb5dbd1df0939d8dfe489f0", {
          name: "BITS | finance",
          description: "token market for managing SME's investments",
          icons: ["https://54879-hedhack.bitsoko.org/favicon128.png"],
          url: "http://tm.bitsoko.org"
        }, true);

        if (!isMounted) return;

        setHashconnect(hashconnectInstance);

        // Set up event listeners
        hashconnectInstance.pairingEvent.on((data: any) => {
          if (!isMounted) return;
          
          console.log("Paired", data);
          if (data.accountIds && data.accountIds.length > 0) {
            const sessionData = {
              accountIds: data.accountIds,
              topic: data.topic,
              metadata: data.metadata,
              network: data.network,
              pairingString: pairingString
            };
            localStorage.setItem("hashconnectSession", JSON.stringify(sessionData));
            
            setAccountId(data.accountIds[0]);
            setConnected(true);
            setTopic(data.topic);
          }
        });

        hashconnectInstance.connectionStatusChangeEvent.on(async (connectionStatus: string) => {
          if (!isMounted) return;
          
          console.log("Connection status changed:", connectionStatus);
          
          if (connectionStatus === "connected") {
            const existingSession = localStorage.getItem("hashconnectSession");
            if (existingSession) {
              try {
                const sessionData = JSON.parse(existingSession);
                console.log("Existing session found, reconnecting...", sessionData);
                
                if (sessionData.accountIds && sessionData.accountIds.length > 0) {
                  setAccountId(sessionData.accountIds[0]);
                  setConnected(true);
                  setTopic(sessionData.topic);
                  
                  if (sessionData.topic) {
                    try {
                      await hashconnectInstance.connect();
                      console.log("Successfully reconnected to existing session");
                    } catch (error) {
                      console.error("Failed to reconnect:", error);
                      localStorage.removeItem("hashconnectSession");
                      setConnected(false);
                      setAccountId(null);
                      setTopic(null);
                    }
                  }
                }
              } catch (error) {
                console.error("Failed to parse session:", error);
                localStorage.removeItem("hashconnectSession");
              }
            }
          } else if (connectionStatus === "disconnected") {
            setConnected(false);
            setAccountId(null);
            setTopic(null);
            localStorage.removeItem("hashconnectSession");
          }
        });

        await hashconnectInstance.init();
        setIsInitialized(true);

      } catch (error) {
        console.error("Failed to initialize HashConnect:", error);
      }
    };

    initializeHashConnect();

    return () => {
      isMounted = false;
    };
  }, [isInitialized]);

  const connect = async () => {
    if (hashconnect) {
      try {
        const pairingData = await hashconnect.openPairingModal();
        if (pairingData && pairingData.pairingString) {
          setPairingString(pairingData.pairingString);
          const sessionData = JSON.parse(localStorage.getItem("hashconnectSession") || "{}");
          sessionData.pairingString = pairingData.pairingString;
          localStorage.setItem("hashconnectSession", JSON.stringify(sessionData));
        }
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
      
      const transactionBytes = await transaction.freezeWithSigner(() => { });
      
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