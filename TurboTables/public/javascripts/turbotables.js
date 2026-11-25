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

     var DEFAULT_CLASSES = {
          toolbarRow: 'row align-items-center g-2 mb-2',
          infoColumn: 'col-sm-6 d-flex align-items-center gap-2',
          info: 'tt-info',
          searchColumn: 'col-sm-6 d-flex justify-content-sm-end',
          searchInput: 'form-control form-control-sm tt-search',
          filterToggle: 'btn btn-link btn-sm p-0 tt-filter-toggle',
          filterRow: 'row align-items-center g-2 mb-2',
          filterSelect: 'form-select form-select-sm',
          filterInput: 'form-control form-control-sm',
          filterButton: 'btn btn-sm btn-primary',
          clearFilterButton: 'btn btn-sm btn-outline-secondary',
          pagerRow: 'row align-items-center g-2 mt-1',
          pagerButtonGroup: 'btn-group btn-group-sm',
          pagerButton: 'btn btn-primary',
          jumpGroup: 'input-group input-group-sm tt-jump',
          jumpButton: 'btn btn-primary',
          jumpInput: 'form-control tt-jump-input',
          pageSizeColumn: 'col-md-4 d-flex justify-content-md-end align-items-center gap-2',
          pageSizeLabel: 'form-label mb-0 text-nowrap',
          pageSizeSelect: 'form-select form-select-sm w-auto',
          spinner: 'tt-spinner',
          spinnerBorder: 'spinner-border text-primary',
          sortable: 'tt-sortable',
          sortIcon: 'tt-sort-icon ms-1'
     };

     // Font Awesome 7 (free) class names. Override with options.icons for other icon sets.
     var DEFAULT_ICONS = {
          filter: 'fa-solid fa-filter fa-lg',
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
          (children || []).forEach(function (child) { if (child) node.appendChild(child); });
          return node;
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
          this.elements = {};

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
          this.firstButtonId = prefix + 'first';
          this.prevButtonId = prefix + 'prev';
          this.nextButtonId = prefix + 'next';
          this.lastButtonId = prefix + 'last';
          this.jumpButtonId = prefix + 'jump';
          this.jumpInputId = prefix + 'jumpInput';
          this.selectPgSizerId = prefix + 'pageSize';
          this.spinnerId = prefix + 'spinner';

          this.totalItems = Math.max(0, toInt(this.table.getAttribute(this.totalItemsAttribute), 0));

          // Controls are placed around the nearest Bootstrap .row containing the table.
          this.container = (options.container && (typeof options.container === 'string' ? document.getElementById(options.container) : options.container))
               || this.table.closest('.row')
               || this.table.parentNode;

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
          this.showSpinner(true);
          this.dataBinder(this.page, this.getPageSize(), this.sortColumn, this.sortDirection, this.filterColumn, this.filterValue, this.requestId);
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

     proto.showSpinner = function (show) {
          if (this.elements.spinner) this.elements.spinner.hidden = !show;
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
          this.refresh();
     };

     proto.ClearFilterQuery = function () {
          var wasActive = !!(this.filterColumn && this.filterValue);
          this.filterColumn = '';
          this.filterValue = '';
          if (this.elements.filterSelect) this.elements.filterSelect.selectedIndex = 0;
          if (this.elements.filterInput) this.elements.filterInput.value = '';
          if (wasActive) {
               this.page = 1;
               this.refresh();
          }
     };

     proto.ToggleFilterRow = function () {
          var row = this.elements.filterRow;
          row.hidden = !row.hidden;
          this.elements.filterToggle.setAttribute('aria-expanded', String(!row.hidden));
          if (row.hidden) this.ClearFilterQuery();
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

     proto.UpdateSortIndicators = function () {
          var self = this;
          this.headerCells.forEach(function (th) {
               var existing = th.querySelector('.tt-sort-icon');
               if (existing) existing.parentNode.removeChild(existing);
               th.removeAttribute('aria-sort');
               if (self.columnKey(th) !== self.sortColumn || !th.classList.contains('sortable')) return;
               var asc = self.sortDirection === 'asc';
               th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
               var icon = el('i', { className: self.classes.sortIcon + ' ' + (asc ? self.icons.sortAsc : self.icons.sortDesc), 'aria-hidden': 'true' });
               (th.querySelector('a') || th).appendChild(icon);
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

     proto.CreateSearchAndFilterRows = function () {
          var self = this, c = this.classes, e = this.elements;

          e.info = el('span', { id: this.tableInfoId, className: c.info, 'aria-live': 'polite' });
          if (this.showFilter) {
               e.filterToggle = el('button', { type: 'button', id: this.filterIconId, className: c.filterToggle, title: 'Filter', 'aria-label': 'Toggle filter', 'aria-controls': this.filterId, 'aria-expanded': 'false' },
                    [el('i', { className: this.icons.filter, 'aria-hidden': 'true' })]);
               e.filterToggle.addEventListener('click', function () { self.ToggleFilterRow(); });
          }

          e.searchInput = el('input', { type: 'search', id: this.searchInputId, className: c.searchInput, placeholder: 'Search this page', 'aria-label': 'Search this page' });
          var searchForm = el('form', { role: 'search', className: c.searchColumn }, [e.searchInput]);
          searchForm.addEventListener('submit', function (evt) { evt.preventDefault(); });
          e.searchInput.addEventListener('input', function () { self.SearchTable(); });

          this.insertBefore(el('div', { className: c.toolbarRow }, [
               el('div', { className: c.infoColumn }, [e.filterToggle, e.info]),
               searchForm
          ]));

          if (!this.showFilter) return;

          e.filterSelect = el('select', { id: this.selectFilterColumnId, className: c.filterSelect, 'aria-label': 'Filter column' },
               [el('option', { value: '', text: 'Select a column', disabled: true, selected: true })]);
          e.filterInput = el('input', { type: 'text', id: this.filterValueInputId, className: c.filterInput, placeholder: 'Value', 'aria-label': 'Filter value', maxlength: '100' });
          var filterButton = el('button', { type: 'submit', id: this.filterFilterButtonId, className: c.filterButton, text: 'Filter' });
          var clearButton = el('button', { type: 'button', id: this.clearFilterButtonId, className: c.clearFilterButton, text: 'Clear' });

          e.filterRow = el('form', { id: this.filterId, className: c.filterRow, hidden: true }, [
               el('div', { className: 'col-sm-3' }, [e.filterSelect]),
               el('div', { className: 'col-sm-4' }, [e.filterInput]),
               el('div', { className: 'col-sm-5 d-flex gap-2' }, [filterButton, clearButton])
          ]);
          e.filterRow.addEventListener('submit', function (evt) { evt.preventDefault(); self.FilterQuery(); });
          clearButton.addEventListener('click', function () { self.ClearFilterQuery(); });
          this.insertBefore(e.filterRow);
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

          var pagerRow = el('div', { className: c.pagerRow }, [
               el('div', { className: 'col-md-5' }, [
                    el('div', { className: c.pagerButtonGroup, role: 'group', 'aria-label': 'Pagination' }, [e.firstButton, e.prevButton, e.nextButton, e.lastButton])
               ]),
               el('div', { className: 'col-md-3' }, [el('div', { className: c.jumpGroup }, [e.jumpButton, e.jumpInput])]),
               el('div', { className: c.pageSizeColumn }, [
                    el('label', { className: c.pageSizeLabel, 'for': this.selectPgSizerId, text: 'Page size:' }),
                    e.pageSizeSelect
               ])
          ]);
          this.container.parentNode.insertBefore(pagerRow, this.container.nextSibling);

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
               var classes = ' ' + th.className + ' ';

               if (classes.indexOf(' sortable ') !== -1) {
                    th.classList.add(self.classes.sortable);
                    th.addEventListener('click', function (evt) {
                         evt.preventDefault();
                         self.ProcessSortEvent(column);
                    });
               }

               if (self.showFilter && classes.indexOf(' filterable ') !== -1) {
                    var label = th.textContent.trim() || column;
                    self.elements.filterSelect.appendChild(el('option', { value: column, text: label }));
               }
          });

          this.UpdateSortIndicators();
     };

     proto.AddSpinner = function () {
          var c = this.classes;
          var content = this.spinnerSource
               ? el('img', { src: this.spinnerSource, alt: 'Loading...' })
               : el('div', { className: c.spinnerBorder }, [el('span', { className: 'visually-hidden', text: 'Loading...' })]);
          this.elements.spinner = el('div', { id: this.spinnerId, className: c.spinner, role: 'status', hidden: true }, [content]);
          this.insertBefore(this.elements.spinner);
     };

     return TurboTablesLib;
}));
