'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('morgan');
const hbs = require('hbs');
const repo = require('./repository');
const config = require('./config');
const pkg = require('./package.json');

const isDevelopment = process.env.NODE_ENV === 'development';

// Load the demo data
repo.loadCustomers(JSON.parse(fs.readFileSync(path.join(__dirname, 'customer.json'), 'utf8')));

const app = express();
app.disable('x-powered-by');

// Behind Nginx Proxy Manager: set TRUST_PROXY (e.g. "172.17.0.0/16" or "1") so
// req.ip and the access log show the real client address.
const trustProxy = config.parseTrustProxy(process.env.TRUST_PROXY);
if (trustProxy !== undefined)
     app.set('trust proxy', trustProxy);

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
     "style-src 'self' " + CDN,
     "font-src 'self' " + CDN,
     "img-src 'self' data:",
     // Bootstrap's files reference source maps that DevTools fetches; allow only that folder.
     "connect-src 'self' " + CDN + '/npm/bootstrap@5.3.9/dist/',
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
const customerApi = require('./routes/api/customer');
app.use('/api/customer', customerApi);

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
     const { port, host } = config.listenOptions(process.env);
     const server = app.listen(port, host, function () {
          console.log('TurboTables demo listening on ' + (host || 'all interfaces') + ', port ' + port + (isDevelopment ? ' (development)' : ''));
          console.log('Simulated API delay (DEMO_DELAY_MS): ' + customerApi.delayMs + ' ms');
     });
     server.on('error', function (err) {
          if (err.code === 'EADDRINUSE')
               console.error('Port ' + port + ' is already in use. Is another TurboTables instance (or "npm run dev") still running? Stop it, or set PORT.');
          else
               console.error(err);
          process.exit(1);
     });
}

module.exports = app;
