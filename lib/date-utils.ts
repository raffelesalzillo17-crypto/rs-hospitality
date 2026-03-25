// ── Utility condivise per date e importi ──────────────────────────────────────

// Mappa mesi italiani (abbreviati e completi) → MM
export const MESI: Record<string, string> = {
  gen: '01', feb: '02', mar: '03', apr: '04', mag: '05', giu: '06',
  lug: '07', ago: '08', set: '09', ott: '10', nov: '11', dic: '12',
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05',
  giugno: '06', luglio: '07', agosto: '08', settembre: '09', ottobre: '10',
  novembre: '11', dicembre: '12',
};

// Mappa mesi inglesi (3 lettere) → MM
export const MONTHS_EN: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * "12 mag" → "2026-05-12" (usa anno corrente, +1 se già passato)
 */
export function parseItalianShortDate(day: string, month: string): string {
  const mm = MESI[month.toLowerCase()];
  if (!mm) throw new Error(`Mese sconosciuto: ${month}`);
  const dd = day.padStart(2, '0');
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(`${year}-${mm}-${dd}T00:00:00`);
  if (candidate < now) year += 1;
  return `${year}-${mm}-${dd}`;
}

/**
 * "12 maggio 2026" o "12 mag 2026" → "2026-05-12"
 */
export function parseItalianLongDate(str: string): string {
  const m = str.trim().match(/^(\d{1,2})\s+([a-zà-ú]+)\s+(\d{4})$/i);
  if (!m) throw new Error(`Data non parsabile: ${str}`);
  const mm = MESI[m[2].toLowerCase()];
  if (!mm) throw new Error(`Mese sconosciuto: ${m[2]}`);
  return `${m[3]}-${mm}-${m[1].padStart(2, '0')}`;
}

/**
 * Parser flessibile — supporta:
 * - ISO: YYYY-MM-DD
 * - IT: DD/MM/YYYY
 * - EN word: DD Mon YYYY (es. "25 Mar 2026")
 */
export function parseDate(raw: string): string | null {
  if (!raw) return null;
  raw = raw.trim().replace(/['"]/g, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const mSlash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mSlash) return `${mSlash[3]}-${mSlash[2].padStart(2, '0')}-${mSlash[1].padStart(2, '0')}`;
  const mWord = raw.match(/^(\d{1,2})\s+([a-zA-Z]{3,})\s+(\d{4})$/);
  if (mWord) {
    const key = mWord[2].slice(0, 3).toLowerCase();
    const mm = MONTHS_EN[key] ?? MESI[key];
    if (mm) return `${mWord[3]}-${mm}-${mWord[1].padStart(2, '0')}`;
  }
  return null;
}

/**
 * Converte stringa importo in numero (gestisce formato IT 1.050,00 e simboli valuta).
 */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/[€$£\s'"]/g, '');
  // IT thousands separator: 1.050,00 → 1050.00
  if (/\d\.\d{3},/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
