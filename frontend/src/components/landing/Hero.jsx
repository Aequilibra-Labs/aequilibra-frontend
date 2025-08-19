import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="w-full px-4 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-22">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
        <Badge variant="outline" className="text-sm">
          Perpetual DEX Funding Aggregator
        </Badge>
        <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
          Find the best funding across perps.{' '}
          <span className="text-primary">One dashboard.</span>
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Aggregate across DEXes • Compare pairs • Track funding history • Build
          neutral strategies
        </p>
        <div className="space-x-4">
          <Button size="lg" asChild>
            <a href="/app">Launch App</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/docs">Learn More</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground max-w-[42rem]">
          Crypto derivatives are risky. Nothing here is financial advice. DYOR.
        </p>
      </div>
    </section>
  );
}
