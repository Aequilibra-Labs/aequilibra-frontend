'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { ChevronDown, ChevronRight } from 'lucide-react';

import SideTabs from '@/components/trade/SideTabs';
import OrderTypeTabs from '@/components/trade/OrderTypeTabs';
import TifSelect from '@/components/trade/TifSelect';
import SizeInput from '@/components/trade/SizeInput';
import SlippageInput from '@/components/trade/SlippageInput';
import ReduceOnlyToggle from '@/components/trade/ReduceOnlyToggle';
import CloidInput from '@/components/trade/CloidInput';
import LeveragePanel from '@/components/trade/LeveragePanel';
import OpenOrdersTable from '@/components/trade/OpenOrdersTable';
import BracketPanel from '@/components/trade/BracketPanel';
import PositionsTable from '@/components/dashboard/PositionsTable';

const DEFAULT_AGENT_NAME = 'aeq-agent';

// Popular trading pairs on Hyperliquid
const AVAILABLE_MARKETS = [
  'BTC', 'ETH', 'SOL', 'AVAX', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT',
  'LINK', 'UNI', 'LTC', 'BCH', 'ICP', 'FIL', 'ATOM', 'VET', 'TRX', 'ETC',
  'ALGO', 'XLM', 'AAVE', 'MANA', 'SAND', 'AXS', 'CRV', 'COMP', 'YFI', 'MKR',
  'SUSHI', '1INCH', 'BAL', 'REN', 'ZRX', 'SNX', 'KNC', 'LRC', 'STORJ', 'BAT'
];

// Centralize API routes used by this page
const API = {
  trade: '/api/trading/hl/orders/open',
  leverage: '/api/trading/hl/leverage',
  activeAssetData: '/api/trading/hl/active-asset-data',
  state: '/api/trading/hl/state',
  marketClose: '/api/trading/hl/orders/market-close',
  modifyBracket: '/api/trading/hl/bracket/modify',
  cancelBracket: '/api/trading/hl/bracket/cancel',
  previewBracket: '/api/trading/hl/bracket/preview',
};

export default function TradePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const owner = useMemo(() => address?.toLowerCase() ?? null, [address]);

  // ---------------- Session ----------------
  const [sessionAddr, setSessionAddr] = useState(null);
  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' });
        const j = await r.json();
        setSessionAddr(j?.address || null);
      } catch { setSessionAddr(null); }
    })();
  }, [mounted]);

  const connectedAndAuthed = mounted && isConnected && sessionAddr && owner && sessionAddr.toLowerCase() === owner.toLowerCase();

  // ---------------- Agent (for display) ----------------
  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  useEffect(() => {
    if (!owner) return setAgent(null);
    (async () => {
      try {
        setLoadingAgent(true);
        const r = await fetch(`/api/hl/agents?owner=${owner}`, { cache: 'no-store' });
        setAgent(r.ok ? await r.json() : null);
      } catch { setAgent(null); }
      finally { setLoadingAgent(false); }
    })();
  }, [owner]);

  // ---------------- Sign-in ----------------
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState(null);
  const handleSignIn = async () => {
    try {
      setAuthBusy(true); setAuthErr(null);
      if (!owner) throw new Error('Connect your wallet first.');
      const n = await fetch('/api/auth/nonce', { cache: 'no-store' }).then(r => r.json());
      if (!n?.nonce || !n?.domain || !n?.uri) throw new Error('Invalid nonce payload');
      const issuedAt = new Date().toISOString();
      const msg = `${n.domain} wants you to sign in with your Ethereum account:\n${owner}\n\nURI: ${n.uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${n.nonce}\nIssued At: ${issuedAt}`;
      const signature = await signMessageAsync({ message: msg });
      const r = await fetch('/api/auth/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: owner, message: msg, signature }) });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail || 'Verification failed');
      }
      const s = await fetch('/api/auth/session', { cache: 'no-store' }).then(r => r.json());
      setSessionAddr(s?.address || null);
    } catch (e) { setAuthErr(e.message || 'Sign-in failed'); }
    finally { setAuthBusy(false); }
  };

  // ---------------- Order state ----------------
  const [agentName, setAgentName] = useState(DEFAULT_AGENT_NAME);
  useEffect(() => { if (agent?.agent_name) setAgentName(agent.agent_name); }, [agent?.agent_name]);

  const [coin, setCoin] = useState('BTC');
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMarketDropdownOpen && !event.target.closest('.market-dropdown')) {
        setIsMarketDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMarketDropdownOpen]);
  
  const [markPx, setMarkPx] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState('market'); // market | limit | twap
  const [size, setSize] = useState('0.01');
  const [limitPx, setLimitPx] = useState('');
  const [tif, setTif] = useState('Gtc');
  const [slippage, setSlippage] = useState('0.05');
  const [reduceOnly, setReduceOnly] = useState(false);
  const [cloid, setCloid] = useState('');

  // ---- Bracket Orders State ----
  const [bracketConfig, setBracketConfig] = useState({});
  const [showBrackets, setShowBrackets] = useState(false);

  // ---- Leverage (inline; calls API.leverage) ----
  const [levMode, setLevMode] = useState('cross'); // 'cross' | 'isolated'
  const [levValue, setLevValue] = useState('5');   // integer leverage
  const [levIsoMarginUSD, setLevIsoMarginUSD] = useState(''); // optional when isolated
  const [levBusy, setLevBusy] = useState(false);
  const [levMsg, setLevMsg] = useState(null);

  // ---------------- Positions (current) ----------------
  const [positions, setPositions] = useState([]);
  const [posBusy, setPosBusy] = useState(false);
  const [posErr, setPosErr] = useState(null);

  const refreshPositions = useCallback(async () => {
    if (!connectedAndAuthed || !owner) { setPositions([]); return; }
    try {
      setPosBusy(true); setPosErr(null);
      const r = await fetch(`${API.state}?owner=${owner}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`state ${r.status}`);
      const j = await r.json();
      const arr = Array.isArray(j?.assetPositions) ? j.assetPositions : [];
      const rows = arr.map((x) => {
        const p = x.position || {};
        const szi = parseFloat(p.szi ?? '0');
        const side = szi > 0 ? 'LONG' : szi < 0 ? 'SHORT' : 'FLAT';
        const lev = p.leverage || {};
        return {
          coin: p.coin || x.asset || '—',
          szi,
          side,
          entryPx: p.entryPx != null ? parseFloat(p.entryPx) : null,
          leverageType: lev.type || '—',
          leverageValue: lev.value != null ? parseInt(lev.value, 10) : null,
        };
      }).filter(r => r.szi !== 0);
      setPositions(rows);
    } catch (e) {
      setPosErr(String(e?.message || e)); setPositions([]);
    } finally { setPosBusy(false); }
  }, [connectedAndAuthed, owner]);

  useEffect(() => { refreshPositions(); }, [refreshPositions]);

  // ---------------- User State (for open orders) ----------------
  const [userState, setUserState] = useState(null);
  const [userStateBusy, setUserStateBusy] = useState(false);
  const [userStateErr, setUserStateErr] = useState(null);

  const refreshUserState = useCallback(async () => {
    if (!connectedAndAuthed || !owner) { setUserState(null); return; }
    try {
      setUserStateBusy(true); setUserStateErr(null);
      const r = await fetch(`${API.state}?owner=${owner}&agent_name=${agentName || DEFAULT_AGENT_NAME}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`user state ${r.status}`);
      const j = await r.json();
      setUserState(j);
    } catch (e) {
      setUserStateErr(String(e?.message || e)); setUserState(null);
    } finally { setUserStateBusy(false); }
  }, [connectedAndAuthed, owner, agentName]);

  useEffect(() => { refreshUserState(); }, [refreshUserState]);

  // Persistence
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hlTradeTicket') || 'null');
      if (s) {
        setAgentName(s.agentName ?? DEFAULT_AGENT_NAME);
        setCoin(s.coin ?? 'BTC'); setIsBuy(!!s.isBuy);
        setOrderType(s.orderType ?? 'market'); setSize(String(s.size ?? '0.01'));
        setLimitPx(s.limitPx ?? ''); setTif(s.tif ?? 'Gtc'); setSlippage(s.slippage ?? '0.05');
        setReduceOnly(!!s.reduceOnly); setCloid(s.cloid ?? '');
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('hlTradeTicket', JSON.stringify({ agentName, coin, isBuy, orderType, size, limitPx, tif, slippage, reduceOnly, cloid })); } catch {}
  }, [agentName, coin, isBuy, orderType, size, limitPx, tif, slippage, reduceOnly, cloid]);

  // ---------------- Active asset (HL-style pretrade) ----------------
  const [aad, setAad] = useState(null);            // active asset data
  const [aadBusy, setAadBusy] = useState(false);
  const [aadErr, setAadErr] = useState(null);
  const fetchAadAbort = useRef(null);

  const fetchActiveAssetData = useCallback(async () => {
    if (!connectedAndAuthed || !owner || !coin) { setAad(null); return; }
    try {
      setAadBusy(true); setAadErr(null);
      if (fetchAadAbort.current) fetchAadAbort.current.abort();
      const ctrl = new AbortController(); fetchAadAbort.current = ctrl;
      const r = await fetch(`${API.activeAssetData}?owner=${owner}&coin=${encodeURIComponent(coin)}`, { signal: ctrl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`active-asset-data ${r.status}`);
      const j = await r.json();
      setAad(j);
      if (j && typeof j.markPx === 'number') setMarkPx(String(j.markPx));
    } catch (e) { if (e?.name !== 'AbortError') { setAadErr(String(e)); setAad(null); } }
    finally { setAadBusy(false); }
  }, [connectedAndAuthed, owner, coin]);

  // Debounce on inputs that matter
  useEffect(() => {
    const t = setTimeout(() => { fetchActiveAssetData(); }, 250);
    return () => clearTimeout(t);
  }, [fetchActiveAssetData]);

  // ---------------- Request builder ----------------
  const payload = useMemo(() => {
    const p = {
      owner: owner ?? '',
      agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME,
      coin: (coin || '').trim(),
      is_buy: Boolean(isBuy),
      order_kind: orderType === 'limit' ? 'limit' : 'market',
      size: safeFloat(size),
      reduce_only: Boolean(reduceOnly),
    };
    if (orderType === 'limit') {
      if (limitPx !== '') p.limit_px = safeFloat(limitPx);
      if (tif) p.tif = tif;
    } else if (orderType === 'market') {
      if (slippage !== '') p.slippage = safeFloat(slippage);
    }
    if (cloid.trim()) p.cloid = cloid.trim();
    
    // Add bracket parameters if configured (convert percentages to decimals)
    if (bracketConfig.sl_pct) p.sl_pct = parseFloat(bracketConfig.sl_pct) / 100;
    if (bracketConfig.sl_px) p.sl_px = parseFloat(bracketConfig.sl_px);
    
    // Handle TP vs TP Ladders based on mode
    if (bracketConfig.tp_ladder_mode && bracketConfig.tp_ladders && bracketConfig.tp_ladders.length > 0) {
      p.tp_ladders = bracketConfig.tp_ladders.map(ladder => ({
        target_price: parseFloat(ladder.target_price),
        fraction: parseFloat(ladder.fraction)
      }));
    } else {
      // Only set regular TP if not in ladder mode
      if (bracketConfig.tp_pct) p.tp_pct = parseFloat(bracketConfig.tp_pct) / 100;
      if (bracketConfig.tp_px) p.tp_px = parseFloat(bracketConfig.tp_px);
    }
    
    if (bracketConfig.trailing_pct) p.trailing_pct = parseFloat(bracketConfig.trailing_pct) / 100;
    if (bracketConfig.trailing_usd) p.trailing_usd = parseFloat(bracketConfig.trailing_usd);
    
    return p;
  }, [owner, agentName, coin, isBuy, orderType, size, limitPx, tif, slippage, reduceOnly, cloid, bracketConfig]);

  // Compute derived UI data
  const notionalUSD = useMemo(() => {
    const s = parseFloat(size); const m = parseFloat(String(markPx));
    if (!Number.isFinite(s) || !Number.isFinite(m)) return null;
    return s * m;
  }, [size, markPx]);

  const aadMaxSize = useMemo(() => {
    if (!aad || !Array.isArray(aad.maxTradeSzs)) return undefined;
    // HL returns [maxBuy, maxSell]
    return isBuy ? parseFloat(aad.maxTradeSzs[0]) : parseFloat(aad.maxTradeSzs[1]);
  }, [aad, isBuy]);

  const sizeTooBig = useMemo(() => {
    const s = parseFloat(size);
    if (!Number.isFinite(s) || !Number.isFinite(aadMaxSize)) return false;
    return s > aadMaxSize;
  }, [size, aadMaxSize]);

  const canSubmit = useMemo(() => {
    if (!connectedAndAuthed) return false;
    if (!payload.owner || !payload.agent_name || !payload.coin) return false;
    if (!(typeof payload.size === 'number') || Number.isNaN(payload.size) || payload.size <= 0) return false;
    if (orderType === 'limit') {
      const ok = typeof payload.limit_px === 'number' && !Number.isNaN(payload.limit_px) && payload.limit_px > 0;
      if (!ok) return false;
    }
    if (sizeTooBig) return false;
    
    // Volume validation (minimum $10 after leverage)
    const currentLeverage = aad?.leverage?.value || 1;
    const totalVolume = payload.size * parseFloat(markPx) * currentLeverage;
    if (totalVolume < 10) return false;
    
    return true;
  }, [connectedAndAuthed, payload, orderType, sizeTooBig, markPx, aad]);

  // ---------------- Submit ----------------
  const [submitting, setSubmitting] = useState(false);
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);

  async function placeOrder(e) {
    e.preventDefault();
    setSubmitting(true); setResp(null); setErr(null);
    try {
      console.log('Current bracketConfig:', bracketConfig);
      console.log('Placing order with payload:', payload);
      
      // Always use the main trade endpoint - it handles brackets automatically
      console.log('Using endpoint:', API.trade);
      
      const r = await fetch(API.trade, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const txt = await r.text(); 
      console.log('API Response status:', r.status, 'Response text:', txt);
      
      let data; 
      try{ 
        data = JSON.parse(txt);
      } catch { 
        data = { raw: txt }; 
      }
      
      if (!r.ok) {
        console.log('API Error - Status:', r.status, 'Data:', data);
        let errorMsg = `Order failed (${r.status})`;
        if (data) {
          if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
            
            // Provide more specific error messages for common bracket issues
            if (errorMsg.includes('Invalid TP/SL price')) {
              errorMsg = 'Invalid TP/SL price. Please check that your stop loss and take profit are in the correct direction and within valid price ranges.';
            } else if (errorMsg.includes('asset=0')) {
              errorMsg = 'Asset mapping error. Please try again or contact support if the issue persists.';
            } else if (errorMsg.includes('Stop loss must be')) {
              errorMsg = errorMsg + ' Please adjust your stop loss percentage or price.';
            } else if (errorMsg.includes('Take profit must be')) {
              errorMsg = errorMsg + ' Please adjust your take profit percentage or price.';
            }
          } else if (data.message) {
            errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
          } else if (data.raw) {
            errorMsg = data.raw;
          }
        }
        // Don't throw, just set the error directly
        setErr(errorMsg);
        return;
      }
      setResp({ status: r.status, data });
      await refreshPositions();
      await refreshUserState();
      await fetchActiveAssetData();
    } catch (e) { 
      const errorMessage = e.message || String(e) || 'Order failed';
      console.error('Order error:', e, 'Payload:', payload);
      setErr(errorMessage); 
    }
    finally { setSubmitting(false); }
  }

  async function applyLeverage() {
    try {
      setLevBusy(true); setLevMsg(null);
      const payload = {
        owner: owner ?? '',
        agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME,
        coin: (coin || '').trim(),
        is_cross: levMode === 'cross',
        leverage: levValue ? parseInt(levValue, 10) : 1,
        adjust_isolated_margin_usd: levMode === 'isolated' && levIsoMarginUSD ? parseFloat(levIsoMarginUSD) : undefined,
      };
      const r = await fetch(API.leverage, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const txt = await r.text(); let data; try{ data = JSON.parse(txt);} catch{ data = { raw: txt }; }
      if (!r.ok) throw new Error((data && (data.detail || data.message)) || r.statusText || 'Failed');
      setLevMsg({ ok: true });
      await fetchActiveAssetData();
      await refreshPositions();
      await refreshUserState();
    } catch (e) { setLevMsg({ ok: false, err: String(e?.message || e) }); }
    finally { setLevBusy(false); }
  }

  // Per-position actions
  async function applyPositionLeverage(targetCoin, mode, value, extraUsd) {
    try {
      const payload = {
        owner: owner ?? '',
        agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME,
        coin: (targetCoin || '').trim(),
        is_cross: mode === 'cross',
        leverage: parseInt(String(value||'1'), 10),
        adjust_isolated_margin_usd: mode === 'isolated' && extraUsd !== undefined && extraUsd !== '' ? parseFloat(String(extraUsd)) : undefined,
      };
      const r = await fetch(API.leverage, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        throw new Error(j?.detail || `leverage ${r.status}`);
      }
      await fetchActiveAssetData();
      await refreshPositions();
      await refreshUserState();
      return true;
    } catch (e) {
      console.error('applyPositionLeverage', e);
      return false;
    }
  }

  async function closePosition(targetCoin, partialSz) {
    try {
      const payload = { owner: owner ?? '', agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME, coin: targetCoin, size: partialSz ? parseFloat(String(partialSz)) : undefined };
      console.log('Closing position with payload:', payload);
      const r = await fetch(API.marketClose, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        console.log('Market close failed:', r.status, j);
        return false; // Return false instead of throwing
      }
      await fetchActiveAssetData();
      await refreshPositions();
      await refreshUserState();
      return true;
    } catch (e) {
      console.log('closePosition error:', e);
      return false;
    }
  }

  async function modifyBracket(coin, bracketData) {
    try {
      // Convert percentage values from frontend format (3) to backend format (0.03)
      const convertedBracketData = { ...bracketData };
      if (convertedBracketData.sl_pct) convertedBracketData.sl_pct = convertedBracketData.sl_pct / 100;
      if (convertedBracketData.tp_pct) convertedBracketData.tp_pct = convertedBracketData.tp_pct / 100;
      if (convertedBracketData.trailing_pct) convertedBracketData.trailing_pct = convertedBracketData.trailing_pct / 100;
      
      const payload = { 
        owner: owner ?? '', 
        agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME, 
        coin: coin,
        ...convertedBracketData
      };
      const r = await fetch(API.modifyBracket, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        throw new Error(j?.detail || `modifyBracket ${r.status}`);
      }
      await fetchActiveAssetData();
      await refreshPositions();
    } catch (e) {
      console.error('modifyBracket', e);
    }
  }

  async function cancelBracket(coin) {
    try {
      const payload = { 
        owner: owner ?? '', 
        agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME, 
        coin: coin
      };
      const r = await fetch(API.cancelBracket, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        throw new Error(j?.detail || `cancelBracket ${r.status}`);
      }
      await fetchActiveAssetData();
      await refreshPositions();
    } catch (e) {
      console.error('cancelBracket', e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trade</h1>
        {!mounted ? <Button variant="outline" size="lg">Connect Wallet</Button> : <ConnectWallet />}
      </div>

      {!mounted ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !isConnected ? (
        <p className="text-muted-foreground">Connect your wallet to place trades.</p>
      ) : !(sessionAddr && sessionAddr.toLowerCase() === (owner ?? '')) ? (
        <Card><CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground">You’re connected as <span className="font-mono">{owner}</span>. Please sign in to create a session.</p>
          <Button onClick={handleSignIn} disabled={authBusy}>{authBusy ? 'Signing…' : 'Sign in with wallet'}</Button>
          {authErr ? <p className="text-sm text-red-600">{authErr}</p> : null}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Center column: identity + pretrade strip + leverage */}
          <div className="lg:col-span-2 space-y-4">
            {/* Agent summary */}
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="font-mono text-sm">{owner}</div>
              </div>
              <Image src="/hyprliquid.png" alt="Hyperliquid" width={28} height={28} />
            </CardContent></Card>

            {/* HL-like pretrade info bar */}
            <Card>
              <CardContent className="p-4 text-xs flex flex-wrap gap-x-6 gap-y-2 items-center">
                <div>Market: <span className="font-medium">{coin}</span></div>
                <div>Leverage: <span className="font-medium">{aad?.leverage?.type ?? '—'} {aad?.leverage?.value ?? '—'}x</span></div>
                <div>Mark: <span className="font-mono">{markPx || '—'}</span></div>
                {Number.isFinite(aadMaxSize) ? (
                  <div>Max size ({isBuy ? 'Buy' : 'Sell'}): <span className="font-mono">{aadMaxSize}</span></div>
                ) : null}
                {aadBusy ? <span className="text-muted-foreground">refreshing…</span> : null}
                {aadErr ? <span className="text-red-600">{aadErr}</span> : null}
              </CardContent>
            </Card>

            {/* Leverage controls (separate card, like HL side rail) */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Leverage (for next orders)</div>
                    {levMsg?.ok ? <span className="text-xs text-green-700">Applied</span> : levMsg && !levMsg.ok ? <span className="text-xs text-red-700">{levMsg.err}</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant={levMode==='cross'?'default':'outline'} onClick={()=>setLevMode('cross')}>Cross</Button>
                    <Button type="button" variant={levMode==='isolated'?'default':'outline'} onClick={()=>setLevMode('isolated')}>Isolated</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <div className="text-xs text-muted-foreground">Leverage (x)</div>
                      <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" min="1" step="1" value={levValue} onChange={(e)=>setLevValue(e.target.value)} />
                    </label>
                    {levMode==='isolated' ? (
                      <label className="block text-sm">
                        <div className="text-xs text-muted-foreground">Extra isolated margin (USD)</div>
                        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" min="0" step="0.01" value={levIsoMarginUSD} onChange={(e)=>setLevIsoMarginUSD(e.target.value)} />
                      </label>
                    ) : <div />}
                  </div>
                  <Button type="button" size="sm" onClick={applyLeverage} disabled={levBusy || !connectedAndAuthed}>{levBusy ? 'Applying…' : 'Apply'}</Button>
                </div>
              </CardContent>
            </Card>

            {/* Positions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Positions</div>
                  {posBusy ? <div className="text-xs text-muted-foreground">refreshing…</div> : null}
                </div>
                {posErr ? <div className="text-xs text-red-600">{posErr}</div> : null}
                {positions.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">No open positions</div>
                ) : (
                  <PositionsTable 
                    positions={positions.map(p => ({ 
                      position: { 
                        coin: p.coin, 
                        szi: p.szi.toString(), 
                        entryPx: p.entryPx?.toString(),
                        leverage: {
                          value: p.leverageValue,
                          type: p.leverageType
                        },
                        side: p.side
                      } 
                    }))}
                    owner={owner}
                    onPartialClose={async (closeData) => {
                      // Implement partial close functionality
                      console.log('Partial close:', closeData);
                      if (closeData.coin && closeData.percentage) {
                        // Find the position to get the current size
                        const position = positions.find(p => p.coin === closeData.coin);
                        if (position) {
                          const sizeToClose = Math.abs(parseFloat(position.szi)) * closeData.percentage;
                          await closePosition(closeData.coin, sizeToClose);
                        }
                      }
                    }}
                    onCancelBracket={async (coin) => {
                      // Implement cancel bracket functionality
                      console.log('Cancel bracket:', coin);
                      await cancelBracket(coin);
                    }}
                    onModifyBracket={async (coin, bracketData) => {
                      // Implement modify bracket functionality
                      console.log('Modify bracket:', coin, bracketData);
                      await modifyBracket(coin, bracketData);
                    }}
                    bracketStates={{}}
                    refreshBrackets={() => {
                      // Implement refresh brackets functionality
                      console.log('Refresh brackets');
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Open Orders */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Open Orders</div>
                  {userStateBusy ? <div className="text-xs text-muted-foreground">refreshing…</div> : null}
                </div>
                {userStateErr ? <div className="text-xs text-red-600">{userStateErr}</div> : null}
                <OpenOrdersTable 
                  owner={owner}
                  agentName={agentName}
                  userState={userState}
                  onAfterChange={async () => {
                    await refreshUserState();
                    await refreshPositions();
                    await fetchActiveAssetData();
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right rail: HL-like order ticket */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4 space-y-5">
              {/* Header: side */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button type="button" variant={isBuy ? 'default' : 'outline'} onClick={() => setIsBuy(true)} className={isBuy ? 'bg-green-600 hover:bg-green-600 text-white' : ''}>Buy</Button>
                  <Button type="button" variant={!isBuy ? 'destructive' : 'outline'} onClick={() => setIsBuy(false)} className={!isBuy ? 'bg-red-600 hover:bg-red-600 text-white' : ''}>Sell</Button>
                </div>
                <div className="text-xs text-muted-foreground">{coin}</div>
              </div>

              {/* Order type */}
              <OrderTypeTabs value={orderType} onChange={setOrderType} enableTwap={true} />

              {/* Market / Limit specific rows */}
              {orderType === 'limit' ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <div className="text-xs text-muted-foreground">Limit price</div>
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" min="0" step="any" value={limitPx} onChange={(e)=>setLimitPx(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <div className="text-xs text-muted-foreground">TIF</div>
                    <TifSelect value={tif} onChange={setTif} />
                  </label>
                </div>
              ) : orderType === 'market' ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">Market order</div>
                  <div className="flex items-center gap-2">Slippage <SlippageInput slippage={slippage} setSlippage={setSlippage} /></div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">TWAP params (interval/duration/clip) — backend coming soon.</div>
              )}

              {/* Size row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">Size ({coin})</div>
                  {Number.isFinite(notionalUSD) ? <div>≈ <span className="font-mono">{notionalUSD.toFixed(2)}</span> USD</div> : null}
                </div>
                <SizeInput size={size} setSize={setSize} markPx={markPx} />
                {sizeTooBig ? <div className="text-[11px] text-red-600">Size exceeds max allowed at current leverage.</div> : null}
              </div>

              {/* Advanced */}
              <div className="space-y-3">
                {orderType==='limit' ? (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={tif==='Alo'} onChange={(e)=>setTif(e.target.checked?'Alo':'Gtc')} />
                    <span>Post-only (ALO)</span>
                  </label>
                ) : null}

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={reduceOnly} onChange={(e)=>setReduceOnly(e.target.checked)} />
                    <span>Reduce-only</span>
                  </label>
                  {orderType==='limit' ? (
                    <select className="rounded-md border px-2 py-1" value={tif} onChange={(e)=>setTif(e.target.value)}>
                      <option value="Gtc">GTC</option>
                      <option value="Ioc">IOC</option>
                      <option value="Alo">ALO</option>
                    </select>
                  ) : null}
                </div>

                <label className="block text-xs">
                  <div className="text-muted-foreground">CLOID (optional)</div>
                  <CloidInput cloid={cloid} setCloid={setCloid} />
                </label>
              </div>

              {/* Bracket Orders Panel - Collapsible */}
              <div className="space-y-3">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBrackets(!showBrackets)}
                  className="w-full justify-between text-xs"
                >
                  <span>SL/TP Orders</span>
                  {showBrackets ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
                
                {showBrackets && (
                  <div className="border rounded-lg p-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    <BracketPanel
                      bracketConfig={bracketConfig}
                      setBracketConfig={setBracketConfig}
                      markPx={parseFloat(markPx) || 0}
                      position={{ is_buy: isBuy }}
                      walletBalance={parseFloat(userState?.withdrawable) || 0}
                      size={parseFloat(size) || 0}
                      leverage={aad?.leverage?.value || 1}
                      owner={owner}
                      agentName={agentName}
                      coin={coin}
                      previewEndpoint={API.previewBracket}
                    />
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mt-2">
                      Debug: size={size}, markPx={markPx}, leverage={aad?.leverage?.value}
                    </div>
                  </div>
                )}
              </div>

              {/* Agent & market inputs inline for quick edits */}
              <div className="text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-muted-foreground">Agent</div>
                    <input className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed" value={agentName} readOnly disabled />
                  </label>
                  <label className="block">
                    <div className="text-muted-foreground">Market</div>
                    <div className="relative market-dropdown">
                      <button
                        type="button"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/50"
                        onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                      >
                        <span>{coin}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMarketDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isMarketDropdownOpen && (
                        <div className="absolute top-full mt-1 w-full z-50 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {AVAILABLE_MARKETS.map((market) => (
                            <button
                              key={market}
                              type="button"
                              className={`w-full px-3 py-2 text-sm text-left hover:bg-muted/50 ${
                                coin === market ? 'bg-muted/30 font-medium' : ''
                              }`}
                              onClick={() => {
                                setCoin(market);
                                setIsMarketDropdownOpen(false);
                              }}
                            >
                              {market}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <form onSubmit={placeOrder}>
                <Button type="submit" disabled={!canSubmit || submitting} className={`w-full ${isBuy ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-600'} text-white relative`}>
                  {submitting ? 'Submitting…' : `${isBuy ? 'Buy' : 'Sell'} ${size || ''} ${coin}`}
                  {(bracketConfig.sl_pct || bracketConfig.sl_px || bracketConfig.tp_pct || bracketConfig.tp_px || (bracketConfig.tp_ladder_mode && bracketConfig.tp_ladders?.length > 0) || bracketConfig.trailing_pct) && (
                    <div className="absolute top-1 right-2 w-2 h-2 bg-yellow-400 rounded-full border border-white" title="Brackets configured"></div>
                  )}
                </Button>
                <div className="mt-2 text-xs min-h-[1.25rem]">
                  {resp ? <span className="text-green-700">OK ({resp.status})</span> : err ? <span className="text-red-700">{err}</span> : null}
                  {!resp && !err && (bracketConfig.sl_pct || bracketConfig.sl_px || bracketConfig.tp_pct || bracketConfig.tp_px || (bracketConfig.tp_ladder_mode && bracketConfig.tp_ladders?.length > 0) || bracketConfig.trailing_pct) && (
                    <div className="text-muted-foreground mt-1">
                      Brackets: 
                      {(bracketConfig.sl_pct || bracketConfig.sl_px) && ` SL ${bracketConfig.sl_pct || '$' + bracketConfig.sl_px}`}
                      {!bracketConfig.tp_ladder_mode && (bracketConfig.tp_pct || bracketConfig.tp_px) && ` TP ${bracketConfig.tp_pct ? bracketConfig.tp_pct + '%' : '$' + bracketConfig.tp_px}`}
                      {bracketConfig.tp_ladder_mode && bracketConfig.tp_ladders?.length > 0 && ` TP Ladders (${bracketConfig.tp_ladders.length})`}
                      {bracketConfig.trailing_pct && ` Trail ${bracketConfig.trailing_pct}%`}
                    </div>
                  )}
                </div>
              </form>

              {/* Preview (debug) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Preview payload</summary>
                <pre className="bg-muted rounded-md border p-3 text-[11px] overflow-auto max-h-60">{JSON.stringify(payload, null, 2)}</pre>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ---------------- Utils ----------------
function safeFloat(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}
