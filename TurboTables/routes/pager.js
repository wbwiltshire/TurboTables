'use strict';
// Routing for the paged customer page (the TurboTables demo).
const express = require('express');
const repo = require('../repository');

const router = express.Router();
const PAGE_SIZE = 5;

router.get('/', function (req, res) {
     const customers = repo.findCustomersPaged({ page: 1, pageSize: PAGE_SIZE, sortColumn: 'Id', direction: 'asc' });
     res.render('pager', { title: 'Paged Customer List', customers: customers, pageSize: PAGE_SIZE });
});

module.exports = router;
