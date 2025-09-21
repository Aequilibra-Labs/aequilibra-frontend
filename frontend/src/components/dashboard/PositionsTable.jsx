'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { X, Shield, Target, TrendingUp, TrendingDown, Settings } from 'lucide-react';

export default function PositionsTable({ 
  positions = [], 
  onPartialClose, 
  onCancelBracket,
  bracketStates = {},
  refreshBrackets,
  refreshOrders,  // Add new prop for refreshing open orders
  owner = null  // Add owner prop
}) {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [editingBracket, setEditingBracket] = useState(null);
  const [closePercentages, setClosePercentages] = useState({}); // Track close percentage for each position
  const [showCloseSlider, setShowCloseSlider] = useState({}); // Track which positions show close slider
  const [closeErrors, setCloseErrors] = useState({}); // Track close errors for each position
  const [bracketForm, setBracketForm] = useState({
    sl_pct: '',
    tp_pct: '',
    trailing_pct: ''
  });

  // Format number for display
  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0.00';
    return Number(num).toFixed(decimals);
  };

  // Format percentage
  const formatPercent = (num) => {
    if (!num) return '0.00%';
    return `${(Number(num) * 100).toFixed(2)}%`;
  };

  // Get bracket state for position
  const getBracketState = (coin) => {
    return bracketStates[coin] || null;
  };

  // Handle partial close
  const handlePartialClose = async (position, percentage) => {
    const coin = position.position.coin;
    const positionSize = Math.abs(parseFloat(position.position.szi || 0));
    // Use entry price as fallback since markPx might not be available
    const markPrice = parseFloat(position.markPx || position.position.entryPx || 0);
    const closeValue = (positionSize * markPrice * percentage) / 100;
    
    console.log('PositionsTable - handlePartialClose called with:', {
      coin: coin,
      percentage: percentage,
      positionSize: positionSize,
      markPrice: markPrice,
      closeValue: closeValue,
      convertedPercentage: percentage / 100,
      position: position
    });
    
    // Clear any previous error for this position
    setCloseErrors(prev => ({
      ...prev,
      [coin]: null
    }));
    
    // Check minimum $10 rule for partial closes (not 100%)
    if (percentage < 100 && closeValue < 10) {
      const errorMsg = `Volume trop petit ($${closeValue.toFixed(2)}). Minimum requis: $10 pour fermeture partielle`;
      setCloseErrors(prev => ({
        ...prev,
        [coin]: errorMsg
      }));
      console.warn('Volume too small for partial close:', { closeValue, minRequired: 10 });
      return;
    }
    
    if (onPartialClose) {
      try {
        await onPartialClose({
          coin: coin,
          percentage: percentage / 100,
          slippage: 0.05
        });
      } catch (error) {
        // Handle API errors
        const errorMsg = error.message || 'Erreur lors de la fermeture';
        setCloseErrors(prev => ({
          ...prev,
          [coin]: errorMsg
        }));
        console.log('Error closing position:', error);
      }
    }
  };

  // Update close percentage for a position
  const updateClosePercentage = (coin, percentage) => {
    setClosePercentages(prev => ({
      ...prev,
      [coin]: percentage
    }));
    
    // Clear any error when user changes percentage
    setCloseErrors(prev => ({
      ...prev,
      [coin]: null
    }));
  };

  // Toggle close slider visibility for a position
  const toggleCloseSlider = (coin) => {
    setShowCloseSlider(prev => ({
      ...prev,
      [coin]: !prev[coin]
    }));
    
    // Reset percentage when hiding slider
    if (showCloseSlider[coin]) {
      setClosePercentages(prev => ({
        ...prev,
        [coin]: 25
      }));
      setCloseErrors(prev => ({
        ...prev,
        [coin]: null
      }));
    }
  };  // Check if close value would be too small for partial close
  const isCloseValueTooSmall = (position, percentage) => {
    if (percentage >= 100) return false; // 100% is always allowed
    
    const positionSize = Math.abs(parseFloat(position.position.szi || 0));
    // Use entry price as fallback since markPx might not be available
    const markPrice = parseFloat(position.markPx || position.position.entryPx || 0);
    const closeValue = (positionSize * markPrice * percentage) / 100;
    
    console.log('isCloseValueTooSmall debug:', {
      coin: position.position.coin,
      percentage,
      positionSize,
      markPrice,
      closeValue,
      result: closeValue < 10
    });
    
    return closeValue < 10;
  };

  // Calculate position value in USD
  const getPositionValueUSD = (position) => {
    const positionSize = Math.abs(parseFloat(position.position.szi || 0));
    // Use entry price as fallback since markPx might not be available
    const markPrice = parseFloat(position.markPx || position.position.entryPx || 0);
    return positionSize * markPrice;
  };

  // Get close percentage for a position (default 50%)
  const getClosePercentage = (coin) => {
    return closePercentages[coin] || 50;
  };

  // Handle cancel bracket
  const handleCancelBracket = async (coin) => {
    if (onCancelBracket) {
      await onCancelBracket(coin);
      if (refreshBrackets) {
        refreshBrackets();
      }
    }
  };

  // Apply SL/TP to existing position
  async function handleApplyNow({ owner, agentName, coin, slPctStr, tpPctStr, slPx, tpPx }) {
    const payload = {
      owner,
      agent_name: agentName || "aeq-agent",
      coin,
      sl_pct: slPctStr !== "" && slPctStr != null ? Number(slPctStr) / 100 : null,
      tp_pct: tpPctStr !== "" && tpPctStr != null ? Number(tpPctStr) / 100 : null,
      sl_px: slPx != null && slPx !== "" ? Number(slPx) : null,
      tp_px: tpPx != null && tpPx !== "" ? Number(tpPx) : null,
    };

    const res = await fetch("/api/trading/hl/bracket/apply-now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Failed to apply TP/SL");
    return data;
  }

  // Handle modify bracket
  const handleModifyBracket = async (position) => {
    // Safe extraction of coin with fallback
    const coin = position?.position?.coin || position?.coin;
    if (!coin) {
      console.log('No coin found in position for modify bracket:', position);
      return;
    }
    
    if (!owner) {
      console.log('Owner is required to modify brackets');
      return;
    }
    
    try {
      console.log('Applying SL/TP with form:', bracketForm);
      
      const result = await handleApplyNow({
        owner: owner,
        agentName: 'aeq-agent',
        coin: coin,
        slPctStr: bracketForm.sl_pct,
        tpPctStr: bracketForm.tp_pct,
        slPx: null,
        tpPx: null
      });

      console.log('✅ SL/TP applied successfully:', result);
      setEditingBracket(null);
      setBracketForm({ sl_pct: '', tp_pct: '', trailing_pct: '' });
      
      // Refresh brackets if callback provided
      if (refreshBrackets) {
        refreshBrackets();
      }
      
      // Refresh open orders to show the new TP/SL orders
      if (refreshOrders) {
        refreshOrders();
      }
    } catch (error) {
      console.log('Error applying SL/TP:', error);
    }
  };

  // Open bracket editor
  const openBracketEditor = (position) => {
    // Safe extraction of coin with fallback
    const coin = position?.position?.coin || position?.coin;
    if (!coin) {
      console.log('No coin found in position:', position);
      return;
    }
    
    const bracket = getBracketState(coin)?.state;
    
    // Pre-fill form with existing values (convert to percentage display)
    setBracketForm({
      sl_pct: bracket?.sl_pct ? (bracket.sl_pct * 100).toString() : '',
      tp_pct: bracket?.tp_pct ? (bracket.tp_pct * 100).toString() : '',
      trailing_pct: bracket?.trailing_pct ? (bracket.trailing_pct * 100).toString() : ''
    });
    
    setEditingBracket(position);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Open Positions</h3>
        <div className="text-sm text-muted-foreground">
          {positions.length} position{positions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No open positions
        </div>
      ) : (
        <div className="space-y-2">
          {positions.map((pos, index) => {
            const position = pos.position;
            const coin = position.coin;
            const size = parseFloat(position.szi);
            const isLong = size > 0;
            const entryPx = parseFloat(position.entryPx || 0);
            const unrealizedPnl = parseFloat(pos.unrealizedPnl || 0);
            const marginUsed = parseFloat(pos.marginUsed || 0);
            
            // Debug full position structure to find leverage
            console.log('Full position debug for', coin, ':', {
              position: position,
              pos: pos,
              positionLeverage: position.leverage,
              posLeverage: pos.leverage,
              positionKeys: Object.keys(position),
              posKeys: Object.keys(pos)
            });
            
            // Try multiple ways to get leverage
            let leverage = '1'; // default
            if (position.leverage?.value) {
              leverage = String(Math.round(parseFloat(position.leverage.value)));
            } else if (position.leverage && typeof position.leverage === 'number') {
              leverage = String(Math.round(parseFloat(position.leverage)));
            } else if (pos.leverage?.value) {
              leverage = String(Math.round(parseFloat(pos.leverage.value)));
            } else if (pos.leverage && typeof pos.leverage === 'number') {
              leverage = String(Math.round(parseFloat(pos.leverage)));
            }
            
            console.log('Final leverage for', coin, ':', leverage);
            
            const bracketState = getBracketState(coin);
            const hasBracket = bracketState?.exists;
            const bracket = bracketState?.state;

            return (
              <div 
                key={`${coin}-${index}`}
                className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{coin}</h4>
                    <Badge variant={isLong ? 'default' : 'destructive'}>
                      {isLong ? 'LONG' : 'SHORT'} {leverage}x
                    </Badge>
                    
                    {/* Bracket badges */}
                    {hasBracket && bracket && (
                      <div className="flex gap-1">
                        {bracket.sl_price && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            SL: ${formatNumber(bracket.sl_price)}
                          </Badge>
                        )}
                        {bracket.tp_price && (
                          <Badge variant="outline" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            TP: ${formatNumber(bracket.tp_price)}
                          </Badge>
                        )}
                        {(bracket.trailing_pct || bracket.trailing_usd) && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trailing
                          </Badge>
                        )}
                        {bracket.breakeven_active && (
                          <Badge variant="secondary" className="text-xs">
                            BE Active
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasBracket && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBracket(coin)}
                        className="text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel Bracket
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBracketEditor(position)}
                      className="text-xs"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      {hasBracket ? 'Modifier SL/TP' : 'Ajouter SL/TP'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Size</div>
                    <div className="font-medium">
                      {formatNumber(Math.abs(size), 6)}
                      <div className="text-xs text-muted-foreground">
                        ≈ ${formatNumber(getPositionValueUSD(pos))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Entry</div>
                    <div className="font-medium">${formatNumber(entryPx)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">PnL</div>
                    <div className={`font-medium ${unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${formatNumber(unrealizedPnl)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Margin</div>
                    <div className="font-medium">${formatNumber(marginUsed)}</div>
                  </div>
                </div>

                {/* Bracket details */}
                {hasBracket && bracket && (
                  <div className="mb-3 p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Bracket Details</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {bracket.sl_price && (
                        <div>
                          SL: ${formatNumber(bracket.sl_price)}
                          {bracket.trailing_pct && ` (Trail ${bracket.trailing_pct}%)`}
                          {bracket.trailing_usd && ` (Trail $${bracket.trailing_usd})`}
                        </div>
                      )}
                      {bracket.tp_price && (
                        <div>TP: ${formatNumber(bracket.tp_price)}</div>
                      )}
                      {bracket.tp_ladders && bracket.tp_ladders.length > 0 && (
                        <div>Ladders: {bracket.tp_ladders.length} targets</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Close position controls */}
                <div className="space-y-3">
                  {/* Initial Close button - hide when slider is shown */}
                  {!showCloseSlider[pos.position.coin] && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => toggleCloseSlider(pos.position.coin)}
                      className="w-full"
                    >
                      Close Position
                    </Button>
                  )}
                  
                  {/* Slider section - only show when toggled */}
                  {showCloseSlider[pos.position.coin] && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Close Position</span>
                        <span className="text-sm text-muted-foreground">
                          {getClosePercentage(pos.position.coin)}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Slider for percentage selection */}
                        <Slider
                          value={[getClosePercentage(pos.position.coin)]}
                          onValueChange={(value) => updateClosePercentage(pos.position.coin, value[0])}
                          max={100}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        
                        {/* Volume warning for partial closes */}
                        {isCloseValueTooSmall(pos, getClosePercentage(pos.position.coin)) && (
                          <div className="text-xs text-orange-700 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-300 dark:border-orange-700 rounded px-2 py-1">
                            ⚠️ Fermeture partielle minimum: $10 (actuel: ${formatNumber(getPositionValueUSD(pos) * getClosePercentage(pos.position.coin) / 100, 2)})
                          </div>
                        )}
                        
                        {/* Quick preset buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateClosePercentage(pos.position.coin, 25)}
                            className="text-xs flex-1"
                          >
                            25%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateClosePercentage(pos.position.coin, 50)}
                            className="text-xs flex-1"
                          >
                            50%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateClosePercentage(pos.position.coin, 100)}
                            className="text-xs flex-1"
                          >
                            100%
                          </Button>
                        </div>
                        
                        {/* Execute close button with percentage */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePartialClose(pos, getClosePercentage(pos.position.coin))}
                          disabled={isCloseValueTooSmall(pos, getClosePercentage(pos.position.coin))}
                          className="w-full"
                        >
                          Close {getClosePercentage(pos.position.coin)}%
                          <span className="ml-1 text-xs">
                            (~{formatNumber(Math.abs(parseFloat(pos.position.szi)) * getClosePercentage(pos.position.coin) / 100, 4)} {pos.position.coin})
                          </span>
                        </Button>
                        
                        {/* Error message display */}
                        {closeErrors[pos.position.coin] && (
                          <div className="text-xs text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300 border border-red-300 dark:border-red-700 rounded px-2 py-1">
                            {closeErrors[pos.position.coin]}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Bracket Editor Modal */}
      {editingBracket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-lg w-96 max-w-[90vw] shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Modifier SL/TP pour {editingBracket?.position?.coin || editingBracket?.coin || 'Position'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 2.0 pour -2%"
                  value={bracketForm.sl_pct}
                  onChange={(e) => setBracketForm(prev => ({ ...prev, sl_pct: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 5.0 pour +5%"
                  value={bracketForm.tp_pct}
                  onChange={(e) => setBracketForm(prev => ({ ...prev, tp_pct: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => handleModifyBracket(editingBracket)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sauvegarder
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingBracket(null);
                  setBracketForm({ sl_pct: '', tp_pct: '', trailing_pct: '' });
                }}
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
