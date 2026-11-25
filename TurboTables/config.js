'use strict';
// Server settings from environment variables.

// TRUST_PROXY: a hop count ("1"), or anything Express accepts as a trust list,
// e.g. "loopback" or "172.17.0.0/16" (Nginx Proxy Manager in Docker). Unset: trust no proxy.
function parseTrustProxy(value) {
     if (value === undefined || value === null || String(value).trim() === '') return undefined;
     const text = String(value).trim();
     if (/^\d+$/.test(text)) return parseInt(text, 10);
     if (text === 'true') return true;
     if (text === 'false') return false;
     return text.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}

// PORT (default 5000) and HOST (default: all interfaces).
function listenOptions(env) {
     const port = parseInt(env.PORT || '5000', 10);
     return { port: Number.isInteger(port) ? port : 5000, host: (env.HOST || '').trim() || undefined };
}

module.exports = { parseTrustProxy, listenOptions };
