import { createServer } from 'node:http';
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const html = readFileSync(new URL('./index.html', import.meta.url));
const client = readFileSync(new URL('./client.js', import.meta.url));
const dataDir = resolve(process.env.TASK_DATA_DIR || 'data');
mkdirSync(dataDir, { recursive: true });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function workspace(req, res) {
  const header = req.headers['x-task-workspace'];
  if (header !== undefined) {
    if (typeof header !== 'string' || !uuid.test(header)) throw Object.assign(new Error('Invalid workspace'), { status: 400 });
    return header;
  }
  const cookie = /(?:^|;\s*)taskWorkspace=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  if (cookie && uuid.test(cookie)) return cookie;
  const id = randomUUID();
  res.setHeader('Set-Cookie', `taskWorkspace=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
  return id;
}
function load(id) {
  const file = join(dataDir, `${id}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
}
// Atomic replacement; synchronous mutations serialize this small single-process demo.
function save(id, tasks) {
  const file = join(dataDir, `${id}.json`);
  const temp = `${file}.tmp`;
  writeFileSync(temp, JSON.stringify(tasks));
  renameSync(temp, file);
}
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}
async function body(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json'))
    throw Object.assign(new Error('JSON content type required'), { status: 415 });
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size <= 16384) chunks.push(chunk);
  }
  if (size > 16384) throw Object.assign(new Error('Body too large'), { status: 413 });
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw Object.assign(new Error('Invalid JSON object'), { status: 400 }); }
}
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/api/health' && req.method === 'GET') return send(res, 200, { status: 'ok' });
    if (path === '/client.js' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(client);
    }
    if (path === '/' && req.method === 'GET') {
      workspace(req, res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    const match = /^\/api\/tasks(?:\/([^/]+))?$/.exec(path);
    if (!match) return send(res, 404, { error: 'Not found' });
    const scope = workspace(req, res);
    const id = match[1];
    if (id && !uuid.test(id)) return send(res, 400, { error: 'Invalid task ID' });
    const allowed = id ? ['GET', 'PATCH', 'DELETE'] : ['GET', 'POST', 'DELETE'];
    if (!allowed.includes(req.method)) {
      res.setHeader('Allow', allowed.join(', '));
      return send(res, 405, { error: 'Method not allowed' });
    }
    const payload = ['POST', 'PATCH'].includes(req.method) ? await body(req) : undefined;
    // Load AFTER awaiting input so concurrent saves see the latest committed state.
    const tasks = load(scope);
    if (!id) {
      if (req.method === 'GET') return send(res, 200, tasks);
      if (req.method === 'DELETE') {
        const file = join(dataDir, `${scope}.json`);
        if (existsSync(file)) unlinkSync(file);
        return send(res, 204);
      }
      if (Object.keys(payload).some(key => !['id', 'text'].includes(key)) ||
          typeof payload.text !== 'string' || !payload.text.trim() || payload.text.trim().length > 500 ||
          (payload.id !== undefined && (typeof payload.id !== 'string' || !uuid.test(payload.id))))
        return send(res, 422, { error: 'Task text must contain 1..500 characters; ID must be a UUID' });
      const taskId = payload.id || randomUUID();
      const existing = tasks.find(task => task.id === taskId);
      if (existing) return send(res, existing.text === payload.text.trim() ? 200 : 409,
        existing.text === payload.text.trim() ? existing : { error: 'Task ID already used with different text' });
      const task = { id: taskId, text: payload.text.trim(), completed: false };
      tasks.push(task); save(scope, tasks);
      res.setHeader('Location', `/api/tasks/${taskId}`);
      return send(res, 201, task);
    }
    const index = tasks.findIndex(task => task.id === id);
    if (index < 0) return send(res, 404, { error: 'Task not found' });
    if (req.method === 'GET') return send(res, 200, tasks[index]);
    if (req.method === 'DELETE') { tasks.splice(index, 1); save(scope, tasks); return send(res, 204); }
    if (Object.keys(payload).length !== 1 || typeof payload.completed !== 'boolean')
      return send(res, 422, { error: 'Provide only a boolean completed field' });
    tasks[index].completed = payload.completed; save(scope, tasks);
    return send(res, 200, tasks[index]);
  } catch (error) {
    if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'Unable to save tasks' });
    else res.end();
  }
});
server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
  console.log(`Listening on ${server.address().port}`);
});
