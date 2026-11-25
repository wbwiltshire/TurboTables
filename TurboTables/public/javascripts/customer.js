// Plain (unpaged) customer list with a refresh button.
document.addEventListener('DOMContentLoaded', function () {
     'use strict';
     const PAGE_SIZE = 21;
     const tbody = document.getElementById('CustomerList');
     const spinner = document.getElementById('spinner');

     document.getElementById('refresh').addEventListener('click', async function (evt) {
          evt.preventDefault();
          spinner.hidden = false;
          try {
               const result = await Demo.getJson('/api/customer/?page=1&pageSize=' + PAGE_SIZE);
               if (result.customers.length)
                    tbody.innerHTML = Demo.renderTemplate('customerListHGrid', { CustomerList: result.customers });
               else
                    Demo.showNoRecords(tbody, 4);
          }
          catch (err) {
               console.error(err);
               Demo.showNoRecords(tbody, 4);
          }
          finally {
               spinner.hidden = true;
          }
     });
});
