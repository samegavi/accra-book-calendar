// ─── App Entry Point ───────────────────────────────────────────────────────────
// Handles data loading, caching, and WhatsApp modal.

// ── CSV Parser ────────────────────────────────────────────────────────────────
// Parses the Google Sheets CSV export into event objects.
// Expected columns (row 1 = headers, must match exactly):
//   id | date | type | title | venue | time | organiser | published
//
// "published" column: set to TRUE to show the event, anything else = hidden.

// Google Sheets often exports dates as "April 5, 2026" (or regional variants).
// The calendar grid and ICS layer expect strict YYYY-MM-DD.
function normalizeSheetDate(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(n => parseInt(n, 10));
    if (!y || !m || !d) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  const t = Date.parse(s.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, '$2/$1/$3'));
  if (Number.isNaN(t)) return '';
  const d = new Date(t);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseCsv(csvText) {
  // Google Sheets CSV uses CRLF (\r\n). split('\n') leaves \r on every line, so
  // e.g. published becomes "TRUE\r" and fails the === 'TRUE' check — no events.
  const normalized = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines      = normalized.split('\n').filter(line => line.length);
  const headers    = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1)
    .map(line => {
      // Handle quoted fields with commas inside
      const cols = [];
      let inside = false, field = '';
      for (const ch of line) {
        if (ch === '"') { inside = !inside; }
        else if (ch === ',' && !inside) { cols.push(field.trim()); field = ''; }
        else { field += ch; }
      }
      cols.push(field.trim());

      const row = {};
      headers.forEach((h, i) => { row[h] = (cols[i] || '').replace(/^"|"$/g, '').trim(); });
      return row;
    })
    .filter(row => {
      // Only include rows marked as published
      const pub = (row.published || '').toUpperCase();
      return pub === 'TRUE' || pub === '1' || pub === 'YES';
    })
    .map(row => ({
      id:         row.id         || Math.random().toString(36).slice(2),
      date:       normalizeSheetDate(row.date || ''),
      type:       (row.type      || 'reading').toLowerCase(),
      title:      row.title      || '',
      venue:      row.venue      || '',
      time:       row.time       || '',   // e.g. "5:00 PM"
      organiser:  row.organiser  || '',
    }))
    .filter(e => e.date && e.title); // require at minimum a date and title
}

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_KEY = 'abc_events_v2';

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    const ttl = (ABC_CONFIG.cacheTtlMinutes || 30) * 60 * 1000;
    if (Date.now() - ts < ttl) return data;
  } catch (_) {}
  return null;
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {}
}

// ── Load Events ───────────────────────────────────────────────────────────────
async function loadEvents() {
  Calendar.showError(false);

  // Try cache first
  const cached = getCached();
  if (cached) {
    Calendar.setEvents(cached);
    Calendar.showLoading(false);
    return;
  }

  Calendar.showLoading(true);

  try {
    const url      = ABC_CONFIG.sheetUrl;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text   = await response.text();
    const events = parseCsv(text);
    setCache(events);
    Calendar.setEvents(events);
    Calendar.showLoading(false);
  } catch (err) {
    console.error('Failed to load events:', err);
    Calendar.showLoading(false);
    Calendar.showError(true);
  }
}

// ── WhatsApp Modal ────────────────────────────────────────────────────────────
function initModal() {
  const btn     = document.getElementById('wa-btn');
  const modal   = document.getElementById('wa-modal');
  const close   = document.getElementById('wa-close');
  const link    = document.getElementById('wa-link');

  link.href = ABC_CONFIG.whatsappLink;

  btn.addEventListener('click', () => { modal.style.display = 'flex'; });
  close.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') modal.style.display = 'none';
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Calendar.init();
  initModal();
  loadEvents();
});
