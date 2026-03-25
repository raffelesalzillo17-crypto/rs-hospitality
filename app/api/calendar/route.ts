import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

const supabase = createServerClient();

function parseDate(str: string): string {
  const s = str.replace(/T[\s\S]*/, '').trim();
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function parseiCal(raw: string): { start: string; end: string }[] {
  const text = raw.replace(/\r\n[ \t]/g, '').replace(/\r\n|\r/g, '\n');
  const lines = text.split('\n');
  const events: { start: string; end: string }[] = [];
  let inEvent = false;
  let start = '';
  let end = '';
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; start = ''; end = ''; }
    else if (line === 'END:VEVENT') {
      if (inEvent && start && end) events.push({ start, end });
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) start = parseDate(line.split(':').slice(1).join(':'));
      else if (line.startsWith('DTEND')) end  = parseDate(line.split(':').slice(1).join(':'));
    }
  }
  return events;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('property');

    let query = supabase
      .from('properties')
      .select('id, name, ical_airbnb, ical_booking')
      .eq('active', true);

    if (slug) query = query.eq('name', slug);

    const { data: properties, error } = await query;
    if (error) throw new Error(error.message);

    const icalUrls: string[] = (properties ?? []).flatMap(p => [
      p.ical_airbnb,
      p.ical_booking,
    ].filter(Boolean));

    if (icalUrls.length === 0) {
      return NextResponse.json({ events: [] }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
      });
    }

    const results = await Promise.allSettled(
      icalUrls.map(url => fetch(url, { next: { revalidate: 3600 } }).then(r => r.text()))
    );

    const events = results.flatMap(r => r.status === 'fulfilled' ? parseiCal(r.value) : []);

    return NextResponse.json({ events }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
