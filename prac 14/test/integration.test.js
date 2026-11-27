'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');

const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'deny',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin',
};

const REQUIRED_CSP_PARTS = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
];

async function startServer() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = 'http://127.0.0.1:' + port;
  return { server, base };
}

function checkHeaders(headers, expectCacheNoStore) {
  for (const [k, v] of Object.entries(REQUIRED_HEADERS)) {
    assert.equal((headers[k] || '').toLowerCase(), v, 'header ' + k);
  }
  const csp = headers['content-security-policy'] || '';
  for (const part of REQUIRED_CSP_PARTS) {
    assert.ok(csp.includes(part), 'CSP includes ' + part);
  }
  if (expectCacheNoStore) {
    assert.equal(headers['cache-control'], 'no-store', 'cache-control no-store on API');
  }
}

test('health endpoint', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/health');
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.status, 'ok');
    checkHeaders(Object.fromEntries(res.headers), true);
  } finally {
    server.close();
  }
});

test('valid record submission', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ada', email: 'ada@example.com', note: 'hi' }),
    });
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.ok, true);
    assert.ok(j.record);
    assert.equal(j.record.name, 'Ada');
    checkHeaders(Object.fromEntries(res.headers), true);
  } finally {
    server.close();
  }
});

test('empty name rejected', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ', email: 'a@b.co' }),
    });
    assert.equal(res.status, 422);
    const j = await res.json();
    assert.equal(j.error, 'Validation Error');
    assert.ok(j.details.name);
  } finally {
    server.close();
  }
});

test('malformed email rejected', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob', email: 'not-an-email' }),
    });
    assert.equal(res.status, 422);
    const j = await res.json();
    assert.ok(j.details.email);
  } finally {
    server.close();
  }
});

test('HTML markup rejected', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '<script>x</script>', email: 'a@b.co' }),
    });
    assert.equal(res.status, 422);
    const j = await res.json();
    assert.ok(j.details.name);
  } finally {
    server.close();
  }
});

test('unexpected object input rejected', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: { x: 1 }, email: 'a@b.co' }),
    });
    assert.equal(res.status, 422);
    const j = await res.json();
    assert.ok(j.details.name);
  } finally {
    server.close();
  }
});

test('unknown route returns 404', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/nope');
    assert.equal(res.status, 404);
    const j = await res.json();
    assert.equal(j.error, 'Not Found');
    checkHeaders(Object.fromEntries(res.headers), true);
  } finally {
    server.close();
  }
});

test('security headers on static and error responses', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/');
    assert.equal(res.status, 200);
    checkHeaders(Object.fromEntries(res.headers), false);

    const res2 = await fetch(base + '/api/health');
    checkHeaders(Object.fromEntries(res2.headers), true);
  } finally {
    server.close();
  }
});

test('URL query regression', async () => {
  const { server, base } = await startServer();
  try {
    const r1 = await fetch(base + '/api/health?x=1');
    assert.equal(r1.status, 200);
    const j1 = await r1.json();
    assert.equal(j1.status, 'ok');

    const r2 = await fetch(base + '/api/health?next=/api/records');
    assert.equal(r2.status, 200);
    const j2 = await r2.json();
    assert.equal(j2.status, 'ok');
  } finally {
    server.close();
  }
});

test('malformed JSON rejected with 422', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad json',
    });
    assert.equal(res.status, 422);
  } finally {
    server.close();
  }
});

test('body over 10KB returns 413', async () => {
  const { server, base } = await startServer();
  try {
    const big = '{"name":"' + 'a'.repeat(11 * 1024) + '","email":"a@b.co"}';
    const res = await fetch(base + '/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: big,
    });
    assert.equal(res.status, 413);
  } finally {
    server.close();
  }
});

test('static path traversal refused', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(base + '/../../etc/passwd');
    // fetch normalizes the URL; try an encoded traversal
    const res2 = await fetch(base + '/%2e%2e/%2e%2e/server.js');
    assert.equal(res2.status, 404);
  } finally {
    server.close();
  }
});
