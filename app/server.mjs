import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('./index.html', import.meta.url));
createServer((req, res) => {
  if (req.url !== '/') { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(3000, '127.0.0.1');
