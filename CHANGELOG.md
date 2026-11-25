# Changelog

## 1.0.0 - unreleased

### Breaking changes
- **Bootstrap 5 and Font Awesome 7.** Generated markup uses Bootstrap 5 classes and Font Awesome 7 icons (`fa-solid fa-filter`, `fa-sort-up`, `fa-sort-down`). Apps still on Bootstrap 4 should stay on the 0.9.x file until they migrate.
- **Generated element ids are prefixed with the table id** (`next` → `CustomerTable-next`, `spinner` → `CustomerTable-spinner`, ...). Only matters if page code looked these up directly.
- **`getFilterColumn()` / `getFilterValue()` return the applied filter**, not whatever is currently typed in the filter row.
- **Sort direction is normalized to lowercase** (`'ASC'` → `'asc'`).
- **Clicking a new sort column starts ascending.** It used to inherit the previous column's direction.
- The default `spinnerSource` is now none (a Bootstrap spinner is shown) instead of `/images/spinner.gif`.

### Added
- `buildQueryString([extraParams])`: URL-encoded query string for the current state.
- `refresh()`, `goToPage(n)`, `getLastPage()`.
- A request id is passed as the 7th data-binder argument, with `isCurrentRequest(id)` and `endDataBinding(total, id)`, so stale responses can be ignored.
- `classes`, `icons`, `tableInfoTemplate` and `container` options.
- `data-column` attribute for header cells (an `id` still works).
- Initial sort indicator, `aria-sort`, labels and `aria-live` on the info text.
- `dist/` build with minified JS/CSS and a source map, published by git tag via jsDelivr.

### Fixed
- Two tables on one page (or a page element with the same id, e.g. `spinner`) no longer conflict.
- Search, filter and jump inputs now get their `type` (`search`, `text`, `number`).
- Pressing Enter in the search box no longer submits/reloads the page. Enter in the filter value applies the filter, and Enter in the jump box jumps.
- Hiding the filter row actually clears the filter. Clear re-queries when a filter was active.
- Applying a filter returns to page 1.
- Zero rows shows "Showing 0 to 0 of 0" and no longer requests page 0 or divides by zero with "All".
- Jump clamps to 1..last page and ignores non-numeric input.
- Disabled pager buttons are really `disabled`.
- Sorting no longer throws when `sortColumn` matches no header or when there's whitespace before the header link, and header links no longer add `#` to the URL.
- Search matches visible text instead of HTML markup, and is re-applied after new data is bound.
- Info text is set with `textContent`. No accidental global variables.
- A page size that isn't in `pagerSizeOptions` is now shown as selected.

### Demo app
- Express 5.3, hbs 4.4 (Handlebars 4.7.10), morgan 1.12. Removed axios, lodash, body-parser, cookie-parser, serve-favicon, debug and the unused webpack setup.
- Fixed SSRF: pages no longer fetch data from `http://<Host header>`.
- Fixed a crash (process exit) from repeated query parameters. Sort/filter columns are allowlisted, page size is capped, and new customers are validated and capped.
- Stack traces only with `NODE_ENV=development`. Added Content-Security-Policy and other security headers, plus `TRUST_PROXY` for Nginx Proxy Manager.
- Bootstrap 5.3.9 / Bootswatch 5.3.8, Font Awesome 7.3.1, Handlebars 4.7.10 from jsDelivr with SRI. jQuery removed from the demo.
- Vitest + jsdom test suite.

## 0.9.3
- Replaced the deprecated `request` package with axios.
