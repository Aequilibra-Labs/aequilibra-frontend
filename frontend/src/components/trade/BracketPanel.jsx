'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus, Target, Info } from 'lucide-react';

export default function BracketPanel({ 
  bracketConfig, 
  setBracketConfig, 
  markPx, 
  position,
  walletBalance = 0,
  size = 0,
  leverage = 1,
  owner,
  agentName = 'aeq-agent',
  coin,
  previewEndpoint
}) {
  const [slTpMode, setSlTpMode] = useState('percentage'); // 'percentage' or 'absolute'
  const [trailingMode, setTrailingMode] = useState('percentage'); // 'percentage' or 'usd'
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Validation functions
  const validateLadderSize = (fraction) => {
    return true; // Accept any fraction
  };

  // Preview bracket prices when configuration changes
  useEffect(() => {
    if (!owner || !coin || !previewEndpoint || (!bracketConfig.sl_pct && !bracketConfig.sl_px && !bracketConfig.tp_pct && !bracketConfig.tp_px)) {
      setPreviewData(null);
      return;
    }

    const previewBracket = async () => {
      setPreviewLoading(true);
      try {
        const payload = {
          owner,
          agent_name: agentName,
          coin,
          is_buy: position?.is_buy || true,
          size: size || 1, // Use 1 as default for preview
          order_kind: 'market',
          sl_pct: bracketConfig.sl_pct,
          sl_px: bracketConfig.sl_px,
          tp_pct: bracketConfig.tp_pct,
          tp_px: bracketConfig.tp_px
        };

        const response = await fetch(previewEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          setPreviewData(data);
        } else {
          setPreviewData(null);
        }
      } catch (error) {
        console.warn('Preview failed:', error);
        setPreviewData(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    // Debounce the preview call
    const timeoutId = setTimeout(previewBracket, 500);
    return () => clearTimeout(timeoutId);
  }, [owner, coin, agentName, previewEndpoint, position?.is_buy, size, bracketConfig.sl_pct, bracketConfig.sl_px, bracketConfig.tp_pct, bracketConfig.tp_px]);

  const addTpLadder = () => {
    const newLadder = { target_price: '', fraction: 0.25 };
    setBracketConfig(prev => ({
      ...prev,
      tp_ladders: [...(prev.tp_ladders || []), newLadder]
    }));
  };

  const removeTpLadder = (index) => {
    setBracketConfig(prev => ({
      ...prev,
      tp_ladders: prev.tp_ladders.filter((_, i) => i !== index)
    }));
  };

  const updateTpLadder = (index, field, value) => {
    setBracketConfig(prev => ({
      ...prev,
      tp_ladders: prev.tp_ladders.map((ladder, i) => 
        i === index ? { ...ladder, [field]: value } : ladder
      )
    }));
  };

  const handleTpChange = (field, value) => {
    setBracketConfig(prev => ({
      ...prev,
      [field]: value,
      // Clear ladders if setting regular TP
      tp_ladders: []
    }));
  };

  const calculatePriceFromPercent = (percent, isStopLoss = false) => {
    if (!markPx || !percent) return '';
    
    if (isStopLoss) {
      return position?.is_buy 
        ? (markPx * (1 - percent / 100)).toFixed(2)
        : (markPx * (1 + percent / 100)).toFixed(2);
    } else {
      return position?.is_buy 
        ? (markPx * (1 + percent / 100)).toFixed(2)
        : (markPx * (1 - percent / 100)).toFixed(2);
    }
  };

  return (
    <div className="space-y-6 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bracket Orders</h3>
      </div>

      {/* Price Preview */}
      {previewData && (previewData.sl_price || previewData.tp_price) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Snapped Prices {previewLoading && "(updating...)"}
            </span>
          </div>
          <div className="space-y-1 text-xs text-blue-600">
            {previewData.sl_price && (
              <div>Stop Loss: ${previewData.sl_price.toFixed(previewData.asset_meta?.pxDecimals || 2)}</div>
            )}
            {previewData.tp_price && (
              <div>Take Profit: ${previewData.tp_price.toFixed(previewData.asset_meta?.pxDecimals || 2)}</div>
            )}
            {!previewData.valid && previewData.validation_errors?.length > 0 && (
              <div className="text-red-600 font-medium">
                ⚠️ {previewData.validation_errors[0]}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stop Loss */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Stop Loss</h4>
          <div className="flex gap-1">
            <Button 
              type="button" 
              variant={slTpMode === 'percentage' ? 'default' : 'outline'}
              onClick={() => setSlTpMode('percentage')}
              size="sm"
            >
              %
            </Button>
            <Button 
              type="button" 
              variant={slTpMode === 'absolute' ? 'default' : 'outline'}
              onClick={() => setSlTpMode('absolute')}
              size="sm"
            >
              Price
            </Button>
          </div>
        </div>

        {slTpMode === 'percentage' ? (
          <div className="space-y-2">
            <input 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              type="number" 
              min="0" 
              max="50" 
              step="0.1"
              value={bracketConfig.sl_pct || ''}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                sl_pct: parseFloat(e.target.value) || null,
                sl_px: null 
              }))}
              placeholder="2.0"
            />
            {bracketConfig.sl_pct && markPx && (
              <div className="text-xs text-muted-foreground">
                Price: ${calculatePriceFromPercent(bracketConfig.sl_pct, true)}
              </div>
            )}
          </div>
        ) : (
          <input 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            type="number" 
            min="0" 
            step="0.01"
            value={bracketConfig.sl_px || ''}
            onChange={(e) => setBracketConfig(prev => ({ 
              ...prev, 
              sl_px: parseFloat(e.target.value) || null,
              sl_pct: null 
            }))}
            placeholder="Enter stop loss price"
          />
        )}
      </div>

      {/* Take Profit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Take Profit</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs">Ladder Mode</span>
            <Switch
              checked={bracketConfig.tp_ladder_mode || false}
              onCheckedChange={(checked) => 
                setBracketConfig(prev => ({ 
                  ...prev, 
                  tp_ladder_mode: checked,
                  // Clear opposite mode when switching
                  tp_pct: checked ? null : prev.tp_pct,
                  tp_px: checked ? null : prev.tp_px,
                  tp_ladders: checked ? (prev.tp_ladders || []) : []
                }))
              }
            />
          </div>
        </div>

        {!bracketConfig.tp_ladder_mode ? (
          // Single TP Mode
          <>
            {slTpMode === 'percentage' ? (
              <div className="space-y-2">
                <input 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="number" 
                  min="0" 
                  max="200" 
                  step="0.1"
                  value={bracketConfig.tp_pct || ''}
                  onChange={(e) => setBracketConfig(prev => ({ 
                    ...prev, 
                    tp_pct: parseFloat(e.target.value) || null,
                    tp_px: null 
                  }))}
                  placeholder="5.0"
                />
                {bracketConfig.tp_pct && markPx && (
                  <div className="text-xs text-muted-foreground">
                    Price: ${calculatePriceFromPercent(bracketConfig.tp_pct, false)}
                  </div>
                )}
              </div>
            ) : (
              <input 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                type="number" 
                min="0" 
                step="0.01"
                value={bracketConfig.tp_px || ''}
                onChange={(e) => setBracketConfig(prev => ({ 
                  ...prev, 
                  tp_px: parseFloat(e.target.value) || null,
                  tp_pct: null 
                }))}
                placeholder="Enter take profit price"
              />
            )}
          </>
        ) : (
          // Ladder Mode
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Multiple TP targets</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTpLadder}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable container for ladders */}
            {bracketConfig.tp_ladders?.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                {bracketConfig.tp_ladders.map((ladder, index) => {
                  const isValidSize = validateLadderSize(ladder.fraction);
                  const ladderSize = size * ladder.fraction;
                  
                  return (
                    <div key={index} className="p-3 border border-border rounded bg-muted/30 space-y-2">
                      {/* Header avec icône et bouton supprimer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Target #{index + 1}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTpLadder(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Prix target */}
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Target Price
                        </label>
                        <input 
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={ladder.target_price}
                          onChange={(e) => updateTpLadder(index, 'target_price', parseFloat(e.target.value) || 0)}
                          placeholder="Enter target price"
                        />
                      </div>
                      
                      {/* Fraction avec validation */}
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Position Fraction
                        </label>
                        <div className="flex items-center gap-2">
                          <input 
                            className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                              isValidSize 
                                ? 'border-input bg-background' 
                                : 'border-red-500 bg-red-50 text-red-700'
                            }`}
                            type="number" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            value={ladder.fraction}
                            onChange={(e) => updateTpLadder(index, 'fraction', parseFloat(e.target.value) || 0)}
                            placeholder="0.25"
                          />
                          <div className="text-right min-w-12">
                            <div className={`text-sm font-medium ${isValidSize ? 'text-foreground' : 'text-red-600'}`}>
                              {(ladder.fraction * 100).toFixed(0)}%
                            </div>
                            {!isValidSize && (
                              <div className="text-xs text-red-600">
                                Too low
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {bracketConfig.tp_ladders?.length > 2 && (
                  <div className="text-xs text-center text-muted-foreground py-2 border-t border-border/50">
                    ↕ Scroll for more targets ({bracketConfig.tp_ladders.length} total)
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trailing Stop */}
      <div className="space-y-3">
        <h4 className="font-medium">Trailing Stop</h4>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant={trailingMode === 'percentage' ? 'default' : 'outline'}
            onClick={() => setTrailingMode('percentage')}
            size="sm"
          >
            %
          </Button>
          <Button 
            type="button" 
            variant={trailingMode === 'usd' ? 'default' : 'outline'}
            onClick={() => setTrailingMode('usd')}
            size="sm"
          >
            USD
          </Button>
        </div>

        {trailingMode === 'percentage' ? (
          <input 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            type="number" 
            min="0" 
            max="50" 
            step="0.1"
            value={bracketConfig.trailing_pct || ''}
            onChange={(e) => setBracketConfig(prev => ({ 
              ...prev, 
              trailing_pct: parseFloat(e.target.value) || null,
              trailing_usd: null 
            }))}
            placeholder="1.0"
          />
        ) : (
          <input 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            type="number" 
            min="0" 
            step="1"
            value={bracketConfig.trailing_usd || ''}
            onChange={(e) => setBracketConfig(prev => ({ 
              ...prev, 
              trailing_usd: parseFloat(e.target.value) || null,
              trailing_pct: null 
            }))}
            placeholder="100"
          />
        )}
      </div>

      {/* Summary */}
      {(bracketConfig.sl_pct || bracketConfig.sl_px || bracketConfig.tp_pct || bracketConfig.tp_px || bracketConfig.tp_ladders?.length > 0) && (
        <div className="p-3 bg-muted rounded-md">
          <h5 className="font-medium text-sm mb-2">Bracket Summary</h5>
          <div className="text-xs space-y-1">
            {bracketConfig.sl_pct && (
              <div>SL: -{bracketConfig.sl_pct}% {markPx && `($${calculatePriceFromPercent(bracketConfig.sl_pct, true)})`}</div>
            )}
            {bracketConfig.sl_px && (
              <div>SL: ${bracketConfig.sl_px}</div>
            )}
            {!bracketConfig.tp_ladder_mode && bracketConfig.tp_pct && (
              <div>TP: +{bracketConfig.tp_pct}% {markPx && `($${calculatePriceFromPercent(bracketConfig.tp_pct, false)})`}</div>
            )}
            {!bracketConfig.tp_ladder_mode && bracketConfig.tp_px && (
              <div>TP: ${bracketConfig.tp_px}</div>
            )}
            {bracketConfig.tp_ladder_mode && bracketConfig.tp_ladders?.length > 0 && (
              <div>TP Ladders: {bracketConfig.tp_ladders.length} targets</div>
            )}
            {bracketConfig.trailing_pct && (
              <div>Trailing: {bracketConfig.trailing_pct}%</div>
            )}
            {bracketConfig.trailing_usd && (
              <div>Trailing: ${bracketConfig.trailing_usd}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}