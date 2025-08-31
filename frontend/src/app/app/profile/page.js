// src/app/app/profile/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, useSignMessage, useSignTypedData } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { recoverTypedDataAddress } from 'viem';
import Image from 'next/image';

/* ------------------------ tiny local UI helpers ----------------------- */
function FieldLabel(props) {
  return (
    <label
      {...props}
      className={['text-sm font-medium leading-none', props.className || ''].join(' ')}
    />
  );
}
function TextInput({ className = '', type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={[
        'flex h-10 w-full rounded-md border border-gray-300 bg-white',
        'px-3 py-2 text-sm placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-black/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

/* --------------------------- constants -------------------------------- */
const DEFAULT_AGENT_NAME = 'aeq-agent';
const DEFAULT_TTL_SECONDS = 180 * 24 * 60 * 60; // 180 days
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/* --------------------------- SIWE helpers ----------------------------- */
function buildSiweMessage({ address, nonce, chainId, domain, uri }) {
  const issuedAt = new Date().toISOString();
  return `${domain} wants you to sign in with your Ethereum account:
${address}

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/* --------------------------- HL helpers ------------------------------- */
function toHexChainId(n) {
  return '0x' + Number(n).toString(16);
}

// keep v as 27/28 (NOT 0/1)
function splitSigRSV(sigHex) {
  const s = sigHex.slice(2);
  const r = '0x' + s.slice(0, 64);
  const sPart = '0x' + s.slice(64, 128);
  let v = parseInt(s.slice(128, 130), 16);
  if (v < 27) v += 27;
  return { r, s: sPart, v };
}

// EIP-712 typed data for Hyperliquid ApproveAgent
function buildEip712ForApprove(action, evmChainIdNumber) {
  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId: evmChainIdNumber, // number (e.g., 42161)
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };
  const types = {
    'HyperliquidTransaction:ApproveAgent': [
      { name: 'hyperliquidChain', type: 'string' },  // "Mainnet" | "Testnet"
      { name: 'agentAddress', type: 'address' },     // 0x...
      { name: 'agentName', type: 'string' },         // can be empty
      { name: 'nonce', type: 'uint64' },             // equals outer nonce
    ],
  };
  const primaryType = 'HyperliquidTransaction:ApproveAgent';
  const message = {
    hyperliquidChain: action.hyperliquidChain,
    agentAddress: action.agentAddress.toLowerCase(),
    agentName: action.agentName ?? '',
    nonce: BigInt(action.nonce),
  };
  return { domain, types, primaryType, message };
}

async function getHyperliquidChainFromHealth() {
  try {
    const r = await fetch('/api/health', { cache: 'no-store' });
    const j = await r.json();
    const url = j?.exchange_url || '';
    if (!url) return 'Mainnet';
    return url.includes('test') ? 'Testnet' : 'Mainnet';
  } catch {
    return 'Mainnet';
  }
}

/* --------------------- deterministic date formatting ------------------ */
function stableUTCFromSeconds(tsSec) {
  if (!tsSec) return '—';
  const d = new Date(tsSec * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/* =============================== PAGE ================================= */

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const owner = useMemo(() => address?.toLowerCase() ?? null, [address]);

  // session
  const [sessionAddr, setSessionAddr] = useState(null);
  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await res.json();
      setSessionAddr(data?.address || null);
    } catch {
      setSessionAddr(null);
    }
  };
  useEffect(() => {
    if (mounted) refreshSession();
  }, [mounted]);

  // single agent (HL)
  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);

  const refreshAgent = async () => {
    if (!owner) return;
    try {
      setLoadingAgent(true);
      const res = await fetch(`/api/agents/hl?owner=${owner}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.agent_address || data.agent_name || data.expiry_unix)) {
          setAgent(data);
        } else {
          setAgent(null);
        }
      } else if (res.status === 404) {
        setAgent(null);
      } else {
        // fallback to list route if your backend doesn't have /agents/hl
        const resList = await fetch(`/api/agents?owner=${owner}`, { cache: 'no-store' });
        const list = await resList.json().catch(() => []);
        setAgent(Array.isArray(list) && list.length ? list[0] : null);
      }
    } catch {
      setAgent(null);
    } finally {
      setLoadingAgent(false);
    }
  };

  useEffect(() => {
    if (owner) refreshAgent();
    else setAgent(null);
  }, [owner]);

  // form state (only keys are user-visible)
  const [agentPriv, setAgentPriv] = useState('');
  const [agentAddr, setAgentAddr] = useState('');

  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState(null);

  const connectedAndAuthed =
    mounted &&
    isConnected &&
    sessionAddr &&
    owner &&
    sessionAddr.toLowerCase() === owner.toLowerCase();

  /* --------------------------- Extended (x10) state -------------------- */
  const [extAccountIndex, setExtAccountIndex] = useState(0);
  const [extDescription, setExtDescription] = useState('aeq-prod trading key');
  const [extBusy, setExtBusy] = useState(false);
  const [extError, setExtError] = useState(null);
  const [extResult, setExtResult] = useState(null); // { exists?:true, created?:true, account_id }

  /* --------------------------- actions -------------------------------- */

  // Only generate agent private/public keypair
  const handleGenerateKey = () => {
    const pk = generatePrivateKey(); // 0x...
    const acct = privateKeyToAccount(pk);
    setAgentPriv(pk);
    setAgentAddr(acct.address);
  };

  const handleSignIn = async () => {
    try {
      setAuthBusy(true);
      setError(null);
      const n = await fetch('/api/auth/nonce', { cache: 'no-store' }).then((r) => r.json());
      if (!n?.nonce || !n?.domain || !n?.uri) {
        throw new Error('Invalid nonce payload from backend');
      }
      const msg = buildSiweMessage({
        address: owner,
        nonce: n.nonce,
        chainId,
        domain: n.domain,
        uri: n.uri,
      });
      const signature = await signMessageAsync({ message: msg });
      const r = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: owner, message: msg, signature }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail || 'Verification failed');
      }
      await refreshSession();
      await refreshAgent();
    } catch (e) {
      setError(e.message || 'Sign-in failed');
    } finally {
      setAuthBusy(false);
    }
  };

  const approveAgent = async () => {
    try {
      setBusy(true);
      setError(null);

      if (!connectedAndAuthed) throw new Error('Please sign in with your wallet first.');
      if (!agentPriv || !agentAddr) {
        throw new Error('Missing agent private key or address.');
      }

      const hyperliquidChain = await getHyperliquidChainFromHealth();
      const nowMs = Date.now();

      const action = {
        type: 'approveAgent',
        hyperliquidChain,
        signatureChainId: toHexChainId(chainId), // e.g., "0xa4b1"
        agentAddress: agentAddr.toLowerCase(),
        agentName: DEFAULT_AGENT_NAME,
        nonce: nowMs, // must equal outer nonce
      };

      // Build & sign typed data (owner wallet)
      const { domain, types, primaryType, message } = buildEip712ForApprove(action, chainId);
      const sigHex = await signTypedDataAsync({ domain, types, primaryType, message });

      // Verify locally we recover the connected wallet
      const recovered = await recoverTypedDataAddress({ domain, types, primaryType, message, signature: sigHex });
      if (recovered.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(`Signature recovers to ${recovered}, not your wallet ${owner}`);
      }

      const { r, s, v } = splitSigRSV(sigHex);

      const payload = {
        owner,
        agent_name: DEFAULT_AGENT_NAME,
        agent_privkey_hex: agentPriv,
        agent_address: agentAddr.toLowerCase(),
        ttl_seconds: DEFAULT_TTL_SECONDS, // fixed 180 days (hidden)
        approve_request: {
          action,
          nonce: nowMs, // equals action.nonce
          signature: { r, s, v },
        },
      };

      const resp = await fetch('/api/agents/hl/approve-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(j?.detail || j?.response || 'Approve failed');
      }

      // refresh to show the newly-approved agent
      await refreshAgent();
      // Optionally clear local key fields
      // setAgentPriv(''); setAgentAddr('');
    } catch (e) {
      setError(e.message || 'Approve failed');
    } finally {
      setBusy(false);
    }
  };

  const revokeAgent = async () => {
    try {
      setBusy(true);
      setError(null);

      if (!connectedAndAuthed) throw new Error('Please sign in with your wallet first.');
      if (!agent) throw new Error('No agent to revoke.');

      const name = agent.agent_name ?? DEFAULT_AGENT_NAME;
      if (!name) throw new Error('Missing agent name.');

      const hyperliquidChain = await getHyperliquidChainFromHealth();
      const nowMs = Date.now();

      const action = {
        type: 'approveAgent', // reuses same typed struct
        hyperliquidChain,
        signatureChainId: toHexChainId(chainId),
        agentAddress: ZERO_ADDRESS,          // <-- replace with ZERO to revoke
        agentName: name,
        nonce: nowMs,
      };

      const { domain, types, primaryType, message } = buildEip712ForApprove(action, chainId);
      const sigHex = await signTypedDataAsync({ domain, types, primaryType, message });
      const recovered = await recoverTypedDataAddress({ domain, types, primaryType, message, signature: sigHex });
      if (recovered.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(`Signature recovers to ${recovered}, not your wallet ${owner}`);
      }
      const { r, s, v } = splitSigRSV(sigHex);

      const payload = {
        owner,
        agent_name: name,
        approve_request: {
          action,
          nonce: nowMs,
          signature: { r, s, v },
        },
      };

      const resp = await fetch('/api/agents/hl/revoke-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.detail || j?.response || 'Revoke failed');

      // pull fresh state from backend/HL
      await refreshAgent();
    } catch (e) {
      setError(e.message || 'Revoke failed');
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------- Extended (x10) actions ----------------------- */

  // personal_sign a challenge string "<path>@<time>"
  const personalSign = async (message) => {
    return signMessageAsync({ message });
  };

  const extendedCheckOrCreate = async () => {
    try {
      setExtBusy(true);
      setExtError(null);
      setExtResult(null);

      if (!connectedAndAuthed) throw new Error('Please sign in with your wallet first.');

      // 1) get challenge for /api/v1/user/accounts
      const path1 = '/api/v1/user/accounts';
      const c1 = await fetch(`/api/extended/challenge?path=${encodeURIComponent(path1)}`, { cache: 'no-store' }).then(r => r.json());
      if (!c1?.message || !c1?.time) throw new Error('Invalid challenge from backend');

      const sig1 = await personalSign(c1.message);

      // 2) ask backend to check or request second signature
      let r = await fetch('/api/extended/check-or-create-api-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          signature: sig1,
          time: c1.time,
          account_index: Number(extAccountIndex || 0),
          description: extDescription || undefined,
        }),
      });

      if (r.status === 200) {
        const j = await r.json();
        setExtResult(j); // {exists:true, account_id}
        return;
      }
      if (r.status !== 428) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail || 'Extended check failed');
      }

      // 3) second challenge for /api/v1/user/account/api-key
      const j428 = await r.json(); // { detail: { challenge, account_id, ... } }
      const challenge = j428?.detail?.challenge;
      const accountId = j428?.detail?.account_id;
      if (!challenge) throw new Error('No second challenge provided by backend');
      const sig2 = await personalSign(challenge);

      const [_, t2] = challenge.split('@');

      // 4) create the API key (backend will encrypt & store)
      const r2 = await fetch('/api/extended/create-api-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          signature: sig1,
          time: c1.time,
          account_index: Number(extAccountIndex || 0),
          description: extDescription || undefined,
          signature2: sig2,
          time2: t2,
        }),
      });

      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok) throw new Error(j2?.detail || 'Extended create failed');
      setExtResult(j2); // {created:true, account_id}
    } catch (e) {
      setExtError(e.message || 'Extended flow failed');
    } finally {
      setExtBusy(false);
    }
  };

  /* ----------------------------- render -------------------------------- */

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        {!mounted ? (
          <Button variant="outline" size="lg">Connect Wallet</Button>
        ) : (
          <ConnectWallet />
        )}
      </div>

      {!mounted ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !isConnected ? (
        <p className="text-muted-foreground">Connect your wallet to manage your agent.</p>
      ) : !(sessionAddr && sessionAddr.toLowerCase() === (owner ?? '')) ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-muted-foreground">
              You’re connected as <span className="font-mono">{owner}</span>. Please sign in to create a session.
            </p>
            <Button onClick={handleSignIn} disabled={authBusy}>
              {authBusy ? 'Signing…' : 'Sign in with wallet'}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ========================= HL Agent card ========================= */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Signed in as</div>
                  <div className="font-mono">{owner}</div>
                </div>
                <Image src="/hyprliquid.png" alt="Hyperliquid" width={32} height={32} />
              </div>

              {/* ===== Agent view (if exists) ===== */}
              {loadingAgent ? (
                <div className="text-sm text-muted-foreground">Loading agent…</div>
              ) : agent ? (
                <div className="border rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="font-mono text-sm">{agent.agent_name ?? DEFAULT_AGENT_NAME}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Address</div>
                      <div className="font-mono text-xs break-all">{agent.agent_address ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Valid until</div>
                      <div className="text-sm">
                        {agent.expiry_unix ? stableUTCFromSeconds(agent.expiry_unix) : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button variant="destructive" onClick={revokeAgent} disabled={busy}>
                      {busy ? 'Working…' : 'Revoke'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ===== No agent -> approval form ===== */
                <div className="mt-2 space-y-4">
                  <h2 className="font-medium text-lg">Create / Approve Agent</h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FieldLabel>Agent Private Key (0x…)</FieldLabel>
                      <TextInput value={agentPriv} onChange={(e) => setAgentPriv(e.target.value)} />
                      <div className="text-xs text-muted-foreground">
                        Generated locally. Stored encrypted by backend after approval. Keep it private.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Agent Address</FieldLabel>
                      <TextInput value={agentAddr} onChange={(e) => setAgentAddr(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleGenerateKey}>
                      Generate Agent Key
                    </Button>
                    <Button type="button" onClick={approveAgent} disabled={busy}>
                      {busy ? 'Working…' : 'Approve Agent'}
                    </Button>
                  </div>
                </div>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </CardContent>
          </Card>

          {/* ======================= Extended (x10) card ===================== */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Extended API Key</div>
                  <div className="text-xs text-muted-foreground">
                    Mainnet enforced server-side. Key will be visible in Extended UI (description helps identify).
                  </div>
                </div>
                <Image src="/extended.png" alt="Extended" width={32} height={32} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel>Account Index</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    value={extAccountIndex}
                    onChange={(e) => setExtAccountIndex(Number(e.target.value || 0))}
                  />
                  <div className="text-xs text-muted-foreground">
                    Use 0 for default; other subaccounts via 1, 2, …
                  </div>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Description</FieldLabel>
                  <TextInput
                    value={extDescription}
                    onChange={(e) => setExtDescription(e.target.value)}
                    placeholder="aeq-prod trading key"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" onClick={extendedCheckOrCreate} disabled={extBusy}>
                  {extBusy ? 'Working…' : 'Check / Create API Key'}
                </Button>
              </div>

              {extResult ? (
                <div className="mt-2 border rounded-xl p-4">
                  {'exists' in extResult && extResult.exists ? (
                    <div>
                      <div className="text-sm">An API key already exists for this account.</div>
                      <div className="text-xs text-muted-foreground">
                        account_id: <span className="font-mono">{extResult.account_id}</span>
                      </div>
                    </div>
                  ) : 'created' in extResult && extResult.created ? (
                    <div>
                      <div className="text-sm">API key created successfully.</div>
                      <div className="text-xs text-muted-foreground">
                        account_id: <span className="font-mono">{extResult.account_id}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">Done.</div>
                  )}
                </div>
              ) : null}

              {extError ? <p className="text-sm text-red-600">{extError}</p> : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
