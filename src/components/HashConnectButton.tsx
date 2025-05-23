import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useHashConnect } from '../providers/HashConnectProvider';

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-high"
  >
    <path
      d="M13.3333 6H7.33333C6.59695 6 6 6.59695 6 7.33333V13.3333C6 14.0697 6.59695 14.6667 7.33333 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V7.33333C14.6667 6.59695 14.0697 6 13.3333 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.33333 10H2.66667C2.31305 10 1.97391 9.85952 1.72386 9.60948C1.47381 9.35943 1.33333 9.02029 1.33333 8.66667V2.66667C1.33333 2.31305 1.47381 1.97391 1.72386 1.72386C1.97391 1.47381 2.31305 1.33333 2.66667 1.33333H8.66667C9.02029 1.33333 9.35943 1.47381 9.60948 1.72386C9.85952 1.97391 10 2.31305 10 2.66667V3.33333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const HashConnectButton: React.FC = () => {
  const { pairingString, connected, connect, disconnect, accountId } = useHashConnect();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNewBiz = async () => {
    if (connected) {
      //await disconnect();
    } else {
      setShowQR(true);
      //await connect();
    }
  };
  const handleClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      setShowQR(true);
      await connect();
    }
  };

  const handleCopyAddress = async () => {
    if (accountId) {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      {connected ? (

        <div className="flex items-center gap-2">
        <button
        onClick={handleNewBiz}
        className="px-4 py-2 rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white"
        >
        For Business
        </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-10">
            <span className="text-sm text-high">
              {accountId || 'Connecting..'}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-1 hover:bg-surface-20 rounded"
              title="Copy address"
            >
              <CopyIcon />
            </button>
            {copied && (
              <span className="text-xs text-green-500">Copied!</span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className="px-4 py-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white"
        >
          Connect
          </button>
      )}

      {showQR && pairingString && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex flex-col items-center">
            <p className="mb-2 text-sm text-gray-600">Scan to connect</p>
            <QRCodeSVG value={pairingString} size={200} />
            <p className="mt-2 text-xs text-gray-500">Open HashPack to connect</p>
          </div>
        </div>
      )}

        {connected && (
          <button
            onClick={handleClick}
            className="px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white"
          >
            Disconnect
          </button>
        )}

    </div>
  );
}; 