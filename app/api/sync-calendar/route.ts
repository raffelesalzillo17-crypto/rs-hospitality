import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TULIPANO_ID = "0e16fce0-07d7-47eb-a44b-b4e239ec2cd4";

const FEEDS = [
  {
    url: "https://www.airbnb.it/calendar/ical/1151100346729188269.ics?t=7df772bef1f3499f822c4b6270cbe231",
    channel: "airbnb",
  },
  {
    url: "https://ical.booking.com/v1/export/t/28033739-d90f-4362-8f72-3cb8be1d31bc.ics",
    channel: "booking",
  },
];

// Sommari iCal che indicano blocchi automatici delle OTA (da ignorare)
const NOISE_PATTERNS = [
  /not available/i, /closed/i, /blocked/i, /unavailable/i, /reserved/i,
];

type VEvent = { uid: string; dtstart: string; dtend: string; summary: string };

function parseICalDate(raw: string): string | null {
  const clean = raw.replace(/^.*:/, "").trim();
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function isNoise(ev: VEvent): boolean {
  const nights = daysBetween(ev.dtstart, ev.dtend);
  if (nights > 60) return true;
  const sum = ev.summary.trim();
  if (!sum && nights > 30) return true;
  if (NOISE_PATTERNS.some(p => p.test(sum))) return true;
  return false;
}

function parseVEvents(icsText: string): VEvent[] {
  const events: VEvent[] = [];
  const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  let inEvent = false;
  let current: Partial<VEvent> = {};

  for (const line of lines) {
    if (line.trim() === "BEGIN:VEVENT") { inEvent = true; current = {}; continue; }
    if (line.trim() === "END:VEVENT") {
      inEvent = false;
      if (current.uid && current.dtstart && current.dtend) {
        events.push({ uid: current.uid, dtstart: current.dtstart, dtend: current.dtend, summary: current.summary ?? "" });
      }
      continue;
    }
    if (!inEvent) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const baseKey = line.slice(0, colonIdx).split(";")[0].toUpperCase();
    const value   = line.slice(colonIdx + 1).trim();
    if (baseKey === "UID")     current.uid = value;
    else if (baseKey === "DTSTART") { const d = parseICalDate(line); if (d) current.dtstart = d; }
    else if (baseKey === "DTEND")   { const d = parseICalDate(line); if (d) current.dtend   = d; }
    else if (baseKey === "SUMMARY") current.summary = value;
  }
  return events;
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let sincronizzati = 0;
  let skippati = 0;
  const errori: string[] = [];

  for (const feed of FEEDS) {
    let icsText: string;
    try {
      const res = await fetch(feed.url, { next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      icsText = await res.text();
    } catch (e) {
      errori.push(`${feed.channel}: fetch fallito — ${(e as Error).message}`);
      continue;
    }

    const events = parseVEvents(icsText);

    for (const ev of events) {
      // Filtra blocchi automatici OTA
      if (isNoise(ev)) { skippati++; continue; }

      // Match 1: cerca per check_in + check_out + property_id
      const { data: byDate } = await supabase
        .from("bookings")
        .select("id, guest_id, uid_ical, booking_type")
        .eq("check_in", ev.dtstart)
        .eq("check_out", ev.dtend)
        .eq("property_id", TULIPANO_ID)
        .neq("booking_type", "block")   // non toccare i blocchi manuali
        .maybeSingle();

      if (byDate) {
        // Se la prenotazione ha già un ospite (arricchita da email import) → non toccare
        if (byDate.guest_id) { skippati++; continue; }
        // Aggiorna solo uid_ical se mancante
        if (!byDate.uid_ical) {
          await supabase.from("bookings").update({ uid_ical: ev.uid, channel: feed.channel }).eq("id", byDate.id);
        }
        skippati++;
        continue;
      }

      // Match 2: cerca per uid_ical (fallback)
      const { data: byUid } = await supabase
        .from("bookings")
        .select("id, guest_id")
        .eq("uid_ical", ev.uid)
        .maybeSingle();

      if (byUid) {
        if (byUid.guest_id) { skippati++; continue; }
        skippati++;
        continue;
      }

      // Non trovato → insert
      const { error: insertErr } = await supabase.from("bookings").insert({
        property_id:  TULIPANO_ID,
        check_in:     ev.dtstart,
        check_out:    ev.dtend,
        channel:      feed.channel,
        status:       "confirmed",
        notes:        ev.summary || null,
        uid_ical:     ev.uid,
        num_guests:   1,
        booking_type: "booking",
      });

      if (insertErr) errori.push(`${feed.channel} UID ${ev.uid}: ${insertErr.message}`);
      else sincronizzati++;
    }
  }

  return NextResponse.json({ sincronizzati, skippati, errori });
}
