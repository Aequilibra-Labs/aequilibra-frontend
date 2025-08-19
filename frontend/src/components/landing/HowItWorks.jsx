import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HowItWorks() {
  const steps = [
    {
      step: '1',
      title: 'Connect Your Wallet',
      description: 'Safely connect your Web3 wallet to access the platform',
    },
    {
      step: '2',
      title: 'Browse Markets',
      description:
        'Explore funding rates across multiple DEXes and trading pairs',
    },
    {
      step: '3',
      title: 'Analyze Data',
      description:
        'View historical charts, compare rates, and assess risk metrics',
    },
    {
      step: '4',
      title: 'Track Opportunities',
      description:
        'Add pairs to your watchlist and monitor funding rate changes',
    },
  ];

  return (
    <section className="w-full px-4 space-y-4 py-6 md:py-8 lg:py-12">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          How It Works
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Get started with Aequilibra in just a few simple steps
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
        {steps.map((step, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mb-2">
                {step.step}
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
