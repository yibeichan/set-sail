// Signal Desk — client. All feed/notes data is rendered via DOM textContent (no innerHTML).
const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const safeUrl = (u) => /^https?:\/\//.test(u) ? u : '#';

// ---- localStorage (corruption-safe) ----
const loadStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch { return fallback; }
};
const saveStore = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota/private mode */ } };

// ---- data ----
let jobs = [];
let feedMeta = null; // { updatedAt, jobs }
let state = { role: 'all', region: 'all', query: '', newest: true };

const ageFor = (published, fallback) => {
  const t = Date.parse(published || '');
  if (Number.isNaN(t)) return fallback || 'Recently';
  const days = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;
};

// ---- rendering ----
function renderJobCard(job, index) {
  const card = el('article', 'job-card'); card.style.animationDelay = `${index * 40}ms`;
  card.append(el('span', 'job-strip'));
  const body = el('div');
  body.append(el('h4', null, job.title));
  body.append(el('div', 'job-meta', job.org));
  const tagWrap = el('div', 'job-tags');
  (job.tags || []).forEach((t) => tagWrap.append(el('span', 'tag', t)));
  body.append(tagWrap);
  const link = el('a', 'job-link', 'Open this job ↗');
  link.href = safeUrl(job.url); link.target = '_blank'; link.rel = 'noopener noreferrer';
  body.append(link);
  const side = el('div', 'job-source');
  side.append(document.createTextNode(job.source), el('span', 'job-age', ageFor(job.published, job.age)));
  card.append(body, side);
  return card;
}
function renderJobs() {
  const visible = jobs.filter((j) => {
    const haystack = `${j.title} ${j.org} ${j.source} ${(j.tags || []).join(' ')}`.toLowerCase();
    return (state.role === 'all' || j.role === state.role) && (state.region === 'all' || j.region === state.region) && (!state.query || haystack.includes(state.query.toLowerCase()));
  });
  const oldestFirst = [...visible].sort((a, b) => Date.parse(a.published || 0) - Date.parse(b.published || 0));
  const ordered = state.newest ? oldestFirst.reverse() : oldestFirst;
  $('#resultCount').textContent = String(visible.length).padStart(2, '0');
  const list = $('#jobList'); list.textContent = '';
  ordered.forEach((job, i) => list.append(renderJobCard(job, i)));
  $('#emptyState').hidden = visible.length > 0;
}
function renderStats() {
  const newThisWeek = jobs.filter((j) => { const t = Date.parse(j.published || ''); return !Number.isNaN(t) && Date.now() - t < 7 * 86400000; }).length;
  const sources = new Set(jobs.map((j) => j.source)).size;
  $('#statNewWeek').textContent = String(newThisWeek).padStart(2, '0');
  $('#statNewWeekNote').textContent = newThisWeek === 1 ? 'in the last 7 days' : 'in the last 7 days';
  $('#statSources').textContent = String(sources).padStart(2, '0');
  $('#statSourcesNote').textContent = 'live RSS feeds';
  if (feedMeta?.updatedAt) {
    const t = Date.parse(feedMeta.updatedAt);
    if (!Number.isNaN(t)) {
      const hrs = Math.max(0, Math.floor((Date.now() - t) / 3600000));
      $('#statusText').textContent = `monitoring ${sources} feed${sources === 1 ? '' : 's'} · updated ${hrs === 0 ? 'just now' : hrs === 1 ? '1h ago' : `${hrs}h ago`}`;
    }
  }
}

// ---- notes ----
function loadNotes() {
  const starterNotes = [
    { text: 'Search broad fields first — "neuroscience" surfaces more than a hyper-specific subfield.', date: 'Getting started' },
    { text: 'Feed is a starting point. Check the source map links for boards not covered here.', date: 'Getting started' },
    { text: 'Add your own caveats and follow-ups here — notes stay in this browser only.', date: 'Getting started' }
  ];
  const notes = loadStore('signal-notes', starterNotes);
  if (!localStorage.getItem('signal-notes')) saveStore('signal-notes', notes);
  $('#noteCount').textContent = String(notes.length).padStart(2, '0');
  const wrap = $('#notesList'); wrap.textContent = '';
  notes.slice().reverse().forEach((n) => { const d = el('div', 'note'); d.append(document.createTextNode(n.text), el('time', null, n.date)); wrap.append(d); });
}

// ---- profile + data export/import ----
const initialsFor = (name) => (name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'SD');
function renderProfileLabel() {
  const profile = loadStore('signal-profile', {});
  $('#profileAvatar').textContent = profile.name ? initialsFor(profile.name) : 'SD';
  $('.profile-label').textContent = profile.name || 'Your desk';
}
function exportData() {
  const payload = { exportedAt: new Date().toISOString(), profile: loadStore('signal-profile', {}), notes: loadStore('signal-notes', []) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'signal-desk-data.json';
  document.body.append(a); a.click(); a.remove();
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.profile && typeof data.profile === 'object') saveStore('signal-profile', data.profile);
      if (Array.isArray(data.notes)) saveStore('signal-notes', data.notes);
      loadNotes(); renderProfileLabel();
      const p = loadStore('signal-profile', {});
      $('#profileName').value = p.name || ''; $('#profileField').value = p.field || ''; $('#profileRegions').value = p.regions || '';
    } catch { alert('Could not import: not a valid Signal Desk export file.'); }
  };
  reader.readAsText(file);
}

// ---- wiring ----
document.querySelectorAll('.filter').forEach((b) => b.addEventListener('click', () => { const key = b.dataset.role ? 'role' : 'region'; state[key] = b.dataset[key]; document.querySelectorAll(`.filter[data-${key}]`).forEach((x) => x.classList.toggle('active', x === b)); renderJobs(); }));
$('#searchInput').addEventListener('input', (e) => { state.query = e.target.value.trim(); renderJobs(); });
document.querySelectorAll('[data-query]').forEach((b) => b.addEventListener('click', () => { $('#searchInput').value = b.dataset.query; state.query = b.dataset.query; renderJobs(); $('#searchInput').focus(); }));
$('#sortButton').addEventListener('click', () => { state.newest = !state.newest; $('#sortButton').firstChild.textContent = state.newest ? 'Newest first ' : 'Oldest first '; renderJobs(); });
$('#clearFilters').addEventListener('click', () => { state = { role: 'all', region: 'all', query: '', newest: true }; $('#searchInput').value = ''; document.querySelectorAll('.filter').forEach((x) => x.classList.toggle('active', x.dataset.role === 'all' || x.dataset.region === 'all')); renderJobs(); });
$('#noteInput').addEventListener('input', (e) => $('#charCount').textContent = `${e.target.value.length} / 180`);
$('#noteForm').addEventListener('submit', (e) => {
  e.preventDefault(); const input = $('#noteInput');
  if (!input.value.trim()) return;
  const notes = loadStore('signal-notes', []);
  notes.push({ text: input.value.trim(), date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()) });
  saveStore('signal-notes', notes);
  input.value = ''; $('#charCount').textContent = '0 / 180'; loadNotes();
});
$('#themeButton').addEventListener('click', () => document.body.classList.toggle('dark'));
const profileDialog = $('#profileDialog');
const profile = loadStore('signal-profile', {});
$('#profileName').value = profile.name || ''; $('#profileField').value = profile.field || ''; $('#profileRegions').value = profile.regions || '';
renderProfileLabel();
$('#profileButton').addEventListener('click', () => profileDialog.showModal());
$('#dialogClose').addEventListener('click', () => profileDialog.close());
$('#profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const next = { name: $('#profileName').value.trim(), field: $('#profileField').value.trim(), regions: $('#profileRegions').value.trim() };
  saveStore('signal-profile', next); renderProfileLabel(); profileDialog.close();
});
$('#exportData').addEventListener('click', exportData);
$('#importData').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#searchInput').focus(); } });

renderJobs(); loadNotes();

// ---- feed fetch (offline banner instead of fake fallback data) ----
fetch(`jobs.json?refresh=${Date.now()}`)
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((data) => {
    if (Array.isArray(data.jobs) && data.jobs.length) {
      jobs = data.jobs; feedMeta = data;
      $('#offlineBanner').hidden = true;
      renderJobs(); renderStats();
    } else { $('#offlineBanner').hidden = false; }
  })
  .catch(() => { $('#offlineBanner').hidden = false; });
