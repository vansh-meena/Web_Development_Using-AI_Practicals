const fs = require('fs');
const path = require('path');
const { applySecurityHeaders } = require('./security');
const { validateRecord, MAX_BODY } = require('./validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(res, status, payload, isApi = true) {
  applySecurityHeaders(res, isApi);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        resolve({ tooLarge: true });
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      resolve({ raw });
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  // Resolve and confine to public/
  const resolved = path.resolve(PUBLIC_DIR, '.' + pathname);
  if (!resolved.startsWith(PUBLIC_DIR + path.sep) && resolved !== PUBLIC_DIR) {
    sendJson(res, 404, { error: 'Not Found' }, false);
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJson(res, 404, { error: 'Not Found' }, false);
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    applySecurityHeaders(res, false);
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(resolved).pipe(res);
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/records') {
    const bodyResult = await readBody(req);
    if (bodyResult.tooLarge) {
      sendJson(res, 413, { error: 'Payload Too Large' });
      return;
    }
    const raw = bodyResult.raw;
    if (raw === undefined) {
      sendJson(res, 413, { error: 'Payload Too Large' });
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      sendJson(res, 422, {
        error: 'Validation Error',
        details: { body: 'Malformed JSON' },
      });
      return;
    }
    const result = validateRecord(parsed);
    if (!result.valid) {
      sendJson(res, 422, {
        error: 'Validation Error',
        details: result.details,
      });
      return;
    }
    sendJson(res, 200, { ok: true, record: result.record });
    return;
  }

  sendJson(res, 404, { error: 'Not Found' });
}

async function handle(req, res) {
  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch (e) {
    sendJson(res, 400, { error: 'Bad Request' });
    return;
  }

  try {
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
    } else if (pathname === '/' || pathname === '/index.html') {
      serveStatic(req, res, '/index.html');
    } else if (
      pathname === '/styles.css' ||
      pathname === '/app.js'
    ) {
      serveStatic(req, res, pathname);
    } else {
      // Other static paths under public/
      serveStatic(req, res, pathname);
    }
  } catch (err) {
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }
}

module.exports = { handle };
