// Dashboard overview page
export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

        {/* bullshit for the moment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Total Funding APR</h3>
            <p className="text-2xl font-bold text-primary">+12.34%</p>
            <p className="text-sm text-muted-foreground">24h change: +0.45%</p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Active Positions</h3>
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">Across 4 chains</p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Top Opportunity</h3>
            <p className="text-lg font-semibold">ETH-USD</p>
            <p className="text-sm text-muted-foreground">GMX: +15.67% APR</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Market Activity</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view personalized data and start tracking
            funding opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
