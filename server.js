const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const {
  initializeDatabase,
  getEntries,
  getTrades,
  saveEntry,
  saveTrade,
  deleteEntry,
  deleteTrade
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const db = initializeDatabase();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await getEntries(db);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const entry = await saveEntry(db, { ...req.body, id: req.body.id || undefined });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const entry = await saveEntry(db, { ...req.body, id: req.params.id });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    const deleted = await deleteEntry(db, req.params.id);
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trades', async (req, res) => {
  try {
    const trades = await getTrades(db);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trades', async (req, res) => {
  try {
    const trade = await saveTrade(db, { ...req.body, id: req.body.id || undefined });
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/trades/:id', async (req, res) => {
  try {
    const trade = await saveTrade(db, { ...req.body, id: req.params.id });
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/trades/:id', async (req, res) => {
  try {
    const deleted = await deleteTrade(db, req.params.id);
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Tracker-Journal running at http://localhost:${PORT}`);
});
