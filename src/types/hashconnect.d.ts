declare module 'hashconnect' {
  import { LedgerId } from '@hashgraph/sdk';

  export interface DappMetadata {
    name: string;
    description: string;
    icons: string[];
    url: string;
  }

  export interface SessionData {
    topic: string;
    accountIds: string[];
  }

  export type HashConnectConnectionState = 'connected' | 'disconnected';

  export class HashConnect {
    constructor(ledgerId: LedgerId, projectId: string, metadata: DappMetadata, debug?: boolean);
    init(): Promise<void>;
    connect(): Promise<string>;
    disconnect(): Promise<void>;
    getPairingData(): SessionData[];
    pairingEvent: {
      on(callback: (data: SessionData) => void): void;
    };
    connectionStatusChangeEvent: {
      on(callback: (status: HashConnectConnectionState) => void): void;
    };
  }
} 