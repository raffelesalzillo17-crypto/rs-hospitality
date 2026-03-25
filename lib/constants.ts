// ── Costanti condivise dell'applicazione ──────────────────────────────────────

// ID property Il Tulipano (Supabase)
export const TULIPANO_ID = '0e16fce0-07d7-47eb-a44b-b4e239ec2cd4';

// Feed iCal OTA
export const ICAL_FEEDS = [
  {
    url: 'https://www.airbnb.it/calendar/ical/1151100346729188269.ics?t=7df772bef1f3499f822c4b6270cbe231',
    channel: 'airbnb',
  },
  {
    url: 'https://ical.booking.com/v1/export/t/28033739-d90f-4362-8f72-3cb8be1d31bc.ics',
    channel: 'booking',
  },
] as const;

// Pattern sommari iCal da ignorare (blocchi automatici OTA)
export const ICAL_NOISE_PATTERNS = [
  /not available/i, /closed/i, /blocked/i, /unavailable/i, /reserved/i,
];

// Set sommari iCal da nascondere nell'admin
export const ICAL_NOISE_LABELS = new Set([
  'reserved',
  'airbnb (not available)',
  'closed - not available',
  'not available',
]);

// ── Logica finanziaria ─────────────────────────────────────────────────────────

// Commissioni OTA sul lordo (percentuale decimale)
export const OTA_COMMISSION: Record<string, number> = {
  airbnb:  0.1891,
  booking: 0.2015,
  diretto: 0,
  direct:  0,
  no_tax:  0,
};

// Cedolare secca per canale (no_tax = 0%)
export const CEDOLARE_BY_CHANNEL: Record<string, number> = {
  airbnb:  0.21,
  booking: 0.21,
  diretto: 0.21,
  direct:  0.21,
  no_tax:  0,
};

export const CEDOLARE_RATE = 0.21;   // default fallback
export const COSTI_PULIZIE = 20;     // €20 fisso per prenotazione

// Canali prenotazione
export const CHANNELS = ['Airbnb', 'Booking', 'Diretto', 'No Tax'] as const;
export type Channel = (typeof CHANNELS)[number];

// Stati prenotazione
export const STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof STATUSES)[number];

// Etichette e stili stato
export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#d0ead0', color: '#1a4d1a' },
  pending:   { bg: '#fef3cd', color: '#6b4c00' },
  cancelled: { bg: '#fad7d7', color: '#7a1a1a' },
};
export const STATUS_LABEL: Record<string, string> = {
  confirmed: 'confermata',
  pending:   'in attesa',
  cancelled: 'cancellata',
};

// Etichette canale (display)
export const CHANNEL_LABEL: Record<string, string> = {
  airbnb: 'Airbnb', booking: 'Booking',
  diretto: 'Diretto', direct: 'Diretto', no_tax: 'No Tax',
};

// Mesi italiani per il calendario
export const MONTH_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

// Palette colori app
export const PALETTE = {
  tabacco:  '#2C2416',
  lino:     '#F0EBE0',
  cammello: '#8B7355',
  sabbia:   '#D4C9B5',
} as const;
