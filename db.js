const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'journal.sqlite');

function ensureStorageDirectory() {
  const dir = path.dirname(DEFAULT_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeDatabase(databasePath = DEFAULT_DB_PATH) {
  ensureStorageDirectory();
  const db = new sqlite3.Database(databasePath);

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

  return db;
}

function normalizeEntry(row) {
  if (!row) return null;
  const parsed = JSON.parse(row.payload);
  return { ...parsed, id: parsed.id || row.id };
}

function normalizeTrade(row) {
  if (!row) return null;
  const parsed = JSON.parse(row.payload);
  return { ...parsed, id: parsed.id || row.id };
}

function getEntries(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM entries ORDER BY created_at DESC', (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map(normalizeEntry));
    });
  });
}

function getTrades(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM trades ORDER BY created_at DESC', (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map(normalizeTrade));
    });
  });
}

function saveEntry(db, payload) {
  const record = {
    ...payload,
    id: payload.id || Date.now().toString(36),
    createdAt: payload.createdAt || new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const sql = payload.id
      ? 'UPDATE entries SET payload = ?, created_at = ? WHERE id = ?'
      : 'INSERT INTO entries (id, payload, created_at) VALUES (?, ?, ?)';

    const values = payload.id
      ? [JSON.stringify(record), record.createdAt, payload.id]
      : [record.id, JSON.stringify(record), record.createdAt];

    db.run(sql, values, function (err) {
      if (err) return reject(err);
      resolve(record);
    });
  });
}

function saveTrade(db, payload) {
  const record = {
    ...payload,
    id: payload.id || Date.now().toString(36),
    createdAt: payload.createdAt || new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const sql = payload.id
      ? 'UPDATE trades SET payload = ?, created_at = ? WHERE id = ?'
      : 'INSERT INTO trades (id, payload, created_at) VALUES (?, ?, ?)';

    const values = payload.id
      ? [JSON.stringify(record), record.createdAt, payload.id]
      : [record.id, JSON.stringify(record), record.createdAt];

    db.run(sql, values, function (err) {
      if (err) return reject(err);
      resolve(record);
    });
  });
}

function deleteEntry(db, id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM entries WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

function deleteTrade(db, id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM trades WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
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
