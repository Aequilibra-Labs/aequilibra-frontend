'use client';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Target, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function AuditLog({ 
  triggers = [], 
  maxEntries = 50,
  showFilters = true 
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'sl', 'tp', 'ladder'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

  // Process and filter triggers
  const processedTriggers = useMemo(() => {
    let filtered = [...triggers];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(trigger => {
        const orderTypes = trigger.orders?.map(order => order.type) || [];
        switch (filter) {
          case 'sl':
            return orderTypes.includes('stop_loss');
          case 'tp':
            return orderTypes.includes('take_profit');
          case 'ladder':
            return orderTypes.includes('ladder_tp');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return filtered.slice(0, maxEntries);
  }, [triggers, filter, sortBy, maxEntries]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalTriggers = triggers.length;
    const slTriggers = triggers.filter(t => 
      t.orders?.some(o => o.type === 'stop_loss')
    ).length;
    const tpTriggers = triggers.filter(t => 
      t.orders?.some(o => o.type === 'take_profit')
    ).length;
    const ladderTriggers = triggers.filter(t => 
      t.orders?.some(o => o.type === 'ladder_tp')
    ).length;

    // Calculate total PnL from triggers (simplified)
    const totalPnl = triggers.reduce((sum, trigger) => {
      // This would need real PnL calculation based on order fills
      return sum + (trigger.estimatedPnl || 0);
    }, 0);

    return {
      total: totalTriggers,
      stopLoss: slTriggers,
      takeProfit: tpTriggers,
      ladder: ladderTriggers,
      totalPnl
    };
  }, [triggers]);

  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0.00';
    return Number(num).toFixed(decimals);
  };

  const getOrderIcon = (orderType) => {
    switch (orderType) {
      case 'stop_loss':
        return <Shield className="w-4 h-4" />;
      case 'take_profit':
        return <Target className="w-4 h-4" />;
      case 'ladder_tp':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getOrderColor = (orderType) => {
    switch (orderType) {
      case 'stop_loss':
        return 'bg-red-100 text-red-800';
      case 'take_profit':
        return 'bg-green-100 text-green-800';
      case 'ladder_tp':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderLabel = (orderType) => {
    switch (orderType) {
      case 'stop_loss':
        return 'Stop Loss';
      case 'take_profit':
        return 'Take Profit';
      case 'ladder_tp':
        return 'TP Ladder';
      default:
        return 'Order';
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bracket Audit Log</h3>
        <Badge variant="outline">
          {stats.total} total triggers
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-md">
        <div className="text-center">
          <div className="text-sm font-semibold text-red-600">{stats.stopLoss}</div>
          <div className="text-xs text-muted-foreground">Stop Losses</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-green-600">{stats.takeProfit}</div>
          <div className="text-xs text-muted-foreground">Take Profits</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-blue-600">{stats.ladder}</div>
          <div className="text-xs text-muted-foreground">Ladders</div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-semibold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${formatNumber(stats.totalPnl)}
          </div>
          <div className="text-xs text-muted-foreground">Est. PnL</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'sl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('sl')}
            >
              Stop Loss
            </Button>
            <Button
              variant={filter === 'tp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('tp')}
            >
              Take Profit
            </Button>
            <Button
              variant={filter === 'ladder' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('ladder')}
            >
              Ladders
            </Button>
          </div>
          
          <div className="border-l border-border pl-2 ml-2">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('newest')}
            >
              Newest
            </Button>
            <Button
              variant={sortBy === 'oldest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('oldest')}
              className="ml-1"
            >
              Oldest
            </Button>
          </div>
        </div>
      )}

      {/* Trigger History */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {processedTriggers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No triggers found
            {filter !== 'all' && (
              <div className="text-xs mt-1">
                Try changing the filter or wait for bracket activity
              </div>
            )}
          </div>
        ) : (
          processedTriggers.map((trigger) => (
            <div
              key={trigger.id}
              className="p-3 border border-border rounded-md bg-background hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{trigger.coin}</h4>
                  <div className="flex gap-1">
                    {trigger.orders?.map((order, index) => (
                      <Badge
                        key={index}
                        className={`text-xs flex items-center gap-1 ${getOrderColor(order.type)}`}
                      >
                        {getOrderIcon(order.type)}
                        {getOrderLabel(order.type)}
                        {order.ladder_index !== undefined && (
                          <span>#{order.ladder_index + 1}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {trigger.timestamp.toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {trigger.currentPrice && (
                  <div>
                    <span className="text-muted-foreground">Trigger Price:</span>
                    <span className="ml-1 font-medium">${formatNumber(trigger.currentPrice)}</span>
                  </div>
                )}
                {trigger.estimatedPnl && (
                  <div>
                    <span className="text-muted-foreground">Est. PnL:</span>
                    <span className={`ml-1 font-medium ${trigger.estimatedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${formatNumber(trigger.estimatedPnl)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Orders:</span>
                  <span className="ml-1 font-medium">{trigger.orders?.length || 0}</span>
                </div>
              </div>

              {/* Order Details */}
              {trigger.orders && trigger.orders.length > 0 && (
                <div className="mt-2 space-y-1">
                  {trigger.orders.map((order, index) => (
                    <div key={index} className="text-xs p-2 bg-muted rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {order.success ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className="font-medium">
                            {getOrderLabel(order.type)}
                            {order.ladder_index !== undefined && ` #${order.ladder_index + 1}`}
                          </span>
                        </div>
                        <span className={order.success ? 'text-green-600' : 'text-red-600'}>
                          {order.success ? 'Executed' : 'Failed'}
                        </span>
                      </div>
                      {order.size && (
                        <div className="text-muted-foreground mt-1">
                          Size: {formatNumber(order.size, 6)} 
                          {order.price && ` @ $${formatNumber(order.price)}`}
                        </div>
                      )}
                      {order.error && (
                        <div className="text-red-600 mt-1">
                          Error: {order.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {processedTriggers.length >= maxEntries && (
        <div className="text-xs text-muted-foreground text-center">
          Showing last {maxEntries} triggers
        </div>
      )}
    </div>
  );
}