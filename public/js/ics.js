// ─── ICS Generator ────────────────────────────────────────────────────────────
// Generates .ics calendar files compatible with Apple Calendar and Outlook.

const ICS = {

  // Build the ICS content string for a single event.
  build(event) {
    const start = this._toIcsDate(event.date, event.time);
    const end   = this._toIcsDate(event.date, event.time, 60); // assume 1hr duration
    const uid   = `${event.id}-${event.date}@accrabookcalendar.com`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Accra Book Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${this._escape(event.title)}`,
      `LOCATION:${this._escape(event.venue)}`,
      `DESCRIPTION:${this._escape('Organised by ' + event.organiser + '. Via Accra Book Calendar — accrabookcalendar.com')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  },

  // Trigger a browser download of the .ics file.
  download(event) {
    const content  = this.build(event);
    const blob     = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url      = URL.createObjectURL(blob);
    const filename = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.ics';
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Build Google Calendar URL for a given event.
  googleCalUrl(event) {
    const start = this._toIcsDate(event.date, event.time);
    const end   = this._toIcsDate(event.date, event.time, 60);
    const p     = encodeURIComponent;
    return [
      'https://calendar.google.com/calendar/render?action=TEMPLATE',
      `&text=${p(event.title)}`,
      `&dates=${start}/${end}`,
      `&location=${p(event.venue)}`,
      `&details=${p('Organised by ' + event.organiser + '. Via Accra Book Calendar.')}`,
    ].join('');
  },

  // ── Internals ──────────────────────────────────────────────────────────────

  // Parse "5:00 PM" or "14:30" → 24h integer hours & minutes.
  _parseTime(timeStr) {
    if (!timeStr) return { h: 10, m: 0 };
    const clean = timeStr.trim();
    const isPM  = /PM/i.test(clean);
    const isAM  = /AM/i.test(clean);
    const parts = clean.replace(/[APM\s]/gi, '').split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) : 0;
    if (isPM && h !== 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { h, m };
  },

  // Convert date string "YYYY-MM-DD" + time string + offset minutes → ICS datetime.
  _toIcsDate(dateStr, timeStr, offsetMinutes = 0) {
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const { h, m }     = this._parseTime(timeStr);
    const d            = new Date(yr, mo - 1, dy, h, m + offsetMinutes);
    const pad          = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  },

  _escape(str) {
    return (str || '').replace(/[\\,;]/g, s => '\\' + s).replace(/\n/g, '\\n');
  },

};
