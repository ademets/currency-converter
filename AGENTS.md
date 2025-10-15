# Repository Guidelines

## Project Structure & Module Organization
- Root `index.html` delivers the hosted demo and consumes shared assets from `currency-converter-extension/shared/` so the static site and extension stay aligned.
- `currency-converter-extension/` contains the Chrome extension (`manifest.json`, `popup.html`), shared styling/logic under `shared/`, and expected icons (`icon16.png`, `icon48.png`, `icon128.png`). Add assets here and update the manifest together.
- Prefer mirroring any surface-specific overrides during the same change set so both entry points stay consistent.

## Build, Test, and Development Commands
- Serve the static page locally: `python -m http.server 8000` (from the repo root) and visit `http://localhost:8000`.
- Package the extension for manual installs: `zip -r build/currency-converter-extension.zip currency-converter-extension`.
- Enable Chrome Developer Mode and load the `currency-converter-extension` directory as an unpacked extension for quick iteration.

## Coding Style & Naming Conventions
- Use vanilla HTML/CSS/JS; match the existing four-space indentation and double-quote attributes.
- IDs and helper functions follow kebab-case and camelCase respectively (`from-amount`, `updateConversion`); keep naming descriptive and consistent.
- Keep CSS embedded unless a change truly warrants an external stylesheet to avoid drift between surfaces.

## Testing Guidelines
- No automated suite yet—perform manual verification in Chrome (extension popup) and a modern desktop browser (static page).
- Confirm the CryptoCompare request succeeds, the swap action updates both selects, crypto outputs use 8 decimals, and alternative quotes render without lag.
- Test with the network throttled offline to ensure the error path surfaces `Error` gracefully.

## Commit & Pull Request Guidelines
- Follow the existing short, imperative Git log style (`Add swap animation`, `Fix popup fetch`); keep messages under 72 characters.
- PRs should include: concise summary, screenshots or a short clip of UI changes, manual test notes, and any linked issue.
- Call out any API contract changes or new assets so reviewers can re-upload their extension package.

## Work Tracking
- Use `NEXT.md` to track upcoming enhancements; prefix each item with `-` (needs doing), `~` (in progress), or `+` (completed) to signal status.

## Security & Configuration Tips
- Do not commit secrets; this project relies solely on the public CryptoCompare endpoint.
- Respect API rate limits by avoiding unnecessary polling and batching UI changes before triggering fresh requests.
