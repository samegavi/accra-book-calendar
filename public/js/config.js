// ─── Accra Book Calendar — Configuration ──────────────────────────────────────
// Edit this file to configure your deployment.
// Nothing else needs to change for basic setup.

const ABC_CONFIG = {

  // ── Google Sheets ────────────────────────────────────────────────────────────
  // 1. Publish your sheet: File → Share → Publish to web → CSV
  // 2. The URL looks like:
  //    https://docs.google.com/spreadsheets/d/SHEET_ID/pub?gid=SHEET_GID&single=true&output=csv
  // 3. Paste that URL below.
  sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRL17GLQ2QA6k4GLu_MlFqzsHCDegAKsoyQl7PZyUaqLGENcvsmiNEDqBCkNRkyexKOZz0QcsLhw9fi/pub?output=csv',

  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  // Replace with your WhatsApp group invite link.
  // Format: https://chat.whatsapp.com/INVITE_CODE
  whatsappLink: 'https://chat.whatsapp.com/KiH0NEGRG0BCkjFZXQySHF',

  // ── Site ─────────────────────────────────────────────────────────────────────
  siteName: 'Accra Book Calendar',
  siteTagline: 'literary events in Accra',

  // ── Cache ────────────────────────────────────────────────────────────────────
  // How long (minutes) to cache the sheet data in the browser.
  // Keeps the app fast and avoids hammering Google's servers.
  cacheTtlMinutes: 30,

};
