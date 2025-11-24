const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Load the history.js file content
const historyPath = path.join(__dirname, '../currency-converter-extension/shared/history.js');
const historyContent = fs.readFileSync(historyPath, 'utf8');

// 2. Setup mock environment
let fetchCalls = [];
global.fetch = async (url) => {
    fetchCalls.push(url);
    console.log(`[MockFetch] ${url}`);

    // Parse URL to decide what to return
    if (url.includes('histohour') || url.includes('histoday')) {
        return {
            ok: true,
            json: async () => ({
                Response: 'Success',
                Data: {
                    Data: [
                        { time: 1600000000, close: 100, high: 105, low: 95, open: 98, volumefrom: 10, volumeto: 1000 },
                        { time: 1600003600, close: 102, high: 106, low: 99, open: 100, volumefrom: 12, volumeto: 1224 },
                    ]
                }
            })
        };
    }
    return { ok: false, status: 404 };
};

// 3. Evaluate the code
// This should define global.CurrencyHistory
eval(historyContent);

if (!global.CurrencyHistory) {
    console.error('CurrencyHistory not found on global object.');
    process.exit(1);
}

// 4. Run tests
async function runTests() {
    console.log('Running tests...');

    // Test 1: fetchHistoricalRates basics
    try {
        const data = await global.CurrencyHistory.fetchHistoricalRates({
            fsym: 'BTC',
            tsym: 'USD',
            resolution: 'hour',
            limit: 24
        });

        assert.strictEqual(data.length, 2, 'Should return 2 data points');
        assert.strictEqual(data[0].close, 100, 'First point close should be 100');
        assert.strictEqual(data[0].timestamp, 1600000000 * 1000, 'Timestamp should be in ms');
        assert.strictEqual(fetchCalls.length, 1, 'Should make 1 API call');
        console.log('✅ fetchHistoricalRates basics passed');
    } catch (e) {
        console.error('❌ fetchHistoricalRates basics failed', e);
        process.exit(1);
    }

    // Test 2: Caching
    try {
        const data = await global.CurrencyHistory.fetchHistoricalRates({
            fsym: 'BTC',
            tsym: 'USD',
            resolution: 'hour',
            limit: 24
        });

        assert.strictEqual(fetchCalls.length, 1, 'Should not make new API call due to cache');
        console.log('✅ Caching passed');
    } catch (e) {
        console.error('❌ Caching failed', e);
        process.exit(1);
    }

    // Test 3: Different parameters (should trigger new fetch)
    try {
        const data = await global.CurrencyHistory.fetchHistoricalRates({
            fsym: 'ETH',
            tsym: 'USD',
            resolution: 'hour',
            limit: 24
        });

        assert.strictEqual(fetchCalls.length, 2, 'Should make new API call for different currency');
        console.log('✅ Different parameters passed');
    } catch (e) {
        console.error('❌ Different parameters failed', e);
        process.exit(1);
    }

    console.log('All tests passed!');
}

runTests();
