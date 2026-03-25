import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { parseDate, parseAmount } from '@/lib/date-utils';

const supabase = createServerClient();

// ── CSV parser minimo (gestisce campi quotati con virgole interne) ─────────────
function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (!inQ && line.slice(i, i + sep.length) === sep) { result.push(cur.trim()); cur = ''; i += sep.length - 1; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function detectSep(header: string): string {
  return (header.match(/;/g) ?? []).length > (header.match(/,/g) ?? []).length ? ';' : ',';
}

// Trova indice colonna (case-insensitive, parziale)
function col(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.toLowerCase().includes(c.toLowerCase()));
    if (i !== -1) return i;
  }
  return -1;
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-rs-secret');
  if (secret !== process.env.EMAIL_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const csv = body?.csv ?? '';
  if (!csv.trim()) return NextResponse.json({ error: 'CSV vuoto o mancante' }, { status: 400 });

  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: `CSV con ${lines.length} righe — serve almeno header + 1 riga dati` }, { status: 400 });

  const sep     = detectSep(lines[0]);
  const headers = parseCsvLine(lines[0], sep).map(h => h.replace(/['"]/g, '').trim());

  // Indici colonne — Airbnb (IT/EN) + Booking.com (EN) + Pulse/altri
  const iRef    = col(headers, 'numero di riferimento', 'codice di conferma', 'confirmation code', 'codice', 'reservation number', 'booking number');
  const iCI     = col(headers, 'check-in', 'checkin', 'data di inizio', 'start date', 'arrivo', 'arrival');
  const iCO     = col(headers, 'checkout', 'check-out', 'data di fine', 'end date', 'partenza', 'departure');
  const iName   = col(headers, 'nome dell', 'guest name', 'booker name', 'ospite', 'nome');
  const iAmount = col(headers, 'netto', 'totale host', 'payout', 'importo pagato', 'importo', 'amount', 'original amount', 'final amount');

  if (iCI === -1 || iCO === -1) {
    return NextResponse.json({
      error: `Colonne date non trovate.\nHeaders rilevati: ${headers.join(' | ')}\nSeparatore: "${sep}"`,
    }, { status: 400 });
  }

  // Rileva canale
  const refHeader  = iRef !== -1 ? headers[iRef].toLowerCase() : '';
  const allHeaders = headers.join(' ').toLowerCase();
  const detectedChannel = refHeader.includes('reservation') ? 'booking'
    : refHeader.includes('confirmation') || refHeader.includes('codice') ? 'airbnb'
    : refHeader.includes('numero') || allHeaders.includes('tipologia') || allHeaders.includes('netto') ? 'airbnb'
    : 'diretto';

  // Cerca property attiva una sola volta
  const { data: prop } = await supabase.from('properties').select('id').eq('active', true).limit(1).maybeSingle();

  let updated = 0, created = 0, skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], sep);
    if (row.length < 2) continue;

    const ref        = iRef    !== -1 ? row[iRef]?.trim()  || null : null;
    const check_in   = parseDate(row[iCI]);
    const check_out  = parseDate(row[iCO]);
    const guest_name = iName   !== -1 ? row[iName]?.trim() || null : null;
    const gross_amt  = iAmount !== -1 ? parseAmount(row[iAmount]) : null;

    if (!check_in || !check_out) { errors.push(`Riga ${i + 1}: date non valide (${row[iCI]} → ${row[iCO]})`); continue; }

    let bookingId: string | null = null;
    let existingGuestId: string | null = null;

    if (ref) {
      const { data } = await supabase.from('bookings').select('id, guest_id').eq('ota_booking_ref', ref).maybeSingle();
      if (data) { bookingId = data.id; existingGuestId = data.guest_id; }
    }
    if (!bookingId) {
      const { data } = await supabase.from('bookings').select('id, guest_id').eq('check_in', check_in).eq('check_out', check_out).maybeSingle();
      if (data) { bookingId = data.id; existingGuestId = data.guest_id; }
    }

    if (bookingId) {
      // UPDATE prenotazione esistente
      const updateData: Record<string, unknown> = {};
      if (ref)      updateData.ota_booking_ref = ref;
      if (gross_amt) updateData.gross_amount   = gross_amt;
      if (Object.keys(updateData).length > 0) {
        await supabase.from('bookings').update(updateData).eq('id', bookingId);
      }
      if (guest_name) {
        if (existingGuestId) {
          await supabase.from('guests').update({ full_name: guest_name }).eq('id', existingGuestId);
        } else {
          const { data: ng } = await supabase.from('guests').insert({ full_name: guest_name }).select('id').single();
          if (ng) await supabase.from('bookings').update({ guest_id: ng.id }).eq('id', bookingId);
        }
      }
      updated++;
    } else {
      // INSERT prenotazione storica
      let guestId: string | null = null;
      if (guest_name) {
        const { data: existingGuest } = await supabase.from('guests').select('id').eq('full_name', guest_name).maybeSingle();
        if (existingGuest) {
          guestId = existingGuest.id;
        } else {
          const { data: ng } = await supabase.from('guests').insert({ full_name: guest_name }).select('id').single();
          guestId = ng?.id ?? null;
        }
      }
      const { error: insErr } = await supabase.from('bookings').insert({
        property_id:     prop?.id ?? null,
        guest_id:        guestId,
        check_in,
        check_out,
        channel:         detectedChannel,
        ota_booking_ref: ref,
        gross_amount:    gross_amt,
        status:          'confirmed',
        num_guests:      1,
        booking_type:    'booking',
      });
      if (insErr) errors.push(`Riga ${i + 1}: insert fallito — ${insErr.message}`);
      else created++;
    }
  }

  return NextResponse.json({ updated, created, skipped, errors });
}
