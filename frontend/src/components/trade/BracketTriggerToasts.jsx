'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Shield, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BracketTriggerToasts({ triggers = [], onDismiss }) {
  const [visibleTriggers, setVisibleTriggers] = useState([]);

  useEffect(() => {
    // Add new triggers to visible list
    if (triggers.length > 0) {
      const newTriggers = triggers.filter(trigger => 
        !visibleTriggers.find(visible => visible.id === trigger.id)
      );
      
      if (newTriggers.length > 0) {
        setVisibleTriggers(prev => [...newTriggers, ...prev].slice(0, 5));
        
        // Auto dismiss after 10 seconds
        newTriggers.forEach(trigger => {
          setTimeout(() => {
            dismissTrigger(trigger.id);
          }, 10000);
        });
      }
    }
  }, [triggers]);

  const dismissTrigger = (id) => {
    setVisibleTriggers(prev => prev.filter(trigger => trigger.id !== id));
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const getOrderTypeIcon = (orderType) => {
    switch (orderType) {
      case 'stop_loss':
        return <Shield className="w-4 h-4" />;
      case 'take_profit':
        return <Target className="w-4 h-4" />;
      case 'ladder_tp':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getOrderTypeColor = (orderType) => {
    switch (orderType) {
      case 'stop_loss':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'take_profit':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'ladder_tp':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0.00';
    return Number(num).toFixed(decimals);
  };

  if (visibleTriggers.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleTriggers.map((trigger) => (
        <div
          key={trigger.id}
          className={`p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300 ${getOrderTypeColor(trigger.orders[0]?.type || 'default')}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getOrderTypeIcon(trigger.orders[0]?.type)}
              <div className="font-semibold">
                {trigger.coin} Bracket Triggered
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissTrigger(trigger.id)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-2">
            {trigger.orders.map((order, index) => {
              const orderType = order.type;
              let displayText = '';

              switch (orderType) {
                case 'stop_loss':
                  displayText = 'Stop Loss triggered';
                  break;
                case 'take_profit':
                  displayText = 'Take Profit triggered';
                  break;
                case 'ladder_tp':
                  displayText = `TP Ladder ${order.ladder_index + 1} triggered`;
                  break;
                default:
                  displayText = 'Order triggered';
              }

              return (
                <div key={index} className="text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3" />
                    <span className="font-medium">{displayText}</span>
                  </div>
                  {trigger.currentPrice && (
                    <div className="text-xs opacity-80">
                      Price: ${formatNumber(trigger.currentPrice)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs opacity-70 mt-2">
            {trigger.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}