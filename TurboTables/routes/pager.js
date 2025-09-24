//Routing for pager web page
var express = require('express');
var router = express.Router();
const axios = require('axios');

var customerRoute = '/api/customer/';
var page = 1;
var pageSize = 5;
var sortColumn = 'Id';
var sortDirection = 'asc';
var filterColumn = '';
var filterValue = '';

/* GET default route */
/* http://localhost/pager */
router.get('/', async function (req, res, next) {
     var response = null;
     var json = null;
     //var options = setGetOptions('http://' + req.headers.host + customerRoute + '?page=' + page + '&pageSize=' + pageSize,
     var options = setGetOptions('http://' + req.headers.host + customerRoute + '?page=' + page + '&pageSize=' + pageSize + '&sortColumn=' + sortColumn + '&direction=' + sortDirection +
          '&filterColumn=' + filterColumn + '&filterValue' + filterValue,
          {}
     );

     //Call customer REST service
    try {
        response = await axios.get(options.url);
        json = response.data;
        if (response.status === 200) {
            var json = JSON.parse(body);
            res.render('pager', { title: 'Paged Customer List', customers: json });
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