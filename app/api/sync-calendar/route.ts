import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FEEDS = [
  {
    url: "https://www.airbnb.it/calendar/ical/1151100346729188269.ics?t=7df772bef1f3499f822c4b6270cbe231",
    canale: "Airbnb",
  },
  {
    url: "https://ical.booking.com/v1/export/t/28033739-d90f-4362-8f72-3cb8be1d31bc.ics",
    canale: "Booking",
  },
];

// Parsa una data iCal (YYYYMMDD o YYYYMMDDTHHmmssZ) in formato YYYY-MM-DD
function parseICalDate(raw: string): string | null {
  const clean = raw.replace(/^.*:/, "").trim(); // rimuove eventuale prefix tipo "VALUE=DATE:"
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

type VEvent = {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
};

function parseVEvents(icsText: string): VEvent[] {
  const events: VEvent[] = [];
  // Gestisce line folding iCal (linea che inizia con spazio/tab è continuazione)
  const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  let inEvent = false;
  let current: Partial<VEvent> = {};

  for (const line of lines) {
    if (line.trim() === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line.trim() === "END:VEVENT") {
      inEvent = false;
      if (current.uid && current.dtstart && current.dtend) {
        events.push({
          uid: current.uid,
          dtstart: current.dtstart,
          dtend: current.dtend,
          summary: current.summary ?? "",
        });
      }
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).toUpperCase();
    const value = line.slice(colonIdx + 1).trim();

    // La chiave può avere parametri tipo DTSTART;VALUE=DATE → normalizziamo
    const baseKey = key.split(";")[0];

    if (baseKey === "UID") current.uid = value;
    else if (baseKey === "DTSTART") {
      const d = parseICalDate(line); // usiamo la riga intera per gestire parametri
      if (d) current.dtstart = d;
    } else if (baseKey === "DTEND") {
      const d = parseICalDate(line);
      if (d) current.dtend = d;
    } else if (baseKey === "SUMMARY") {
      current.summary = value;
    }
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
      errori.push(`${feed.canale}: fetch fallito — ${(e as Error).message}`);
      continue;
    }

    const events = parseVEvents(icsText);

    for (const ev of events) {
      // Controlla duplicato tramite uid_ical
      const { data: existing, error: selectErr } = await supabase
        .from("prenotazioni")
        .select("id")
        .eq("uid_ical", ev.uid)
        .maybeSingle();

      if (selectErr) {
        errori.push(`${feed.canale} UID ${ev.uid}: select error — ${selectErr.message}`);
        continue;
      }

      if (existing) {
        skippati++;
        continue;
      }

      const { error: insertErr } = await supabase.from("prenotazioni").insert({
        data_arrivo: ev.dtstart,
        data_partenza: ev.dtend,
        canale: feed.canale,
        stato: "confermata",
        note: ev.summary || null,
        uid_ical: ev.uid,
        num_ospiti: 1, // sconosciuto da iCal, default 1
      });

      if (insertErr) {
        errori.push(`${feed.canale} UID ${ev.uid}: insert error — ${insertErr.message}`);
      } else {
        sincronizzati++;
      }
    }
  }

  return NextResponse.json({ sincronizzati, skippati, errori });
}
