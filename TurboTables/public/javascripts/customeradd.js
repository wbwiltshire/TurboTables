document.addEventListener('DOMContentLoaded', function () {
     'use strict';
     const form = document.getElementById('createForm');
     const errors = document.getElementById('formErrors');

     form.addEventListener('submit', async function (evt) {
          evt.preventDefault();
          errors.hidden = true;
          const result = await Demo.postForm('/api/customer', form);
          if (result.ok) {
               window.location.href = '/customer/' + encodeURIComponent(result.body.Id);
               return;
          }
          errors.replaceChildren();
          (result.body.errors || ['Save failed (' + result.status + ').']).forEach(function (message) {
               const li = document.createElement('li');
               li.textContent = message;
               errors.appendChild(li);
          });
          errors.hidden = false;
     });
});
