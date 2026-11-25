// Light/dark mode using Bootstrap 5.3's data-bs-theme. Loaded in <head> so the saved
// (or system-preferred) theme applies before first paint.
(function () {
     'use strict';
     var KEY = 'turbotables-theme';

     function preferred() {
          try {
               var saved = localStorage.getItem(KEY);
               if (saved === 'light' || saved === 'dark') return saved;
          } catch (e) { /* storage disabled */ }
          return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
     }

     function apply(theme) {
          document.documentElement.setAttribute('data-bs-theme', theme);
          var toggle = document.getElementById('theme-toggle');
          if (!toggle) return;
          var next = theme === 'dark' ? 'light' : 'dark';
          toggle.querySelector('i').className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
          toggle.querySelector('span').textContent = next === 'dark' ? 'Dark' : 'Light';
     }

     apply(preferred());
     document.addEventListener('DOMContentLoaded', function () {
          apply(preferred());
          document.getElementById('theme-toggle').addEventListener('click', function () {
               var theme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
               try { localStorage.setItem(KEY, theme); } catch (e) { /* storage disabled */ }
               apply(theme);
          });
     });
}());
