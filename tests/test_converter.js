const assert = require('assert');

// --- Code under test ---

function normalizeNumericInput(raw) {
    // ... same as before ...
    if (!raw) {
        return '';
    }

    const cleaned = raw.replace(/,/g, '').replace(/[^\d.eE-]/g, '');
    if (!cleaned) {
        return '';
    }

    const hasTrailingDot = cleaned.endsWith('.');
    const [integerPart = '', ...rest] = cleaned.split('.');
    const fractionalPart = rest.join('');
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

function formatChartNumber(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (abs >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    if (abs >= 1) {
        return value.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        });
    }
    // Fix: Use significant digits for small numbers
    return value.toLocaleString(undefined, {
        maximumSignificantDigits: 4,
    });
}

// --- Tests ---

console.log('Running crypto logic tests...');

// ... previous tests ...
const sciInput = "1.5e-5";
const normalizedSci = normalizeNumericInput(sciInput);
assert.strictEqual(normalizedSci, '1.5e-5');

const btcAmount = 0.00001234;
const formattedBtc = formatAmount(btcAmount, 8);
assert.strictEqual(formattedBtc, '0.00001234');

// Test 8: Chart number formatting for small values (USD -> BTC)
const rateUsdBtc = 0.00001129;
const formattedChart = formatChartNumber(rateUsdBtc);
console.log(`Chart format 0.00001129 -> ${formattedChart}`);
// Expectation: 0.00001129 (4 significant digits)
// Node might return "0.00001129".
assert.strictEqual(formattedChart, '0.00001129');

const rateTiny = 5.4e-7;
const formattedTiny = formatChartNumber(rateTiny);
console.log(`Chart format 5.4e-7 -> ${formattedTiny}`);
// Expectation: 0.00000054
assert.strictEqual(formattedTiny, '0.00000054');

console.log('All tests passed.');
