'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { supportedChains } from '@/lib/wagmi';
import { useEffect, useState } from 'react';

export function ChainSwitcher() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !chain) {
    return null;
  }

  const currentChain = supportedChains[chain.id];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {currentChain && (
            <>
              {/*    <span className="text-sm">{currentChain.icon}</span> */}
              <span className="hidden sm:inline">{currentChain.shortName}</span>
            </>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(supportedChains).map(([chainId, chainInfo]) => (
          <DropdownMenuItem
            key={chainId}
            onClick={() => switchChain({ chainId: parseInt(chainId) })}
            disabled={isPending || chain.id === parseInt(chainId)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {/* <span>{chainInfo.icon}</span> */}
                <span>{chainInfo.name}</span>
              </div>
              {chain.id === parseInt(chainId) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
