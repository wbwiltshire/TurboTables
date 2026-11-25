'use strict';
// Query-string validation for the paged customer API.
// Express 5's query parser turns repeated keys (?a=1&a=2) into arrays, so every
// value is reduced to a single bounded string before use.
const repo = require('./repository');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 1000;

function readString(value, maxLength) {
     if (Array.isArray(value)) value = value[0];
     if (typeof value !== 'string') return '';
     return value.trim().slice(0, maxLength);
}

function readInt(value, fallback, min, max) {
     const n = parseInt(readString(value, 12), 10);
     if (!Number.isInteger(n)) return fallback;
     return Math.min(Math.max(n, min), max);
}

function pickAllowed(value, allowed, fallback) {
     const v = readString(value, 50);
     const match = allowed.find(function (a) { return a.toLowerCase() === v.toLowerCase(); });
     return match || fallback;
}

function parsePagedQuery(query) {
     const filterColumn = pickAllowed(query.filterColumn, repo.FILTERABLE_COLUMNS, '');
     return {
          page: readInt(query.page, 1, 1, 1000000),
          pageSize: readInt(query.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
          sortColumn: pickAllowed(query.sortColumn, repo.SORTABLE_COLUMNS, 'Id'),
          direction: pickAllowed(query.direction, ['asc', 'desc'], 'asc'),
          filterColumn: filterColumn,
          filterValue: filterColumn ? readString(query.filterValue, 100) : ''
     };
}

module.exports = { parsePagedQuery, readString, readInt, MAX_PAGE_SIZE };
