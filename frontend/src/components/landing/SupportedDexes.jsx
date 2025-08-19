'use client';

import { Badge } from '@/components/ui/badge';

export function SupportedDexes() {
  const dexes = [
    { name: 'GMX', chain: 'Arbitrum' },
    { name: 'Gains Network', chain: 'Polygon' },
    { name: 'dYdX', chain: 'Ethereum' },
    { name: 'Perpetual Protocol', chain: 'Optimism' },
    { name: 'Kwenta', chain: 'Optimism' },
    { name: 'Rage Trade', chain: 'Arbitrum' },
    { name: 'MUX Protocol', chain: 'Arbitrum' },
    { name: 'Level Finance', chain: 'BSC' },
  ];

  const chains = [
    { name: 'Arbitrum', color: 'bg-blue-500', icon: '🔵' },
    { name: 'Optimism', color: 'bg-red-500', icon: '🔴' },
    { name: 'Polygon', color: 'bg-purple-500', icon: '🟣' },
    { name: 'Ethereum', color: 'bg-gray-500', icon: '⚫' },
    { name: 'BSC', color: 'bg-yellow-500', icon: '🟡' },
    { name: 'Base', color: 'bg-blue-600', icon: '🔷' },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes infiniteScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }

        .animate-infinite-scroll {
          animation: infiniteScroll 20s linear infinite;
          width: max-content;
        }

        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <section className="w-full px-4 space-y-4 py-6 md:py-8 lg:py-12">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Supported DEXes & Chains
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Access funding data from the top perpetual DEXes across multiple
            chains
          </p>
        </div>

        <div className="mx-auto max-w-[64rem] space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center">
              Supported Chains
            </h3>
            {/* Infinite Carousel */}
            <div className="relative overflow-hidden">
              <div className="flex animate-infinite-scroll">
                {/* First set of chains */}
                {chains.map((chain, index) => (
                  <div
                    key={`first-${index}`}
                    className="flex-shrink-0 mx-4 flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors w-[120px]"
                  >
                    <div className="text-3xl mb-2">{chain.icon}</div>
                    <span className="text-sm font-medium">{chain.name}</span>
                  </div>
                ))}
                {/* Second set for seamless loop */}
                {chains.map((chain, index) => (
                  <div
                    key={`second-${index}`}
                    className="flex-shrink-0 mx-4 flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors w-[120px]"
                  >
                    <div className="text-3xl mb-2">{chain.icon}</div>
                    <span className="text-sm font-medium">{chain.name}</span>
                  </div>
                ))}
                {/* Third set for extra smooth transition */}
                {chains.map((chain, index) => (
                  <div
                    key={`third-${index}`}
                    className="flex-shrink-0 mx-4 flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors w-[120px]"
                  >
                    <div className="text-3xl mb-2">{chain.icon}</div>
                    <span className="text-sm font-medium">{chain.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">
              Integrated DEXes
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {dexes.map((dex, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1">
                  {dex.name}{' '}
                  <span className="text-muted-foreground ml-1">
                    • {dex.chain}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
