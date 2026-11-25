import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../app.js');

let server, base;
beforeAll(async () => {
     server = app.listen(0);
     await new Promise((resolve) => server.once('listening', resolve));
     base = 'http://127.0.0.1:' + server.address().port;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

const get = (path, headers) => fetch(base + path, { headers });
const json = async (path) => (await get(path)).json();

describe('GET /api/customer', () => {
     it('pages, sorts and reports the total', async () => {
          const body = await json('/api/customer/?page=2&pageSize=5&sortColumn=Id&direction=asc');
          expect(body.customers.map(c => c.Id)).toEqual([6, 7, 8, 9, 10]);
          expect(body.totalItems).toBeGreaterThan(10);
     });

     it('sorts descending without changing the order of later requests', async () => {
          const desc = await json('/api/customer/?page=1&pageSize=3&sortColumn=Id&direction=desc');
          expect(desc.customers[0].Id).toBeGreaterThan(desc.customers[2].Id);
          const plain = await json('/api/customer/?page=1&pageSize=3');
          expect(plain.customers.map(c => c.Id)).toEqual([1, 2, 3]);
     });

     it('filters by an allowed column', async () => {
          const body = await json('/api/customer/?page=1&pageSize=10&filterColumn=LastName&filterValue=duck');
          expect(body.totalItems).toBeGreaterThan(0);
          expect(body.customers.every(c => c.LastName.toLowerCase() === 'duck')).toBe(true);
     });

     it('ignores unknown sort and filter columns', async () => {
          const body = await json('/api/customer/?page=1&pageSize=3&sortColumn=constructor&filterColumn=__proto__&filterValue=x');
          expect(body.customers.map(c => c.Id)).toEqual([1, 2, 3]);
     });

     it('caps the page size', async () => {
          const body = await json('/api/customer/?page=1&pageSize=99999999');
          expect(body.customers.length).toBeLessThanOrEqual(1000);
     });

     it('survives repeated query parameters (used to crash the process)', async () => {
          const res = await get('/api/customer/?page=1&page=2&pageSize=5&filterColumn=Id&filterValue=a&filterValue=b');
          expect(res.status).toBe(200);
          const after = await get('/api/customer/?page=1&pageSize=1');
          expect(after.status).toBe(200);
     });

     it('handles garbage paging values', async () => {
          const body = await json('/api/customer/?page=-5&pageSize=abc');
          expect(body.customers[0].Id).toBe(1);
     });

     it('returns 404 JSON for an unknown id', async () => {
          const res = await get('/api/customer/999999');
          expect(res.status).toBe(404);
          expect((await res.json()).error).toBeTruthy();
     });
});

describe('POST /api/customer', () => {
     const post = (data) => fetch(base + '/api/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: new URLSearchParams(data)
     });

     it('rejects invalid input', async () => {
          const res = await post({ FirstName: '', LastName: 'x', EMail: 'not-an-email' });
          expect(res.status).toBe(422);
          expect((await res.json()).errors.length).toBe(2);
     });

     it('adds a valid customer with a new id', async () => {
          const res = await post({ FirstName: 'Test', LastName: 'User', EMail: 'test@example.com' });
          expect(res.status).toBe(201);
          const added = await res.json();
          const fetched = await json('/api/customer/' + added.Id);
          expect(fetched.EMail).toBe('test@example.com');
     });
});

describe('pages', () => {
     it('does not use the Host header to fetch data (SSRF)', async () => {
          const res = await get('/pager', { Host: 'attacker.invalid:9' });
          expect(res.status).toBe(200);
          expect(await res.text()).toContain('id="CustomerTable"');
     });

     it('renders the page scripts block inside the layout', async () => {
          const html = await (await get('/pager')).text();
          expect(html).toContain('/javascripts/turbotables.js');
          expect(html.indexOf('turbotables.js')).toBeGreaterThan(html.indexOf('bootstrap.bundle.min.js'));
     });

     it('escapes customer data in server-rendered pages', async () => {
          const res = await fetch(base + '/api/customer', {
               method: 'POST',
               headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
               body: new URLSearchParams({ FirstName: '<script>x</script>', LastName: 'X', EMail: 'x@example.com' })
          });
          const added = await res.json();
          const html = await (await get('/customer/' + added.Id)).text();
          expect(html).not.toContain('<script>x</script>');
          expect(html).toContain('&lt;script&gt;');
     });

     it('renders the home page with demo links, the GitHub link and the version', async () => {
          const html = await (await get('/')).text();
          for (const href of ['/pager', '/customer', '/customer/add', '/customer/3', 'https://github.com/wbwiltshire/TurboTables'])
               expect(html).toContain('href="' + href + '"');
          expect(html).toContain('gh/wbwiltshire/TurboTables@v' + require('../package.json').version);
          expect(html).toMatch(/\d+ customers\)/);
     });

     it('renders the about page with version and project links, without exact server versions', async () => {
          const html = await (await get('/about')).text();
          expect(html).toContain('v' + require('../package.json').version);
          expect(html).toContain('href="https://github.com/wbwiltshire/TurboTables/blob/master/CHANGELOG.md"');
          expect(html).not.toContain(process.version);
     });

     it('sends security headers and hides x-powered-by', async () => {
          const res = await get('/');
          expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
          expect(res.headers.get('x-content-type-options')).toBe('nosniff');
          expect(res.headers.get('x-powered-by')).toBeNull();
     });

     it('does not leak stack traces outside development', async () => {
          const res = await get('/customer/not-a-number');
          expect(res.status).toBe(404);
          expect(await res.text()).not.toMatch(/at .*\.js:\d+/);
     });
});
