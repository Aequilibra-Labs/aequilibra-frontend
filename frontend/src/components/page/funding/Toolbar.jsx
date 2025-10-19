import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, RefreshCw, Filter, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Filters from './Filters';
import { ChainSwitcher } from '@/components/wallet/ChainSwitcher';

export default function Toolbar({
  selectedPlatforms,
  setSelectedPlatforms,
  handlePlatformToggle,
  handleSelectAll,
  handleClearAll,
  query,
  setQuery,
  fundingUnit,
  setFundingUnit,
  isLoading,
  lastUpdate,
  pageSize,
  setPageSize,
  favoritesCount,
  PLATFORM_META,
  onlyDiff,
  setOnlyDiff,
  onlyFavs,
  setOnlyFavs,
  minAprPct,
  setMinAprPct,
  minOI,
  setMinOI,
  minVol,
  setMinVol,
  maxSpreadBps,
  setMaxSpreadBps,
  onReset,
  onRefresh
}) {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Funding Rate Comparison
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Cross-platform perpetual funding rates</p>
            </div>
            <div className="hidden sm:block">
              <ChainSwitcher />
            </div>
          </div>
        </div>
        
        {/* Status & Page Size - Desktop Only */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading ? (
              <>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                </div>
                <span className="animate-pulse">Fetching live data...</span>
              </>
            ) : lastUpdate ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span>Connecting...</span>
              </>
            )}
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Page size" /></SelectTrigger>
            <SelectContent>
              {[10,25,50,100].map(n => (<SelectItem key={n} value={String(n)}>{n} / page</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controls Section */}
      <div className="space-y-4">
        {/* Platform Selection & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.values(PLATFORM_META).map(p => {
              const active = selectedPlatforms.includes(p.id);
              return (
                <Button
                  key={p.id}
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
                  <img src={p.image || '/placeholder.svg'} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                </Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs px-2">
              All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs px-2">
              None
            </Button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              placeholder="Search assets..."
              aria-label="Search assets"
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Funding Unit Selection & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Funding Unit Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1">
            {['1h','8h','1d','1y'].map(u => (
              <Button
                key={u}
                size="sm"
                variant={fundingUnit === u ? 'default' : 'ghost'}
                className={cn('h-8 px-3 rounded-md text-xs',
                  fundingUnit === u && 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900')}
                onClick={() => setFundingUnit(u)}
                aria-pressed={fundingUnit === u}
              >
                {u}
              </Button>
            ))}
          </div>

          {/* Mobile Status & Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isLoading ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Live</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="text-xs px-2">
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs px-2">{favoritesCount}★</Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open filters" className="text-xs px-3">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <Filters
                  onlyDiff={onlyDiff}
                  setOnlyDiff={setOnlyDiff}
                  onlyFavs={onlyFavs}
                  setOnlyFavs={setOnlyFavs}
                  minAprPct={minAprPct}
                  setMinAprPct={setMinAprPct}
                  minOI={minOI}
                  setMinOI={setMinOI}
                  minVol={minVol}
                  setMinVol={setMinVol}
                  maxSpreadBps={maxSpreadBps}
                  setMaxSpreadBps={setMaxSpreadBps}
                  onReset={onReset}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="hidden lg:flex text-xs px-3">
              <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(minOI || minVol || maxSpreadBps || minAprPct !== '' || onlyFavs) && (
          <div className="flex items-center gap-2 flex-wrap">
            {minOI && (
              <Badge variant="secondary" className="text-xs gap-1">
                OI ≥ {formatNumber(Number(minOI))}
                <button onClick={() => setMinOI('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear OI filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minVol && (
              <Badge variant="secondary" className="text-xs gap-1">
                Vol ≥ {formatNumber(Number(minVol))}
                <button onClick={() => setMinVol('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear volume filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {maxSpreadBps && (
              <Badge variant="secondary" className="text-xs gap-1">
                Spread ≤ {maxSpreadBps} bps
                <button onClick={() => setMaxSpreadBps('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear spread filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minAprPct !== '' && (
              <Badge variant="secondary" className="text-xs gap-1">
                APR ≥ {minAprPct}%
                <button onClick={() => setMinAprPct('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear Min APR">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {onlyFavs && (
              <Badge variant="secondary" className="text-xs">Favorites only</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function, assuming it's defined elsewhere, but for now inline
function formatNumber(n) {
  if (!n || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}
