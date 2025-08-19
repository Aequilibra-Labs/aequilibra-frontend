import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Features() {
  const features = [
    {
      title: "Aggregated Data",
      description: "Compare funding rates across multiple perpetual DEXes in real-time",
      icon: "📊"
    },
    {
      title: "Historical Charts",
      description: "Track funding rate trends and APR history over time",
      icon: "📈"
    },
    {
      title: "Multi-Chain Support", 
      description: "Access funding data from Arbitrum, Optimism, Base, and more",
      icon: "🔗"
    },
    {
      title: "Risk Management",
      description: "Understand volatility and open interest before making decisions",
      icon: "🛡️"
    },
    {
      title: "Portfolio Tracking",
      description: "Monitor your positions and watch your favorite pairs",
      icon: "📱"
    },
    {
      title: "Non-Custodial",
      description: "Connect your wallet safely - we never hold your funds",
      icon: "🔐"
    }
  ]

  return (
    <section className="container space-y-6 py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Key Features
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Everything you need to find the best perpetual funding opportunities
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader>
              <div className="text-2xl mb-2">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
