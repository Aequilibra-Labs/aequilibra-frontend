'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { ThemeProvider } from 'next-themes';
import { base } from 'wagmi/chains';

export function Providers({ children }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'your_api_key_here'}
      chain={base}
      config={{
        appearance: {
          mode: 'auto', // 'light' | 'dark' | 'auto'
        },
        wallet: {
          display: 'modal', // 'modal' | 'drawer'
          preference: 'all', // 'all' | 'smartWalletOnly' | 'eoaOnly'
        },
      }}
      miniKit={{
        enabled: true, // Enable MiniKit for Base Mini Apps
      }}
    >
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </OnchainKitProvider>
  );
}
