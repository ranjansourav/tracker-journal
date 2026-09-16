const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/entries', (req, res) => {
  const entries = readData();
  res.json(entries);
});

app.post('/api/entries', (req, res) => {
  const entries = readData();
  const entry = {
    id: Date.now().toString(),
    title: req.body.title || '',
    content: req.body.content || '',
    tags: req.body.tags || [],
    createdAt: new Date().toISOString()
  };
  entries.unshift(entry);
  writeData(entries);
  res.json(entry);
});

app.delete('/api/entries/:id', (req, res) => {
  const id = req.params.id;
  let entries = readData();
  const before = entries.length;
  entries = entries.filter(e => e.id !== id);
  writeData(entries);
  res.json({ deleted: before - entries.length });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Tracker-Journal running at http://localhost:${PORT}`);
});
