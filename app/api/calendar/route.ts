import { NextResponse } from 'next/server';

const ICAL_URLS = [
  'https://www.airbnb.it/calendar/ical/1151100346729188269.ics?t=7df772bef1f3499f822c4b6270cbe231',
  'https://ical.booking.com/v1/export/t/28033739-d90f-4362-8f72-3cb8be1d31bc.ics',
];

function parseDate(str: string): string {
  const s = str.replace(/T[\s\S]*/, '').trim();
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function parseiCal(raw: string): { start: string; end: string }[] {
  // Unfold continuation lines
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
      else if (line.startsWith('DTEND'))  end   = parseDate(line.split(':').slice(1).join(':'));
    }
  }
  return events;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      ICAL_URLS.map(url => fetch(url, { next: { revalidate: 3600 } }).then(r => r.text()))
    );
    const events = results.flatMap(r => r.status === 'fulfilled' ? parseiCal(r.value) : []);
    return NextResponse.json({ events }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
