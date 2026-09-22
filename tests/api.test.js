const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { spawn } = require('node:child_process');

const serverPath = require.resolve('../server.js');

async function startServer() {
  const child = spawn(process.execPath, [serverPath], {
    cwd: __dirname + '/..',
    env: { ...process.env, PORT: '3456' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 5000);
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('Tracker-Journal running')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('Tracker-Journal running')) {
        clearTimeout(timer);
        resolve();
      }
      if (text.includes('EADDRINUSE')) {
        clearTimeout(timer);
        reject(new Error('Port already in use'));
      }
    });
  });

  return child;
}

test('POST /api/entries persists a new journal entry', async () => {
  const child = await startServer();

  try {
    const response = await fetch('http://localhost:3456/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'API test entry',
        category: 'Work',
        start: '09:00',
        duration: '45',
        notes: 'Automated API check',
        date: '2026-09-23'
      })
    });

    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.title, 'API test entry');
    assert.ok(data.id);
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});
