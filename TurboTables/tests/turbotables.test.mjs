// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const TurboTablesLib = require('../public/javascripts/turbotables.js');

function tableMarkup(id, total, { headerSpace = false } = {}) {
     const gap = headerSpace ? ' ' : '';
     return `
     <div class="row"><div class="col-md-12">
          <table id="${id}" ctTotalItems="${total}">
               <thead><tr class="colHeaders">
                    <th id="${id}Id" data-column="Id" class="sortable filterable">${gap}<a href="#">Id</a></th>
                    <th id="${id}Name" data-column="Name" class="sortable filterable"><a href="#">Name</a></th>
                    <th id="${id}Notes">Notes</th>
               </tr></thead>
               <tbody>
                    <tr><td>1</td><td>Daffy Duck</td><td><a href="/x">link</a></td></tr>
                    <tr><td>2</td><td>Bugs Bunny</td><td>carrots</td></tr>
               </tbody>
          </table>
     </div></div>`;
}

function create(opts = {}, total = 95) {
     document.body.innerHTML = tableMarkup('T', total, opts.markup);
     const binder = vi.fn();
     const table = new TurboTablesLib(Object.assign({
          tableId: 'T', totalItemsAttribute: 'ctTotalItems', pageSize: 10,
          pagerSizeOptions: [[10, 25, -1], [10, 25, 'All']], sortColumn: 'Id', showFilter: true
     }, opts));
     table.setDataBinding(binder);
     return { table, binder, q: (s) => document.getElementById('T-' + s) };
}

const lastCall = (binder) => binder.mock.calls[binder.mock.calls.length - 1];

describe('construction', () => {
     beforeEach(() => { document.body.innerHTML = ''; });

     it('requires a tableId and an existing table', () => {
          expect(() => new TurboTablesLib()).toThrow(/tableId/);
          expect(() => new TurboTablesLib({ tableId: 'missing' })).toThrow(/missing/);
     });

     it('prefixes generated ids so two tables can share a page', () => {
          document.body.innerHTML = tableMarkup('A', 30) + tableMarkup('B', 7);
          new TurboTablesLib({ tableId: 'A', sortColumn: 'Id' });
          new TurboTablesLib({ tableId: 'B', sortColumn: 'Id' });
          expect(document.getElementById('A-next')).not.toBeNull();
          expect(document.getElementById('B-next')).not.toBeNull();
          expect(document.getElementById('next')).toBeNull();
          expect(document.getElementById('A-showing').textContent).toBe('Showing 1 to 10 of 30 entries');
          expect(document.getElementById('B-showing').textContent).toBe('Showing 1 to 7 of 7 entries');
     });

     it('creates inputs with the correct types', () => {
          const { q } = create();
          expect(q('search').type).toBe('search');
          expect(q('jumpInput').type).toBe('number');
          expect(q('filterValue').type).toBe('text');
     });

     it('selects the configured page size, adding it when it is not an option', () => {
          const { q } = create({ pageSize: 20 });
          const select = q('pageSize');
          expect(select.value).toBe('20');
          expect([...select.options].map(o => o.value)).toEqual(['10', '20', '25', '-1']);
     });

     it('treats a missing total as zero', () => {
          const { q } = create({}, 'abc');
          expect(q('showing').textContent).toBe('Showing 0 to 0 of 0 entries');
          expect(q('next').disabled).toBe(true);
     });
});

describe('paging', () => {
     it('disables First/Previous on page 1 and Next/Last on the last page', () => {
          const { table, q } = create();
          expect(q('first').disabled).toBe(true);
          expect(q('prev').disabled).toBe(true);
          expect(q('next').disabled).toBe(false);
          q('last').click();
          table.endDataBinding(95);
          expect(table.getPage()).toBe(10);
          expect(q('next').disabled).toBe(true);
          expect(q('last').disabled).toBe(true);
          expect(q('showing').textContent).toBe('Showing 91 to 95 of 95 entries');
     });

     it('calls the data binder with the table state and a request id', () => {
          const { binder, q } = create({ sortDirection: 'ASC' });
          q('next').click();
          expect(lastCall(binder)).toEqual([2, 10, 'Id', 'asc', '', '', 1]);
     });

     it('does not request past the last page', () => {
          const { table, binder } = create({}, 10);
          table.NextPage();
          table.LastPage();
          expect(binder).not.toHaveBeenCalled();
     });

     it('clamps jump input to the valid range and ignores non-numbers', () => {
          const { table, binder, q } = create();
          const input = q('jumpInput');
          input.value = '0'; q('jump').click();
          expect(table.getPage()).toBe(1);
          input.value = '999'; q('jump').click();
          expect(table.getPage()).toBe(10);
          const calls = binder.mock.calls.length;
          input.value = 'abc'; q('jump').click();
          expect(binder.mock.calls.length).toBe(calls);
          expect(input.value).toBe('10');
     });

     it('"All" sends the total item count and tracks it when the total changes', () => {
          const { table, binder, q } = create();
          const select = q('pageSize');
          select.value = '-1';
          select.dispatchEvent(new Event('change'));
          expect(lastCall(binder)[1]).toBe(95);
          table.endDataBinding(0);
          expect(table.getPageSize()).toBe(1);
          expect(table.getLastPage()).toBe(1);
          expect(q('showing').textContent).toBe('Showing 0 to 0 of 0 entries');
     });

     it('"All" re-requests when the total grows past the rows it asked for (clearing a filter)', () => {
          const { table, binder, q } = create({}, 23);
          const select = q('pageSize');
          select.value = '-1';
          select.dispatchEvent(new Event('change'));
          expect(lastCall(binder)[1]).toBe(23);
          table.endDataBinding(23, lastCall(binder)[6]);

          q('filterColumn').value = 'Name';
          q('filterValue').value = 'Duck';
          table.FilterQuery();
          table.endDataBinding(1, lastCall(binder)[6]);
          expect(q('showing').textContent).toBe('Showing 1 to 1 of 1 entries');

          table.ClearFilterQuery();
          expect(lastCall(binder)[1]).toBe(1);                 // still sized by the filtered total...
          const calls = binder.mock.calls.length;
          expect(table.endDataBinding(23, lastCall(binder)[6])).toBe(true);
          expect(binder.mock.calls.length).toBe(calls + 1);     // ...so it asks again for all 23
          expect(lastCall(binder).slice(0, 2)).toEqual([1, 23]);
          expect(q('spinner').hidden).toBe(false);
          table.endDataBinding(23, lastCall(binder)[6]);
          expect(binder.mock.calls.length).toBe(calls + 1);     // and stops there
          expect(q('showing').textContent).toBe('Showing 1 to 23 of 23 entries');
          expect(q('spinner').hidden).toBe(true);
     });

     it('changing page size returns to page 1', () => {
          const { table, binder, q } = create();
          table.goToPage(4);
          const select = q('pageSize');
          select.value = '25';
          select.dispatchEvent(new Event('change'));
          expect(lastCall(binder).slice(0, 2)).toEqual([1, 25]);
     });

     it('ignores endDataBinding from a superseded request', () => {
          const { table, binder } = create();
          table.goToPage(2);
          const first = lastCall(binder)[6];
          table.goToPage(3);
          const second = lastCall(binder)[6];
          expect(table.isCurrentRequest(first)).toBe(false);
          expect(table.endDataBinding(5, first)).toBe(false);
          expect(table.totalItems).toBe(95);
          expect(table.endDataBinding(95, second)).toBe(true);
     });

     it('shows the loading overlay over the table during a request', () => {
          const { table, q } = create();
          const overlay = q('spinner');
          expect(overlay.parentNode).toBe(table.table.parentNode);
          expect(overlay.parentNode.classList.contains('tt-wrapper')).toBe(true);
          table.goToPage(2);
          expect(overlay.hidden).toBe(false);
          expect(table.table.getAttribute('aria-busy')).toBe('true');
          table.endDataBinding(95);
          expect(overlay.hidden).toBe(true);
          expect(table.table.hasAttribute('aria-busy')).toBe(false);
     });

     it('uses spinnerSource as the overlay image when given', () => {
          const { q } = create({ spinnerSource: '/images/spinner.gif' });
          expect(q('spinner').querySelector('img').getAttribute('src')).toBe('/images/spinner.gif');
     });

     it('lays out the toolbar above (filter, info, search) and the pager below (buttons, jump, page size)', () => {
          const { table, q } = create();
          const toolbar = q('search').closest('.tt-toolbar');
          expect(table.container.previousSibling).toBe(toolbar);
          const start = toolbar.firstChild;
          expect([...start.children].map(n => n.id)).toEqual(['T-filterIcon', 'T-filter', 'T-chips', 'T-showing']);
          expect(toolbar.lastChild.contains(q('search'))).toBe(true);

          const pager = q('first').closest('.tt-pager');
          expect(table.container.nextSibling).toBe(pager);
          expect(pager.children[0].contains(q('first'))).toBe(true);
          expect(pager.children[1].contains(q('jump'))).toBe(true);
          expect(pager.children[2].contains(q('pageSize'))).toBe(true);
          expect(table.table.classList.contains('tt-table')).toBe(true);
     });

     it('omits the filter controls unless showFilter is set', () => {
          const { q } = create({ showFilter: false });
          expect(q('filterIcon')).toBeNull();
          expect(q('chips')).toBeNull();
          expect(q('showing')).not.toBeNull();
     });

     it('keeps hidden filter controls hidden despite Bootstrap display utilities', () => {
          const css = require('node:fs').readFileSync(require.resolve('../public/stylesheets/turbotables.css'), 'utf8');
          expect(css).toMatch(/\.tt-filter-panel\[hidden\][\s\S]*?display:\s*none\s*!important/);
          expect(css).toMatch(/\.tt-chips\[hidden\]/);
     });
});

describe('sorting', () => {
     it('shows the initial sort indicator', () => {
          create();
          const th = document.getElementById('TId');
          expect(th.getAttribute('aria-sort')).toBe('ascending');
          expect(th.querySelector('.tt-sort-icon')).not.toBeNull();
     });

     it('toggles direction on the same column and starts a new column ascending', () => {
          const { table, binder } = create();
          document.getElementById('TId').click();
          expect(table.getSortDirection()).toBe('desc');
          expect(document.querySelector('#TId .tt-sort-icon').classList.contains('fa-sort-down')).toBe(true);
          document.getElementById('TName').click();
          expect(lastCall(binder).slice(2, 4)).toEqual(['Name', 'asc']);
          expect(document.getElementById('TId').hasAttribute('aria-sort')).toBe(false);
          expect(document.querySelectorAll('.tt-sort-active').length).toBe(1);
          expect(document.querySelector('#TName .tt-sort-icon').classList.contains('tt-sort-active')).toBe(true);
     });

     it('shows a neutral icon on every inactive sortable column and none on others', () => {
          create();
          expect(document.querySelectorAll('.tt-sort-icon').length).toBe(2);
          expect(document.querySelector('#TName .tt-sort-icon').className).toContain('fa-sort');
          expect(document.querySelector('#TName .tt-sort-icon').classList.contains('tt-sort-active')).toBe(false);
          expect(document.querySelector('#TNotes .tt-sort-icon')).toBeNull();
     });

     it('works with whitespace before the header link and keeps the link text', () => {
          create({ markup: { headerSpace: true } });
          document.getElementById('TId').click();
          document.getElementById('TId').click();
          expect(document.getElementById('TId').textContent.trim()).toBe('Id');
     });

     it('does not throw when sortColumn matches no header', () => {
          const { table } = create({ sortColumn: 'Nope' });
          expect(() => document.getElementById('TName').click()).not.toThrow();
          expect(table.getSortColumn()).toBe('Name');
     });

     it('prevents the header link from navigating', () => {
          create();
          const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
          document.querySelector('#TName a').dispatchEvent(evt);
          expect(evt.defaultPrevented).toBe(true);
     });

     it('ignores headers that are not sortable', () => {
          const { binder } = create();
          document.getElementById('TNotes').click();
          expect(binder).not.toHaveBeenCalled();
     });
});

describe('filtering', () => {
     it('lists filterable columns with their header text', () => {
          const { q } = create();
          const options = [...q('filterColumn').options].slice(1).map(o => [o.value, o.text]);
          expect(options).toEqual([['Id', 'Id'], ['Name', 'Name']]);
     });

     it('filtering resets to page 1 and sends column and value', () => {
          const { table, binder, q } = create();
          table.goToPage(5);
          q('filterColumn').value = 'Name';
          q('filterValue').value = ' Duck ';
          q('filterButton').click();
          expect(lastCall(binder).slice(0, 6)).toEqual([1, 10, 'Id', 'asc', 'Name', 'Duck']);
     });

     it('pressing Enter in the filter value submits the filter, not the page', () => {
          const { binder, q } = create();
          q('filterColumn').value = 'Name';
          q('filterValue').value = 'Duck';
          const evt = new Event('submit', { cancelable: true });
          q('filter').dispatchEvent(evt);
          expect(evt.defaultPrevented).toBe(true);
          expect(lastCall(binder)[4]).toBe('Name');
     });

     it('shows an applied filter as a chip that survives hiding the panel', () => {
          const { table, q } = create();
          expect(q('chips').hidden).toBe(true);
          q('filterIcon').click();
          expect(q('filter').hidden).toBe(false);
          expect(q('filterIcon').getAttribute('aria-expanded')).toBe('true');
          q('filterColumn').value = 'Name';
          q('filterValue').value = 'Duck';
          table.FilterQuery();
          expect(q('chips').hidden).toBe(true);          // controls are open, so no chip yet
          q('filterIcon').click();
          expect(q('filter').hidden).toBe(true);
          expect(table.getFilterColumn()).toBe('Name');
          expect(q('chips').hidden).toBe(false);
          expect(q('chips').textContent).toBe('Name: Duck');
          expect(q('filterIcon').classList.contains('active')).toBe(true);
     });

     it('removing the chip clears the filter and re-queries', () => {
          const { table, binder, q } = create();
          q('filterColumn').value = 'Name';
          q('filterValue').value = 'Duck';
          table.FilterQuery();
          q('chips').querySelector('button').click();
          expect(table.getFilterColumn()).toBe('');
          expect(lastCall(binder).slice(4, 6)).toEqual(['', '']);
          expect(q('chips').hidden).toBe(true);
          expect(q('filterIcon').classList.contains('active')).toBe(false);
          expect(q('filterValue').value).toBe('');
     });

     it('chip text is inserted as text, not HTML', () => {
          const { table, q } = create();
          q('filterColumn').value = 'Name';
          q('filterValue').value = '<img src=x onerror=alert(1)>';
          table.FilterQuery();
          expect(q('chips').querySelector('img')).toBeNull();
          expect(q('chips').textContent).toContain('<img');
     });

     it('Clear does not re-query when no filter was applied', () => {
          const { binder, q } = create();
          q('clearFilterButton').click();
          expect(binder).not.toHaveBeenCalled();
     });

     it('getFilterColumn works when the filter UI is disabled', () => {
          const { table } = create({ showFilter: false });
          expect(table.getFilterColumn()).toBe('');
          expect(document.getElementById('T-filter')).toBeNull();
     });
});

describe('search', () => {
     it('matches visible text, not markup', () => {
          const { q } = create();
          const input = q('search');
          input.value = 'href';
          input.dispatchEvent(new Event('input'));
          const rows = document.querySelectorAll('#T tbody tr');
          expect([...rows].every(r => r.hidden)).toBe(true);
          input.value = 'bunny';
          input.dispatchEvent(new Event('input'));
          expect([...rows].map(r => r.hidden)).toEqual([true, false]);
     });

     it('pressing Enter in search does not submit the page', () => {
          const { q } = create();
          const evt = new Event('submit', { cancelable: true });
          q('search').form.dispatchEvent(evt);
          expect(evt.defaultPrevented).toBe(true);
     });
});

describe('buildQueryString', () => {
     it('URL-encodes values so they cannot add parameters', () => {
          const { table, q } = create();
          q('filterColumn').value = 'Name';
          q('filterValue').value = 'a&pageSize=999999';
          table.FilterQuery();
          const params = new URLSearchParams(table.buildQueryString({ id: 7 }));
          expect(params.getAll('pageSize')).toEqual(['10']);
          expect(params.get('filterValue')).toBe('a&pageSize=999999');
          expect(params.get('id')).toBe('7');
     });

     it('omits filter parameters when no filter is active', () => {
          const { table } = create();
          expect(table.buildQueryString()).toBe('page=1&pageSize=10&sortColumn=Id&direction=asc');
     });
});

describe('icons and classes', () => {
     it('uses Font Awesome 7 classes by default and allows overrides', () => {
          create({ icons: { sortAsc: 'bi bi-caret-up' }, classes: { pagerButton: 'btn btn-dark' } });
          expect(document.querySelector('#T-filterIcon i').className).toBe('fa-solid fa-filter');
          expect(document.querySelector('.tt-search i').className).toBe('fa-solid fa-magnifying-glass');
          expect(document.querySelector('#TId .tt-sort-icon').classList.contains('bi-caret-up')).toBe(true);
          expect(document.getElementById('T-next').className).toBe('btn btn-dark');
     });
});
