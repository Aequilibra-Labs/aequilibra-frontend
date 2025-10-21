'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useBracketPolling({ 
  owner, 
  agentName = 'aeq-agent', 
  coins = [], 
  enabled = true,
  interval = 2000 // 2 seconds
}) {
  const [bracketStates, setBracketStates] = useState({});
  const [triggers, setTriggers] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const lastTriggerTimeRef = useRef(Date.now());

  // Function to poll a specific coin's bracket
  const pollBracket = useCallback(async (coin) => {
    if (!owner || !coin) return null;

    try {
      const params = new URLSearchParams({
        owner,
        agent_name: agentName,
        coin
      });

      const response = await fetch(`/api/trading/hl/bracket/poll?${params}`, {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }

      const result = await response.json();
      return { coin, result };
    } catch (err) {
      console.error(`Failed to poll bracket for ${coin}:`, err);
      return { coin, error: err.message };
    }
  }, [owner, agentName]);

  // Function to get bracket state for a coin
  const getBracketState = useCallback(async (coin) => {
    if (!owner || !coin) return null;

    try {
      const params = new URLSearchParams({
        owner,
        agent_name: agentName,
        coin
      });

      const response = await fetch(`/api/trading/hl/bracket/state?${params}`, {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`State fetch failed: ${response.status}`);
      }

      const result = await response.json();
      return { coin, result };
    } catch (err) {
      console.error(`Failed to get bracket state for ${coin}:`, err);
      return { coin, error: err.message };
    }
  }, [owner, agentName]);

  // Function to refresh all bracket states
  const refreshBracketStates = useCallback(async () => {
    if (!enabled || coins.length === 0) return;

    const statePromises = coins.map(coin => getBracketState(coin));
    const results = await Promise.all(statePromises);

    const newStates = {};
    results.forEach(({ coin, result, error }) => {
      if (!error && result) {
        newStates[coin] = result;
      }
    });

    setBracketStates(newStates);
  }, [enabled, coins, getBracketState]);

  // Main polling function
  const executePoll = useCallback(async () => {
    if (!enabled || coins.length === 0 || !owner) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setError(null);

    try {
      // Poll all coins in parallel
      const pollPromises = coins.map(coin => pollBracket(coin));
      const results = await Promise.all(pollPromises);

      const newTriggers = [];
      const newStates = {};

      results.forEach(({ coin, result, error }) => {
        if (error) {
          console.error(`Poll error for ${coin}:`, error);
          return;
        }

        if (result) {
          // Check for triggers
          if (result.triggered && result.orders && result.orders.length > 0) {
            const triggerEvent = {
              id: `${coin}-${Date.now()}`,
              coin,
              timestamp: new Date(),
              orders: result.orders,
              currentPrice: result.current_price,
              bracketState: result.bracket_state
            };
            newTriggers.push(triggerEvent);
          }

          // Update bracket state
          if (result.bracket_state) {
            newStates[coin] = {
              exists: true,
              state: result.bracket_state
            };
          } else {
            // Bracket might have been removed
            newStates[coin] = {
              exists: false,
              state: null
            };
          }
        }
      });

      // Update states
      setBracketStates(prev => ({ ...prev, ...newStates }));

      // Add new triggers to the list (keep last 10)
      if (newTriggers.length > 0) {
        setTriggers(prev => [...newTriggers, ...prev].slice(0, 10));
        lastTriggerTimeRef.current = Date.now();
      }

    } catch (err) {
      console.error('Polling error:', err);
      setError(err.message);
    } finally {
      setIsPolling(false);
    }
  }, [enabled, coins, owner, pollBracket]);

  // Start/stop polling
  useEffect(() => {
    if (!enabled || coins.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll
    executePoll();

    // Set up interval
    intervalRef.current = setInterval(executePoll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, coins, interval, executePoll]);

  // Cancel bracket function
  const cancelBracket = useCallback(async (coin) => {
    if (!owner || !coin) return;

    try {
      const response = await fetch('/api/trading/hl/bracket/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          agent_name: agentName,
          coin
        }),
      });

      if (!response.ok) {
        throw new Error(`Cancel failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Remove from local state
      setBracketStates(prev => {
        const newStates = { ...prev };
        delete newStates[coin];
        return newStates;
      });

      return result;
    } catch (err) {
      console.error(`Failed to cancel bracket for ${coin}:`, err);
      throw err;
    }
  }, [owner, agentName]);

  // Partial close function
  const partialClose = useCallback(async ({ coin, percentage, slippage = 0.05 }) => {
    if (!owner || !coin) return;

    try {
      const response = await fetch('/api/trading/hl/position/partial-close', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          agent_name: agentName,
          coin,
          percentage,
          slippage
        }),
      });

      if (!response.ok) {
        throw new Error(`Partial close failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error(`Failed to partial close ${coin}:`, err);
      throw err;
    }
  }, [owner, agentName]);

  return {
    bracketStates,
    triggers,
    isPolling,
    error,
    refreshBracketStates,
    cancelBracket,
    partialClose,
    executePoll, // Manual trigger
    lastTriggerTime: lastTriggerTimeRef.current
  };
}