'use client';

//appel API Hyperliquid todo

import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Dummy hook for Hyperliquid connection status
function useHyperliquid() {
  const [connected, setConnected] = useState(false);
  return {
    connected,
    connect: () => setConnected(true),
    disconnect: () => setConnected(false),
  };
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const hyperliquid = useHyperliquid();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <div className="space-y-6">
          <span className="block mb-2 text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      {isConnected ? (
        <div className="space-y-6">
          <div>
            <span className="block mb-2 text-lg font-medium">
              Wallet Connected
            </span>
            <span className="block text-sm text-muted-foreground mb-4">
              {address}
            </span>
          </div>
          <div>
            {hyperliquid.connected ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  size="lg"
                  className="flex items-center gap-3 bg-green-600 hover:bg-green-700 px-6 py-3 text-base min-w-[200px]"
                  disabled
                >
                  <Image
                    src="/hyprliquid.png"
                    alt="Hyperliquid Logo"
                    width={28}
                    height={28}
                  />
                  Connected to Hyperliquid
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 px-4 py-3 text-base border-red-500 text-red-500 hover:bg-red-50"
                  onClick={hyperliquid.disconnect}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-3 px-6 py-3 text-base min-w-[200px]"
                onClick={hyperliquid.connect}
              >
                <Image
                  src="/hyprliquid.png"
                  alt="Hyperliquid Logo"
                  width={28}
                  height={28}
                />
                Connect to Hyperliquid
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <span className="block mb-2 text-lg font-medium">
            Connect your wallet to access your profile.
          </span>
          <ConnectWallet />
        </div>
      )}
    </div>
  );
}
