# Changelog

## Unreleased

### Demo app
- `Linux/turbotables.service`: systemd unit for a Linux server behind Nginx Proxy Manager in Docker (listens on the Docker bridge `172.17.0.1:8006`).
- New `HOST` setting to choose the listen address.
- Fixed `TRUST_PROXY` with a subnet (e.g. `172.17.0.0/16`), which was read as the number 172.
- Linux files are kept with LF line endings.

## 1.0.0 - 2026-11-25

### Breaking changes
- **Bootstrap 5 and Font Awesome 7.** Generated markup uses Bootstrap 5 classes and Font Awesome 7 icons (`fa-solid fa-filter`, `fa-sort-up`, `fa-sort-down`). Apps still on Bootstrap 4 should stay on the 0.9.x file until they migrate.
- **Generated element ids are prefixed with the table id** (`next` → `CustomerTable-next`, `spinner` → `CustomerTable-spinner`, ...). Only matters if page code looked these up directly.
- **`getFilterColumn()` / `getFilterValue()` return the applied filter**, not whatever is currently typed in the filter row.
- **Sort direction is normalized to lowercase** (`'ASC'` → `'asc'`).
- **Clicking a new sort column starts ascending.** It used to inherit the previous column's direction.
- The default `spinnerSource` is now none (a Bootstrap spinner is shown) instead of `/images/spinner.gif`.
- **Restyled controls, same placement.** The toolbar above the table is one line: Filter button and "Showing x to y of z" on the left, search on the right. The filter controls open inline next to the Filter button, and their button now reads "Apply". The pager below keeps First/Previous/Next/Last on the left, Jump in the middle and Page size on the right.
- **The loading spinner is an overlay on the table** instead of fixed to the middle of the window. The table is wrapped in `div.tt-wrapper` and gets the `tt-table` class.
- **Hiding the filter controls keeps the applied filter.** It is shown as a chip; remove it with the chip's × or the Clear button.

### Added
- `buildQueryString([extraParams])`: URL-encoded query string for the current state.
- `refresh()`, `goToPage(n)`, `getLastPage()`.
- A request id is passed as the 7th data-binder argument, with `isCurrentRequest(id)` and `endDataBinding(total, id)`, so stale responses can be ignored.
- `classes`, `icons`, `tableInfoTemplate` and `container` options.
- Filter chip showing the applied filter, with a remove button.
- Neutral sort icon on inactive sortable columns, highlighted icon on the active one.
- Header row styling (`tt-table`) and all colours from Bootstrap 5.3 CSS variables, so light/dark mode and Bootswatch themes apply.
- `aria-busy` on the table while loading.
- `data-column` attribute for header cells (an `id` still works).
- Initial sort indicator, `aria-sort`, labels and `aria-live` on the info text.
- `dist/` build with minified JS/CSS and a source map, published by git tag via jsDelivr.

### Fixed
- Two tables on one page (or a page element with the same id, e.g. `spinner`) no longer conflict.
- Search, filter and jump inputs now get their `type` (`search`, `text`, `number`).
- Pressing Enter in the search box no longer submits/reloads the page. Enter in the filter value applies the filter, and Enter in the jump box jumps.
- Hiding the filter row no longer leaves a hidden filter applied without any indication (it now shows as a chip). Clear re-queries when a filter was active.
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
- Bootstrap 5.3.9 (built-in light/dark modes, following the system preference), Font Awesome 7.3.1, Handlebars 4.7.10 from jsDelivr with SRI. Bootswatch and jQuery removed from the demo. New card-based page layout.
- Vitest + jsdom test suite.

## 0.9.3
- Replaced the deprecated `request` package with axios.
