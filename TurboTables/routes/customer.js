//Routing for customer web page
var express = require('express');
var router = express.Router();
const axios = require('axios');

var customerRoute = '/api/customer/';
var page = 1;
var pageSize = 21;
var orderBy = 'Id';
var direction = 'asc';

/* GET for add page. */
router.get('/add', function (req, res) {
    res.render('customeradd', { title: 'Add Customer', message: 'Hello', customer: { Id: 0, FirstName: '', LastName: '', EMail: '' } });
});

/* GET home page. */
router.get('/', async function (req, res, next) {
    var response = null;
    var json = null;
    var options = setGetOptions('http://' + req.headers.host + customerRoute + '?page=' + page + '&pageSize=' + pageSize,
        { }
    );

    try {
        response = await axios.get(options.url);
        json = response.data;
        if (response.status === 200) {
            res.render('customer', { title: 'Customer List', message: 'Hello', customers: json });
        }
        else
            console.log('Error: ' + response.statusCode + ' - ' + error);
    }
    catch (error) {
        console.log('Error: ', error);
        next(error);     
    }
});

/* GET by id page. */
router.get('/:id', async function (req, res, next) {
    var response = null;
    var json = null;
    var options = setGetOptions('http://' + req.headers.host + customerRoute + req.params.id,
        {}
    );

    try {
        response = await axios.get(options.url);
        json = response.data;
        if (response.status === 200) {
            res.render('customerdetail', { title: 'Customer Details', message: 'Hello', customer: json });
        }
        else
            console.log('Error: ' + response.statusCode + ' - ' + error);
    }
    catch (error) {
        console.log('Error: ', error);
        next(error);     
    }
});

function setGetOptions(u, q) {
    var options = {
        url: u,
        method: 'GET',
        qs: q
    };
    return options;
};
module.exports = router;