async function fetchEntries() {
  const res = await fetch('/api/entries');
  return res.json();
}

function renderEntries(entries) {
  const container = document.getElementById('entries');
  container.innerHTML = '';
  entries.forEach(e => {
    const el = document.createElement('div');
    el.className = 'entry';
    el.innerHTML = `<strong>${escapeHtml(e.title)}</strong>
      <div class="meta">${new Date(e.createdAt).toLocaleString()} · ${ (e.tags||[]).join(', ') }</div>
      <p>${escapeHtml(e.content)}</p>
      <div><button data-id="${e.id}" class="delete">Delete</button></div>`;
    container.appendChild(el);
  });
  document.querySelectorAll('.delete').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      await fetch('/api/entries/' + id, { method: 'DELETE' });
      load();
    };
  });
}

function escapeHtml(s=""){
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function addEntry(payload){
  const res = await fetch('/api/entries', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return res.json();
}

async function load(){
  const entries = await fetchEntries();
  renderEntries(entries);
}

document.getElementById('entryForm').onsubmit = async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const tags = document.getElementById('tags').value.split(',').map(s=>s.trim()).filter(Boolean);
  await addEntry({ title, content, tags });
  document.getElementById('title').value='';
  document.getElementById('content').value='';
  document.getElementById('tags').value='';
  load();
};

load();
