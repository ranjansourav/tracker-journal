const test = require('node:test');
const assert = require('node:assert/strict');

const { initializeDatabase, getEntries, addEntry, deleteEntry } = require('../db');

test('database layer stores and retrieves journal entries', async () => {
  const db = initializeDatabase(':memory:');
  const newEntry = await addEntry(db, {
    title: 'Test entry',
    content: 'This is a test',
    tags: ['work']
  });

  assert.equal(newEntry.title, 'Test entry');
  assert.equal(newEntry.tags.length, 1);

  const entries = await getEntries(db);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].title, 'Test entry');

  const deleted = await deleteEntry(db, newEntry.id);
  assert.equal(deleted, 1);

  const remaining = await getEntries(db);
  assert.equal(remaining.length, 0);
});
