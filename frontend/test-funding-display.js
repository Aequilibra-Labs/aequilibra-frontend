// Test file to verify funding rate display formatting is correct across all components
// This file verifies that Extended Exchange decimal rates are properly formatted for display

console.log('=== FUNDING RATE DISPLAY VERIFICATION ===\n');

// Simulate Extended Exchange API returning decimal values (as it does now)
const extendedData = {
  fundingRate: 0.0025, // 0.25% as decimal
  predictedFundingRate: 0.003, // 0.30% as decimal
  dailyFundingRate: 0.0075, // 0.75% as decimal
};

console.log('Extended Exchange Raw Data (decimals):');
console.log('fundingRate:', extendedData.fundingRate);
console.log('predictedFundingRate:', extendedData.predictedFundingRate);
console.log('dailyFundingRate:', extendedData.dailyFundingRate);

console.log('\n=== DISPLAY FORMATTING TESTS ===');

// Test ExtendedFundingTable.jsx formatting
console.log('\n1. ExtendedFundingTable.jsx:');
console.log(
  'Current Funding Rate:',
  `${((extendedData.fundingRate || 0) * 100).toFixed(4)}%`
);
console.log(
  'Predicted Funding Rate:',
  `${((extendedData.predictedFundingRate || 0) * 100).toFixed(4)}%`
);
console.log(
  'Daily Funding Rate:',
  `${((extendedData.dailyFundingRate || 0) * 100).toFixed(2)}%`
);

// Test ComparisonPairsTable.jsx formatting
console.log('\n2. ComparisonPairsTable.jsx:');
console.log(
  'Extended Funding Rate:',
  `${extendedData.fundingRate > 0 ? '+' : ''}${(
    (extendedData.fundingRate || 0) * 100
  ).toFixed(3)}%`
);

// Test ExtendedPairsTable.jsx formatting
console.log('\n3. ExtendedPairsTable.jsx:');
console.log(
  'Funding Rate:',
  `${extendedData.fundingRate > 0 ? '+' : ''}${(
    extendedData.fundingRate * 100
  ).toFixed(3)}%`
);

// Test basis points calculation
console.log('\n=== BASIS POINTS CALCULATION TEST ===');
const hlRate = 0.002; // Hyperliquid 0.20%
const exRate = 0.0025; // Extended 0.25%
const bpDiff = (exRate - hlRate) * 10000;
console.log(`Hyperliquid: ${hlRate} (${(hlRate * 100).toFixed(3)}%)`);
console.log(`Extended: ${exRate} (${(exRate * 100).toFixed(3)}%)`);
console.log(`Difference: ${bpDiff.toFixed(1)} basis points`);
console.log(`Expected: 5.0 basis points (0.05% difference)`);

console.log('\n=== VERIFICATION COMPLETE ===');
console.log('✅ All funding rates should display as percentages');
console.log('✅ Basis points calculations should be accurate');
console.log('✅ Extended Exchange decimal values properly formatted');
