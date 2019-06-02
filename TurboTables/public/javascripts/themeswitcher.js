$(document).ready(function () {
     var themeElement = null;

     checkCookie();

     $('#theme-toggle').click(function () {

          themeElement = document.getElementById('theme-toggle');
          if (themeElement.innerHTML.trim() === 'Light')
               setLightMode(themeElement);
          else
               setDarkMode(themeElement);
     });

});

function setDarkMode(themeElement) {
     var linkElements = document.styleSheets;
     var idx = 0;

     for (idx = 0; idx < linkElements.length; idx++) {
          if (linkElements[idx].href.indexOf('/bootstrap/') > 0) {
               linkElements[idx].disabled = true;
               break;
          }
     }
     for (idx = 0; idx < linkElements.length; idx++) {
          if (linkElements[idx].href.indexOf('bootswatch') > 0) {
               linkElements[idx].disabled = false;
               break;
          }
     }

     themeElement.innerHTML = 'Light';
     setCookie('currentTheme', 'Dark', 7);
}

function setLightMode(themeElement) {
     var linkElements = document.styleSheets;
     var idx = 0;

     for (idx = 0; idx < linkElements.length; idx++) {
          if (linkElements[idx].href.indexOf('/bootswatch/') > 0) {
               linkElements[idx].disabled = true;
               break;
          }
     }
     for (idx = 0; idx < linkElements.length; idx++) {
          if (linkElements[idx].href.indexOf('bootstrap') > 0) {
               linkElements[idx].disabled = false;
               break;
          }
     }

     themeElement.innerHTML = 'Dark';
     setCookie('currentTheme', 'Light', 7);

}

function setCookie(cname, cvalue, exdays) {
     var d = new Date();
     d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
     var expires = "expires=" + d.toUTCString();
     document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
     var name = cname + "=";
     var ca = document.cookie.split(';');
     for (var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) === ' ') {
               c = c.substring(1);
          }
          if (c.indexOf(name) === 0) {
               return c.substring(name.length, c.length);
          }
     }
     return '';
}

function checkCookie() {
     var currentTheme = getCookie("currentTheme");
     var themeElement = document.getElementById('theme-toggle');

     switch (currentTheme) {
          case 'Light':
               if (themeElement.innerHTML.trim() === 'Light')
                    setLightMode(themeElement);
               break;
          case 'Dark':
               if (themeElement.innerHTML.trim() === 'Dark')
                    setDarkMode(themeElement);
               break;
          default:
               setDarkMode(themeElement);
               break;

     }
}