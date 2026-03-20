import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
// pdf-parse caricato dinamicamente per evitare crash serverless (legge fs al bootstrap)
async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('pdf-parse') as any;
  const fn = mod.default ?? mod;
  const result = await fn(buffer);
  return result.text as string;
}

// ── Supabase (service role) ───────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Mappa mesi italiani ───────────────────────────────────────────────────────
const MESI: Record<string, string> = {
  gen: '01', feb: '02', mar: '03', apr: '04', mag: '05', giu: '06',
  lug: '07', ago: '08', set: '09', ott: '10', nov: '11', dic: '12',
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05',
  giugno: '06', luglio: '07', agosto: '08', settembre: '09', ottobre: '10',
  novembre: '11', dicembre: '12',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedBooking {
  guest_name: string;
  check_in: string;
  check_out: string;
  gross_amount: number | null;
  ota_booking_ref: string;
  channel: string;
}

interface EmailPayload {
  from: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: { filename?: string; content?: string; data?: string }[];
}

// ── Date helpers ──────────────────────────────────────────────────────────────
/**
 * "12 mag" → "2026-05-12" (usa anno corrente, +1 se già passato)
 */
function parseItalianShortDate(day: string, month: string): string {
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
function parseItalianLongDate(str: string): string {
  const m = str.trim().match(/^(\d{1,2})\s+([a-zà-ú]+)\s+(\d{4})$/i);
  if (!m) throw new Error(`Data non parsabile: ${str}`);
  const mm = MESI[m[2].toLowerCase()];
  if (!mm) throw new Error(`Mese sconosciuto: ${m[2]}`);
  return `${m[3]}-${mm}-${m[1].padStart(2, '0')}`;
}

function parseAmount(raw: string): number {
  // "50,00" → 50.00  |  "1.050,00" → 1050.00
  return parseFloat(raw.replace(/\./g, '').replace(',', '.'));
}

// ── Parser Airbnb ─────────────────────────────────────────────────────────────
function parseAirbnb(bodyHtml: string): ParsedBooking {
  const $ = cheerio.load(bodyHtml);
  const text = $.text();

  // Codice conferma
  const refMatch = text.match(/Codice di conferma[:\s]+([A-Z0-9]{8,12})/i);
  if (!refMatch) throw new Error('Codice di conferma Airbnb non trovato');
  const ota_booking_ref = refMatch[1].trim();

  // Nome ospite — pattern "XXX arriverà" oppure testo prima del codice
  let guest_name = '';
  const namePatterns = [
    /([A-ZÀ-Úa-zà-ú][a-zA-ZÀ-Úà-ú\s'-]+?)\s+arriver[aà]/i,
    /Ospite[:\s]+([^\n<]+)/i,
    /Ciao,\s+([A-ZÀ-Úa-zà-ú][a-zA-ZÀ-Úà-ú\s'-]+?)[,\n]/i,
  ];
  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m) { guest_name = m[1].trim(); break; }
  }
  if (!guest_name) {
    // fallback: primo bold/strong che non sia boilerplate
    $('strong, b').each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 2 && t.length < 50 && !/airbnb|prenotazione|conferma/i.test(t)) {
        guest_name = t; return false;
      }
    });
  }
  if (!guest_name) throw new Error('Nome ospite Airbnb non trovato');

  // Date — pattern "lun 12 mag" o "12 mag 2026"
  const datePattern = /(?:lun|mar|mer|gio|ven|sab|dom)[.\s,]*(\d{1,2})\s+([a-z]{3})/gi;
  const dates: string[] = [];
  let dm: RegExpExecArray | null;
  while ((dm = datePattern.exec(text)) !== null) {
    try { dates.push(parseItalianShortDate(dm[1], dm[2])); } catch { /* skip */ }
  }

  // Fallback: "12 mag 2026"
  if (dates.length < 2) {
    const longPat = /(\d{1,2}\s+[a-zà-ú]+\s+\d{4})/gi;
    let lm: RegExpExecArray | null;
    while ((lm = longPat.exec(text)) !== null) {
      try { dates.push(parseItalianLongDate(lm[1])); } catch { /* skip */ }
    }
  }

  // Fallback: se c'è solo check-in e il testo dice "x N notte/i", calcola check-out
  if (dates.length === 1) {
    const nightMatch = text.match(/x\s*(\d+)\s*nott/i);
    if (nightMatch) {
      const d = new Date(dates[0] + 'T00:00:00');
      d.setDate(d.getDate() + parseInt(nightMatch[1], 10));
      dates.push(d.toISOString().slice(0, 10));
    }
  }

  if (dates.length < 2) throw new Error(`Date non trovate in email Airbnb. Trovate: ${dates.join(', ')}`);
  const [check_in, check_out] = dates.sort();

  // Importo — "50,00 € x 1 notte" o "€ 50,00"
  let gross_amount: number | null = null;
  const amtMatch = text.match(/([\d.,]+)\s*(?:€|euro)\s*x\s*\d+\s*nott/i)
    ?? text.match(/(?:€|euro)\s*([\d.,]+)/i);
  if (amtMatch) gross_amount = parseAmount(amtMatch[1]);

  return { guest_name, check_in, check_out, gross_amount, ota_booking_ref, channel: 'airbnb' };
}

// ── Parser Booking (PDF) ──────────────────────────────────────────────────────
async function parseBooking(
  attachments: EmailPayload['attachments'],
  bodyText: string
): Promise<ParsedBooking> {
  // Prova prima PDF allegato
  let pdfText = '';
  for (const att of attachments) {
    const b64 = att.content ?? att.data ?? '';
    if (!b64) continue;
    try {
      const buffer = Buffer.from(b64, 'base64');
      pdfText = await parsePdf(buffer);
      break;
    } catch { /* prossimo allegato */ }
  }

  const src = pdfText || bodyText;
  if (!src.trim()) throw new Error('Nessun contenuto PDF o bodyText per Booking');

  // Numero prenotazione
  const refMatch = src.match(/Numero di prenotazione[:\s]+(\d+)/i);
  if (!refMatch) throw new Error('Numero prenotazione Booking non trovato');
  const ota_booking_ref = refMatch[1].trim();

  // Nome ospite
  const nameMatch = src.match(/Informazioni sull['']ospite[:\s]+([^\n]+)/i)
    ?? src.match(/Ospite[:\s]+([^\n]+)/i)
    ?? src.match(/Nome[:\s]+([^\n]+)/i);
  if (!nameMatch) throw new Error('Nome ospite Booking non trovato');
  const guest_name = nameMatch[1].trim();

  // Check-in
  const ciMatch = src.match(/Check-in[:\s]+(?:[a-z]{3,}\s+)?(\d{1,2}\s+[a-zà-ú]+\s+\d{4})/i);
  if (!ciMatch) throw new Error('Check-in Booking non trovato');
  const check_in = parseItalianLongDate(ciMatch[1]);

  // Check-out
  const coMatch = src.match(/Check-out[:\s]+(?:[a-z]{3,}\s+)?(\d{1,2}\s+[a-zà-ú]+\s+\d{4})/i);
  if (!coMatch) throw new Error('Check-out Booking non trovato');
  const check_out = parseItalianLongDate(coMatch[1]);

  // Prezzo totale
  let gross_amount: number | null = null;
  const priceMatch = src.match(/Prezzo totale[:\s]+€\s*([\d.,]+)/i)
    ?? src.match(/Totale[:\s]+€\s*([\d.,]+)/i);
  if (priceMatch) gross_amount = parseAmount(priceMatch[1]);

  return { guest_name, check_in, check_out, gross_amount, ota_booking_ref, channel: 'booking' };
}

// ── Find or create guest ──────────────────────────────────────────────────────
async function findOrCreateGuest(full_name: string): Promise<string | null> {
  // Cerca per nome esatto
  const { data: found } = await supabase
    .from('guests')
    .select('id')
    .eq('full_name', full_name)
    .maybeSingle();
  if (found) return found.id;
  // Crea nuovo
  const { data: created } = await supabase
    .from('guests')
    .insert({ full_name })
    .select('id')
    .single();
  return created?.id ?? null;
}

// ── Match engine ──────────────────────────────────────────────────────────────
async function matchOrInsert(parsed: ParsedBooking): Promise<{ action: string; booking: Record<string, unknown> }> {
  // 1. Cerca per ota_booking_ref
  const { data: existing } = await supabase
    .from('bookings')
    .select('id, guest_id, check_in, check_out')
    .eq('ota_booking_ref', parsed.ota_booking_ref)
    .maybeSingle();

  if (existing) {
    const guestId = existing.guest_id
      ? (await supabase.from('guests').update({ full_name: parsed.guest_name }).eq('id', existing.guest_id), existing.guest_id)
      : await findOrCreateGuest(parsed.guest_name);
    await supabase.from('bookings').update({
      gross_amount: parsed.gross_amount,
      channel: parsed.channel,
      guest_id: guestId,
    }).eq('id', existing.id);
    return { action: 'updated', booking: { ...existing, ...parsed } };
  }

  // 2. Cerca per check_in + check_out
  const { data: byDate } = await supabase
    .from('bookings')
    .select('id, guest_id')
    .eq('check_in', parsed.check_in)
    .eq('check_out', parsed.check_out)
    .maybeSingle();

  if (byDate) {
    const guestId = byDate.guest_id
      ? (await supabase.from('guests').update({ full_name: parsed.guest_name }).eq('id', byDate.guest_id), byDate.guest_id)
      : await findOrCreateGuest(parsed.guest_name);
    await supabase.from('bookings').update({
      ota_booking_ref: parsed.ota_booking_ref,
      gross_amount: parsed.gross_amount,
      channel: parsed.channel,
      guest_id: guestId,
    }).eq('id', byDate.id);
    return { action: 'updated', booking: { ...byDate, ...parsed } };
  }

  // 3. INSERT — cerca property attiva
  const { data: prop } = await supabase
    .from('properties')
    .select('id')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  const { data: guest } = await supabase
    .from('guests')
    .insert({ full_name: parsed.guest_name })
    .select('id')
    .single();

  const { data: newBooking, error } = await supabase
    .from('bookings')
    .insert({
      guest_id: guest?.id ?? null,
      property_id: prop?.id ?? null,
      check_in: parsed.check_in,
      check_out: parsed.check_out,
      channel: parsed.channel,
      ota_booking_ref: parsed.ota_booking_ref,
      gross_amount: parsed.gross_amount,
      status: 'confirmed',
      num_guests: 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { action: 'created', booking: newBooking };
}

// ── Log helper ────────────────────────────────────────────────────────────────
async function writeLog(entry: {
  channel: string | null;
  from_email: string;
  subject: string;
  action: string;
  booking_ref: string | null;
  guest_name: string | null;
  error_message: string | null;
}) {
  await supabase.from('import_logs').insert(entry).then(() => void 0);
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth
  const secret = req.headers.get('x-rs-secret');
  if (secret !== process.env.EMAIL_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON non valido' }, { status: 400 });
  }

  const { from, subject, bodyHtml, bodyText, attachments = [] } = payload;

  // Determina canale
  const isAirbnb  = from.toLowerCase().includes('airbnb.com');
  const isBooking = from.toLowerCase().includes('booking.com')
    || attachments.some(a => a.filename?.toLowerCase().endsWith('.pdf'));

  if (!isAirbnb && !isBooking) {
    await writeLog({ channel: null, from_email: from, subject, action: 'skipped', booking_ref: null, guest_name: null, error_message: 'Mittente non riconosciuto' });
    return NextResponse.json({ success: true, action: 'skipped', reason: 'Mittente non riconosciuto' });
  }

  let parsed: ParsedBooking | null = null;
  let parseError: string | null = null;

  try {
    parsed = isAirbnb
      ? parseAirbnb(bodyHtml ?? bodyText ?? '')
      : await parseBooking(attachments, bodyText ?? '');
  } catch (e) {
    parseError = (e as Error).message;
  }

  if (!parsed || parseError) {
    await writeLog({
      channel: isAirbnb ? 'airbnb' : 'booking',
      from_email: from, subject,
      action: 'error',
      booking_ref: null, guest_name: null,
      error_message: parseError ?? 'Parse fallito',
    });
    // Rispondiamo 200 per evitare retry di Make
    return NextResponse.json({ success: false, action: 'error', error: parseError });
  }

  try {
    const { action, booking } = await matchOrInsert(parsed);

    await writeLog({
      channel: parsed.channel,
      from_email: from, subject,
      action,
      booking_ref: parsed.ota_booking_ref,
      guest_name: parsed.guest_name,
      error_message: null,
    });

    return NextResponse.json({ success: true, action, booking });
  } catch (e) {
    const msg = (e as Error).message;
    await writeLog({
      channel: parsed.channel,
      from_email: from, subject,
      action: 'error',
      booking_ref: parsed.ota_booking_ref,
      guest_name: parsed.guest_name,
      error_message: msg,
    });
    return NextResponse.json({ success: false, action: 'error', error: msg });
  }
}
