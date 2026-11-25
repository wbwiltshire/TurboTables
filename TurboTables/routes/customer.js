'use strict';
// Routing for customer web pages.
// Data comes straight from the repository: the old version made an HTTP call
// back to 'http://' + req.headers.host, which let a forged Host header point the
// server at any address (SSRF).
const express = require('express');
const repo = require('../repository');

const router = express.Router();
const PAGE_SIZE = 21;

router.get('/add', function (req, res) {
     res.render('customeradd', { title: 'Add Customer', customer: { Id: 0, FirstName: '', LastName: '', EMail: '' } });
});

router.get('/', function (req, res) {
     const customers = repo.findCustomersPaged({ page: 1, pageSize: PAGE_SIZE });
     res.render('customer', { title: 'Customer List', customers: customers });
});

router.get('/:id', function (req, res, next) {
     const id = parseInt(req.params.id, 10);
     const customer = Number.isInteger(id) ? repo.findCustomerById(id) : null;
     if (!customer) {
          const err = new Error('Customer not found');
          err.status = 404;
          return next(err);
     }
     res.render('customerdetail', { title: 'Customer Details', customer: customer });
});

module.exports = router;
