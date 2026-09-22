const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'journal.sqlite');
const DEFAULT_DATABASE_URL = process.env.DATABASE_URL || '';

function ensureStorageDirectory() {
  const dir = path.dirname(DEFAULT_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeDatabase(databaseUrl = DEFAULT_DATABASE_URL || DEFAULT_DB_PATH) {
  if (databaseUrl && databaseUrl !== DEFAULT_DB_PATH && databaseUrl.startsWith('postgres')) {
    const client = new Client({ connectionString: databaseUrl });
    client.connect().catch((error) => {
      console.error('Postgres connection failed:', error.message);
    });

    client.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).catch(() => {});

    client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).catch(() => {});

    return { kind: 'postgres', client };
  }

  ensureStorageDirectory();
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(DEFAULT_DB_PATH);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  });

  return { kind: 'sqlite', db };
}

function normalizeEntry(row) {
  if (!row) return null;
  const parsed = JSON.parse(row.payload || '{}');
  return { ...parsed, id: parsed.id || row.id };
}

function normalizeTrade(row) {
  if (!row) return null;
  const parsed = JSON.parse(row.payload || '{}');
  return { ...parsed, id: parsed.id || row.id };
}

async function getEntries(db) {
  if (db.kind === 'postgres') {
    const result = await db.client.query('SELECT * FROM entries ORDER BY created_at DESC');
    return (result.rows || []).map(normalizeEntry);
  }

  return new Promise((resolve, reject) => {
    db.db.all('SELECT * FROM entries ORDER BY created_at DESC', (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map(normalizeEntry));
    });
  });
}

async function getTrades(db) {
  if (db.kind === 'postgres') {
    const result = await db.client.query('SELECT * FROM trades ORDER BY created_at DESC');
    return (result.rows || []).map(normalizeTrade);
  }

  return new Promise((resolve, reject) => {
    db.db.all('SELECT * FROM trades ORDER BY created_at DESC', (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map(normalizeTrade));
    });
  });
}

async function saveEntry(db, payload) {
  const record = {
    ...payload,
    id: payload.id || Date.now().toString(36),
    createdAt: payload.createdAt || new Date().toISOString()
  };

  if (db.kind === 'postgres') {
    const query = payload.id
      ? 'UPDATE entries SET payload = $1, created_at = $2 WHERE id = $3 RETURNING *'
      : 'INSERT INTO entries (id, payload, created_at) VALUES ($1, $2, $3) RETURNING *';
    const values = payload.id
      ? [JSON.stringify(record), record.createdAt, payload.id]
      : [record.id, JSON.stringify(record), record.createdAt];
    const result = await db.client.query(query, values);
    const row = result.rows[0];
    return row ? normalizeEntry(row) : record;
  }

  return new Promise((resolve, reject) => {
    const sql = payload.id
      ? 'UPDATE entries SET payload = ?, created_at = ? WHERE id = ?'
      : 'INSERT INTO entries (id, payload, created_at) VALUES (?, ?, ?)';

    const values = payload.id
      ? [JSON.stringify(record), record.createdAt, payload.id]
      : [record.id, JSON.stringify(record), record.createdAt];

    db.db.run(sql, values, function (err) {
      if (err) return reject(err);
      resolve(record);
    });
  });
}

async function saveTrade(db, payload) {
  const record = {
    ...payload,
    id: payload.id || Date.now().toString(36),
    createdAt: payload.createdAt || new Date().toISOString()
  };

  if (db.kind === 'postgres') {
    const query = payload.id
      ? 'UPDATE trades SET payload = $1, created_at = $2 WHERE id = $3 RETURNING *'
      : 'INSERT INTO trades (id, payload, created_at) VALUES ($1, $2, $3) RETURNING *';
    const values = payload.id
      ? [JSON.stringify(record), record.createdAt, payload.id]
      : [record.id, JSON.stringify(record), record.createdAt];
    const result = await db.client.query(query, values);
    const row = result.rows[0];
    return row ? normalizeTrade(row) : record;
  }

  return new Promise((resolve, reject) => {
    const sql = payload.id
      ? 'UPDATE trades SET payload = ?, created_at = ? WHERE id = ?'
      : 'INSERT INTO trades (id, payload, created_at) VALUES (?, ?, ?)';

    const values = payload.id
      ? [JSON.stringify(record), record.createdAt, payload.id]
      : [record.id, JSON.stringify(record), record.createdAt];

    db.db.run(sql, values, function (err) {
      if (err) return reject(err);
      resolve(record);
    });
  });
}

async function deleteEntry(db, id) {
  if (db.kind === 'postgres') {
    const result = await db.client.query('DELETE FROM entries WHERE id = $1', [id]);
    return result.rowCount || 0;
  }

  return new Promise((resolve, reject) => {
    db.db.run('DELETE FROM entries WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes || 0);
    });
  });
}

async function deleteTrade(db, id) {
  if (db.kind === 'postgres') {
    const result = await db.client.query('DELETE FROM trades WHERE id = $1', [id]);
    return result.rowCount || 0;
  }

  return new Promise((resolve, reject) => {
    db.db.run('DELETE FROM trades WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes || 0);
    });
  });
}

module.exports = {
  DEFAULT_DB_PATH,
  initializeDatabase,
  getEntries,
  getTrades,
  addEntry: saveEntry,
  saveEntry,
  saveTrade,
  deleteEntry,
  deleteTrade
};
