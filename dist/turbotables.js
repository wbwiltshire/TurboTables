/*!
 * TurboTables v1.0.0
 * Copyright (c) Seagull Consulting, Inc. Licensed under the Apache License 2.0.
 * https://github.com/wbwiltshire/TurboTables
 *
 * Server-side paging, sorting and filtering controls for an HTML table (Bootstrap 5, Font Awesome 7).
 *
 * Public methods:
 *   setDataBinding(fn)                 fn(page, pageSize, sortColumn, sortDirection, filterColumn, filterValue, requestId)
 *   endDataBinding(totalItems[, requestId])  call when the data has been bound (also on errors!)
 *   isCurrentRequest(requestId)        false when a newer request has started since requestId
 *   refresh()                          re-request the current page
 *   buildQueryString([extraParams])    URL-encoded page/pageSize/sortColumn/direction/filterColumn/filterValue
 *   goToPage(n), getLastPage()
 *   getPage(), getPageSize(), getSortColumn(), getSortDirection(), getFilterColumn(), getFilterValue()
 *   showSpinner(show)
 */
(function (root, factory) {
     var lib = factory();
     if (typeof module === 'object' && module.exports)
          module.exports = lib;
     else
          root.TurboTablesLib = lib;
}(typeof self !== 'undefined' ? self : this, function () {
     'use strict';

     var VERSION = '1.0.0';

     // Bootstrap 5 classes for every generated element. Override any of them with options.classes.
     var DEFAULT_CLASSES = {
          table: 'tt-table',
          wrapper: 'tt-wrapper',
          overlay: 'tt-overlay',
          spinnerBorder: 'spinner-border text-primary',
          toolbar: 'tt-toolbar d-flex flex-wrap align-items-center gap-2 mb-2',
          toolbarStart: 'd-flex flex-wrap align-items-center gap-2 me-auto',
          info: 'tt-info',
          searchGroup: 'input-group input-group-sm tt-search',
          searchIcon: 'input-group-text',
          searchInput: 'form-control',
          filterToggle: 'btn btn-sm btn-outline-secondary tt-filter-toggle',
          filterPanel: 'tt-filter-panel d-flex flex-wrap align-items-center gap-2',
          filterSelect: 'form-select form-select-sm w-auto',
          filterInput: 'form-control form-control-sm tt-filter-value',
          filterButton: 'btn btn-sm btn-primary',
          clearFilterButton: 'btn btn-sm btn-outline-secondary',
          chips: 'tt-chips d-inline-flex flex-wrap gap-2',
          chip: 'tt-chip',
          chipRemove: 'btn-close',
          pager: 'tt-pager d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2',
          pagerButtonGroup: 'btn-group btn-group-sm',
          pagerButton: 'btn btn-primary',
          jumpGroup: 'input-group input-group-sm w-auto tt-jump',     // w-auto: .input-group is width:100% by default
          jumpButton: 'btn btn-primary',
          jumpInput: 'form-control tt-jump-input',
          pageSizeGroup: 'tt-page-size d-flex align-items-center gap-2',
          pageSizeLabel: 'tt-label mb-0 text-nowrap',
          pageSizeSelect: 'form-select form-select-sm w-auto',
          sortable: 'tt-sortable',
          sortIcon: 'tt-sort-icon',
          sortIconActive: 'tt-sort-active'
     };

     // Font Awesome 7 (free) class names. Override with options.icons for other icon sets.
     var DEFAULT_ICONS = {
          filter: 'fa-solid fa-filter',
          search: 'fa-solid fa-magnifying-glass',
          sortNone: 'fa-solid fa-sort',
          sortAsc: 'fa-solid fa-sort-up',
          sortDesc: 'fa-solid fa-sort-down'
     };

     var DEFAULT_PAGE_SIZE_OPTIONS = [[10, 25, 50, -1], [10, 25, 50, 'All']];

     function assign(target) {
          for (var i = 1; i < arguments.length; i++) {
               var src = arguments[i];
               if (!src) continue;
               for (var key in src)
                    if (Object.prototype.hasOwnProperty.call(src, key)) target[key] = src[key];
          }
          return target;
     }

     function toInt(value, fallback) {
          var n = parseInt(value, 10);
          return isNaN(n) ? fallback : n;
     }

     function normalizeDirection(direction) {
          return String(direction || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
     }

     function addClasses(node, classes) {
          String(classes || '').split(/\s+/).forEach(function (c) { if (c) node.classList.add(c); });
     }

     // el('button', { className: 'btn', type: 'button', text: 'First' }, [children])
     function el(tag, props, children) {
          var node = document.createElement(tag);
          props = props || {};
          for (var key in props) {
               if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
               var value = props[key];
               if (value === undefined || value === null || value === false) continue;
               if (key === 'text') node.textContent = value;
               else if (key === 'className') node.className = value;
               else if (key === 'hidden') node.hidden = true;
               else node.setAttribute(key, value === true ? '' : value);
          }
          (children || []).forEach(function (child) {
               if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
          });
          return node;
     }

     function icon(classes) {
          return classes ? el('i', { className: classes, 'aria-hidden': 'true' }) : null;
     }

     function TurboTablesLib(options) {
          if (!(this instanceof TurboTablesLib))
               return new TurboTablesLib(options);

          options = options || {};
          if (!options.tableId)
               throw new Error('TurboTables requires the tableId option.');

          this.tableId = options.tableId;
          this.table = document.getElementById(this.tableId);
          if (!this.table)
               throw new Error('TurboTables: no element with id "' + this.tableId + '" was found.');

          this.page = Math.max(1, toInt(options.page, 1));
          this.requestedPageSize = toInt(options.pageSize, 10);          // -1 means "All"
          if (this.requestedPageSize === 0 || this.requestedPageSize < -1) this.requestedPageSize = 10;
          this.pagerSizeOptions = options.pagerSizeOptions || DEFAULT_PAGE_SIZE_OPTIONS;
          this.sortColumn = options.sortColumn || 'Id';
          this.sortDirection = normalizeDirection(options.sortDirection);
          this.filterColumn = '';
          this.filterValue = '';
          this.showFilter = !!options.showFilter;
          this.columnHeaderClass = options.columnHeaderClass || 'colHeaders';
          this.spinnerSource = options.spinnerSource || null;
          this.totalItemsAttribute = options.totalItemsAttribute || 'ctTotalItems';
          this.tableInfoTemplate = options.tableInfoTemplate || 'Showing {0} to {1} of {2} entries';
          this.classes = assign({}, DEFAULT_CLASSES, options.classes);
          this.icons = assign({}, DEFAULT_ICONS, options.icons);
          this.dataBinder = function () { };
          this.requestId = 0;
          this.lastRequestedPageSize = Infinity;     // no request yet
          this.elements = {};
          this.columnLabels = {};

          // Generated element ids are prefixed with the table id so several tables can share a page.
          var prefix = this.tableId + '-';
          this.tableInfoId = prefix + 'showing';
          this.searchInputId = prefix + 'search';
          this.filterId = prefix + 'filter';
          this.filterIconId = prefix + 'filterIcon';
          this.selectFilterColumnId = prefix + 'filterColumn';
          this.filterValueInputId = prefix + 'filterValue';
          this.filterFilterButtonId = prefix + 'filterButton';
          this.clearFilterButtonId = prefix + 'clearFilterButton';
          this.chipsId = prefix + 'chips';
          this.firstButtonId = prefix + 'first';
          this.prevButtonId = prefix + 'prev';
          this.nextButtonId = prefix + 'next';
          this.lastButtonId = prefix + 'last';
          this.jumpButtonId = prefix + 'jump';
          this.jumpInputId = prefix + 'jumpInput';
          this.selectPgSizerId = prefix + 'pageSize';
          this.spinnerId = prefix + 'spinner';

          this.totalItems = Math.max(0, toInt(this.table.getAttribute(this.totalItemsAttribute), 0));

          // Toolbar and pager are placed around the nearest Bootstrap .row containing the table.
          this.container = (options.container && (typeof options.container === 'string' ? document.getElementById(options.container) : options.container))
               || this.table.closest('.row')
               || this.table.parentNode;

          addClasses(this.table, this.classes.table);
          this.CreateSearchAndFilterRows();
          this.CreatePagingControls();
          this.EnableColumnSortingAndFiltering();
          this.AddSpinner();
          this.ShowTableInfo();
     }

     TurboTablesLib.version = VERSION;
     var proto = TurboTablesLib.prototype;

     // ---------------------------------------------------------------- public API

     proto.setDataBinding = function (dataBinder) {
          this.dataBinder = typeof dataBinder === 'function' ? dataBinder : function () { };
          return this;
     };

     // Call when the data for a request has been bound. Pass the requestId your data binder
     // received to have responses from superseded requests ignored (returns false for those).
     proto.endDataBinding = function (totalItems, requestId) {
          if (requestId !== undefined && requestId !== this.requestId)
               return false;
          this.totalItems = Math.max(0, toInt(totalItems, 0));
          this.table.setAttribute(this.totalItemsAttribute, String(this.totalItems));

          // "All" asks for the total known when the request started. If the total has since grown
          // (e.g. a filter was cleared), that request returned too few rows, so ask again.
          if (this.requestedPageSize === -1 && this.totalItems > this.lastRequestedPageSize) {
               this.refresh();
               return true;
          }

          this.ShowTableInfo();
          if (this.elements.searchInput && this.elements.searchInput.value)
               this.SearchTable();
          this.showSpinner(false);
          return true;
     };

     proto.isCurrentRequest = function (requestId) {
          return requestId === this.requestId;
     };

     proto.refresh = function () {
          this.requestId++;
          this.lastRequestedPageSize = this.getPageSize();
          this.showSpinner(true);
          this.dataBinder(this.page, this.lastRequestedPageSize, this.sortColumn, this.sortDirection, this.filterColumn, this.filterValue, this.requestId);
          return this.requestId;
     };

     proto.buildQueryString = function (extraParams) {
          var params = new URLSearchParams();
          params.set('page', String(this.page));
          params.set('pageSize', String(this.getPageSize()));
          params.set('sortColumn', this.sortColumn);
          params.set('direction', this.sortDirection);
          if (this.filterColumn && this.filterValue) {
               params.set('filterColumn', this.filterColumn);
               params.set('filterValue', this.filterValue);
          }
          if (extraParams)
               for (var key in extraParams)
                    if (Object.prototype.hasOwnProperty.call(extraParams, key)) params.set(key, String(extraParams[key]));
          return params.toString();
     };

     proto.getPage = function () { return this.page; };

     // "All" (-1) is sent to the server as the current total item count.
     proto.getPageSize = function () {
          return this.requestedPageSize === -1 ? Math.max(this.totalItems, 1) : this.requestedPageSize;
     };

     proto.getSortColumn = function () { return this.sortColumn; };
     proto.getSortDirection = function () { return this.sortDirection; };
     proto.getFilterColumn = function () { return this.filterColumn; };
     proto.getFilterValue = function () { return this.filterValue; };

     proto.getLastPage = function () {
          return Math.max(1, Math.ceil(this.totalItems / this.getPageSize()));
     };

     // Dims the table and shows a spinner over it while data loads.
     proto.showSpinner = function (show) {
          if (this.elements.spinner) this.elements.spinner.hidden = !show;
          if (show) this.table.setAttribute('aria-busy', 'true');
          else this.table.removeAttribute('aria-busy');
     };

     // ---------------------------------------------------------------- navigation

     proto.goToPage = function (page) {
          this.page = Math.min(Math.max(1, toInt(page, 1)), this.getLastPage());
          return this.refresh();
     };

     proto.FirstPage = function () { if (this.page !== 1) this.goToPage(1); };
     proto.PreviousPage = function () { if (this.page > 1) this.goToPage(this.page - 1); };
     proto.NextPage = function () { if (this.page < this.getLastPage()) this.goToPage(this.page + 1); };
     proto.LastPage = function () { if (this.page !== this.getLastPage()) this.goToPage(this.getLastPage()); };

     proto.JumpPage = function () {
          var input = this.elements.jumpInput;
          var target = parseInt(input.value, 10);
          if (isNaN(target)) {
               input.value = this.page;
               return;
          }
          this.goToPage(target);
          input.value = this.page;
     };

     proto.UpdatePageSize = function () {
          var size = toInt(this.elements.pageSizeSelect.value, 10);
          this.requestedPageSize = size === -1 || size > 0 ? size : 10;
          this.page = 1;
          this.refresh();
     };

     // ---------------------------------------------------------------- filtering & search

     proto.FilterQuery = function () {
          var column = this.elements.filterSelect.value;
          var value = this.elements.filterInput.value.trim();
          if (!column || !value) return;
          this.filterColumn = column;
          this.filterValue = value;
          this.page = 1;
          this.UpdateFilterState();
          this.refresh();
     };

     proto.ClearFilterQuery = function () {
          var wasActive = !!(this.filterColumn && this.filterValue);
          this.filterColumn = '';
          this.filterValue = '';
          if (this.elements.filterSelect) this.elements.filterSelect.selectedIndex = 0;
          if (this.elements.filterInput) this.elements.filterInput.value = '';
          this.UpdateFilterState();
          if (wasActive) {
               this.page = 1;
               this.refresh();
          }
     };

     // Shows or hides the filter panel. An applied filter stays active (and visible as a chip)
     // until it is cleared with the chip's remove button or the Clear button.
     proto.ToggleFilterRow = function () {
          var panel = this.elements.filterRow;
          panel.hidden = !panel.hidden;
          this.UpdateFilterState();
          if (!panel.hidden) this.elements.filterSelect.focus();
     };

     proto.UpdateFilterState = function () {
          var e = this.elements;
          if (!e.filterRow) return;
          var active = !!(this.filterColumn && this.filterValue);
          e.filterToggle.classList.toggle('active', active || !e.filterRow.hidden);
          e.filterToggle.setAttribute('aria-expanded', String(!e.filterRow.hidden));

          // The chip stands in for the filter controls while they are closed.
          e.chips.replaceChildren();
          e.chips.hidden = !active || !e.filterRow.hidden;
          if (e.chips.hidden) return;

          var self = this;
          var label = (this.columnLabels[this.filterColumn] || this.filterColumn) + ': ' + this.filterValue;
          var remove = el('button', { type: 'button', className: this.classes.chipRemove, 'aria-label': 'Remove filter ' + label });
          remove.addEventListener('click', function () { self.ClearFilterQuery(); });
          e.chips.appendChild(el('span', { className: this.classes.chip }, [el('span', { text: label }), remove]));
     };

     // Client-side search: hides rows on the current page whose text doesn't contain the term.
     proto.SearchTable = function () {
          var term = this.elements.searchInput.value.trim().toUpperCase();
          var bodies = this.table.tBodies;
          for (var b = 0; b < bodies.length; b++) {
               var rows = bodies[b].rows;
               for (var r = 0; r < rows.length; r++)
                    rows[r].hidden = term !== '' && rows[r].textContent.toUpperCase().indexOf(term) === -1;
          }
     };

     // ---------------------------------------------------------------- sorting

     proto.ProcessSortEvent = function (column) {
          if (column === this.sortColumn)
               this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          else {
               this.sortColumn = column;
               this.sortDirection = 'asc';
          }
          this.UpdateSortIndicators();
          this.refresh();
     };

     // Every sortable header shows an icon: a faint neutral one, or the active direction.
     proto.UpdateSortIndicators = function () {
          var self = this, c = this.classes, icons = this.icons;
          this.headerCells.forEach(function (th) {
               if (!th.classList.contains('sortable')) return;
               var existing = th.querySelector('.tt-sort-icon');
               if (existing) existing.parentNode.removeChild(existing);

               var active = self.columnKey(th) === self.sortColumn;
               var asc = self.sortDirection === 'asc';
               if (active) th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
               else th.removeAttribute('aria-sort');

               var classes = c.sortIcon + ' ' + (active ? c.sortIconActive + ' ' + (asc ? icons.sortAsc : icons.sortDesc) : icons.sortNone);
               (th.querySelector('a') || th).appendChild(icon(classes));
          });
     };

     // A header's column key is its data-column attribute, falling back to its id.
     proto.columnKey = function (th) {
          return th.getAttribute('data-column') || th.id;
     };

     // ---------------------------------------------------------------- rendering

     proto.ShowTableInfo = function () {
          var pageSize = this.getPageSize();
          if (this.page > this.getLastPage()) this.page = this.getLastPage();
          var low = this.totalItems === 0 ? 0 : (this.page - 1) * pageSize + 1;
          var high = Math.min(this.page * pageSize, this.totalItems);
          this.elements.info.textContent = this.tableInfoTemplate
               .replace('{0}', low).replace('{1}', high).replace('{2}', this.totalItems);
          this.UpdatePagerControls();
     };

     proto.UpdatePagerControls = function () {
          var last = this.getLastPage();
          var e = this.elements;
          e.firstButton.disabled = e.prevButton.disabled = this.page <= 1;
          e.nextButton.disabled = e.lastButton.disabled = this.page >= last;
          e.jumpInput.value = this.page;
          e.jumpInput.max = last;
     };

     // ---------------------------------------------------------------- DOM construction

     proto.insertBefore = function (node) {
          this.container.parentNode.insertBefore(node, this.container);
     };

     // Toolbar above the table, on one line:
     //   [Filter] [column][value][Apply][Clear] | [chip]   Showing x to y of z ........ [Search]
     // The filter controls open inline next to the Filter button; while they are closed an
     // applied filter is shown as a removable chip.
     proto.CreateSearchAndFilterRows = function () {
          var self = this, c = this.classes, e = this.elements;

          e.info = el('span', { id: this.tableInfoId, className: c.info, 'aria-live': 'polite' });

          e.searchInput = el('input', { type: 'search', id: this.searchInputId, className: c.searchInput, placeholder: 'Search this page', 'aria-label': 'Search this page' });
          var searchForm = el('form', { role: 'search', className: c.searchGroup }, [
               el('span', { className: c.searchIcon }, [icon(this.icons.search)]),
               e.searchInput
          ]);
          searchForm.addEventListener('submit', function (evt) { evt.preventDefault(); });
          e.searchInput.addEventListener('input', function () { self.SearchTable(); });

          var start = el('div', { className: c.toolbarStart });

          if (this.showFilter) {
               e.filterToggle = el('button', { type: 'button', id: this.filterIconId, className: c.filterToggle, 'aria-controls': this.filterId, 'aria-expanded': 'false' },
                    [icon(this.icons.filter), ' Filter']);
               e.filterToggle.addEventListener('click', function () { self.ToggleFilterRow(); });

               e.filterSelect = el('select', { id: this.selectFilterColumnId, className: c.filterSelect, 'aria-label': 'Filter column' },
                    [el('option', { value: '', text: 'Select a column', disabled: true, selected: true })]);
               e.filterInput = el('input', { type: 'text', id: this.filterValueInputId, className: c.filterInput, placeholder: 'Value', 'aria-label': 'Filter value', maxlength: '100' });
               var filterButton = el('button', { type: 'submit', id: this.filterFilterButtonId, className: c.filterButton, text: 'Apply' });
               var clearButton = el('button', { type: 'button', id: this.clearFilterButtonId, className: c.clearFilterButton, text: 'Clear' });

               e.filterRow = el('form', { id: this.filterId, className: c.filterPanel, hidden: true, 'aria-label': 'Filter' },
                    [e.filterSelect, e.filterInput, filterButton, clearButton]);
               e.filterRow.addEventListener('submit', function (evt) { evt.preventDefault(); self.FilterQuery(); });
               clearButton.addEventListener('click', function () { self.ClearFilterQuery(); });

               e.chips = el('span', { id: this.chipsId, className: c.chips, hidden: true, 'aria-live': 'polite' });

               start.appendChild(e.filterToggle);
               start.appendChild(e.filterRow);
               start.appendChild(e.chips);
          }
          start.appendChild(e.info);

          this.insertBefore(el('div', { className: c.toolbar }, [start, searchForm]));
     };

     proto.CreatePagingControls = function () {
          var self = this, c = this.classes, e = this.elements;

          function pagerButton(id, text) {
               return el('button', { type: 'button', id: id, className: c.pagerButton, text: text });
          }
          e.firstButton = pagerButton(this.firstButtonId, 'First');
          e.prevButton = pagerButton(this.prevButtonId, 'Previous');
          e.nextButton = pagerButton(this.nextButtonId, 'Next');
          e.lastButton = pagerButton(this.lastButtonId, 'Last');

          e.jumpButton = el('button', { type: 'button', id: this.jumpButtonId, className: c.jumpButton, text: 'Jump' });
          e.jumpInput = el('input', { type: 'number', id: this.jumpInputId, name: 'jumpInput', className: c.jumpInput, min: '1', value: '1', 'aria-label': 'Page number' });

          e.pageSizeSelect = el('select', { id: this.selectPgSizerId, name: 'pageSizer', className: c.pageSizeSelect });
          this.PopulatePageSizeOptions();

          // Pager below the table: buttons left, Jump in the middle, Page size right.
          var pager = el('div', { className: c.pager }, [
               el('div', { className: c.pagerButtonGroup, role: 'group', 'aria-label': 'Pagination' }, [e.firstButton, e.prevButton, e.nextButton, e.lastButton]),
               el('div', { className: c.jumpGroup }, [e.jumpButton, e.jumpInput]),
               el('div', { className: c.pageSizeGroup }, [
                    el('label', { className: c.pageSizeLabel, 'for': this.selectPgSizerId, text: 'Page size' }),
                    e.pageSizeSelect
               ])
          ]);
          this.container.parentNode.insertBefore(pager, this.container.nextSibling);

          e.firstButton.addEventListener('click', function () { self.FirstPage(); });
          e.prevButton.addEventListener('click', function () { self.PreviousPage(); });
          e.nextButton.addEventListener('click', function () { self.NextPage(); });
          e.lastButton.addEventListener('click', function () { self.LastPage(); });
          e.jumpButton.addEventListener('click', function () { self.JumpPage(); });
          e.jumpInput.addEventListener('keydown', function (evt) {
               if (evt.key === 'Enter') { evt.preventDefault(); self.JumpPage(); }
          });
          e.pageSizeSelect.addEventListener('change', function () { self.UpdatePageSize(); });
     };

     proto.PopulatePageSizeOptions = function () {
          var values = (this.pagerSizeOptions[0] || []).map(function (v) { return toInt(v, 10); });
          var labels = (this.pagerSizeOptions[1] || []).slice();
          var current = this.requestedPageSize;

          // Make sure the configured page size is selectable even if it isn't in the option list.
          if (values.indexOf(current) === -1) {
               var at = 0;
               while (at < values.length && values[at] !== -1 && values[at] < current) at++;
               values.splice(at, 0, current);
               labels.splice(at, 0, String(current));
          }

          var select = this.elements.pageSizeSelect;
          values.forEach(function (value, i) {
               select.appendChild(el('option', {
                    value: String(value),
                    text: labels[i] !== undefined ? String(labels[i]) : String(value),
                    selected: value === current
               }));
          });
     };

     proto.EnableColumnSortingAndFiltering = function () {
          var self = this;
          var thead = this.table.tHead;
          var headerRow = thead ? (thead.querySelector('tr.' + this.columnHeaderClass) || thead.rows[0]) : null;
          this.headerCells = headerRow ? Array.prototype.slice.call(headerRow.cells) : [];

          this.headerCells.forEach(function (th) {
               var column = self.columnKey(th);
               if (!column) return;
               var label = th.textContent.trim() || column;
               self.columnLabels[column] = label;

               if (th.classList.contains('sortable')) {
                    addClasses(th, self.classes.sortable);
                    th.addEventListener('click', function (evt) {
                         evt.preventDefault();
                         self.ProcessSortEvent(column);
                    });
               }

               if (self.showFilter && th.classList.contains('filterable'))
                    self.elements.filterSelect.appendChild(el('option', { value: column, text: label }));
          });

          this.UpdateSortIndicators();
     };

     // Wraps the table so the loading overlay can cover exactly the table.
     proto.AddSpinner = function () {
          var c = this.classes;
          var wrapper = el('div', { className: c.wrapper });
          this.table.parentNode.insertBefore(wrapper, this.table);
          wrapper.appendChild(this.table);

          var content = this.spinnerSource
               ? el('img', { src: this.spinnerSource, alt: 'Loading...' })
               : el('div', { className: c.spinnerBorder, role: 'presentation' }, [el('span', { className: 'visually-hidden', text: 'Loading...' })]);
          this.elements.spinner = el('div', { id: this.spinnerId, className: c.overlay, role: 'status', hidden: true }, [content]);
          wrapper.appendChild(this.elements.spinner);
     };

     return TurboTablesLib;
}));
