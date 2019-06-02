module.exports = {
     loadCustomers: LoadCustomers,
     findAllCustomers: FindAllCustomers,
     findAllCustomersPaged: FindAllCustomersPaged,
     findAllCustomersPagedByOrder: FindAllCustomersPagedByOrder,
     findCustomersPaged: FindCustomersPaged,
     findCustomerById: FindCustomerById,
     addCustomer: AddCustomer
}
var lodash = require('lodash');
var customers = [];
var orderBy = 'Id';
var direction = 'asc';
var delay = 1000;

function LoadCustomers(c) {
     customers = c;
};

function FindAllCustomers() {
     return lodash.orderBy(customers, ['Id'], ['asc']);
};

//Function expect to start on page 1
//function FindAllCustomersPaged(page, pageSize, orderBy, direction) {
function FindAllCustomersPaged(page, pageSize) {
     var itemCount = 0;
     var customerPage = [];
     var intPage = parseInt(page, 10);
     var intPageSize = parseInt(pageSize, 10);
     if (intPageSize > customers.length)
          intPageSize = customers.length;
     var start = (intPage - 1) * intPageSize;
     customers = lodash.orderBy(customers, [orderBy], [direction]);
     itemCount = start + intPageSize;
     if (itemCount > customers.length)
          itemCount = customers.length;

     if (start > -1) {
          for (var idx = start; idx < itemCount; idx++)
               customerPage.push(customers[idx]);
     }
     return { customers: customerPage, totalItems: customers.length };
};

//Function expect to start on page 1
function FindAllCustomersPagedByOrder(page, pageSize, orderBy, direction) {
     var itemCount = 0;
     var customerPage = [];
     var intPage = parseInt(page, 10);
     var intPageSize = parseInt(pageSize, 10);
     if (intPageSize > customers.length)
          intPageSize = customers.length;
     var start = (intPage - 1) * intPageSize;
     customers = lodash.orderBy(customers, [orderBy], [direction]);
     itemCount = start + intPageSize;
     if (itemCount > customers.length)
          itemCount = customers.length;

     if (start > -1) {
          for (var idx = start; idx < itemCount; idx++)
               customerPage.push(customers[idx]);
     }
     return { customers: customerPage, totalItems: customers.length };
};

function FindCustomersPaged(page, pageSize, orderBy, direction, fieldProperty, fieldValue) {
     var results = [];
     var customerPage = [];
     var itemCount = 0;
     var idx = 0;
     var intPage = parseInt(page, 10);
     var intPageSize = parseInt(pageSize, 10);
     if (intPageSize > customers.length)
          intPageSize = customers.length;
     var start = (intPage - 1) * intPageSize;

     customers = lodash.orderBy(customers, [orderBy], [direction]);

     switch (fieldProperty.trim()) {
          case 'Id':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].Id === parseInt(fieldValue, 10)) {
                         results.push(customers[idx]);
                         break;
                    }
               }               
               break;
          case 'FirstName':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].FirstName.trim() === fieldValue.trim()) {
                         results.push(customers[idx]);
                    }
               }               
               break;
          case 'LastName':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].LastName.trim() === fieldValue.trim()) {
                         results.push(customers[idx]);
                    }
               }               
               break;
          case 'EMail':
               var email = '';
               for (idx = 0; idx < customers.length; idx++) {
                    email = customers[idx].EMail;
                    if (email.indexOf(fieldValue.trim()) >= 0) {
                         results.push(customers[idx]);
                    }
               }               
               break;
          default:
               //
               console.log('Invalid select column:' + fieldProperty.trim());
               break;
     }

     itemCount = start + intPageSize;
     if (itemCount > results.length)
          itemCount = results.length;

     if (start > -1) {
          for (idx = start; idx < itemCount; idx++)
               customerPage.push(results[idx]);
     }

     return { customers: customerPage, totalItems: results.length }; 
}

function FindCustomerById(id) {
     var customer = null;
     for (idx in customers) {
          if (id === customers[idx].Id) {
               customer = customers[idx];
               break;
          }
     }

     return customer;
};

function AddCustomer(customer) {
     var id = customers.length + 1;
     customer.Id = id;
     customers.push(customer);
};

function respond(data, cb) {
     cb(data);
}