import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── CSV parser minimo (gestisce campi quotati con virgole interne) ─────────────
function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (!inQ && line.slice(i, i + sep.length) === sep) { result.push(cur.trim()); cur = ""; i += sep.length - 1; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function detectSep(header: string): string {
  return (header.match(/;/g) ?? []).length > (header.match(/,/g) ?? []).length ? ";" : ",";
}

// ── Trova indice colonna (case-insensitive, parziale) ────────────────────────
function col(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.toLowerCase().includes(c.toLowerCase()));
    if (i !== -1) return i;
  }
  return -1;
}

// ── Converti data in ISO (supporta DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD) ───────
function parseDate(raw: string): string | null {
  if (!raw) return null;
  raw = raw.trim().replace(/['"]/g, "");
  // ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD/MM/YYYY (contesto italiano)
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[€$£\s'"]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-rs-secret");
  if (secret !== process.env.EMAIL_IMPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const csv = body?.csv ?? "";
  if (!csv.trim()) return NextResponse.json({ error: "CSV vuoto o mancante" }, { status: 400 });

  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: `CSV con ${lines.length} righe — serve almeno header + 1 riga dati` }, { status: 400 });

  const sep     = detectSep(lines[0]);
  const headers = parseCsvLine(lines[0], sep).map(h => h.replace(/['"]/g, "").trim());

  // Indici colonne Airbnb CSV (IT/EN)
  const iRef     = col(headers, "codice di conferma", "confirmation code", "codice");
  const iCI      = col(headers, "data di inizio", "check-in", "start date", "arrivo");
  const iCO      = col(headers, "data di fine", "check-out", "end date", "partenza");
  const iName    = col(headers, "nome dell'ospite", "guest name", "ospite", "nome");
  const iAmount  = col(headers, "totale host", "payout", "importo pagato", "importo", "amount");

  if (iCI === -1 || iCO === -1) {
    return NextResponse.json({
      error: `Colonne date non trovate.\nHeaders rilevati: ${headers.join(" | ")}\nSeparatore: "${sep}"`,
    }, { status: 400 });
  }

  let updated = 0, skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], sep);
    if (row.length < 2) continue;

    const ref        = iRef    !== -1 ? row[iRef]?.trim()  : null;
    const check_in   = parseDate(row[iCI]);
    const check_out  = parseDate(row[iCO]);
    const guest_name = iName   !== -1 ? row[iName]?.trim() : null;
    const gross_amt  = iAmount !== -1 ? parseAmount(row[iAmount]) : null;

    if (!check_in || !check_out) { errors.push(`Riga ${i + 1}: date non valide`); continue; }

    // Cerca prenotazione per ref o per date
    let bookingId: string | null = null;
    let existingGuestId: string | null = null;

    if (ref) {
      const { data } = await supabase.from("bookings").select("id, guest_id").eq("ota_booking_ref", ref).maybeSingle();
      if (data) { bookingId = data.id; existingGuestId = data.guest_id; }
    }
    if (!bookingId) {
      const { data } = await supabase.from("bookings").select("id, guest_id").eq("check_in", check_in).eq("check_out", check_out).maybeSingle();
      if (data) { bookingId = data.id; existingGuestId = data.guest_id; }
    }

    if (!bookingId) { errors.push(`Riga ${i + 1}: prenotazione non trovata (${check_in} → ${check_out})`); skipped++; continue; }

    // Aggiorna prenotazione
    const updateData: Record<string, unknown> = {};
    if (ref)       updateData.ota_booking_ref = ref;
    if (gross_amt) updateData.gross_amount    = gross_amt;

    if (Object.keys(updateData).length > 0) {
      await supabase.from("bookings").update(updateData).eq("id", bookingId);
    }

    // Aggiorna o crea guest con il nome
    if (guest_name) {
      if (existingGuestId) {
        await supabase.from("guests").update({ full_name: guest_name }).eq("id", existingGuestId);
      } else {
        const { data: newGuest } = await supabase.from("guests").insert({ full_name: guest_name }).select("id").single();
        if (newGuest) await supabase.from("bookings").update({ guest_id: newGuest.id }).eq("id", bookingId);
      }
    }

    updated++;
  }

  return NextResponse.json({ updated, skipped, errors });
}
