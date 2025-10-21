'use client';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, DollarSign } from 'lucide-react';

export default function RiskPanel({ 
  userState, 
  positions = [], 
  bracketStates = {},
  walletBalance = 0 
}) {
  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    if (!userState || !positions.length) {
      return {
        totalExposure: 0,
        totalMarginUsed: 0,
        avgLeverage: 0,
        unrealizedPnl: 0,
        exposurePercentage: 0,
        riskLevel: 'low'
      };
    }

    let totalExposure = 0;
    let totalMarginUsed = 0;
    let totalUnrealizedPnl = 0;
    let leverageSum = 0;

    positions.forEach(pos => {
      const position = pos.position;
      const size = Math.abs(parseFloat(position.szi || 0));
      const entryPx = parseFloat(position.entryPx || 0);
      const leverage = parseFloat(position.leverage?.value || 1);
      const marginUsed = parseFloat(pos.marginUsed || 0);
      const unrealizedPnl = parseFloat(pos.unrealizedPnl || 0);

      const exposure = size * entryPx;
      totalExposure += exposure;
      totalMarginUsed += marginUsed;
      totalUnrealizedPnl += unrealizedPnl;
      leverageSum += leverage;
    });

    const avgLeverage = positions.length > 0 ? leverageSum / positions.length : 0;
    const exposurePercentage = walletBalance > 0 ? (totalMarginUsed / walletBalance) * 100 : 0;

    // Determine risk level
    let riskLevel = 'low';
    if (exposurePercentage > 80 || avgLeverage > 10) {
      riskLevel = 'high';
    } else if (exposurePercentage > 50 || avgLeverage > 5) {
      riskLevel = 'medium';
    }

    return {
      totalExposure,
      totalMarginUsed,
      avgLeverage,
      unrealizedPnl: totalUnrealizedPnl,
      exposurePercentage,
      riskLevel
    };
  }, [userState, positions, walletBalance]);

  // Count protected positions (with brackets)
  const protectedPositions = useMemo(() => {
    const positionsWithBrackets = positions.filter(pos => {
      const coin = pos.position.coin;
      return bracketStates[coin]?.exists;
    });
    return positionsWithBrackets.length;
  }, [positions, bracketStates]);

  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0.00';
    return Number(num).toFixed(decimals);
  };

  const formatPercent = (num) => {
    return `${formatNumber(num)}%`;
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default:
        return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Risk Management</h3>
        <Badge className={`${getRiskColor(riskMetrics.riskLevel)} flex items-center gap-1`}>
          {getRiskIcon(riskMetrics.riskLevel)}
          {riskMetrics.riskLevel.toUpperCase()} RISK
        </Badge>
      </div>

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Wallet Balance
          </div>
          <div className="font-semibold text-sm">
            ${formatNumber(walletBalance)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Total Exposure</div>
          <div className="font-semibold text-sm">
            ${formatNumber(riskMetrics.totalExposure)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Margin Used</div>
          <div className="font-semibold text-sm">
            ${formatNumber(riskMetrics.totalMarginUsed)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Unrealized PnL</div>
          <div className={`font-semibold text-sm ${riskMetrics.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${formatNumber(riskMetrics.unrealizedPnl)}
          </div>
        </div>
      </div>

      {/* Risk Percentages */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Margin Usage</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  riskMetrics.exposurePercentage > 80 ? 'bg-red-500' :
                  riskMetrics.exposurePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(riskMetrics.exposurePercentage, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium">
              {formatPercent(riskMetrics.exposurePercentage)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Avg. Leverage</div>
          <div className="font-semibold text-sm">
            {formatNumber(riskMetrics.avgLeverage, 1)}x
          </div>
        </div>
      </div>

      {/* Position Protection Status */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Position Protection</div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Positions with brackets: {protectedPositions} / {positions.length}
          </div>
          <div className="text-xs">
            {positions.length > 0 ? 
              `${formatPercent((protectedPositions / positions.length) * 100)} protected` : 
              'No positions'
            }
          </div>
        </div>
        
        {positions.length > 0 && (
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                protectedPositions === positions.length ? 'bg-green-500' :
                protectedPositions > 0 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(protectedPositions / positions.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Risk Warnings */}
      {riskMetrics.riskLevel === 'high' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            High Risk Warning
          </div>
          <div className="text-xs text-red-700 mt-1">
            {riskMetrics.exposurePercentage > 80 && 
              "High margin usage. Consider reducing position sizes."
            }
            {riskMetrics.avgLeverage > 10 && 
              " High average leverage detected."
            }
          </div>
        </div>
      )}

      {protectedPositions < positions.length && positions.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Unprotected Positions
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            {positions.length - protectedPositions} position{positions.length - protectedPositions !== 1 ? 's' : ''} without stop-loss protection
          </div>
        </div>
      )}
    </div>
  );
}