'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export default function OpenOrdersTable({ 
  owner, 
  agentName, 
  userState, 
  onAfterChange,
  orders = [], 
  onCancelOrder,
  onRefresh
}) {
  const [cancellingOrders, setCancellingOrders] = useState(new Set());
  const [error, setError] = useState(null);

  // Get open orders from userState OR use passed orders prop
  const openOrders = orders.length > 0 ? orders : (
    userState?.openOrders || 
    userState?.user?.openOrders || 
    userState?.orders || 
    userState?.data?.openOrders ||
    userState?.clearinghouseState?.openOrders ||
    userState?.assetPositions?.openOrders ||
    []
  );

  // DEBUG: Log the userState to see what we're getting
  console.log('🔍 OpenOrdersTable DEBUG:', {
    userState,
    openOrders,
    hasOpenOrders: openOrders?.length > 0,
    userStateKeys: userState ? Object.keys(userState) : 'null',
    ordersFromProps: orders,
    fullUserState: JSON.stringify(userState, null, 2)
  });

  // Format number for display
  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0.00';
    return Number(num).toFixed(decimals);
  };

  // Handle cancel order - use legacy method or new prop method
  const handleCancelOrder = async (orderData) => {
    // New method using onCancelOrder prop
    if (onCancelOrder) {
      const orderId = orderData.order?.oid || orderData.oid;
      setCancellingOrders(prev => new Set(prev).add(orderId));
      
      try {
        await onCancelOrder({
          coin: orderData.order?.coin || orderData.coin,
          oid: orderId
        });
        
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Failed to cancel order:', error);
        setError('Failed to cancel order');
      } finally {
        setCancellingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
      return;
    }

    // Legacy method
    const order = orderData.order || orderData;
    const { coin, oid } = order;
    if (!coin || !oid) {
      setError('Invalid order data');
      return;
    }

    if (!owner) {
      setError('Owner not available');
      return;
    }

    setCancellingOrders(prev => new Set(prev).add(oid));
    setError(null);

    try {
      const payload = {
        owner,
        agent_name: agentName || 'aeq-agent',
        coin,
        oid,
      };

      const response = await fetch('/api/trading/hl/orders/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Cancel failed: ${response.status}`);
      }

      // Call the callback to refresh data
      if (onAfterChange) {
        await onAfterChange();
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(oid);
        return newSet;
      });
    }
  };

  if (!Array.isArray(openOrders) || openOrders.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No open orders.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        {openOrders.map((order) => {
          const { coin, isBuy, px, sz, cloid, oid } = order;
          const isBeingCancelled = cancellingOrders.has(oid);
          
          return (
            <div 
              key={oid || `${coin}-${cloid || Math.random()}`} 
              className="border rounded-md p-3 text-xs grid grid-cols-1 md:grid-cols-6 gap-3 items-center"
            >
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">Market</div>
                <div className="font-medium">{coin || '—'}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">Side</div>
                <div className={`font-medium ${isBuy ? 'text-green-700' : 'text-red-700'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">Price</div>
                <div className="font-mono">{px != null ? px : '—'}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">Size</div>
                <div className="font-mono">{sz != null ? sz : '—'}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">CLOID</div>
                <div className="font-mono text-[10px]">{cloid || '—'}</div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelOrder(order)}
                  disabled={isBeingCancelled}
                  className="text-xs"
                >
                  {isBeingCancelled ? 'Cancelling...' : 'Cancel'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}