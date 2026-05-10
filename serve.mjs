// Static file server + local API proxy — serves project root at http://localhost:3000
// Reads .env.local for environment variables, then routes /api/* to api/*.js handlers.
// Run with: node serve.mjs

import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire  } from 'module';

const ROOT    = path.dirname(fileURLToPath(import.meta.url));
const PORT    = process.env.PORT || 3000;
const require = createRequire(import.meta.url);

// Parse .env.local into process.env
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

// Mock Vercel req/res and call the CommonJS handler
async function handleApiRoute(urlPath, req, res) {
  const parts = urlPath.split('/').filter(Boolean); // ['api', 'search']
  if (parts.length !== 2) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const handlerFile = path.join(ROOT, 'api', `${parts[1]}.js`);
  if (!fs.existsSync(handlerFile)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `API route not found: /api/${parts[1]}` }));
    return;
  }

  const qIdx  = (req.url || '').indexOf('?');
  const query = qIdx >= 0
    ? Object.fromEntries(new URLSearchParams(req.url.slice(qIdx + 1)))
    : {};

  const mockReq = { query, method: req.method, url: req.url, headers: req.headers };

  let statusCode = 200;
  const resHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  let body = '';

  const mockRes = {
    status(code)    { statusCode = code; return mockRes; },
    json(obj)       { body = JSON.stringify(obj); return mockRes; },
    setHeader(k, v) { resHeaders[k] = v; return mockRes; },
    end(data)       { if (data !== undefined) body = String(data); return mockRes; },
  };

  try {
    // Use createRequire so Node treats api/*.js as CommonJS (no package.json needed)
    const handler = require(handlerFile);
    await handler(mockReq, mockRes);
  } catch (err) {
    statusCode = 500;
    body = JSON.stringify({ error: err.message });
    console.error('[api error]', err);
  }

  res.writeHead(statusCode, resHeaders);
  res.end(body);
}

http.createServer(async (req, res) => {
  let urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // Proxy API routes
  if (urlPath.startsWith('/api/')) {
    await handleApiRoute(urlPath, req, res);
    return;
  }

  const filePath = path.join(ROOT, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${urlPath}`);
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => {
  const hasKey = !!process.env.GOOGLE_API_KEY;
  console.log(`indi.cafe dev server → http://localhost:${PORT}`);
  if (!hasKey) console.warn('  ⚠  GOOGLE_API_KEY not set — add it to .env.local');
});
