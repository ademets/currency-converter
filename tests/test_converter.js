const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load converter.js content
const converterPath = path.join(__dirname, '../currency-converter-extension/shared/converter.js');
const converterContent = fs.readFileSync(converterPath, 'utf8');

// Mock Browser Environment
global.window = global; // window.ConverterUtils will be global.ConverterUtils
global.document = {
    readyState: 'loading', // Prevent auto-init
    addEventListener: () => {},
    getElementById: () => null,
};
global.requestAnimationFrame = (cb) => cb();
global.CurrencyHistory = {};

// Evaluate code
eval(converterContent);

// Access exposed utils
if (!global.ConverterUtils) {
    console.error('❌ ConverterUtils not found. Ensure converter.js exposes it.');
    process.exit(1);
}

const { normalizeNumericInput, formatAmount, formatChartNumber } = global.ConverterUtils;

console.log('Running crypto logic tests (using exposed utils)...');

// Test 1: Scientific notation input
const sciInput = "1.5e-5";
const normalizedSci = normalizeNumericInput(sciInput);
console.log(`Input: ${sciInput} -> Normalized: ${normalizedSci}`);
if (normalizedSci === '1.5e-5') {
     console.log('✅ Scientific notation preserved.');
} else {
     console.log('❌ Scientific notation broken.');
     console.error(`Expected 1.5e-5, got ${normalizedSci}`);
     process.exit(1);
}

// Test 2: Formatting small crypto amounts
const btcAmount = 0.00001234;
const formattedBtc = formatAmount(btcAmount, 8);
console.log(`BTC Amount: ${btcAmount} -> Formatted: ${formattedBtc}`);
assert.strictEqual(formattedBtc, '0.00001234');

// Test 3: Formatting zero-padded small amounts
const btcAmount2 = 0.00000001;
const formattedBtc2 = formatAmount(btcAmount2, 8);
console.log(`BTC Amount: ${btcAmount2} -> Formatted: ${formattedBtc2}`);
assert.strictEqual(formattedBtc2, '0.00000001');

// Test 4: USD -> BTC simulation
const usdAmount = 1;
const rateUsdBtc = 0.00001129;
const btcVal = usdAmount * rateUsdBtc;
const formattedUsdBtc = formatAmount(btcVal, 8);
console.log(`1 USD -> BTC (${rateUsdBtc}) = ${btcVal} -> ${formattedUsdBtc}`);
assert.strictEqual(formattedUsdBtc, '0.00001129');

// Test 5: Chart number formatting for small values
const formattedChart = formatChartNumber(rateUsdBtc);
console.log(`Chart format 0.00001129 -> ${formattedChart}`);
assert.strictEqual(formattedChart, '0.00001129');

const rateTiny = 5.4e-7;
const formattedTiny = formatChartNumber(rateTiny);
console.log(`Chart format 5.4e-7 -> ${formattedTiny}`);
assert.strictEqual(formattedTiny, '0.00000054');

console.log('All tests passed.');
