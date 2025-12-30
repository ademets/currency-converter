# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the hosted demo entry point and consumes shared assets from `currency-converter-extension/shared/`.
- `currency-converter-extension/` contains the extension (`manifest.json`, `popup.html`) plus `shared/` JS/CSS used by both surfaces; keep changes in sync.
- `tests/` holds Node-based regression tests for converter and graph behavior.
- `NEXT.md` tracks upcoming work; `FEATURE-GRAPH.md` documents the historical graph feature.

## Build, Test, and Development Commands
- `python3 start_server.py` — serve the repo locally (defaults to `http://127.0.0.1:8000`).
- `python3 -m http.server 8000` — quick static server alternative from the repo root.
- Extension dev: open `chrome://extensions`, enable Developer Mode, and "Load unpacked" from `currency-converter-extension/`.
- Package extension: `mkdir -p build && zip -r build/currency-converter-extension.zip currency-converter-extension`.

## Coding Style & Naming Conventions
- Use vanilla HTML/CSS/JS with 4-space indentation and double-quoted HTML attributes.
- JavaScript uses semicolons and single-quoted strings; helper functions are camelCase.
- IDs/classes stay kebab-case (`from-amount`, `alt-group`); prefer edits in `currency-converter-extension/shared/` so both surfaces stay aligned.
- No formatter or linter is configured.

## Testing Guidelines
- Run tests with Node: `node tests/test_converter.js` and `node tests/test_graph.js`.
- Manual checks: conversion updates on input change, swap button behavior, chart range changes, and graceful `Error` state when the API is unreachable.

## Commit & Pull Request Guidelines
- Keep commit subjects short and imperative (e.g., `Add chart tooltips`, `Fix popup fetch`).
- PRs should include a summary, manual test notes, and screenshots or a short clip for UI changes.
- Update both `index.html` and `popup.html` when a shared UI change is required; link related issues when available.

## Work Tracking
- Use `NEXT.md` and prefix items with `-` (to do), `~` (in progress), or `+` (done).

## Security & Configuration Tips
- Rates come from `https://min-api.cryptocompare.com`; be mindful of rate limits and CORS.
- Avoid committing secrets; document any new configuration in `README.md`.
