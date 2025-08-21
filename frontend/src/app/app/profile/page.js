'use client';

import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';

const IS_TESTNET = process.env.NEXT_PUBLIC_HL_TESTNET === 'false' ? false : true;
const HL_CHAIN = IS_TESTNET ? 'Testnet' : 'Mainnet';
const SIGNATURE_CHAIN_ID = '0x66eee'; // domain chain id Hyperliquid expects for user-signed actions

function buildApproveAgentTypedData({ agentAddress, agentName, nonce }) {
  return {
    domain: {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId: parseInt(SIGNATURE_CHAIN_ID, 16),
      verifyingContract: '0x0000000000000000000000000000000000000000',
    },
    primaryType: 'HyperliquidTransaction:ApproveAgent',
    types: {
      'HyperliquidTransaction:ApproveAgent': [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'agentAddress', type: 'address' },
        { name: 'agentName', type: 'string' },
        { name: 'nonce', type: 'uint64' },
      ],
    },
    message: {
      hyperliquidChain: HL_CHAIN,
      agentAddress,
      agentName,
      nonce,
    },
  };
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState('');
  const [agentAddr, setAgentAddr] = useState(null);
  const [hlConnected, setHlConnected] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => setIsClient(true), []);
  const disabled = useMemo(() => !isConnected || isWorking, [isConnected, isWorking]);

  const onConnectHyperliquid = useCallback(async () => {
    if (!isConnected || !address) return;
    setIsWorking(true);
    setStatus('Creating agent on backend…');
    setAgentAddr(null);

    try {
      // 1) Create agent (server generates keypair, returns only address)
      const r1 = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'web-agent' }),
      });
      if (!r1.ok) throw new Error(await r1.text());
      const { agent_addr } = await r1.json();
      setAgentAddr(agent_addr);

      // 2) Sign EIP-712 ApproveAgent
      setStatus('Please sign the Hyperliquid approval in your wallet…');
      const nonce = Date.now();
      const typed = buildApproveAgentTypedData({
        agentAddress: agent_addr,
        agentName: 'web-agent',
        nonce,
      });

      const sigHex = await signTypedDataAsync({
        domain: typed.domain,
        types: typed.types,
        primaryType: typed.primaryType,
        message: typed.message,
      });

      // Split signature -> { r, s, v }
      const raw = sigHex.slice(2);
      const r = '0x' + raw.slice(0, 64);
      const s = '0x' + raw.slice(64, 128);
      let v = parseInt(raw.slice(128, 130), 16);
      if (v < 27) v += 27;

      // 3) Submit approval
      setStatus('Submitting approval to backend…');
      const r2 = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',              // ensures route forwards to /hl/agent/approve
          owner: address,
          agent_address: agent_addr,      // match backend pydantic alias
          agent_name: 'web-agent',        // match backend pydantic alias
          signatureChainId: SIGNATURE_CHAIN_ID,
          nonce,
          signature: { r, s, v },         // required shape for HL /exchange
        }),
      });
      const text = await r2.text();
      if (!r2.ok) throw new Error(text);

      setHlConnected(true);
      setStatus('Agent approved. Connected to Hyperliquid.');
    } catch (e) {
      setStatus(e?.message || String(e));
      setHlConnected(false);
    } finally {
      setIsWorking(false);
    }
  }, [address, isConnected, signTypedDataAsync]);

  const onDisconnectHyperliquid = useCallback(() => {
    setHlConnected(false);
    setAgentAddr(null);
    setStatus('');
  }, []);

  if (!isClient) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <div className="space-y-6"><span className="block mb-2 text-lg font-medium">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      {isConnected ? (
        <div className="space-y-6">
          <div>
            <span className="block mb-2 text-lg font-medium">Wallet Connected</span>
            <span className="block text-sm text-muted-foreground mb-4">{address}</span>
          </div>

          <div>
            {hlConnected ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  size="lg"
                  className="flex items-center gap-3 bg-green-600 hover:bg-green-700 px-6 py-3 text-base min-w-[220px]"
                  disabled
                >
                  <Image src="/hyprliquid.png" alt="Hyperliquid Logo" width={28} height={28} />
                  Connected to Hyperliquid
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 px-4 py-3 text-base border-red-500 text-red-500 hover:bg-red-50"
                  onClick={onDisconnectHyperliquid}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-3 px-6 py-3 text-base min-w-[220px]"
                onClick={onConnectHyperliquid}
                disabled={disabled}
              >
                <Image src="/hyprliquid.png" alt="Hyperliquid Logo" width={28} height={28} />
                Connect to Hyperliquid
              </Button>
            )}
          </div>

          {agentAddr && (
            <div className="text-sm">
              Agent address: <span className="font-mono">{agentAddr}</span>
            </div>
          )}
          {status && <div className="text-sm opacity-80 whitespace-pre-wrap">{status}</div>}
        </div>
      ) : (
        <div className="space-y-6">
          <span className="block mb-2 text-lg font-medium">Connect your wallet to access your profile.</span>
          <ConnectWallet />
        </div>
      )}
    </div>
  );
}
