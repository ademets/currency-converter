(function () {
    const currencies = ['CZK', 'USD', 'EUR', 'CAD', 'ETH', 'BTC', 'SOL'];
    const crypto = ['ETH', 'BTC', 'SOL'];
    const resizeQueue = new Set();
    let historyController = null;

    function queueFit(element) {
        if (!element) {
            return;
        }

        resizeQueue.add(element);
        if (resizeQueue.size === 1) {
            requestAnimationFrame(() => {
                resizeQueue.forEach((el) => fitInputToWidth(el));
                resizeQueue.clear();
            });
        }
    }

    function fitInputToWidth(element) {
        if (!element) {
            return;
        }

        const computed = window.getComputedStyle(element);
        if (!element.dataset.baseFontSize) {
            element.dataset.baseFontSize = computed.fontSize;
        }

        const maxFontSize = parseFloat(element.dataset.baseFontSize) || 16;
        const minFontSize = Math.max(8, Math.round(maxFontSize * 0.4));
        let fontSize = maxFontSize;

        element.style.fontSize = `${maxFontSize}px`;

        const maxIterations = Math.max(24, Math.ceil(maxFontSize - minFontSize) + 8);
        let iterations = 0;
        const targetWidth = element.clientWidth;

        while (
            element.scrollWidth > targetWidth + 1 &&
            fontSize > minFontSize &&
            iterations < maxIterations
        ) {
            fontSize -= 1;
            element.style.fontSize = `${fontSize}px`;
            iterations += 1;
        }
    }

    function queueFitAlternatives(container) {
        if (!container) {
            return;
        }
        container.querySelectorAll('.alt').forEach((node) => queueFit(node));
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
        return value.toLocaleString(undefined, {
            maximumFractionDigits: 4,
            minimumFractionDigits: 0,
        });
    }

    function formatTimestampForRange(timestamp, range) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        switch (range) {
            case '1d':
                return new Intl.DateTimeFormat(undefined, {
                    hour: 'numeric',
                    minute: 'numeric',
                }).format(date);
            case '7d':
            case '31d':
            case '3m':
                return new Intl.DateTimeFormat(undefined, {
                    month: 'short',
                    day: 'numeric',
                }).format(date);
            case 'YTD':
            case '1y':
                return new Intl.DateTimeFormat(undefined, {
                    month: 'short',
                }).format(date);
            case '5y':
                return new Intl.DateTimeFormat(undefined, {
                    year: 'numeric',
                }).format(date);
            default:
                return MiniLineChart.defaultFormatDate(timestamp);
        }
    }

    function createHistoryController() {
        const canvas = byId('history-chart');
        const statusEl = byId('chart-status');

        if (!canvas || typeof MiniLineChart === 'undefined' || !window.CurrencyHistory) {
            return null;
        }

        const buttons = Array.from(
            canvas.closest('.chart-section')?.querySelectorAll('.chart-range .range-button') || [],
        );
        const defaultButton =
            buttons.find((btn) => btn.classList.contains('is-active')) || buttons[0];
        const defaultRange = defaultButton ? defaultButton.dataset.range : '1d';
        const state = {
            currentRange: defaultRange || '1d',
            buttons,
            statusEl,
            requestId: 0,
            sequence: 0,
        };

        state.chart = new MiniLineChart(canvas, {
            formatY: formatChartNumber,
            formatX: (timestamp) => formatTimestampForRange(timestamp, state.currentRange),
            enableTooltips: window.AppConfig ? window.AppConfig.enableTooltips : false,
        });

        const setActiveRange = (range) => {
            state.currentRange = range;
            state.buttons.forEach((btn) => {
                btn.classList.toggle('is-active', btn.dataset.range === range);
            });
        };

        if (defaultRange) {
            setActiveRange(defaultRange);
        }

        const showStatus = (message) => {
            if (!state.statusEl) {
                return;
            }
            if (message) {
                state.statusEl.textContent = message;
                state.statusEl.classList.add('is-visible');
            } else {
                state.statusEl.textContent = '';
                state.statusEl.classList.remove('is-visible');
            }
        };

        const fetchAndRender = () => {
            const fromCurr = byId('from-curr');
            const toCurr = byId('to-curr');
            if (!fromCurr || !toCurr) {
                return;
            }

            const fsym = fromCurr.value;
            const tsym = toCurr.value;

            if (!fsym || !tsym) {
                state.chart.setData([]);
                showStatus('Select currencies to see history.');
                return;
            }

            state.sequence += 1;
            const requestId = state.sequence;
            state.requestId = requestId;

            showStatus('Loading history…');

            window.CurrencyHistory.getRangeSeries({
                range: state.currentRange,
                fsym,
                tsym,
            })
                .then((series) => {
                    if (state.requestId !== requestId) {
                        return;
                    }

                    const sanitized = series
                        .filter((point) => typeof point?.close === 'number')
                        .map((point) => ({
                            timestamp: point.timestamp,
                            close: point.close,
                        }));

                    state.chart.setData(sanitized);
                    if (!sanitized.length) {
                        showStatus('No history available yet.');
                    } else {
                        showStatus('');
                    }
                })
                .catch((error) => {
                    if (state.requestId !== requestId) {
                        return;
                    }
                    console.error('Failed to fetch historical rates', error);
                    state.chart.setData([]);
                    showStatus('History unavailable. Try again later.');
                });
        };

        state.buttons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const range = btn.dataset.range;
                if (!range || range === state.currentRange) {
                    return;
                }
                setActiveRange(range);
                fetchAndRender();
            });
        });

        return {
            refresh: fetchAndRender,
        };
    }

    function onCurrencyPairChanged() {
        updateConversion();
        if (historyController) {
            historyController.refresh();
        }
    }

    function normalizeNumericInput(raw) {
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

    function formatInputDisplay(normalized) {
        if (!normalized) {
            return '';
        }

        if (normalized.endsWith('.')) {
            const integerPart = normalized.slice(0, -1);
            if (!integerPart) {
                return '';
            }
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${formattedInteger}.`;
        }

        const [integerPart = '', fractionalPart] = normalized.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        if (fractionalPart !== undefined) {
            return fractionalPart.length > 0
                ? `${formattedInteger}.${fractionalPart}`
                : formattedInteger;
        }

        return formattedInteger;
    }

    function applyInputFormatting(input) {
        if (!input) {
            return '';
        }

        const raw = input.value;
        const normalized = normalizeNumericInput(raw);
        const formatted = formatInputDisplay(normalized);

        if (formatted !== raw) {
            const cleanBeforeCaretLength =
                raw && typeof input.selectionStart === 'number'
                    ? raw.slice(0, input.selectionStart).replace(/,/g, '').length
                    : null;

            input.value = formatted;

            if (
                document.activeElement === input &&
                typeof input.setSelectionRange === 'function' &&
                cleanBeforeCaretLength !== null
            ) {
                let seen = 0;
                let caretPos = 0;
                while (caretPos < formatted.length && seen < cleanBeforeCaretLength) {
                    if (formatted.charAt(caretPos) !== ',') {
                        seen += 1;
                    }
                    caretPos += 1;
                }
                input.setSelectionRange(caretPos, caretPos);
            }
        }

        input.dataset.numericValue = normalized;
        return normalized;
    }

    function formatAmount(value, decimals) {
        const fixed = (value || 0).toFixed(decimals);
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.length === 2 ? `${parts[0]}.${parts[1]}` : parts[0];
    }

    function byId(id) {
        return document.getElementById(id);
    }

    window.swapCurr = function swapCurr() {
        const fromCurr = byId('from-curr');
        const toCurr = byId('to-curr');
        if (!fromCurr || !toCurr) {
            return;
        }
        const temp = fromCurr.value;
        fromCurr.value = toCurr.value;
        toCurr.value = temp;
        onCurrencyPairChanged();
    };

    async function updateConversion() {
        const fromAmountInput = byId('from-amount');
        const fromCurr = byId('from-curr');
        const toCurr = byId('to-curr');
        const toAmountOutput = byId('to-amount');
        const altDiv = byId('alternatives');

        if (!fromAmountInput || !fromCurr || !toCurr || !toAmountOutput || !altDiv) {
            return;
        }

        const normalizedAmount = applyInputFormatting(fromAmountInput);
        if (!normalizedAmount) {
            toAmountOutput.value = '';
            altDiv.innerHTML = '';
            queueFit(fromAmountInput);
            queueFit(toAmountOutput);
            queueFitAlternatives(altDiv);
            return;
        }

        const amount = parseFloat(normalizedAmount);
        if (!Number.isFinite(amount)) {
            toAmountOutput.value = '';
            altDiv.innerHTML = '';
            queueFit(fromAmountInput);
            queueFit(toAmountOutput);
            queueFitAlternatives(altDiv);
            return;
        }

        const from = fromCurr.value;
        const to = toCurr.value;
        const tsyms = currencies.filter((c) => c !== from).join(',');
        const url = `https://min-api.cryptocompare.com/data/price?fsym=${from}&tsyms=${tsyms}`;

        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.Response === 'Error') {
                throw new Error(data.Message);
            }

            const rate = data[to];
            if (typeof rate !== 'number') {
                throw new Error(`No rate returned for ${to}`);
            }

            const decimals = crypto.includes(to) ? 8 : 2;
            toAmountOutput.value = formatAmount(amount * rate, decimals);
            queueFit(fromAmountInput);
            queueFit(toAmountOutput);

            altDiv.innerHTML = '';
            for (const curr in data) {
                if (Object.prototype.hasOwnProperty.call(data, curr) && curr !== to) {
                    const altRate = data[curr];
                    if (typeof altRate !== 'number') {
                        continue;
                    }
                    const altDecimals = crypto.includes(curr) ? 8 : 2;
                    const altAmount = formatAmount(amount * altRate, altDecimals);
                    const p = document.createElement('div');
                    p.className = 'alt';
                    p.textContent = `(${altAmount} ${curr})`;
                    altDiv.appendChild(p);
                    queueFit(p);
                }
            }
            queueFitAlternatives(altDiv);
        } catch (e) {
            console.error(e);
            toAmountOutput.value = 'Error';
            altDiv.innerHTML = '';
            queueFitAlternatives(altDiv);
        }
    }

    function init() {
        const fromAmountInput = byId('from-amount');
        const fromCurr = byId('from-curr');
        const toCurr = byId('to-curr');
        const toAmountOutput = byId('to-amount');

        if (fromAmountInput) {
            applyInputFormatting(fromAmountInput);
            fromAmountInput.addEventListener('input', () => {
                applyInputFormatting(fromAmountInput);
                queueFit(fromAmountInput);
                updateConversion();
            });
            queueFit(fromAmountInput);
        }
        if (fromCurr) {
            fromCurr.addEventListener('change', onCurrencyPairChanged);
        }
        if (toCurr) {
            toCurr.addEventListener('change', onCurrencyPairChanged);
        }
        if (toAmountOutput) {
            queueFit(toAmountOutput);
        }

        historyController = createHistoryController();

        window.addEventListener('resize', () => {
            queueFit(fromAmountInput);
            queueFit(toAmountOutput);
            queueFitAlternatives(byId('alternatives'));
        });

        updateConversion();
        if (historyController) {
            historyController.refresh();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
