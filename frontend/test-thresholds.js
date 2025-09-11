// Test realistic funding rate scenarios
console.log('=== REALISTIC FUNDING RATE THRESHOLDS ===\n');

const scenarios = [
  {
    name: 'BTC',
    hlRate: 0.0001,
    exRate: 0.0002,
    description: 'Minimal spread',
  },
  { name: 'ETH', hlRate: 0.0005, exRate: 0.0015, description: 'Low spread' },
  { name: 'DOGE', hlRate: 0.001, exRate: 0.0025, description: 'Medium spread' },
  { name: 'SHIB', hlRate: 0.002, exRate: 0.005, description: 'High spread' },
  {
    name: 'MEME',
    hlRate: -0.001,
    exRate: 0.004,
    description: 'Excellent spread',
  },
];

scenarios.forEach((scenario) => {
  const bpDiff = Math.abs((scenario.exRate - scenario.hlRate) * 10000);

  let category = 'Minimal';
  let worth = '❌ Not worth trading';
  let color = '🟢';

  if (bpDiff > 50) {
    category = 'Excellent';
    worth = '🔥 Definitely trade';
    color = '🔴';
  } else if (bpDiff > 25) {
    category = 'High';
    worth = '⭐ Worth trading';
    color = '🟠';
  } else if (bpDiff > 15) {
    category = 'Medium';
    worth = '📊 Consider trading';
    color = '🟡';
  } else if (bpDiff > 5) {
    category = 'Low';
    worth = '⚠️ Marginal';
    color = '🟡';
  }

  console.log(`${color} ${scenario.name}:`);
  console.log(`  Spread: ${bpDiff.toFixed(1)}bp`);
  console.log(`  Category: ${category}`);
  console.log(`  Decision: ${worth}`);
  console.log(`  APY (yearly): ${(bpDiff * 10.95).toFixed(1)}%\n`);
});

console.log('=== NEW THRESHOLD SUMMARY ===');
console.log('🔥 Excellent (>50bp): Definitely trade - high profit potential');
console.log('⭐ High (25-50bp): Worth trading - good profit vs costs');
console.log('📊 Medium (15-25bp): Consider trading - moderate profit');
console.log('⚠️ Low (5-15bp): Marginal - check gas costs carefully');
console.log('❌ Minimal (<5bp): Not worth trading - costs exceed profit');
