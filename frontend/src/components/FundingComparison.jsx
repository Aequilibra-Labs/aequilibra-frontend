'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Search,
  RefreshCw,
  BarChart3,
  EyeOff,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Hooks
import { useHyperliquidFunding } from '@/hooks/protocols/hyperliquid';
import { useExtendedFunding } from '@/lib/protocols/extended/rest';
import { useAsterFunding } from '@/hooks/protocols/aster/useAsterFunding';

/***************************************
 * Comparison-centric improvements
 * - Baseline platform selector (Δ vs baseline shown inline in each cell)
 * - Pair mode (side-by-side A ↔ B with heatmap + delta columns)
 * - Optional pairwise Δ columns in matrix mode (A−B in bps)
 * - Compact density toggle and consistent monospace alignment
 * - Thresholds in bps for both global spread and pair deltas
 ***************************************/

// Per-platform metadata & funding cadence
const PLATFORM_META = {
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    description: 'Perpetual futures DEX',
    image: '/hyprliquid.png',
    unit: 'per_8h',
  },
  extended: {
    id: 'extended',
    name: 'Extended',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    description: 'Advanced derivatives',
    image: '/extended.png',
    unit: 'per_8h',
  },
  aster: {
    id: 'aster',
    name: 'Aster',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    description: 'Decentralized exchange',
    image: '/aster.png',
    unit: 'per_8h',
  },
};

const AVAILABLE_PLATFORMS = Object.values(PLATFORM_META);

function annualizeFunding(rate, unit) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return null;
  const r = Number(rate);
  if (unit === 'per_8h') return r * 3 * 365; // 3 times/day
  if (unit === 'per_hour') return r * 24 * 365;
  if (unit === 'per_day') return r * 365;
  return null;
}

function nextFundingTime(unit) {
  const now = Date.now();
  const ms = unit === 'per_8h' ? 8 * 60 * 60 * 1000 : unit === 'per_hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return new Date(now + ms);
}

function normalizeAssetName(assetName) {
  if (!assetName) return '';
  return assetName
    .trim()
    .toUpperCase()
    .replace(/[-_/](PERP|SWAP)$/i, '')
    .replace(/[-_/]?(USD|USDT|USDC|BUSD)$/i, '')
    .replace(/\s+PERP$/i, '')
    .replace(/:\w+$/i, '')
    .replace(/[^A-Z0-9.]/g, '');
}

function formatPct(rate, digits = 4) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return 'N/A';
  const v = Number(rate) * 100;
  const s = v.toFixed(digits);
  return `${v >= 0 ? '+' : ''}${s}%`;
}

function formatNumber(n) {
  if (!n || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

function formatBps(rate, digits = 2) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return '—';
  const v = Number(rate) * 10000; // fraction -> bps
  const s = v.toFixed(digits);
  return `${v >= 0 ? '+' : ''}${s} bps`;
}

function rateColor(rate) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return 'text-slate-400 dark:text-slate-500';
  return Number(rate) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

function deltaBgStyle(delta) {
  // Soft diverging heatmap background for delta cells (±20 bps full intensity)
  if (delta === null || delta === undefined || isNaN(Number(delta))) return {};
  const bps = Math.min(20, Math.abs(Number(delta) * 10000));
  const alpha = 0.05 + (bps / 20) * 0.12; // 5% -> 17%
  const color = Number(delta) >= 0 ? `rgba(16,185,129,${alpha})` : `rgba(239,68,68,${alpha})`; // emerald/red
  return { backgroundColor: color };
}

function allPairs(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) out.push([ids[i], ids[j]]);
  }
  return out;
}

export default function FundingComparison() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(AVAILABLE_PLATFORMS.map(p => p.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('maxRate'); // 'asset' | 'maxRate' | 'spread' | 'volume' | 'oi'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [onlyDiff, setOnlyDiff] = useState(true);
  const [epsilonBps, setEpsilonBps] = useState(1); // matrix threshold in bps
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastUpdate, setLastUpdate] = useState(null);

  // New: comparison-centric UI state
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'pair'
  const [baseline, setBaseline] = useState('hyperliquid');
  const [showPairwiseCols, setShowPairwiseCols] = useState(true);
  const [compact, setCompact] = useState(false);
  const [pairA, setPairA] = useState('hyperliquid');
  const [pairB, setPairB] = useState('extended');
  const [pairEpsBps, setPairEpsBps] = useState(1);
  const [onlyOppositeSign, setOnlyOppositeSign] = useState(false);

  // Data hooks
  const hyperliquidData = useHyperliquidFunding();
  const extendedData = useExtendedFunding();
  const asterData = useAsterFunding();

  // Keep baseline & pair selections valid when platforms change
  useEffect(() => {
    if (!selectedPlatforms.includes(baseline) && selectedPlatforms.length)
      setBaseline(selectedPlatforms[0]);
    if (!selectedPlatforms.includes(pairA) && selectedPlatforms.length)
      setPairA(selectedPlatforms[0]);
    if (!selectedPlatforms.includes(pairB) && selectedPlatforms.length)
      setPairB(selectedPlatforms[1] || selectedPlatforms[0]);
  }, [selectedPlatforms]);

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => prev.includes(platformId)
      ? prev.filter(id => id !== platformId)
      : [...prev, platformId]);
    setPage(1);
  };

  const handleSelectAll = () => setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id));
  const handleClearAll = () => setSelectedPlatforms([]);

  // Combine
  const combined = useMemo(() => {
    const rows = [];

    function pushFrom(list, platformKey) {
      if (!list) return;
      const meta = PLATFORM_META[platformKey];
      list.forEach((item) => {
        const asset = (item.asset ?? item.coin ?? '').toString();
        const normalized = normalizeAssetName(asset);
        const rateNum = item.fundingRate !== undefined && item.fundingRate !== null && !isNaN(Number(item.fundingRate))
          ? Number(item.fundingRate)
          : null;
        rows.push({
          platform: platformKey,
          platformName: meta.name,
          unit: meta.unit,
          asset,
          normalized,
          fundingRate: rateNum,
          annualized: annualizeFunding(rateNum, meta.unit),
          nextFunding: nextFundingTime(meta.unit),
          volume24h: Number(item.volume24h ?? 0),
          openInterest: Number(item.openInterest ?? 0),
          markPx: Number(item.markPx ?? 0),
        });
      });
    }

    if (selectedPlatforms.includes('hyperliquid')) pushFrom(hyperliquidData.data, 'hyperliquid');
    if (selectedPlatforms.includes('extended')) pushFrom(extendedData.data, 'extended');
    if (selectedPlatforms.includes('aster')) pushFrom(asterData.data, 'aster');

    return rows;
  }, [selectedPlatforms, hyperliquidData.data, extendedData.data, asterData.data]);

  // Group by asset
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of combined) {
      if (!r.normalized) continue;
      if (!map.has(r.normalized)) {
        map.set(r.normalized, {
          asset: r.normalized,
          platforms: {},
          volume24h: 0,
          openInterest: 0,
          maxRate: null,
          minRate: null,
          spread: null,
        });
      }
      const g = map.get(r.normalized);
      g.platforms[r.platform] = {
        fundingRate: r.fundingRate,
        annualized: r.annualized,
        platformName: r.platformName,
      };
      g.volume24h = Math.max(g.volume24h, r.volume24h || 0);
      g.openInterest = Math.max(g.openInterest, r.openInterest || 0);

      if (r.fundingRate !== null) {
        g.maxRate = g.maxRate === null ? r.fundingRate : Math.max(g.maxRate, r.fundingRate);
        g.minRate = g.minRate === null ? r.fundingRate : Math.min(g.minRate, r.fundingRate);
      }
    }

    const out = Array.from(map.values()).map(g => {
      const rates = Object.values(g.platforms).map(p => p.fundingRate).filter(v => v !== null);
      if (rates.length >= 2) {
        const mx = Math.max(...rates);
        const mn = Math.min(...rates);
        g.maxRate = mx; g.minRate = mn; g.spread = mx - mn;
        return g;
      }
      return { ...g, spread: null };
    });

    return out.filter(g => Object.values(g.platforms).filter(p => p.fundingRate !== null).length >= 2);
  }, [combined]);

  // Filter + sort (matrix mode)
  const filteredSorted = useMemo(() => {
    const eps = Math.max(0, Number(epsilonBps)) / 10000; // bps -> fraction
    let arr = grouped.filter(g => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return g.asset.toLowerCase().includes(q);
    });

    if (onlyDiff) arr = arr.filter(g => (g.spread ?? 0) > eps);

    const dir = sortOrder === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = sortBy === 'asset' ? a.asset
        : sortBy === 'maxRate' ? (a.maxRate ?? Number.NEGATIVE_INFINITY)
        : sortBy === 'spread' ? (a.spread ?? Number.NEGATIVE_INFINITY)
        : sortBy === 'volume' ? (a.volume24h ?? 0)
        : (a.openInterest ?? 0);
      const bv = sortBy === 'asset' ? b.asset
        : sortBy === 'maxRate' ? (b.maxRate ?? Number.NEGATIVE_INFINITY)
        : sortBy === 'spread' ? (b.spread ?? Number.NEGATIVE_INFINITY)
        : sortBy === 'volume' ? (b.volume24h ?? 0)
        : (b.openInterest ?? 0);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    });

    return arr;
  }, [grouped, searchQuery, onlyDiff, epsilonBps, sortBy, sortOrder]);

  // Pagination (matrix mode)
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  // Pair mode dataset
  const pairItems = useMemo(() => {
    const eps = Math.max(0, Number(pairEpsBps)) / 10000;
    const arr = grouped
      .map(g => {
        const a = g.platforms[pairA]?.fundingRate ?? null;
        const b = g.platforms[pairB]?.fundingRate ?? null;
        if (a === null || b === null) return null;
        const delta = a - b;
        return { asset: g.asset, a, b, delta, volume24h: g.volume24h, openInterest: g.openInterest };
      })
      .filter(Boolean)
      .filter(r => Math.abs(r.delta) > eps)
      .filter(r => !onlyOppositeSign || (r.a * r.b < 0));

    return arr.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  }, [grouped, pairA, pairB, pairEpsBps, onlyOppositeSign]);

  // Update last update timestamp from hooks
  useEffect(() => {
    const times = [];
    if (hyperliquidData.lastUpdate) times.push(hyperliquidData.lastUpdate);
    if (extendedData.lastUpdate) times.push(extendedData.lastUpdate);
    if (asterData.lastUpdate) times.push(asterData.lastUpdate);
    if (times.length) setLastUpdate(new Date(Math.max(...times.map(t => t.getTime()))));
  }, [hyperliquidData.lastUpdate, extendedData.lastUpdate, asterData.lastUpdate]);

  const isLoading = (
    (selectedPlatforms.includes('hyperliquid') && hyperliquidData.loading) ||
    (selectedPlatforms.includes('extended') && extendedData.loading) ||
    (selectedPlatforms.includes('aster') && asterData.loading)
  );

  const hasError = (
    (selectedPlatforms.includes('hyperliquid') && !!hyperliquidData.error) ||
    (selectedPlatforms.includes('extended') && !!extendedData.error) ||
    (selectedPlatforms.includes('aster') && !!asterData.error)
  );

  const visiblePairs = useMemo(() => allPairs(selectedPlatforms), [selectedPlatforms]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Funding Rate Comparison</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cross-platform perpetual funding — matrix & pair views</p>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdate && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className={cn('w-2 h-2 rounded-full', isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500')} />
                    <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Platforms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id))}>Select all</Button>
                    <Button variant="outline" size="xs" onClick={() => setSelectedPlatforms([])}>Clear</Button>
                  </div>

                  <div className="space-y-3">
                    {AVAILABLE_PLATFORMS.map(p => (
                      <div key={p.id} className="flex items-center space-x-3">
                        <Checkbox id={p.id} checked={selectedPlatforms.includes(p.id)} onCheckedChange={() => {
                          setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                          setPage(1);
                        }} />
                        <label htmlFor={p.id} className="flex items-center gap-3 flex-1 cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image || '/placeholder.svg'} alt={p.name} className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700 object-cover" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{p.description}</div>
                          </div>
                          <Badge className={cn('text-[10px]', p.color)}>Unit {p.unit.replace('per_', '')}</Badge>
                        </label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Baseline selector for Δ vs baseline in matrix */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Baseline (matrix)</div>
                    <Select value={baseline} onValueChange={setBaseline}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose baseline" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPlatforms.map(pid => (
                          <SelectItem key={pid} value={pid}>{PLATFORM_META[pid].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox id="compact" checked={compact} onCheckedChange={v => setCompact(Boolean(v))} />
                      <label htmlFor="compact" className="text-xs">Compact rows</label>
                    </div>
                  </div>

                  <Separator />

                  {/* Pair mode controls */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pair mode</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={pairA} onValueChange={setPairA}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="A" /></SelectTrigger>
                        <SelectContent>
                          {selectedPlatforms.map(pid => (<SelectItem key={pid} value={pid}>{PLATFORM_META[pid].name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={pairB} onValueChange={setPairB}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="B" /></SelectTrigger>
                        <SelectContent>
                          {selectedPlatforms.map(pid => (<SelectItem key={pid} value={pid}>{PLATFORM_META[pid].name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="opp" checked={onlyOppositeSign} onCheckedChange={v => setOnlyOppositeSign(Boolean(v))} />
                      <label htmlFor="opp" className="text-xs">Only opposite sign (a·b &lt; 0)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Δ threshold</span>
                      <Input type="number" step="0.1" min={0} value={pairEpsBps} onChange={e => setPairEpsBps(Number(e.target.value))} className="h-8 w-20 text-xs" />
                      <span className="text-xs text-slate-500">bps</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-slate-500 dark:text-slate-400">{selectedPlatforms.length} selected</div>
                </CardContent>
              </Card>
            </div>

            {/* Main */}
            <div className="lg:col-span-3">
              {/* Controls */}
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm mb-6">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search assets (e.g., BTC, ETH)…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pl-10"
                        aria-label="Search assets"
                      />
                    </div>

                    {/* View mode */}
                    <div className="flex items-center gap-2">
                      <Button variant={viewMode === 'matrix' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('matrix')}>Matrix</Button>
                      <Button variant={viewMode === 'pair' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('pair')}>Pair</Button>
                    </div>

                    {/* Sort & density (matrix) */}
                    {viewMode === 'matrix' && (
                      <div className="flex gap-2 items-center">
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maxRate">Max rate</SelectItem>
                            <SelectItem value="spread">Spread</SelectItem>
                            <SelectItem value="volume">Volume (24h)</SelectItem>
                            <SelectItem value="oi">Open interest</SelectItem>
                            <SelectItem value="asset">Asset</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort order">
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-8" />

                        <div className="flex items-center gap-2">
                          <Checkbox id="onlyDiff" checked={onlyDiff} onCheckedChange={(v) => setOnlyDiff(Boolean(v))} />
                          <label htmlFor="onlyDiff" className="text-sm">Only differences</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input
                                type="number"
                                step="0.1"
                                min={0}
                                className="w-24 h-8 text-xs"
                                value={epsilonBps}
                                onChange={(e) => setEpsilonBps(Number(e.target.value))}
                                aria-label="Difference threshold in bps"
                              />
                            </TooltipTrigger>
                            <TooltipContent>Matrix threshold (bps). Show rows where spread &gt; threshold.</TooltipContent>
                          </Tooltip>
                        </div>

                        <Separator orientation="vertical" className="h-8" />

                        <div className="flex items-center gap-2">
                          <Checkbox id="pairwiseCols" checked={showPairwiseCols} onCheckedChange={(v) => setShowPairwiseCols(Boolean(v))} />
                          <label htmlFor="pairwiseCols" className="text-sm">Show pairwise Δ</label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loading */}
              {isLoading && (
                <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="py-8 px-6">
                    <div className="animate-pulse space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Errors */}
              {hasError && (
                <Card className="border-red-200 dark:border-red-800 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="py-6 text-center">
                    <div className="text-red-600 dark:text-red-400 mb-2">
                      <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                      <p className="font-semibold text-sm">Failed to load funding data</p>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 max-w-md mx-auto">
                      {selectedPlatforms.includes('hyperliquid') && hyperliquidData.error && (<p>• Hyperliquid: {String(hyperliquidData.error)}</p>)}
                      {selectedPlatforms.includes('extended') && extendedData.error && (<p>• Extended: {String(extendedData.error)}</p>)}
                      {selectedPlatforms.includes('aster') && asterData.error && (<p>• Aster: {String(asterData.error)}</p>)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No selection */}
              {selectedPlatforms.length === 0 && !isLoading && !hasError && (
                <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <div className="text-slate-500 dark:text-slate-400 mb-4">
                      <EyeOff className="h-8 w-8 mx-auto mb-3 opacity-70" />
                      <p className="font-semibold text-sm">No platforms selected</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select platforms to view funding rates</p>
                  </CardContent>
                </Card>
              )}

              {/* MATRIX VIEW */}
              {!isLoading && !hasError && selectedPlatforms.length > 0 && viewMode === 'matrix' && (
                <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">Funding Rates — Matrix</CardTitle>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{`${filteredSorted.length} assets • page ${page} / ${totalPages} • baseline: ${PLATFORM_META[baseline]?.name}`}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[11px]">Spread &gt; {epsilonBps} bps</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className={cn('w-full', compact ? 'text-[13px]' : 'text-sm')}>
                        <thead className="sticky top-[57px] z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                          <tr>
                            <th className="text-left py-3 px-6 text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-800 z-20">Asset</th>
                            {selectedPlatforms.includes('hyperliquid') && (
                              <th className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">
                                <div className="flex items-center justify-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src="/hyprliquid.png" alt="Hyperliquid" className="h-5 w-5 rounded" />
                                  <span>Hyperliquid</span>
                                </div>
                              </th>
                            )}
                            {selectedPlatforms.includes('extended') && (
                              <th className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">
                                <div className="flex items-center justify-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src="/extended.png" alt="Extended" className="h-5 w-5 rounded" />
                                  <span>Extended</span>
                                </div>
                              </th>
                            )}
                            {selectedPlatforms.includes('aster') && (
                              <th className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">
                                <div className="flex items-center justify-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src="/aster.png" alt="Aster" className="h-5 w-5 rounded" />
                                  <span>Aster</span>
                                </div>
                              </th>
                            )}
                            {/* Pairwise Δ columns */}
                            {visiblePairs.map(([a,b]) => (
                              <th key={`${a}-${b}`} className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">Δ {PLATFORM_META[a].name} − {PLATFORM_META[b].name}</th>
                            ))}

                            <th className="text-right py-3 px-6 text-xs uppercase tracking-wide font-semibold">Spread</th>
                            <th className="text-right py-3 px-6 text-xs uppercase tracking-wide font-semibold">Volume (24h)</th>
                            <th className="text-right py-3 px-6 text-xs uppercase tracking-wide font-semibold">Open Interest</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((g) => {
                            const entries = Object.entries(g.platforms);
                            const maxVal = Math.max(...entries.map(([, p]) => (p.fundingRate ?? Number.NEGATIVE_INFINITY)));
                            const minVal = Math.min(...entries.map(([, p]) => (p.fundingRate ?? Number.POSITIVE_INFINITY)));
                            const baseVal = g.platforms[baseline]?.fundingRate ?? null;
                            return (
                              <tr key={g.asset} className={cn('border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors', compact && 'h-10') }>
                                <td className={cn('py-4 px-6 font-semibold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10', compact && 'py-2')}>
                                  {g.asset}
                                </td>
                                {selectedPlatforms.includes('hyperliquid') && (
                                  <td className={cn('py-4 px-6 text-center', compact && 'py-2')}>
                                    {g.platforms.hyperliquid ? (
                                      <div className="space-y-1">
                                        <div className={cn('font-mono font-bold', rateColor(g.platforms.hyperliquid.fundingRate),
                                          (g.platforms.hyperliquid.fundingRate === maxVal) && 'underline decoration-emerald-400 decoration-2 underline-offset-4',
                                          (g.platforms.hyperliquid.fundingRate === minVal) && 'underline decoration-red-400 decoration-2 underline-offset-4')}
                                        >
                                          {formatPct(g.platforms.hyperliquid.fundingRate)}
                                        </div>
                                        <div className={cn('text-[11px] font-mono opacity-75', rateColor(g.platforms.hyperliquid.annualized))}>
                                          {formatPct(g.platforms.hyperliquid.annualized)} /yr
                                        </div>
                                        {baseVal !== null && (
                                          <div className="text-[11px] font-mono" style={deltaBgStyle((g.platforms.hyperliquid.fundingRate ?? 0) - baseVal)}>
                                            Δ vs {PLATFORM_META[baseline].name}: {formatBps((g.platforms.hyperliquid.fundingRate ?? 0) - baseVal)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400 dark:text-slate-500 text-sm font-mono">—</div>
                                    )}
                                  </td>
                                )}
                                {selectedPlatforms.includes('extended') && (
                                  <td className={cn('py-4 px-6 text-center', compact && 'py-2')}>
                                    {g.platforms.extended ? (
                                      <div className="space-y-1">
                                        <div className={cn('font-mono font-bold', rateColor(g.platforms.extended.fundingRate),
                                          (g.platforms.extended.fundingRate === maxVal) && 'underline decoration-emerald-400 decoration-2 underline-offset-4',
                                          (g.platforms.extended.fundingRate === minVal) && 'underline decoration-red-400 decoration-2 underline-offset-4')}
                                        >
                                          {formatPct(g.platforms.extended.fundingRate)}
                                        </div>
                                        <div className={cn('text-[11px] font-mono opacity-75', rateColor(g.platforms.extended.annualized))}>
                                          {formatPct(g.platforms.extended.annualized)} /yr
                                        </div>
                                        {baseVal !== null && (
                                          <div className="text-[11px] font-mono" style={deltaBgStyle((g.platforms.extended.fundingRate ?? 0) - baseVal)}>
                                            Δ vs {PLATFORM_META[baseline].name}: {formatBps((g.platforms.extended.fundingRate ?? 0) - baseVal)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400 dark:text-slate-500 text-sm font-mono">—</div>
                                    )}
                                  </td>
                                )}
                                {selectedPlatforms.includes('aster') && (
                                  <td className={cn('py-4 px-6 text-center', compact && 'py-2')}>
                                    {g.platforms.aster ? (
                                      <div className="space-y-1">
                                        <div className={cn('font-mono font-bold', rateColor(g.platforms.aster.fundingRate),
                                          (g.platforms.aster.fundingRate === maxVal) && 'underline decoration-emerald-400 decoration-2 underline-offset-4',
                                          (g.platforms.aster.fundingRate === minVal) && 'underline decoration-red-400 decoration-2 underline-offset-4')}
                                        >
                                          {formatPct(g.platforms.aster.fundingRate)}
                                        </div>
                                        <div className={cn('text-[11px] font-mono opacity-75', rateColor(g.platforms.aster.annualized))}>
                                          {formatPct(g.platforms.aster.annualized)} /yr
                                        </div>
                                        {baseVal !== null && (
                                          <div className="text-[11px] font-mono" style={deltaBgStyle((g.platforms.aster.fundingRate ?? 0) - baseVal)}>
                                            Δ vs {PLATFORM_META[baseline].name}: {formatBps((g.platforms.aster.fundingRate ?? 0) - baseVal)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400 dark:text-slate-500 text-sm font-mono">—</div>
                                    )}
                                  </td>
                                )}

                                {/* Pairwise delta cells */}
                                {visiblePairs.map(([a,b]) => {
                                  const ra = g.platforms[a]?.fundingRate ?? null;
                                  const rb = g.platforms[b]?.fundingRate ?? null;
                                  const d = (ra === null || rb === null) ? null : (ra - rb);
                                  return (
                                    <td key={`${g.asset}-${a}-${b}`} className={cn('py-4 px-6 text-center font-mono', compact && 'py-2')} style={deltaBgStyle(d)}>
                                      {d === null ? '—' : formatBps(d)}
                                    </td>
                                  );
                                })}

                                <td className={cn('py-4 px-6 text-right', compact && 'py-2')}>
                                  {g.spread !== null ? (
                                    <Badge variant={g.spread > 0 ? 'default' : 'secondary'} className={cn('font-mono', g.spread > 0.0005 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700')}>
                                      {formatBps(g.spread, 3)}
                                    </Badge>
                                  ) : '—'}
                                </td>
                                <td className={cn('py-4 px-6 text-right font-mono text-slate-700 dark:text-slate-300', compact && 'py-2')}>${formatNumber(g.volume24h)}</td>
                                <td className={cn('py-4 px-6 text-right font-mono text-slate-700 dark:text-slate-300', compact && 'py-2')}>{formatNumber(g.openInterest)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredSorted.length === 0 && (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No matching assets</p>
                        <p className="text-xs mt-1">Try broadening your search or lowering the bps threshold</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {filteredSorted.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredSorted.length)} of {filteredSorted.length}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                            <ChevronLeft className="h-4 w-4" /> Prev
                          </Button>
                          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                            Next <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* PAIR VIEW */}
              {!isLoading && !hasError && selectedPlatforms.length > 0 && viewMode === 'pair' && (
                <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">Side-by-side — {PLATFORM_META[pairA]?.name} vs {PLATFORM_META[pairB]?.name}</CardTitle>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{pairItems.length} assets • Δ &gt; {pairEpsBps} bps{onlyOppositeSign ? ' • opposite sign only' : ''}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className={cn('w-full', compact ? 'text-[13px]' : 'text-sm')}>
                        <thead className="sticky top-[57px] z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                          <tr>
                            <th className="text-left py-3 px-6 text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-800 z-20">Asset</th>
                            <th className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">{PLATFORM_META[pairA]?.name}</th>
                            <th className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">{PLATFORM_META[pairB]?.name}</th>
                            <th className="text-center py-3 px-6 text-xs uppercase tracking-wide font-semibold">Δ (A − B)</th>
                            <th className="text-right py-3 px-6 text-xs uppercase tracking-wide font-semibold">Volume (24h)</th>
                            <th className="text-right py-3 px-6 text-xs uppercase tracking-wide font-semibold">Open Interest</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairItems.map((r) => {
                            const maxAbs = Math.max(Math.abs(r.a), Math.abs(r.b)) || 1e-9;
                            const widthA = Math.min(100, Math.abs((r.a / maxAbs) * 100));
                            const widthB = Math.min(100, Math.abs((r.b / maxAbs) * 100));
                            return (
                              <tr key={`${r.asset}-${pairA}-${pairB}`} className={cn('border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors', compact && 'h-10')}>
                                <td className={cn('py-4 px-6 font-semibold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10', compact && 'py-2')}>{r.asset}</td>

                                {/* A cell with mini bar */}
                                <td className={cn('py-4 px-6 text-center', compact && 'py-2')}>
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={cn('font-mono font-bold', rateColor(r.a))}>{formatPct(r.a)}</div>
                                    <div className="w-24 h-2 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <div className="h-full" style={{ width: `${widthA}%`, backgroundColor: r.a >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)' }} />
                                    </div>
                                  </div>
                                </td>

                                {/* B cell with mini bar */}
                                <td className={cn('py-4 px-6 text-center', compact && 'py-2')}>
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={cn('font-mono font-bold', rateColor(r.b))}>{formatPct(r.b)}</div>
                                    <div className="w-24 h-2 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <div className="h-full" style={{ width: `${widthB}%`, backgroundColor: r.b >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)' }} />
                                    </div>
                                  </div>
                                </td>

                                {/* Delta */}
                                <td className={cn('py-4 px-6 text-center font-mono', compact && 'py-2')} style={deltaBgStyle(r.delta)}>
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={cn('font-semibold', rateColor(r.delta))}>{formatBps(r.delta, 2)}</div>
                                    <div className="text-[11px] opacity-70">{formatPct(annualizeFunding(r.delta, 'per_8h'))} /yr (if per-8h)</div>
                                  </div>
                                </td>

                                <td className={cn('py-4 px-6 text-right font-mono text-slate-700 dark:text-slate-300', compact && 'py-2')}>${formatNumber(r.volume24h)}</td>
                                <td className={cn('py-4 px-6 text-right font-mono text-slate-700 dark:text-slate-300', compact && 'py-2')}>{formatNumber(r.openInterest)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {pairItems.length === 0 && (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No assets match the pair filters</p>
                        <p className="text-xs mt-1">Try lowering the Δ bps threshold or disabling the opposite-sign filter</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
