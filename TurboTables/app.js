'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('morgan');
const hbs = require('hbs');
const repo = require('./repository');
const pkg = require('./package.json');

const isDevelopment = process.env.NODE_ENV === 'development';

// Load the demo data
repo.loadCustomers(JSON.parse(fs.readFileSync(path.join(__dirname, 'customer.json'), 'utf8')));

const app = express();
app.disable('x-powered-by');

// Behind Nginx Proxy Manager: set TRUST_PROXY (e.g. "1" or the proxy's IP) so
// req.ip and the access log show the real client address.
if (process.env.TRUST_PROXY) {
     const hops = parseInt(process.env.TRUST_PROXY, 10);
     app.set('trust proxy', Number.isInteger(hops) ? hops : process.env.TRUST_PROXY);
}

// View engine and helpers (Handlebars)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.locals.version = pkg.version;
app.locals.year = new Date().getFullYear();

// Per-request content blocks ({{#contentFor 'pageScripts'}} ... {{{block 'pageScripts'}}}).
// Stored on the render data root, not a module global, so concurrent requests can't mix.
hbs.registerHelper('contentFor', function (name, options) {
     const root = options.data.root;
     root._blocks = root._blocks || {};
     (root._blocks[name] = root._blocks[name] || []).push(options.fn(this));
});
hbs.registerHelper('block', function (name, options) {
     const blocks = options.data.root._blocks || {};
     return (blocks[name] || []).join('\n');
});

// Security headers. Handlebars.compile() in the browser needs 'unsafe-eval'; inline
// scripts and other script origins are still blocked.
const CDN = 'https://cdn.jsdelivr.net';
const CSP = [
     "default-src 'self'",
     "script-src 'self' " + CDN + " 'unsafe-eval'",
     "style-src 'self' " + CDN + ' https://fonts.googleapis.com', // Bootswatch Cosmo @imports Google Fonts
     "font-src 'self' " + CDN + ' https://fonts.gstatic.com',
     "img-src 'self' data:",
     "connect-src 'self'",
     "form-action 'self'",
     "frame-ancestors 'none'",
     "base-uri 'self'",
     "object-src 'none'"
].join('; ');
app.use(function (req, res, next) {
     res.set({
          'Content-Security-Policy': CSP,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
     });
     next();
});

app.use(logger(isDevelopment ? 'dev' : 'combined', { skip: function () { return process.env.NODE_ENV === 'test'; } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/customer', require('./routes/customer'));
app.use('/pager', require('./routes/pager'));
app.use('/api/customer', require('./routes/api/customer'));

// 404
app.use(function (req, res, next) {
     const err = new Error('Not Found');
     err.status = 404;
     next(err);
});

// Error handler: stack traces only when NODE_ENV=development is set explicitly.
app.use(function (err, req, res, next) {
     const status = err.status || err.statusCode || 500;
     if (status >= 500) console.error(err);
     res.status(status);
     const message = status >= 500 && !isDevelopment ? 'Internal Server Error' : err.message;
     if (req.originalUrl.startsWith('/api/'))
          return res.json({ error: message });
     res.render('error', { title: 'Error', message: message, status: status, stack: isDevelopment ? err.stack : '' });
});

// Start the server unless loaded by a test.
if (require.main === module) {
     const port = parseInt(process.env.PORT || '5000', 10);
     app.listen(port, function () {
          console.log('TurboTables demo listening on port ' + port + (isDevelopment ? ' (development)' : ''));
     });
}

module.exports = app;
