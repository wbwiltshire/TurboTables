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

function FindCustomersPaged(page, pageSize, fieldProperty, fieldValue) {
     var customerPage = [];
     var itemCount = 0;
     var idx = 0;
     switch (fieldProperty.trim()) {
          case 'ID':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].Id === parseInt(fieldValue, 10)) {
                         customerPage.push(customers[idx]);
                         itemCount++;
                         break;
                    }
               }               
               break;
          case 'FirstName':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].FirstName.trim() === fieldValue.trim()) {
                         customerPage.push(customers[idx]);
                         itemCount++;
                         break;
                    }
               }               
               break;
          case 'LastName':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].LastName.trim() === fieldValue.trim()) {
                         customerPage.push(customers[idx]);
                         itemCount++;
                         break;
                    }
               }               
               break;
          case 'EMail':
               for (idx = 0; idx < customers.length; idx++) {
                    if (customers[idx].EMail.trim() === fieldValue.trim()) {
                         customerPage.push(customers[idx]);
                         itemCount++;
                         break;
                    }
               }               
               break;
          default:
               //
               break;
     }

     return { customers: customerPage, totalItems: itemCount }; 
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