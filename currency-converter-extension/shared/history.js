(function (global) {
    const API_BASE = 'https://min-api.cryptocompare.com/data/v2';
    const ENDPOINT_BY_RESOLUTION = {
        hour: 'histohour',
        day: 'histoday',
    };
    const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // five minutes
    const cache = new Map();
    const MS_IN_HOUR = 60 * 60 * 1000;
    const MS_IN_DAY = 24 * MS_IN_HOUR;

    const RANGE_DEFINITIONS = {
        '1d': {
            resolution: 'hour',
            limit: 24,
            windowMs: MS_IN_DAY,
        },
        '7d': {
            resolution: 'hour',
            limit: 7 * 24,
            windowMs: 7 * MS_IN_DAY,
        },
        '31d': {
            resolution: 'day',
            limit: 31,
            windowMs: 31 * MS_IN_DAY,
        },
        '3m': {
            resolution: 'day',
            limit: 90,
            windowMs: 90 * MS_IN_DAY,
        },
        YTD: {
            resolution: 'day',
            limit: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), 0, 1);
                const diffDays = Math.ceil((now - start) / MS_IN_DAY);
                return Math.min(diffDays + 3, 366);
            },
            startTime: () => {
                const now = new Date();
                return new Date(now.getFullYear(), 0, 1).getTime();
            },
        },
        '1y': {
            resolution: 'day',
            limit: 365,
            windowMs: 365 * MS_IN_DAY,
        },
        '5y': {
            resolution: 'day',
            limit: 5 * 365,
            windowMs: 5 * 365 * MS_IN_DAY,
        },
    };

    function getCacheKey({ fsym, tsym, resolution, limit, aggregate }) {
        return `${fsym}|${tsym}|${resolution}|${limit}|${aggregate || 1}`;
    }

    async function requestSeries({ fsym, tsym, resolution, limit, aggregate = 1 }) {
        const endpoint = ENDPOINT_BY_RESOLUTION[resolution];
        if (!endpoint) {
            throw new Error(`Unsupported resolution "${resolution}".`);
        }

        const params = new URLSearchParams({
            fsym: fsym.toUpperCase(),
            tsym: tsym.toUpperCase(),
            limit: String(limit),
            aggregate: String(Math.max(1, aggregate)),
        });

        const url = `${API_BASE}/${endpoint}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Historical rates request failed with status ${response.status}.`);
        }

        const payload = await response.json();
        if (payload.Response === 'Error') {
            const message = payload.Message || 'Unknown CryptoCompare error.';
            throw new Error(message);
        }

        const series = payload?.Data?.Data;
        if (!Array.isArray(series)) {
            throw new Error('Historical rates payload missing data array.');
        }

        return series.map((point) => ({
            timestamp: point.time * 1000,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volumeFrom: point.volumefrom,
            volumeTo: point.volumeto,
        }));
    }

    async function fetchHistoricalRates({
        fsym,
        tsym,
        resolution = 'day',
        limit = 30,
        aggregate = 1,
        ttlMs = DEFAULT_CACHE_TTL_MS,
    }) {
        if (!fsym || !tsym) {
            throw new Error('Both fsym and tsym must be provided.');
        }

        const key = getCacheKey({ fsym, tsym, resolution, limit, aggregate });
        const now = Date.now();
        const cached = cache.get(key);

        if (cached) {
            if (cached.data && cached.expiresAt > now) {
                return cached.data;
            }
            if (cached.promise) {
                return cached.promise;
            }
        }

        const requestPromise = requestSeries({ fsym, tsym, resolution, limit, aggregate })
            .then((data) => {
                cache.set(key, {
                    data,
                    expiresAt: now + ttlMs,
                });
                return data;
            })
            .catch((error) => {
                cache.delete(key);
                throw error;
            });

        cache.set(key, {
            promise: requestPromise,
            expiresAt: now + ttlMs,
        });

        return requestPromise;
    }

    async function getRangeSeries({ range, fsym, tsym, ttlMs }) {
        const definition = RANGE_DEFINITIONS[range];
        if (!definition) {
            throw new Error(`Unsupported range "${range}".`);
        }

        const limit =
            typeof definition.limit === 'function'
                ? definition.limit()
                : definition.limit;

        const rawSeries = await fetchHistoricalRates({
            fsym,
            tsym,
            resolution: definition.resolution,
            limit,
            aggregate: definition.aggregate || 1,
            ttlMs,
        });

        const startBoundary =
            typeof definition.startTime === 'function'
                ? definition.startTime()
                : definition.windowMs
                  ? Date.now() - definition.windowMs
                  : null;

        if (!startBoundary) {
            return rawSeries;
        }

        return rawSeries.filter((point) => point.timestamp >= startBoundary);
    }

    function clearHistoricalCache() {
        cache.clear();
    }

    global.CurrencyHistory = {
        fetchHistoricalRates,
        getRangeSeries,
        clearHistoricalCache,
        RANGE_DEFINITIONS: Object.freeze({ ...RANGE_DEFINITIONS }),
    };
})(typeof window !== 'undefined' ? window : globalThis);
