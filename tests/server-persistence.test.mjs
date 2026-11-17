import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';

test('tasks survive a server process restart', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'task-persistence-'));
  let child;
  async function stop() {
    if (child && child.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
  }
  async function start() {
    child = spawn(process.execPath, ['app/server.mjs'], { env: { ...process.env, PORT: '0', TASK_DATA_DIR: dir }, stdio: ['ignore', 'pipe', 'pipe'] });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      let output = '';
      child.stdout.on('data', data => {
        output += data;
        const match = /Listening on (\d+)/.exec(output);
        if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
      });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    });
  }
  try {
    const headers = { 'x-task-workspace': randomUUID(), 'Content-Type': 'application/json' };
    let url = await start();
    const response = await fetch(`${url}/api/tasks`, { method: 'POST', headers, body: JSON.stringify({ text: 'Durable task' }) });
    assert.equal(response.status, 201);
    const saved = await response.json();
    await stop(); url = await start();
    const fetched = await fetch(`${url}/api/tasks/${saved.id}`, { headers });
    assert.equal(fetched.status, 200);
    assert.deepEqual(await fetched.json(), saved);
  } finally { await stop(); await rm(dir, { recursive: true, force: true }); }
});
