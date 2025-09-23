import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export default function Filters({ onlyDiff, setOnlyDiff, onlyFavs, setOnlyFavs, minAprPct, setMinAprPct, minOI, setMinOI, minVol, setMinVol, maxSpreadBps, setMaxSpreadBps, onReset }) {
  return (
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
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button size="sm">
          Apply
        </Button>
      </div>
    </div>
  );
}
