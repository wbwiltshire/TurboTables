'use strict';
// REST web service for Customer
const express = require('express');
const repo = require('../../repository');
const { parsePagedQuery, readString } = require('../../validation');

const router = express.Router();

// Upper bound on customers the demo will hold in memory, so anonymous
// POSTs cannot grow the process without limit.
const MAX_CUSTOMERS = 1000;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

// Optional simulated network latency so the spinner can be seen (DEMO_DELAY_MS).
const delayMs = Math.max(0, parseInt(process.env.DEMO_DELAY_MS || '0', 10) || 0);
router.delayMs = delayMs;
function delay() {
     return new Promise(function (resolve) { setTimeout(resolve, delayMs); });
}

router.get('/', async function (req, res) {
     await delay();
     res.json(repo.findCustomersPaged(parsePagedQuery(req.query)));
});

router.get('/:id', function (req, res) {
     const id = parseInt(req.params.id, 10);
     const customer = Number.isInteger(id) ? repo.findCustomerById(id) : null;
     if (!customer)
          return res.status(404).json({ error: 'Customer not found' });
     res.json(customer);
});

router.post('/', function (req, res) {
     const body = req.body || {};
     const customer = {
          FirstName: readString(body.FirstName, 50),
          LastName: readString(body.LastName, 50),
          EMail: readString(body.EMail, 100)
     };

     const errors = [];
     if (!customer.FirstName) errors.push('First name is required (max 50 characters).');
     if (!customer.LastName) errors.push('Last name is required (max 50 characters).');
     if (!customer.EMail || !EMAIL_PATTERN.test(customer.EMail)) errors.push('A valid e-mail address is required (max 100 characters).');
     if (errors.length)
          return res.status(422).json({ errors: errors });

     if (repo.customerCount() >= MAX_CUSTOMERS)
          return res.status(409).json({ errors: ['The demo customer list is full.'] });

     const added = repo.addCustomer(Object.assign(customer, {
          Address1: '4201 Disney Blvd. ',
          Address2: 'Unit 100',
          Notes: 'No notes',
          ZipCode: '32822',
          HomePhone: '4072581111',
          WorkPhone: '4072581111',
          CellPhone: '4073171111',
          CityId: 10,
          Active: true,
          ModifiedDt: new Date().toISOString(),
          CreateDt: new Date().toISOString()
     }));
     res.status(201).location('/customer/' + added.Id).json(added);
});

module.exports = router;
