'use strict';
const express = require('express');
const repo = require('../repository');

const router = express.Router();

router.get('/', function (req, res) {
     res.render('index', { title: 'Home', customerCount: repo.customerCount() });
});

router.get('/about', function (req, res) {
     res.render('about', { title: 'About', customerCount: repo.customerCount() });
});

module.exports = router;
