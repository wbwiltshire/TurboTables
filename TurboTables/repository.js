'use strict';
// In-memory customer repository for the TurboTables demo.
// All inputs are expected to be validated by the caller (see routes/api/customer.js).

const SORTABLE_COLUMNS = ['Id', 'FirstName', 'LastName', 'EMail'];
const FILTERABLE_COLUMNS = ['Id', 'FirstName', 'LastName', 'EMail'];

let customers = [];

function loadCustomers(list) {
     customers = Array.isArray(list) ? list.slice() : [];
}

function compareBy(column, direction) {
     const sign = direction === 'desc' ? -1 : 1;
     return function (a, b) {
          const x = a[column];
          const y = b[column];
          if (typeof x === 'number' && typeof y === 'number')
               return (x - y) * sign;
          return String(x ?? '').localeCompare(String(y ?? ''), undefined, { sensitivity: 'base' }) * sign;
     };
}

function matchesFilter(customer, column, value) {
     const needle = value.trim().toLowerCase();
     if (column === 'Id')
          return customer.Id === parseInt(needle, 10);
     if (column === 'EMail')
          return String(customer.EMail ?? '').toLowerCase().includes(needle);
     return String(customer[column] ?? '').trim().toLowerCase() === needle;
}

// Returns { customers: [...], totalItems: n } for a 1-based page.
// Sorting works on a copy so concurrent requests never reorder shared state.
function findCustomersPaged({ page, pageSize, sortColumn = 'Id', direction = 'asc', filterColumn = '', filterValue = '' }) {
     let results = customers;
     if (filterColumn && filterValue)
          results = results.filter(function (c) { return matchesFilter(c, filterColumn, filterValue); });

     results = results.slice().sort(compareBy(sortColumn, direction));

     const start = (page - 1) * pageSize;
     return { customers: results.slice(start, start + pageSize), totalItems: results.length };
}

function findCustomerById(id) {
     return customers.find(function (c) { return c.Id === id; }) || null;
}

function customerCount() {
     return customers.length;
}

function addCustomer(customer) {
     const nextId = customers.reduce(function (max, c) { return Math.max(max, c.Id); }, 0) + 1;
     const added = Object.assign({}, customer, { Id: nextId });
     customers.push(added);
     return added;
}

module.exports = {
     SORTABLE_COLUMNS,
     FILTERABLE_COLUMNS,
     loadCustomers,
     findCustomersPaged,
     findCustomerById,
     customerCount,
     addCustomer
};
