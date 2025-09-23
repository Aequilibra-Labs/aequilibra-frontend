import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, RefreshCw, Filter, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Filters from './Filters';

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
  onReset
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          Funding Rate Comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Cross-platform perpetual funding rates</p>
        <div className="flex items-center gap-2 mt-3">
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
                <img src={p.image || '/placeholder.svg'} alt={p.name} className="h-6 w-6 rounded-full object-cover" />
              </Button>
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
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
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
        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); }}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Page size" /></SelectTrigger>
          <SelectContent>
            {[10,25,50,100].map(n => (<SelectItem key={n} value={String(n)}>{n} / page</SelectItem>))}
          </SelectContent>
        </Select>
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
        <Badge variant="outline" className="rounded-full">{favoritesCount}★</Badge>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Open filters">
              <Filter className="h-4 w-4 mr-2" />
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
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
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
