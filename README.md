# Currency Converter & Historical Graph

Quick & easy currency conversion available as a static web page and a Chrome extension.

Visit the live demo: [https://ademets.github.io/currency-converter/](https://ademets.github.io/currency-converter/)

## Features

- **Live Conversion:** Convert between fiat (USD, EUR, etc.) and crypto (BTC, ETH, etc.).
- **Historical Chart:** View price trends over various time ranges (1D, 7D, 1M, etc.).
- **Extension Support:** Run as a standalone Chrome extension.

## Development

The project structure is shared between the static site (`index.html`) and the extension (`currency-converter-extension/`).

### Local Server

To serve the static page locally:
```bash
python start_server.py
# or
python -m http.server 8000
```
Then visit `http://localhost:8000`.

### Chrome Extension

1. Go to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked".
4. Select the `currency-converter-extension` folder.

## Configuration

Global configuration is managed in `currency-converter-extension/shared/config.js`.
Key settings:
- `enableTooltips`: Set to `true` (default) to show interactive tooltips on the chart.

## Testing

### Manual Verification
- Open the extension or local web page.
- Verify conversions work.
- Check the historical graph loads data.
- Hover over the graph to see tooltips (if enabled).

### Automated Tests
A lightweight test script is provided for the Graph data layer:
```bash
node tests/test_graph.js
```

## Data Source

Powered by [CryptoCompare API](https://min-api.cryptocompare.com/).
- Caching: Historical data is cached in-memory (TTL 5 mins).
- Limits: Respects API rate limits.
