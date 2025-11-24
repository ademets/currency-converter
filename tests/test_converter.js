const assert = require('assert');

// --- Code under test (updated logic) ---

function normalizeNumericInput(raw) {
    if (!raw) {
        return '';
    }

    // Fixed regex to allow scientific notation
    const cleaned = raw.replace(/,/g, '').replace(/[^\d.eE-]/g, '');
    if (!cleaned) {
        return '';
    }

    const hasTrailingDot = cleaned.endsWith('.');
    const [integerPart = '', ...rest] = cleaned.split('.');
    const fractionalPart = rest.join('');
    // Fixed regex
    const integerDigits = integerPart.replace(/[^0-9eE-]/g, '');
    let normalizedInteger = integerDigits.replace(/^0+(?=\d)/, '');

    if (normalizedInteger === '' && integerDigits !== '') {
        normalizedInteger = '0';
    }

    if (normalizedInteger === '' && fractionalPart.length > 0) {
        return `0.${fractionalPart}`;
    }

    if (fractionalPart.length > 0) {
        if (normalizedInteger === '') {
            normalizedInteger = '0';
        }
        return `${normalizedInteger}.${fractionalPart}`;
    }

    if (hasTrailingDot && normalizedInteger !== '') {
        return `${normalizedInteger}.`;
    }

    return normalizedInteger;
}

function formatAmount(value, decimals) {
    const fixed = (value || 0).toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length === 2 ? `${parts[0]}.${parts[1]}` : parts[0];
}

// --- Tests ---

console.log('Running crypto logic tests...');

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

// Test 5: Inputting multiple dots
const badInput = "1.2.3";
const normalizedBad = normalizeNumericInput(badInput);
console.log(`Input: ${badInput} -> Normalized: ${normalizedBad}`);
assert.strictEqual(normalizedBad, '1.23');

console.log('All tests passed.');
