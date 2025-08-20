import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { ChainSwitcher } from '@/components/wallet/ChainSwitcher';

export function AppNavBar() {
  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6 md:px-8">
        <div className="flex items-center">
          <a className="flex items-center space-x-2" href="/">
            <span className="font-bold text-xl">Aequilibra</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-base ml-8">
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/app"
            >
              Dashboard
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/app/markets"
            >
              Markets
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/app/portfolio"
            >
              Portfolio
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/app/profile"
            >
              Profile
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <ChainSwitcher />
          <ThemeToggle />
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
