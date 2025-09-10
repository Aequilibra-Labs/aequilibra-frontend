// Test APY calculations with real data examples
import { calculateDeltaNeutralAPY, debugRates } from './apyCalculations.js';

// Test with real funding rate values from the APIs
console.log('=== APY CALCULATION TESTS ===');

// Example 1: Small difference (realistic)
const hlRate1 = 0.0000125; // Hyperliquid: 0.00125%
const exRate1 = 0.000013; // Extended: 0.0013%
console.log('\nTest 1 - Small realistic difference:');
debugRates('TEST', hlRate1, exRate1);

// Example 2: Larger difference (still realistic)
const hlRate2 = 0.0001; // Hyperliquid: 0.01%
const exRate2 = 0.00005; // Extended: 0.005%
console.log('\nTest 2 - Larger difference:');
debugRates('TEST', hlRate2, exRate2);

// Example 3: Very small difference (not worth arbitrage)
const hlRate3 = 0.000001; // Hyperliquid: 0.0001%
const exRate3 = 0.000002; // Extended: 0.0002%
console.log('\nTest 3 - Very small difference:');
debugRates('TEST', hlRate3, exRate3);

console.log('\n=== EXPECTED RANGES ===');
console.log('Realistic 8-hour spreads: 0.0001% - 0.01%');
console.log('Realistic annual APY: 0.1% - 50%');
console.log('Extreme annual APY (rare): up to 200%');
console.log('============================');
