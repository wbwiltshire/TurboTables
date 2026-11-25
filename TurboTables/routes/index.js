'use strict';
const express = require('express');

const router = express.Router();

router.get('/', function (req, res) {
     res.render('index', { title: 'Home', welcome: 'Express' });
});

router.get('/about', function (req, res) {
     res.render('about', { title: 'About' });
});

module.exports = router;
