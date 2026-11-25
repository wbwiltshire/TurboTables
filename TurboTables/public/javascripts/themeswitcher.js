// Bootswatch light/dark theme switcher. Loaded in <head> so the saved theme is applied
// before first paint. Each theme keeps its own SRI hash.
(function () {
     'use strict';
     var THEMES = {
          Light: { href: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.8/dist/cosmo/bootstrap.min.css', integrity: 'sha384-QOrayDhdkHbTAsh/gb0iGlDY/xHwI3sdDvyHkxnfpY20Y+Pa8aRHFXmLQYklmIx/', bsTheme: 'light' },
          Dark: { href: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.8/dist/slate/bootstrap.min.css', integrity: 'sha384-qhrBcipvKS9sQcI3lcoXpdKNs9jmQAunazzwZW3aZeuFMoRih2NYJIDsr6XTFndn', bsTheme: 'dark' }
     };
     var KEY = 'turbotables-theme';

     function saved() {
          try { return localStorage.getItem(KEY) === 'Light' ? 'Light' : 'Dark'; } catch (e) { return 'Dark'; }
     }

     function apply(name) {
          var theme = THEMES[name];
          var link = document.getElementById('theme-style');
          if (link && link.getAttribute('href') !== theme.href) {
               // integrity must change before href so the new file is checked against its own hash
               link.setAttribute('integrity', theme.integrity);
               link.setAttribute('href', theme.href);
          }
          document.documentElement.setAttribute('data-bs-theme', theme.bsTheme);
          var toggle = document.getElementById('theme-toggle');
          if (toggle) toggle.textContent = name === 'Light' ? 'Dark' : 'Light';
          try { localStorage.setItem(KEY, name); } catch (e) { /* storage disabled */ }
     }

     apply(saved());
     document.addEventListener('DOMContentLoaded', function () {
          apply(saved());
          document.getElementById('theme-toggle').addEventListener('click', function () {
               apply(saved() === 'Light' ? 'Dark' : 'Light');
          });
     });
}());
