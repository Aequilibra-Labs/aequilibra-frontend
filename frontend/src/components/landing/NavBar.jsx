import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function NavBar() {
  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-6 md:px-8">
        <div className="flex items-center">
          <a className="flex items-center space-x-2" href="/">
            <span className="font-bold text-xl">Aequilibra</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-base ml-8">
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/docs"
            >
              Docs
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/legal"
            >
              Legal
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Button asChild size="lg">
            <a href="/app">Launch App</a>
          </Button>
          {/*   Uncomment the following line to add a "Connect Wallet" button if Elio wants it to be displayed here
          <Button asChild variant="outline" className="ml-4">
            <a href="/app">Connect Wallet</a>
          </Button>
          */}
        </div>
      </div>
    </nav>
  );
}
