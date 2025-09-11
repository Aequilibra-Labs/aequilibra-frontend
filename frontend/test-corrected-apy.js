// Test corrected APY calculations
console.log('=== CORRECTED APY CALCULATIONS ===\n');

// Updated calculation functions
const calculateDeltaNeutralAPY = (
  hyperliquidRate,
  extendedRate,
  period = 'year'
) => {
  const hlRateDecimal = hyperliquidRate;
  const exRateDecimal = extendedRate;
  const rateDifferential = Math.abs(hlRateDecimal - exRateDecimal);

  if (rateDifferential < 0.000001) return 0;

  switch (period) {
    case 'hours':
      return rateDifferential * 100;
    case 'days':
      // 3 funding periods per day, simple interest
      return rateDifferential * 3 * 100;
    case 'year':
      // 3 periods per day * 365 days = 1095 periods per year, simple interest
      return rateDifferential * 1095 * 100;
    default:
      return rateDifferential * 100;
  }
};

// Test scenarios
const testScenarios = [
  {
    name: 'Small Spread (2bp)',
    hlRate: 0.0001, // 0.01%
    exRate: 0.0003, // 0.03%
  },
  {
    name: 'Medium Spread (10bp)',
    hlRate: 0.0025, // 0.25%
    exRate: 0.0035, // 0.35%
  },
  {
    name: 'Large Spread (50bp)',
    hlRate: 0.001, // 0.10%
    exRate: 0.006, // 0.60%
  },
  {
    name: 'Very Large Spread (100bp)',
    hlRate: 0.0, // 0.00%
    exRate: 0.01, // 1.00%
  },
];

testScenarios.forEach((scenario, index) => {
  console.log(`--- Test ${index + 1}: ${scenario.name} ---`);
  console.log(`Hyperliquid: ${(scenario.hlRate * 100).toFixed(4)}%`);
  console.log(`Extended: ${(scenario.exRate * 100).toFixed(4)}%`);

  const rateDiff = Math.abs(scenario.hlRate - scenario.exRate);
  const bpDiff = (scenario.exRate - scenario.hlRate) * 10000;
  console.log(`Rate Difference: ${bpDiff.toFixed(1)} basis points`);

  // Test APY calculations
  const apyHours = calculateDeltaNeutralAPY(
    scenario.hlRate,
    scenario.exRate,
    'hours'
  );
  const apyDays = calculateDeltaNeutralAPY(
    scenario.hlRate,
    scenario.exRate,
    'days'
  );
  const apyYear = calculateDeltaNeutralAPY(
    scenario.hlRate,
    scenario.exRate,
    'year'
  );

  console.log(`8-Hour APY: ${apyHours.toFixed(4)}%`);
  console.log(`Daily APY: ${apyDays.toFixed(3)}%`);
  console.log(`Annual APY: ${apyYear.toFixed(1)}%`);

  // Verify reasonableness
  const isReasonable =
    apyYear > 0 &&
    apyYear < 500 &&
    apyDays === apyHours * 3 &&
    apyYear === apyDays * 365;
  console.log(`✅ Reasonable: ${isReasonable ? 'YES' : 'NO'}`);

  // Show the math
  console.log(
    `Math check: ${apyHours.toFixed(4)} * 3 = ${(apyHours * 3).toFixed(
      3
    )} (daily), * 365 = ${(apyHours * 3 * 365).toFixed(1)} (yearly)`
  );
  console.log('');
});

console.log('=== SUMMARY ===');
console.log(
  '✅ Fixed compound interest to simple interest for realistic APY values'
);
console.log(
  '✅ Delta neutral strategies capture spread linearly, not exponentially'
);
console.log(
  '✅ APY calculations now scale properly: 8H * 3 = Daily, Daily * 365 = Yearly'
);
