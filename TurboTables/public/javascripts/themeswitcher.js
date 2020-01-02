$(document).ready(function () {
     var lightThemeStyle = { href: 'https://stackpath.bootstrapcdn.com/bootswatch/4.4.1/cosmo/bootstrap.min.css', integrity: 'sha256-KgiMiZgZazlcRqcTnpKlQRyoi1Y79W1dsn5CtKFtwH0=' };
     var darkThemeStyle = { href: 'https://stackpath.bootstrapcdn.com/bootswatch/4.4.1/slate/bootstrap.min.css', integrity: 'sha256-6NKhLkfyx8JV2uViSv6uakftk/GM5vfDWtY7ALlbG44=' };

     checkCookie(lightThemeStyle, darkThemeStyle);

     $('#theme-toggle').click(function () {
          var styleElement = document.getElementById('theme-style');
          var themeElement = document.getElementById('theme-toggle');

          if (themeElement.innerHTML.trim() === 'Light') 
               setTheme(themeElement, styleElement, lightThemeStyle, 'Dark', 'Light');
          else 
               setTheme(themeElement, styleElement, darkThemeStyle, 'Light', 'Dark');
     });

});

function setTheme(themeElement, styleElement, styleInfo, nextStyle, currentStyle) {
     styleElement.setAttribute('href', styleInfo.href);
     //styleElement.setAttribute('integrity', styleInfo.integrity);
     themeElement.innerHTML = nextStyle;
     setCookie('currentTheme', currentStyle, 7);
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

function checkCookie(lightThemeStyle, darkThemeStyle) {
     var themeElement = document.getElementById('theme-toggle');
     var styleElement = document.getElementById('theme-style');
     var currentTheme = getCookie("currentTheme");

     switch (currentTheme) {
          case 'Light':
               if (themeElement.innerHTML.trim() === 'Light')
                    setTheme(themeElement, styleElement, lightThemeStyle, 'Dark', 'Light');
               break;
          case 'Dark':
               if (themeElement.innerHTML.trim() === 'Dark')
                    setTheme(themeElement, styleElement, darkThemeStyle, 'Light', 'Dark');
               break;
          default:
               setTheme(themeElement, styleElement, darkThemeStyle, 'Light', 'Dark');
               break;

     }
}