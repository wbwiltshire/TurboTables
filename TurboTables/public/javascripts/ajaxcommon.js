// Small fetch helpers shared by the demo pages (no jQuery needed).
(function (root) {
     'use strict';

     async function getJson(url) {
          const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error('GET ' + url + ' failed: ' + response.status);
          return response.json();
     }

     async function postForm(url, form) {
          const response = await fetch(url, {
               method: 'POST',
               headers: { Accept: 'application/json' },
               body: new URLSearchParams(new FormData(form))
          });
          const body = await response.json().catch(function () { return {}; });
          return { ok: response.ok, status: response.status, body: body };
     }

     // Compiles each <script type="text/x-handlebars-template"> once and caches it.
     // Handlebars {{ }} HTML-escapes values; never use {{{ }}} for data from the server.
     const templates = {};
     function renderTemplate(templateId, context) {
          if (!templates[templateId])
               templates[templateId] = Handlebars.compile(document.getElementById(templateId).innerHTML);
          return templates[templateId](context);
     }

     function showNoRecords(tbody, columns) {
          tbody.replaceChildren();
          const row = tbody.insertRow();
          const cell = row.insertCell();
          cell.colSpan = columns;
          cell.className = 'lead text-start text-danger';
          cell.textContent = 'No Records Found!';
     }

     root.Demo = { getJson: getJson, postForm: postForm, renderTemplate: renderTemplate, showNoRecords: showNoRecords };
}(window));
