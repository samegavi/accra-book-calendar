# Accra Book Calendar

A free, minimalist web calendar for literary events in Accra.

---

## Project Structure

```
accra-book-calendar/
├── public/
│   ├── index.html          ← The app
│   ├── css/
│   │   └── style.css       ← All styles
│   └── js/
│       ├── config.js       ← Your settings (sheet URL, WhatsApp link)
│       ├── ics.js          ← Calendar file generator
│       ├── calendar.js     ← Calendar rendering
│       └── app.js          ← Data loading & modal
├── .gitignore
├── netlify.toml            ← Netlify deploy config
└── README.md
```

---

## Setup: Google Sheet

This is your database. You edit the sheet; the site updates automatically.

### 1. Create the sheet

Create a new Google Sheet. Name it "Accra Book Calendar Events".

Row 1 must have these exact headers in this order:

| id | date | type | title | venue | time | organiser | published |
|----|------|------|-------|-------|------|-----------|-----------|

### 2. Column reference

| Column | Format | Example | Notes |
|--------|--------|---------|-------|
| `id` | Any unique text | `evt-001` | Use sequential numbers or slugs |
| `date` | YYYY-MM-DD | `2026-04-18` | Must be this format |
| `type` | One of the types below | `launch` | Lowercase only |
| `title` | Free text | `Homestretch: New Poetry` | Keep under 60 chars |
| `venue` | Free text | `Goethe-Institut Accra` | Address optional |
| `time` | 12h format | `5:30 PM` | Include AM/PM |
| `organiser` | Free text | `Goethe-Institut Accra` | Can be same as venue |
| `published` | TRUE or FALSE | `TRUE` | Only TRUE rows show on site |

### 3. Event types

Use exactly one of these in the `type` column:

- `launch` — Book launches
- `club` — Book club meetups
- `fair` — Book fairs & festivals
- `reading` — Author readings & Q&As
- `workshop` — Writing & literacy workshops

### 4. Publish the sheet as CSV

1. In Google Sheets: **File → Share → Publish to web**
2. Select the sheet tab (usually "Sheet1")
3. Change format from "Web page" to **"Comma-separated values (.csv)"**
4. Click **Publish** and confirm
5. Copy the URL — it looks like:
   `https://docs.google.com/spreadsheets/d/LONG_ID/pub?gid=0&single=true&output=csv`

### 5. Add the URL to the config

Open `public/js/config.js` and paste the URL:

```js
sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=0&single=true&output=csv',
```

---

## Setup: WhatsApp Group

1. Create a WhatsApp group for event submissions
2. Get the invite link: Group Info → Invite Link → Copy Link
3. Paste it in `public/js/config.js`:

```js
whatsappLink: 'https://chat.whatsapp.com/YOUR_INVITE_CODE',
```

**Your workflow:**
- Anyone in the group posts an event (text, poster, screenshot)
- You review it
- You add a row to the Google Sheet with `published` set to `FALSE` initially
- Once you're happy with the details, change `published` to `TRUE`
- The event appears on the calendar within 30 minutes (cache TTL)

To publish immediately during your session, open `config.js` and set `cacheTtlMinutes: 0` temporarily.

---

## Deploy to Netlify (free)

### First deploy

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Select your repo
4. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `public`
5. Click **Deploy**

Your site will be live at `something.netlify.app` in about 30 seconds.

### Custom domain

1. In Netlify: **Domain management → Add custom domain**
2. Enter your domain (e.g. `accrabookcalendar.com`)
3. Update your DNS nameservers to Netlify's (shown in the dashboard)
4. SSL is automatic and free

### Deploy to Cloudflare Pages (alternative)

1. Push to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a project**
3. Connect your repo
4. Build settings:
   - Build command: *(leave empty)*
   - Output directory: `public`
5. Deploy

---

## Day-to-Day: Adding Events

1. Open your Google Sheet
2. Add a new row with all the event details
3. Set `published` to `TRUE`
4. The site picks up the change within 30 minutes

**Tip:** Keep a few draft rows with `published` set to `FALSE` as you gather info from WhatsApp, then flip to `TRUE` when ready.

---

## Customisation

### Change cache duration
In `config.js`, edit `cacheTtlMinutes`. Set to `0` to disable caching during development.

### Add a new event type
1. Add the type key to `TYPES` in `calendar.js`
2. Add CSS classes for `.pill-{type}`, `.chip.active-{type}` in `style.css`

### Colours & fonts
All design tokens are CSS variables at the top of `style.css`. Dark mode is handled automatically via `prefers-color-scheme`.

---

## Tech stack

- Plain HTML, CSS, vanilla JavaScript — no build step, no framework
- Google Sheets as a database (free)
- Netlify or Cloudflare Pages for hosting (free)
- `.ics` downloads for Apple Calendar & Outlook
- Google Calendar deep links
