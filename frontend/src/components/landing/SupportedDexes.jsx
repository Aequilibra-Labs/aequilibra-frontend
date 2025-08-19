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
    { name: 'Arbitrum', color: 'bg-blue-500' },
    { name: 'Optimism', color: 'bg-red-500' },
    { name: 'Polygon', color: 'bg-purple-500' },
    { name: 'Ethereum', color: 'bg-gray-500' },
    { name: 'BSC', color: 'bg-yellow-500' },
    { name: 'Base', color: 'bg-blue-600' },
  ];

  return (
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
          <h3 className="text-xl font-semibold mb-4 text-center">
            Supported Chains
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {chains.map((chain, index) => (
              <Badge key={index} variant="outline" className="text-sm py-1">
                <div className={`w-2 h-2 rounded-full ${chain.color} mr-2`} />
                {chain.name}
              </Badge>
            ))}
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
  );
}
