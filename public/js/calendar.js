// ─── Calendar Module ───────────────────────────────────────────────────────────
// Handles all calendar rendering and event data management.

const Calendar = (() => {

  // ── State ────────────────────────────────────────────────────────────────────
  let events      = [];       // all events loaded from sheet
  let current     = new Date(); // month currently displayed
  let selected    = null;     // currently selected date
  let filters     = new Set(); // active type filters
  let addedIds    = new Set(); // event ids added to personal calendar
  let openMenu    = null;     // currently open atc dropdown

  current = new Date(current.getFullYear(), current.getMonth(), 1);

  // ── Type metadata ────────────────────────────────────────────────────────────
  const TYPES = {
    launch:   { label: 'Book Launch', pill: 'pill-launch',   chip: 'active-launch'   },
    club:     { label: 'Book Club',   pill: 'pill-club',     chip: 'active-club'     },
    fair:     { label: 'Book Fair',   pill: 'pill-fair',     chip: 'active-fair'     },
    reading:  { label: 'Reading',     pill: 'pill-reading',  chip: 'active-reading'  },
    workshop: { label: 'Workshop',    pill: 'pill-workshop', chip: 'active-workshop' },
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function dateStr(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function eventsForDate(d) {
    const s = dateStr(d);
    return events.filter(e =>
      e.date === s && (filters.size === 0 || filters.has(e.type))
    );
  }

  function isToday(d) {
    const t = new Date();
    return d.getDate() === t.getDate()
      && d.getMonth()  === t.getMonth()
      && d.getFullYear() === t.getFullYear();
  }

  // ── Grid ─────────────────────────────────────────────────────────────────────

  function buildGrid() {
    const grid = document.getElementById('grid');
    const lbl  = document.getElementById('month-label');
    grid.innerHTML = '';
    lbl.textContent = current.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const yr    = current.getFullYear();
    const mo    = current.getMonth();
    const first = new Date(yr, mo, 1).getDay();
    const dim   = new Date(yr, mo + 1, 0).getDate();

    // Fill 6 rows × 7 cols = 42 cells
    for (let i = 0; i < 42; i++) {
      const dayOffset = i - first;
      const d = new Date(yr, mo, 1 + dayOffset);
      const isOtherMonth = d.getMonth() !== mo;
      grid.appendChild(makeCell(d, isOtherMonth));
    }
  }

  function makeCell(d, otherMonth) {
    const cell = document.createElement('div');
    cell.className = 'cell' + (otherMonth ? ' other-month' : '');
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }));

    if (isToday(d))                             cell.classList.add('today');
    if (selected && dateStr(d) === dateStr(selected)) cell.classList.add('selected');

    // Date number
    const dn = document.createElement('div');
    dn.className = 'date-num';
    dn.textContent = d.getDate();
    cell.appendChild(dn);

    // Event pills / dots
    const evs = eventsForDate(d);
    if (evs.length) {
      const wrap = document.createElement('div');
      wrap.className = 'cell-pills';

      // Show up to 2 pills on desktop; dots on mobile (via CSS)
      evs.slice(0, 2).forEach(ev => {
        const tm = TYPES[ev.type] || TYPES.reading;
        const pill = document.createElement('div');
        pill.className = `pill ${tm.pill}`;
        pill.textContent = tm.label;
        wrap.appendChild(pill);

        const dot = document.createElement('div');
        dot.className = 'cell-dot';
        wrap.appendChild(dot);
      });

      if (evs.length > 2) {
        const more = document.createElement('div');
        more.style.cssText = 'font-size:9px;color:var(--c-text-3);padding:0 5px;';
        more.textContent = `+${evs.length - 2} more`;
        wrap.appendChild(more);
      }

      cell.appendChild(wrap);
    }

    cell.addEventListener('click', () => {
      selected = d;
      buildGrid();
      renderSidebar(d);
      // On mobile, scroll to sidebar
      if (window.innerWidth <= 700) {
        document.getElementById('sidebar').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    return cell;
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  function renderSidebar(d) {
    const lbl  = document.getElementById('sb-label');
    const body = document.getElementById('sb-body');
    lbl.textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    body.innerHTML = '';

    const evs = eventsForDate(d);
    if (!evs.length) {
      body.innerHTML = '<p class="sb-empty">No events on this day.</p>';
      return;
    }

    evs.forEach(ev => body.appendChild(makeEventCard(ev, d)));
  }

  function makeEventCard(ev, d) {
    const tm   = TYPES[ev.type] || TYPES.reading;
    const card = document.createElement('div');
    card.className = 'ecard';

    card.innerHTML = `
      <span class="ecard-type ${tm.pill}">${tm.label}</span>
      <div class="ecard-title">${ev.title}</div>
      <div class="ecard-meta">
        <strong>${ev.time}</strong><br>
        ${ev.venue}${ev.organiser ? `<br><span>${ev.organiser}</span>` : ''}
      </div>
    `;

    card.appendChild(makeAtcWidget(ev, d));
    return card;
  }

  // ── Add-to-Calendar widget ───────────────────────────────────────────────────

  function makeAtcWidget(ev, d) {
    const wrap = document.createElement('div');
    wrap.className = 'atc-wrap';

    if (addedIds.has(ev.id)) {
      const done = document.createElement('button');
      done.className = 'atc-btn added';
      done.textContent = '✓ Added to your calendar';
      done.disabled = true;
      wrap.appendChild(done);
      return wrap;
    }

    const btn  = document.createElement('button');
    btn.className = 'atc-btn';
    btn.textContent = '+ Add to my calendar';

    const menu = document.createElement('div');
    menu.className = 'atc-menu';

    const options = [
      {
        label: 'Google Calendar',
        sub:   'Opens in new tab',
        action() {
          window.open(ICS.googleCalUrl(ev), '_blank', 'noopener');
          markAdded();
        }
      },
      {
        label: 'Apple Calendar',
        sub:   'Downloads .ics file',
        action() { ICS.download(ev); markAdded(); }
      },
      {
        label: 'Outlook',
        sub:   'Downloads .ics file',
        action() { ICS.download(ev); markAdded(); }
      },
    ];

    options.forEach(opt => {
      const el = document.createElement('button');
      el.className = 'atc-option';
      el.innerHTML = `${opt.label}<span class="atc-sub">${opt.sub}</span>`;
      el.addEventListener('click', e => {
        e.stopPropagation();
        opt.action();
        closeMenu();
      });
      menu.appendChild(el);
    });

    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (openMenu && openMenu !== menu) closeOpenMenu();
      menu.classList.toggle('open');
      openMenu = menu.classList.contains('open') ? menu : null;
    });

    function markAdded() {
      addedIds.add(ev.id);
      renderSidebar(d); // re-render sidebar to show tick
    }

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  function closeOpenMenu() {
    if (openMenu) { openMenu.classList.remove('open'); openMenu = null; }
  }

  // ── Filters ──────────────────────────────────────────────────────────────────

  function buildFilters() {
    const row = document.getElementById('filters');
    row.innerHTML = '';
    Object.entries(TYPES).forEach(([type, tm]) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = tm.label;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        if (filters.has(type)) {
          filters.delete(type);
          chip.className = 'chip';
          chip.setAttribute('aria-pressed', 'false');
        } else {
          filters.add(type);
          chip.className = `chip ${tm.chip}`;
          chip.setAttribute('aria-pressed', 'true');
        }
        buildGrid();
        if (selected) renderSidebar(selected);
      });
      row.appendChild(chip);
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function prevMonth() {
    current.setMonth(current.getMonth() - 1);
    selected = null;
    buildGrid();
    clearSidebar();
  }

  function nextMonth() {
    current.setMonth(current.getMonth() + 1);
    selected = null;
    buildGrid();
    clearSidebar();
  }

  function clearSidebar() {
    document.getElementById('sb-label').textContent = 'Select a date';
    document.getElementById('sb-body').innerHTML = '<p class="sb-empty">Tap any date to see events.</p>';
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  return {
    init() {
      buildFilters();
      buildGrid();

      document.getElementById('prev').addEventListener('click', prevMonth);
      document.getElementById('next').addEventListener('click', nextMonth);
      document.addEventListener('click', closeOpenMenu);

      // Auto-select today if it's in the current month
      const today = new Date();
      if (today.getMonth() === current.getMonth() && today.getFullYear() === current.getFullYear()) {
        selected = today;
        buildGrid();
        renderSidebar(today);
      }
    },

    setEvents(data) {
      events = data;
      buildGrid();
      if (selected) renderSidebar(selected);
    },

    showLoading(show) {
      document.getElementById('loading-msg').style.display = show ? 'block' : 'none';
      document.getElementById('grid').style.opacity = show ? '0.4' : '1';
    },

    showError(show) {
      document.getElementById('error-msg').style.display = show ? 'block' : 'none';
    },
  };

})();
