// Nulla fuggosegu statikus szerver a DOL A FA fejleszteshez.
// Inditas:  node server.js   ->  http://localhost:5173
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');

    // Fejlesztoi segedlet: a lap el tudja menteni a canvas tartalmat PNG-be.
    if (req.method === 'POST' && u.pathname === '/__shot') {
      const chunks = [];
      for await (const ch of req) chunks.push(ch);
      const dataUrl = Buffer.concat(chunks).toString('utf8');
      const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const name = (u.searchParams.get('name') || 'shot').replace(/[^a-z0-9_-]/gi, '');
      await mkdir(join(ROOT, 'shots'), { recursive: true });
      await writeFile(join(ROOT, 'shots', name + '.png'), Buffer.from(b64, 'base64'));
      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
      return;
    }

    let path = decodeURIComponent(u.pathname);
    if (path === '/' || path.endsWith('/')) path += 'index.html';
    const file = join(ROOT, normalize(path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(PORT, () => console.log(`DOL A FA fut: http://localhost:${PORT}`));
