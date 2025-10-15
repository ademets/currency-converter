(function () {
    const currencies = ['CZK', 'USD', 'EUR', 'CAD', 'ETH', 'BTC', 'SOL'];
    const crypto = ['ETH', 'BTC', 'SOL'];

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
        updateConversion();
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

        const amount = parseFloat(fromAmountInput.value) || 1;
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
                }
            }
        } catch (e) {
            console.error(e);
            toAmountOutput.value = 'Error';
            altDiv.innerHTML = '';
        }
    }

    function init() {
        const fromAmountInput = byId('from-amount');
        const fromCurr = byId('from-curr');
        const toCurr = byId('to-curr');

        if (fromAmountInput) {
            fromAmountInput.addEventListener('input', updateConversion);
        }
        if (fromCurr) {
            fromCurr.addEventListener('change', updateConversion);
        }
        if (toCurr) {
            toCurr.addEventListener('change', updateConversion);
        }

        updateConversion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
