'use client';

import { 
  Swap,
  SwapAmountInput,
  SwapToggleButton,
  SwapButton,
  SwapMessage,
  SwapToast,
} from '@coinbase/onchainkit/swap';
import { useCallback } from 'react';

export function OnchainSwap({ 
  onSuccess,
  onError,
  ...props 
}) {
  const handleOnStatus = useCallback((status) => {
    console.log('Swap status:', status);
    
    if (status.statusName === 'success' && onSuccess) {
      onSuccess(status);
    } else if (status.statusName === 'error' && onError) {
      onError(status);
    }
  }, [onSuccess, onError]);

  return (
    <div className="w-full max-w-md mx-auto">
      <Swap onStatus={handleOnStatus} {...props}>
        <SwapAmountInput
          label="Sell"
          swappableTokens={undefined} // Will use default token list
          token={undefined}
          type="from"
        />
        <SwapToggleButton />
        <SwapAmountInput
          label="Buy"
          swappableTokens={undefined} // Will use default token list
          token={undefined}
          type="to"
        />
        <SwapButton className="min-h-[44px] w-full" />
        <SwapMessage />
        <SwapToast />
      </Swap>
    </div>
  );
}