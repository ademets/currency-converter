# Historical Graph Feature

You’ll need three pieces: data, a way to aggregate it per time range, and a chart UI.

- **Pick a price-history source.** CryptoCompare already powers your spot rates and supports historical candles: `https://min-api.cryptocompare.com/data/v2/histohour` (hourly up to 7d), `histoday` (daily up to years). You call with `fsym`, `tsym`, and `limit`. For example, 7 days of hourly data: `.../histohour?fsym=USD&tsym=EUR&limit=7*24`.
- **Aggregate per range.**
  - `1d`: 24 hourly points (use `histohour`).
  - `7d`, `31d`: daily candles (`histoday`).
  - `3m`, `YTD`, `1y`, `5y`: daily candles with higher `limit`; for YTD filter client-side to this calendar year.
  - Normalise responses into `{timestamp, close}` pairs in UTC and cache them so switching tabs doesn’t refetch.
- **Render the chart.** Drop in a lightweight chart lib such as Chart.js or Apache ECharts. A line chart with area fill works well. Give the chart a full-width container below the converter, add a segmented control for the ranges, and on change:
  1. Fetch or reuse the series;
  2. Slice to the selected period;
  3. Update the chart via the library API.
- **Usability details.** Format the x-axis with `Intl.DateTimeFormat` matching the range (hours for 1d, months for long spans). Provide a simple loading/empty state and surface API errors near the chart.

Once you have the data-fetch util and chart component wired up, you can integrate it into both the standalone page and extension so the visual stays consistent.

## Workplan

### Workpackage 1: Data Retrieval Layer
- Create a `fetchHistoricalRates({ fsym, tsym, resolution, limit })` helper that wraps CryptoCompare `histohour`/`histoday`.
- Add client-side caching keyed by `{fsym, tsym, resolution}` with an expiry buffer to limit API calls.
- Implement range-specific adapters (1d, 7d, 31d, 3m, YTD, 1y, 5y) that calculate the proper API limit and filter to the requested window.
- Guard against API throttling and propagate meaningful error objects/messages.

### Workpackage 2: Chart Integration
- Pick and install a chart library (e.g., Chart.js with `chart.js/auto` for a simple line chart).
- Define a reusable `<HistoricalChart>` component (for the web version and the extension) that accepts `{ series, range, onRangeChange }`.
- Handle responsive sizing, area fill, tooltip formatting, and axis tick formatting per range.
- Display loading and error states inline with the chart container.

### Workpackage 3: UI Controls & Wiring
- Add a range selector (segmented control or buttons) near the chart with options: 1d, 7d, 31d, 3m, YTD, 1y, 5y.
- Wire the selector to trigger data fetches via the new helper and update the chart component.
- Ensure the converter inputs feed the graph (switching base/quote currencies refreshes historical data appropriately).
- Mirror the integration inside the browser extension popup while accounting for its smaller layout constraints.

### Workpackage 4: QA & Documentation
- Add smoke tests or scripts to sanity-check the data helper (mocked fetch) and chart rendering (visual regression optional).
- Document API usage limits, caching behaviour, and UI affordances in `README.md` or a dedicated doc.
- Capture follow-up tasks (e.g., offline fallback, exporting data) in `NEXT.md` once initial feature ships.
