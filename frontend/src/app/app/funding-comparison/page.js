'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Search,
  RefreshCw,
  BarChart3,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Star,
  ExternalLink,
} from 'lucide-react';

// Hooks
import { useHyperliquidFunding } from '@/hooks/protocols/hyperliquid';
import { useExtendedFunding } from '@/lib/protocols/extended/rest';
import { useAsterFunding } from '@/hooks/protocols/aster/useAsterFunding';
import { asterDataService } from '@/lib/protocols/aster';

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
    unit: 'per_hour',
  },
};

const AVAILABLE_PLATFORMS = Object.values(PLATFORM_META);

// Cache for Aster funding intervals to avoid repeated API calls
const asterIntervalCache = new Map();

async function getAsterFundingInterval(symbol) {
  const cacheKey = symbol;
  if (asterIntervalCache.has(cacheKey)) return asterIntervalCache.get(cacheKey);

  // Try localStorage cache first
  try {
    const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
    if (stored && stored[cacheKey]) {
      asterIntervalCache.set(cacheKey, stored[cacheKey]);
      return stored[cacheKey];
    }
  } catch {}

  // Helper: timeout a promise
  const withTimeout = (p, ms = 5000) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);

  try {
    // Ask only for the last 2 events (enough to get cadence)
    const historyData = await withTimeout(
      asterDataService.fundingRateHistory(symbol, null, null, 2),
      5000
    );

    if (historyData?.length >= 2) {
      const t0 = historyData[0].fundingTime;
      const t1 = historyData[1].fundingTime;
      const intervalMs = Math.abs(t1 - t0);
      const hours = Math.max(1, Math.round(intervalMs / (1000 * 60 * 60)));

      const result = { hours, milliseconds: intervalMs };
      asterIntervalCache.set(cacheKey, result);

      // persist in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
        stored[cacheKey] = result;
        localStorage.setItem('funding:asterIntervals', JSON.stringify(stored));
      } catch {}

      return result;
    }
  } catch (error) {
    console.warn(`Aster interval ${symbol} failed:`, error);
  }

  // Fallback: 4h
  const fallback = { hours: 4, milliseconds: 4 * 60 * 60 * 1000 };
  asterIntervalCache.set(cacheKey, fallback);
  try {
    const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
    stored[cacheKey] = fallback;
    localStorage.setItem('funding:asterIntervals', JSON.stringify(stored));
  } catch {}
  return fallback;
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

function rateColor(rate) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return 'text-slate-400 dark:text-slate-500';
  return Number(rate) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

function isFiniteNum(x) { return typeof x === 'number' && isFinite(x); }
// If OI/Vol are already USD, just return Number(x) or 0.
function toUsd(x) {
  const n = Number(x);
  return isFinite(n) ? n : 0;
}

// — Page wrapper —
export default function FundingComparisonPage() {
  return (
    <div className="min-h-screen bg-background">
      <FundingComparison />
    </div>
  );
}

export function FundingComparison() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(AVAILABLE_PLATFORMS.map(p => p.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('maxRate'); // 'asset' | 'maxRate' | 'spread' | 'volume' | 'oi'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [onlyDiff, setOnlyDiff] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastUpdate, setLastUpdate] = useState(null);

  // New filter states (UI only for now)
  const [minOI, setMinOI] = useState('');
  const [minVol, setMinVol] = useState('');
  const [maxSpreadBps, setMaxSpreadBps] = useState('');

  // Funding unit state
  const [fundingUnit, setFundingUnit] = useState('1h'); // '1h' | '8h' | '1d' | '1y'
  const FUNDING_MULT = { '1h': 1, '8h': 8, '1d': 24, '1y': 24 * 365 };
  const scaleFunding = (perHour) => {
    if (perHour == null || isNaN(Number(perHour))) return null;
    return Number(perHour) * FUNDING_MULT[fundingUnit];
  };

  // Min APR filter state
  const [minAprPct, setMinAprPct] = useState('');

  // Router for navigation
  const router = useRouter();

  // Handler to navigate to asset page
  const handleViewAsset = (assetName) => {
    router.push(`/markets/asset/${assetName.toLowerCase()}`);
  };

  // Aster funding intervals (dynamically calculated per symbol)
  const [asterIntervals, setAsterIntervals] = useState(new Map());

  // Favorites state with localStorage persistence
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('funding:favorites') || '[]')); }
    catch { return new Set(); }
  });
  const [onlyFavs, setOnlyFavs] = useState(false);

  // Data hooks
  const hyperliquidData = useHyperliquidFunding();
  const extendedData = useExtendedFunding();
  const asterData = useAsterFunding();

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => prev.includes(platformId)
      ? prev.filter(id => id !== platformId)
      : [...prev, platformId]);
    setPage(1);
  };

  const handleSelectAll = () => setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id));
  const handleClearAll = () => setSelectedPlatforms([]);

  // Favorites persistence
  useEffect(() => {
    localStorage.setItem('funding:favorites', JSON.stringify([...favorites]));
  }, [favorites]);

// Fetch Aster funding intervals progressively with bounded concurrency
useEffect(() => {
  if (!(selectedPlatforms.includes('aster') && asterData.data?.length)) return;

  let cancelled = false;

  const symbols = asterData.data
    .map((item) => (item.asset ?? item.coin ?? '').toString())
    .filter(Boolean);

  // Seed from localStorage immediately (avoids refetch on reload)
  try {
    const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
    if (stored && typeof stored === 'object') {
      // Merge into state Map
      setAsterIntervals(new Map(Object.entries(stored)));
      // Also prime in-memory cache
      Object.entries(stored).forEach(([k, v]) => asterIntervalCache.set(k, v));
    }
  } catch {}

  // Helper to push each discovered interval into state + storage
  const pushInterval = (sym, interval) => {
    if (cancelled) return;
    setAsterIntervals((prev) => {
      const next = new Map(prev);
      next.set(sym, interval);
      try {
        const obj = Object.fromEntries(next);
        localStorage.setItem('funding:asterIntervals', JSON.stringify(obj));
      } catch {}
      return next;
    });
  };

  // Bounded concurrency (simple worker pool)
  const CONCURRENCY = 6;
  let i = 0;

  const worker = async () => {
    while (!cancelled && i < symbols.length) {
      const sym = symbols[i++];
      // Use memory cache if available
      if (asterIntervalCache.has(sym)) {
        pushInterval(sym, asterIntervalCache.get(sym));
        continue;
      }
      try {
        const res = await getAsterFundingInterval(sym);
        pushInterval(sym, res);
      } catch {
        pushInterval(sym, { hours: 4, milliseconds: 4 * 60 * 60 * 1000 });
      }
    }
  };

  // Kick off workers (fire-and-forget; don't await)
  const workers = Array.from({ length: Math.min(CONCURRENCY, symbols.length) }, worker);

  return () => { cancelled = true; };
}, [selectedPlatforms, asterData.data]);

  // Helper to toggle favorite
  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol); else next.add(symbol);
      return next;
    });
  };

  // Combine
  const combined = useMemo(() => {
    const rows = [];

    function pushFrom(list, platformKey) {
      if (!list) return;
      const meta = PLATFORM_META[platformKey];
      list.forEach((item) => {
        const asset = (item.asset ?? item.coin ?? '').toString();
        const normalized = normalizeAssetName(asset);
        let rateNum = item.fundingRate !== undefined && item.fundingRate !== null && !isNaN(Number(item.fundingRate))
          ? Number(item.fundingRate)
          : null;
        if (platformKey === 'aster' && rateNum !== null) {
          // Convert from per-interval to per hour using dynamic interval calculation
          const interval = asterIntervals.get(asset) || { hours: 4 }; // fallback to 4 hours
          rateNum /= interval.hours;
        }
        rows.push({
          platform: platformKey,
          platformName: meta.name,
          unit: meta.unit,
          asset,
          normalized,
          fundingRate: rateNum,
          nextFunding: nextFundingTime(meta.unit),
          volume24h: toUsd(item.volume24h),        // ensure number
          openInterest: platformKey === 'aster' ? toUsd(item.openInterest) * toUsd(item.markPx) : toUsd(item.openInterestUSD || item.openInterest),
          markPx: Number(item.markPx ?? 0),
        });
      });
    }

    if (selectedPlatforms.includes('hyperliquid')) pushFrom(hyperliquidData.data, 'hyperliquid');
    if (selectedPlatforms.includes('extended')) pushFrom(extendedData.data, 'extended');
    if (selectedPlatforms.includes('aster')) pushFrom(asterData.data, 'aster');

    return rows;
  }, [selectedPlatforms, hyperliquidData.data, extendedData.data, asterData.data, asterIntervals]);

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
        platformName: r.platformName,
        openInterest: r.openInterest,
        volume24h: r.volume24h,
        validOI:  isFiniteNum(r.openInterest)  && r.openInterest  >= 0,
        validVol: isFiniteNum(r.volume24h) && r.volume24h >= 0,
      };
      g.volume24h = Math.max(g.volume24h, r.volume24h || 0);
      g.openInterest = Math.max(g.openInterest, r.openInterest || 0);

      if (r.fundingRate !== null) {
        g.maxRate = g.maxRate === null ? r.fundingRate : Math.max(g.maxRate, r.fundingRate);
        g.minRate = g.minRate === null ? r.fundingRate : Math.min(g.minRate, r.fundingRate);
      }
    }

    const out = Array.from(map.values()).map(g => {
      const entries = Object.entries(g.platforms);
      const perHourVals = entries
        .map(([k, v]) => ({ key: k, val: v.fundingRate }))
        .filter(({ val }) => val != null);

      if (perHourVals.length >= 2) {
        const mx = perHourVals.reduce((a, b) => (b.val > a.val ? b : a));
        const mn = perHourVals.reduce((a, b) => (b.val < a.val ? b : a));
        const spreadPerHour = mx.val - mn.val;
        const apr = spreadPerHour * 24 * 365;

        g.maxRate = mx.val;
        g.minRate = mn.val;
        g.apr = apr;
        g.shortPlatform = mx.key;
        g.longPlatform = mn.key;
        return g;
      }
      return { ...g, spread: null, apr: null, longPlatform: null, shortPlatform: null };
    });

    return out.filter(g => Object.values(g.platforms).filter(p => p.fundingRate !== null).length >= 2);
  }, [combined]);

  // Debug validation
  console.debug('row check', grouped.map(g => [g.asset, Object.fromEntries(Object.entries(g.platforms).map(([k,v]) => [k, { OI:v.openInterest, Vol:v.volume24h, okOI:v.validOI, okVol:v.validVol }]))]));

  // Filter + sort
  const filteredSorted = useMemo(() => {
    let arr = grouped.filter(g => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return g.asset.toLowerCase().includes(q);
    });

    if (onlyDiff) arr = arr.filter(g => (g.apr ?? 0) > 0);

    if (onlyFavs) arr = arr.filter(g => favorites.has(g.asset));

    if (minAprPct !== '') {
      const thr = Number(minAprPct);
      if (!isNaN(thr) && thr >= 0) {
        arr = arr.filter(g => (g.apr ?? 0) * 100 >= thr);
      }
    }

    const thrOI  = minOI  === '' ? null : Number(minOI);
    const thrVol = minVol === '' ? null : Number(minVol);

    if (thrOI !== null || thrVol !== null) {
      arr = arr.map(g => {
        // Platforms present in this row & currently selected
        const toCheck = selectedPlatforms.filter(p => g.platforms[p]);

        // Count platforms that pass BOTH thresholds (when set)
        const passes = toCheck.filter(pid => {
          const p = g.platforms[pid];
          const okOI  = thrOI  === null ? true : (p?.validOI  && p.openInterest >= thrOI);
          const okVol = thrVol === null ? true : (p?.validVol && p.volume24h  >= thrVol);
          return okOI && okVol;
        }).length;

        // annotate for UI (used later)
        g._passCount = passes;
        g._checkedCount = toCheck.length;
        g._meetsTwoForArb = passes >= 2;  // arbitrage viability flag
        return g;
      })
      // Keep the row visible if AT LEAST ONE platform passes
      .filter(g => (g._passCount ?? 0) >= 1);
    } else {
      // No thresholds set — still compute flags for UI consistency
      arr = arr.map(g => {
        const toCheck = selectedPlatforms.filter(p => g.platforms[p]);
        g._checkedCount = toCheck.length;
        g._passCount = toCheck.length;     // treat as all passing when no thresholds
        g._meetsTwoForArb = g._passCount >= 2;
        return g;
      });
    }

    const dir = sortOrder === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = sortBy === 'asset' ? a.asset : (a.maxRate ?? Number.NEGATIVE_INFINITY);
      const bv = sortBy === 'asset' ? b.asset : (b.maxRate ?? Number.NEGATIVE_INFINITY);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    });

    return arr;
  }, [grouped, searchQuery, onlyDiff, onlyFavs, minAprPct, minOI, minVol, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

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

  return (
    <TooltipProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        {/* Header */}
        <div className="border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Funding Rate Comparison</h1>
                <p className="text-sm text-muted-foreground mt-1">Cross-platform perpetual funding rates</p>
                <div className="flex items-center gap-2 mt-3">
                  {AVAILABLE_PLATFORMS.map(p => {
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <Tooltip key={p.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 rounded-full transition-colors",
                              active
                                ? "bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 ring-2 ring-primary"
                                : "border border-border hover:bg-muted/40"
                            )}
                            onClick={() => handlePlatformToggle(p.id)}
                            aria-pressed={active}
                          >
                            <img src={p.image || '/placeholder.svg'} alt={p.name} className="h-6 w-6 rounded-full object-cover" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{p.name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="ml-2">
                    All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    None
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                      placeholder="Search"
                      aria-label="Search assets"
                      className="h-8 pl-8 w-[160px] md:w-[220px] rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted/40 px-1 py-1">
                    {['1h','8h','1d','1y'].map(u => (
                      <Button
                        key={u}
                        size="sm"
                        variant={fundingUnit === u ? 'default' : 'ghost'}
                        className={cn('h-7 px-2 rounded-full',
                          fundingUnit === u && 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900')}
                        onClick={() => setFundingUnit(u)}
                        aria-pressed={fundingUnit === u}
                      >
                        {u}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={cn('w-2 h-2 rounded-full', isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500')} />
                    <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                )}
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Page size" /></SelectTrigger>
                  <SelectContent>
                    {[10,25,50,100].map(n => (<SelectItem key={n} value={String(n)}>{n} / page</SelectItem>))}
                  </SelectContent>
                </Select>
                {/* Filter chips */}
                {minOI && (
                  <Badge variant="secondary" className="text-xs">
                    OI ≥ {formatNumber(Number(minOI))}
                    <button onClick={() => setMinOI('')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Clear OI filter">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minVol && (
                  <Badge variant="secondary" className="text-xs">
                    Vol ≥ {formatNumber(Number(minVol))}
                    <button onClick={() => setMinVol('')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Clear volume filter">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {maxSpreadBps && (
                  <Badge variant="secondary" className="text-xs">
                    Spread ≤ {maxSpreadBps} bps
                    <button onClick={() => setMaxSpreadBps('')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Clear spread filter">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minAprPct !== '' && (
                  <Badge variant="secondary" className="gap-1 rounded-full">
                    APR ≥ {minAprPct}%
                    <button
                      type="button"
                      aria-label="Clear Min APR"
                      onClick={() => setMinAprPct('')}
                      className="ml-1 inline-flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {onlyFavs && (
                  <Badge variant="secondary" className="gap-1 rounded-full">Favorites only</Badge>
                )}
                <Badge variant="outline" className="rounded-full">{favorites.size}★</Badge>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Open filters">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label htmlFor="only-favs" className="text-sm">Only favorites</label>
                        <Checkbox id="only-favs" checked={onlyFavs} onCheckedChange={(v) => setOnlyFavs(Boolean(v))} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="only-diff" className="text-sm">Only differences</label>
                        <Checkbox id="only-diff" checked={onlyDiff} onCheckedChange={(v) => setOnlyDiff(Boolean(v))} />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="min-apr" className="text-xs font-medium">Min APR (%)</label>
                        <Input
                          id="min-apr"
                          type="number"
                          step="0.1"
                          min={0}
                          className="h-8 w-[140px]"
                          value={minAprPct}
                          onChange={(e) => setMinAprPct(e.target.value)}
                          placeholder="e.g. 10"
                        />
                        <p className="text-[11px] text-muted-foreground">APR is computed from 1h spread × 24 × 365.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="minOI" className="text-sm font-medium">Min Open Interest</label>
                        <Input
                          id="minOI"
                          type="number"
                          placeholder="e.g. 1000000"
                          value={minOI}
                          onChange={(e) => setMinOI(e.target.value)}
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Minimum open interest in USD</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="minVol" className="text-sm font-medium">Min Volume (24h)</label>
                        <Input
                          id="minVol"
                          type="number"
                          placeholder="e.g. 5000000"
                          value={minVol}
                          onChange={(e) => setMinVol(e.target.value)}
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Minimum 24h volume in USD</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="maxSpreadBps" className="text-sm font-medium">Max Spread (bps)</label>
                        <Input
                          id="maxSpreadBps"
                          type="number"
                          placeholder="e.g. 10"
                          value={maxSpreadBps}
                          onChange={(e) => setMaxSpreadBps(e.target.value)}
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">Maximum funding spread in basis points</p>
                      </div>
                      <div className="flex justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMinOI('');
                            setMinVol('');
                            setMaxSpreadBps('');
                            setOnlyDiff(true);
                            setMinAprPct('');
                            setOnlyFavs(false);
                          }}
                        >
                          Reset
                        </Button>
                        <Button size="sm">
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Main */}
            <div>
              {/* Loading */}
              {isLoading && (
                <Card className="border-border shadow-lg bg-card/60 backdrop-blur-sm">
                  <CardContent className="py-8 px-6">
                    <div className="animate-pulse space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 bg-muted/60 rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Errors */}
              {hasError && (
                <Card className="border-destructive/20 shadow-lg bg-card/60 backdrop-blur-sm">
                  <CardContent className="py-6 text-center">
                    <div className="text-destructive mb-2">
                      <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                      <p className="font-semibold text-sm">Failed to load funding data</p>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 max-w-md mx-auto">
                      {selectedPlatforms.includes('hyperliquid') && hyperliquidData.error && (<p>• Hyperliquid: {String(hyperliquidData.error)}</p>)}
                      {selectedPlatforms.includes('extended') && extendedData.error && (<p>• Extended: {String(extendedData.error)}</p>)}
                      {selectedPlatforms.includes('aster') && asterData.error && (<p>• Aster: {String(asterData.error)}</p>)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No selection */}
              {selectedPlatforms.length === 0 && !isLoading && !hasError && (
                <Card className="border-border shadow-lg bg-card/60 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground mb-4">
                      <EyeOff className="h-8 w-8 mx-auto mb-3 opacity-70" />
                      <p className="font-semibold text-sm">No platforms selected</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Select platforms to view funding rates</p>
                  </CardContent>
                </Card>
              )}

              {/* Table */}
              {!isLoading && !hasError && selectedPlatforms.length > 0 && (
                <Card className="border-border shadow-lg bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">Funding Rates</CardTitle>
                        <div className="text-xs text-muted-foreground">{filteredSorted.length} assets • page {page} / {totalPages}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[11px]">APR ≥ {minAprPct || 0}%</Badge>
                        {(minOI !== '' || minVol !== '') && (
                          <Badge variant="secondary" className="text-[11px] rounded-full">
                            Row kept if ≥1 passes; arbitrage viable if ≥2
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-4 font-semibold sticky left-0 bg-muted/30 z-10">Asset</th>
                            {selectedPlatforms.map(platformId => (
                              <th key={platformId} className="text-center p-4 font-semibold">
                                <div className="flex items-center justify-center gap-2">
                                  <img src={PLATFORM_META[platformId].image} alt={PLATFORM_META[platformId].name} className="h-5 w-5 rounded" />
                                  <span className="hidden sm:inline">{PLATFORM_META[platformId].name} · {fundingUnit}</span>
                                  <span className="sm:hidden">{PLATFORM_META[platformId].name}</span>
                                </div>
                              </th>
                            ))}
                            <th className="text-right p-4 font-semibold">APR</th>
                            <th className="text-center p-4 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((g) => {
                            const scaledVals = ['hyperliquid','extended','aster']
                              .filter(k => selectedPlatforms.includes(k) && g.platforms[k]?.fundingRate != null)
                              .map(k => scaleFunding(g.platforms[k].fundingRate));
                            const rowMax = scaledVals.length ? Math.max(...scaledVals) : null;
                            const rowMin = scaledVals.length ? Math.min(...scaledVals) : null;
                            return (
                              <tr key={g.asset} className="hover:bg-muted/30 transition-all duration-200 border-b border-border">
                                <td className="p-4 sticky left-0 bg-background z-10">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      aria-label={`Toggle favorite for ${g.asset}`}
                                      aria-pressed={favorites.has(g.asset)}
                                      onClick={() => toggleFavorite(g.asset)}
                                      className="p-1 rounded hover:bg-muted/40 transition-colors"
                                    >
                                      <Star className={cn(
                                        "h-4 w-4",
                                        favorites.has(g.asset) ? "text-amber-400 fill-current" : "text-muted-foreground"
                                      )}/>
                                    </button>
                                    <span className="font-semibold text-foreground text-sm block truncate max-w-[12ch] md:max-w-[18ch]" title={g.asset}>{g.asset}</span>
                                  </div>
                                </td>
                                {selectedPlatforms.map(platformId => {
                                  const v = scaleFunding(g.platforms[platformId]?.fundingRate ?? null);
                                  return (
                                    <td key={platformId} className="p-4 text-center">
                                      {g.platforms[platformId] ? (
                                        <div className="space-y-1">
                                          <div className={cn(
                                            'font-mono font-bold text-sm tabular-nums',
                                            rateColor(v),
                                            v === rowMax && 'underline decoration-emerald-400 decoration-2 underline-offset-4',
                                            v === rowMin && 'underline decoration-red-400 decoration-2 underline-offset-4'
                                          )}>
                                            {formatPct(v, 4)}
                                          </div>

                                          {/* OI line */}
                                          <div className="text-[11px] leading-tight">
                                            {g.platforms[platformId]?.validOI
                                              ? <span className="text-muted-foreground">OI ${formatNumber(g.platforms[platformId].openInterest)}</span>
                                              : <span className="text-red-400/80">OI —</span>}
                                          </div>

                                          {/* Vol line */}
                                          <div className="text-[11px] leading-tight">
                                            {g.platforms[platformId]?.validVol
                                              ? <span className="text-muted-foreground">Vol ${formatNumber(g.platforms[platformId].volume24h)}</span>
                                              : <span className="text-red-400/80">Vol —</span>}
                                          </div>
                                        </div>
                                      ) : <div className="text-muted-foreground text-sm font-mono">—</div>}
                                    </td>
                                  );
                                })}
                                <td className="p-4 text-right font-semibold text-emerald-500">
                                  {g.apr != null ? `${(g.apr * 100).toFixed(1)}%` : '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => handleViewAsset(g.asset)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                  </Button>

                                  {/* strategy preview with logos (below) */}
                                  <div className="mt-2 flex items-center justify-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-muted-foreground hidden sm:inline">Long</span>
                                      {g.longPlatform ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={PLATFORM_META[g.longPlatform].image}
                                          alt={PLATFORM_META[g.longPlatform].name}
                                          title={PLATFORM_META[g.longPlatform].name}
                                          className="h-5 w-5 rounded"
                                        />
                                      ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-muted-foreground hidden sm:inline">Short</span>
                                      {g.shortPlatform ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={PLATFORM_META[g.shortPlatform].image}
                                          alt={PLATFORM_META[g.shortPlatform].name}
                                          title={PLATFORM_META[g.shortPlatform].name}
                                          className="h-5 w-5 rounded"
                                        />
                                      ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-1 text-[11px] text-muted-foreground">
                                    {g._passCount}/{g._checkedCount} pass{g._passCount === 1 ? '' : 'es'}
                                    {!g._meetsTwoForArb && (
                                      <span className="ml-1 text-amber-400">need ≥2 for arb</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredSorted.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No matching assets</p>
                        <p className="text-xs mt-1">Try broadening your search or lowering the bps threshold</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {filteredSorted.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <div className="text-xs text-muted-foreground">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredSorted.length)} of {filteredSorted.length}</div>
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
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
