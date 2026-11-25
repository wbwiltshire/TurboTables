// TurboTables demo: server-side paging, sorting and filtering of the customer list.
document.addEventListener('DOMContentLoaded', function () {
     'use strict';

     const tbody = document.getElementById('CustomerList');
     const tableElement = document.getElementById('CustomerTable');

     const customerTable = new TurboTablesLib({
          tableId: 'CustomerTable',
          totalItemsAttribute: 'ctTotalItems',
          page: 1,
          pageSize: parseInt(tableElement.dataset.pageSize, 10) || 5,
          pagerSizeOptions: [[5, 10, 25, -1], [5, 10, 25, 'All']],
          sortColumn: 'Id',
          sortDirection: 'asc',
          columnHeaderClass: 'colHeaders',
          showFilter: true,
          spinnerSource: '/images/spinner-128.gif'
     });

     customerTable.setDataBinding(loadCustomers);

     document.getElementById('refresh').addEventListener('click', function (evt) {
          evt.preventDefault();
          customerTable.refresh();
     });

     // Called by TurboTables with the table's state; requestId identifies this request.
     async function loadCustomers(page, pageSize, sortColumn, direction, filterColumn, filterValue, requestId) {
          const url = '/api/customer/?' + customerTable.buildQueryString();
          try {
               const result = await Demo.getJson(url);
               if (!customerTable.isCurrentRequest(requestId)) return;   // a newer request superseded this one
               if (result.totalItems > 0)
                    tbody.innerHTML = Demo.renderTemplate('customerListHGrid', { CustomerList: result.customers });
               else
                    Demo.showNoRecords(tbody, 4);
               customerTable.endDataBinding(result.totalItems, requestId);
          }
          catch (err) {
               console.error(err);
               if (!customerTable.isCurrentRequest(requestId)) return;
               Demo.showNoRecords(tbody, 4);
               customerTable.endDataBinding(0, requestId);   // always end binding so the spinner stops
          }
     }
});
