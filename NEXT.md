# Things to improve

- + Added auto-fit styling and thousands-separator formatting for amount inputs so longer values stay readable.
- + Unify shared UI and logic between the static page and extension by extracting the duplicated CSS and script into reusable files to keep both surfaces consistent.
- + Introduce historical data utility (`CurrencyHistory`) to fetch & cache series for upcoming chart work.
- + Embedded a minimalist historical chart (range selector + canvas renderer) so users can scan recent trends inline.
- - Handle same-currency conversions locally so users see immediate results without hitting the API when `from` equals `to`.
- - Debounce `updateConversion()` to limit network traffic and smooth out rapid input changes.
- - Replace the generic “Error” message with a clearer UI banner that suggests retrying and highlights offline scenarios.
- - Introduce a lightweight automated regression check (e.g., Playwright smoke test or mocked fetch script) to verify calculator pathways before packaging or deploys.
