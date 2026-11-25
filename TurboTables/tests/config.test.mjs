import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseTrustProxy, listenOptions } = require('../config.js');

describe('parseTrustProxy', () => {
     it('is off when unset or blank', () => {
          expect(parseTrustProxy(undefined)).toBeUndefined();
          expect(parseTrustProxy('  ')).toBeUndefined();
     });

     it('reads a hop count as a number', () => {
          expect(parseTrustProxy('1')).toBe(1);
     });

     it('keeps subnets and names as a list (not parsed as a number)', () => {
          expect(parseTrustProxy('172.17.0.0/16')).toEqual(['172.17.0.0/16']);
          expect(parseTrustProxy('loopback, 172.17.0.0/16')).toEqual(['loopback', '172.17.0.0/16']);
     });

     it('accepts true and false', () => {
          expect(parseTrustProxy('true')).toBe(true);
          expect(parseTrustProxy('false')).toBe(false);
     });
});

describe('listenOptions', () => {
     it('defaults to port 5000 on all interfaces', () => {
          expect(listenOptions({})).toEqual({ port: 5000, host: undefined });
     });

     it('uses PORT and HOST', () => {
          expect(listenOptions({ PORT: '8006', HOST: '172.17.0.1' })).toEqual({ port: 8006, host: '172.17.0.1' });
     });

     it('falls back to 5000 for a non-numeric port', () => {
          expect(listenOptions({ PORT: 'abc' }).port).toBe(5000);
     });
});
