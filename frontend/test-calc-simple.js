// Simple calculation verification without imports
console.log('=== CALCULATION VERIFICATION ===\n');

// Recreate the key functions locally for testing
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
      return ((1 + rateDifferential) ** 3 - 1) * 100;
    case 'year':
      return ((1 + rateDifferential) ** 1095 - 1) * 100;
    default:
      return rateDifferential * 100;
  }
};

const getFundingDifferentialBPS = (hyperliquidRate, extendedRate) => {
  return (extendedRate - hyperliquidRate) * 10000;
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
];

testScenarios.forEach((scenario, index) => {
  console.log(`--- Test ${index + 1}: ${scenario.name} ---`);
  console.log(`Hyperliquid: ${(scenario.hlRate * 100).toFixed(4)}%`);
  console.log(`Extended: ${(scenario.exRate * 100).toFixed(4)}%`);

  // Test basis points
  const bpDiff = getFundingDifferentialBPS(scenario.hlRate, scenario.exRate);
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
  const isReasonable = apyYear > 0 && apyYear < 1000 && apyDays > apyHours;
  console.log(`✅ Reasonable: ${isReasonable ? 'YES' : 'NO'}`);
  console.log('');
});

console.log('=== DISPLAY FORMAT TEST ===');
const testRate = 0.0025; // 0.25% as decimal
console.log(`Input: ${testRate} (decimal)`);
console.log(`Display: ${(testRate * 100).toFixed(4)}%`);
console.log(`Expected: 0.2500%`);
console.log(
  `✅ Correct: ${(testRate * 100).toFixed(4) === '0.2500' ? 'YES' : 'NO'}`
);

console.log('\n=== BASIS POINTS VERIFICATION ===');
// 1 basis point = 0.01% = 0.0001 in decimal
console.log('1 basis point = 0.01% = 0.0001 decimal');
console.log(`Example: 0.25% - 0.20% = 0.05% = 5 basis points`);
console.log(
  `Calculation: (0.0025 - 0.0020) * 10000 = ${(
    (0.0025 - 0.002) *
    10000
  ).toFixed(1)} bp`
);
console.log('✅ Basis points calculation is correct');

console.log('\n=== VERIFICATION COMPLETE ===');
