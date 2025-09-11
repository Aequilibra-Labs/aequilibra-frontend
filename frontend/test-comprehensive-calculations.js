// Comprehensive test for all funding rate calculations
// This tests rate diff, APY calculations, and display formatting

import {
  calculateDeltaNeutralAPY,
  getFundingDifferentialBPS,
  getDeltaNeutralStrategy,
} from '../src/lib/apyCalculations.js';

console.log('=== COMPREHENSIVE CALCULATION VERIFICATION ===\n');

// Test data: both in decimal format as APIs now return
const testScenarios = [
  {
    name: 'Small Spread',
    hlRate: 0.0001, // 0.01%
    exRate: 0.0003, // 0.03%
    expectedBP: 2, // 2 basis points
  },
  {
    name: 'Medium Spread',
    hlRate: 0.0025, // 0.25%
    exRate: 0.0035, // 0.35%
    expectedBP: 10, // 10 basis points
  },
  {
    name: 'Large Spread',
    hlRate: 0.001, // 0.10%
    exRate: 0.006, // 0.60%
    expectedBP: 50, // 50 basis points
  },
  {
    name: 'Negative Spread',
    hlRate: 0.004, // 0.40%
    exRate: 0.002, // 0.20%
    expectedBP: -20, // -20 basis points
  },
];

testScenarios.forEach((scenario, index) => {
  console.log(`\n--- Test ${index + 1}: ${scenario.name} ---`);
  console.log(
    `Hyperliquid: ${scenario.hlRate} (${(scenario.hlRate * 100).toFixed(4)}%)`
  );
  console.log(
    `Extended: ${scenario.exRate} (${(scenario.exRate * 100).toFixed(4)}%)`
  );

  // Test basis points calculation
  const bpDiff = getFundingDifferentialBPS(scenario.hlRate, scenario.exRate);
  console.log(`\n📊 Basis Points Calculation:`);
  console.log(`  Calculated: ${bpDiff.toFixed(1)} bp`);
  console.log(`  Expected: ${scenario.expectedBP} bp`);
  console.log(
    `  ✅ Correct: ${
      Math.abs(bpDiff - scenario.expectedBP) < 0.1 ? 'YES' : 'NO'
    }`
  );

  // Test APY calculations for all time periods
  console.log(`\n💰 APY Calculations:`);

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

  console.log(`  8-Hour APY: ${apyHours.toFixed(4)}%`);
  console.log(`  Daily APY: ${apyDays.toFixed(3)}%`);
  console.log(`  Annual APY: ${apyYear.toFixed(1)}%`);

  // Verify APY calculations make sense
  const rateDiff = Math.abs(scenario.hlRate - scenario.exRate);
  const expectedHourly = rateDiff * 100;
  const expectedDaily = ((1 + rateDiff) ** 3 - 1) * 100;
  const expectedYearly = ((1 + rateDiff) ** 1095 - 1) * 100;

  console.log(`\n🔍 APY Verification:`);
  console.log(
    `  8H Expected: ${expectedHourly.toFixed(
      4
    )}% | Calculated: ${apyHours.toFixed(4)}% | ✅ ${
      Math.abs(expectedHourly - apyHours) < 0.0001 ? 'PASS' : 'FAIL'
    }`
  );
  console.log(
    `  Daily Expected: ${expectedDaily.toFixed(
      3
    )}% | Calculated: ${apyDays.toFixed(3)}% | ✅ ${
      Math.abs(expectedDaily - apyDays) < 0.001 ? 'PASS' : 'FAIL'
    }`
  );
  console.log(
    `  Yearly Expected: ${expectedYearly.toFixed(
      1
    )}% | Calculated: ${apyYear.toFixed(1)}% | ✅ ${
      Math.abs(expectedYearly - apyYear) < 1 ? 'PASS' : 'FAIL'
    }`
  );

  // Test strategy recommendation
  const strategy = getDeltaNeutralStrategy(scenario.hlRate, scenario.exRate);
  console.log(`\n🎯 Strategy:`);
  console.log(
    `  Short: ${strategy.short.exchange} (${strategy.short.rate.toFixed(4)}%)`
  );
  console.log(
    `  Long: ${strategy.long.exchange} (${strategy.long.rate.toFixed(4)}%)`
  );
  console.log(`  Spread: ${strategy.spread.toFixed(4)}%`);
});

console.log('\n=== DISPLAY FORMATTING VERIFICATION ===');

// Test display formatting for ComparisonFundingTable
const testRate = 0.0025; // 0.25% as decimal
console.log(`\nDecimal input: ${testRate}`);
console.log(`Display format: ${(testRate * 100).toFixed(4)}%`);
console.log(`Expected: 0.2500%`);
console.log(
  `✅ Correct: ${(testRate * 100).toFixed(4) === '0.2500' ? 'YES' : 'NO'}`
);

console.log('\n=== REALISTIC APY RANGES ===');

// Check if APY values are in realistic ranges
const typicalScenarios = [
  { name: 'Low Volatility', hlRate: 0.0001, exRate: 0.0002 },
  { name: 'Medium Volatility', hlRate: 0.001, exRate: 0.002 },
  { name: 'High Volatility', hlRate: 0.003, exRate: 0.005 },
];

typicalScenarios.forEach((scenario) => {
  const yearlyAPY = calculateDeltaNeutralAPY(
    scenario.hlRate,
    scenario.exRate,
    'year'
  );
  const isRealistic = yearlyAPY > 0 && yearlyAPY < 500; // Should be between 0% and 500% annually

  console.log(
    `${scenario.name}: ${yearlyAPY.toFixed(1)}% annually - ${
      isRealistic ? '✅ Realistic' : '❌ Unrealistic'
    }`
  );
});

console.log('\n=== VERIFICATION COMPLETE ===');
