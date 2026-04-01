import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import {
  OTA_COMMISSION, CEDOLARE_BY_CHANNEL, CEDOLARE_RATE,
  COSTI_PULIZIE, MONTH_IT, CHANNEL_LABEL,
} from '@/lib/constants';

export const runtime = 'nodejs';

// ── Logica finanziaria (replica di calcFin in page.tsx) ───────────────────────
type FinRow = {
  commissione_ota: number;
  netto_dopo_comm: number;
  cedolare:        number;
  netto_ricevuto:  number;
  costi_pulizie:   number;
  utile_reale:     number;
  is_no_tax:       boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcFin(b: Record<string, any>): FinRow | null {
  const ch = String(b.channel ?? '').toLowerCase();

  if (ch === 'no tax') {
    const tp = b.total_price as number | null;
    if (!tp) return null;
    return { commissione_ota: 0, netto_dopo_comm: tp, cedolare: 0, netto_ricevuto: tp, costi_pulizie: COSTI_PULIZIE, utile_reale: tp - COSTI_PULIZIE, is_no_tax: true };
  }

  const g = b.gross_amount as number | null;
  if (!g) return null;
  const rate            = OTA_COMMISSION[ch] ?? 0;
  const cedRate         = CEDOLARE_BY_CHANNEL[ch] ?? CEDOLARE_RATE;
  const commissione_ota = g * rate;
  const netto_dopo_comm = g - commissione_ota;
  const cedolare        = g * cedRate;
  const netto_ricevuto  = netto_dopo_comm - cedolare;
  const utile_reale     = netto_ricevuto - COSTI_PULIZIE;
  return { commissione_ota, netto_dopo_comm, cedolare, netto_ricevuto, costi_pulizie: COSTI_PULIZIE, utile_reale, is_no_tax: false };
}

function eur(n: number): string {
  return `\u20AC ${n.toFixed(2)}`;
}

function fmtDate(d: string): string {
  if (!d) return '\u2014';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtCh(ch: string): string {
  return CHANNEL_LABEL[ch.toLowerCase()] ?? ch;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// ── Colori RS ─────────────────────────────────────────────────────────────────
const TABACCO  = '#2C2416';
const CAMMELLO = '#8B7355';
const LINO     = '#F0EBE0';
const SABBIA   = '#D4C9B5';

// ── GET /api/report-pdf?month=YYYY-MM ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ error: 'Parametro month mancante (formato: YYYY-MM)' }, { status: 400 });
  }

  const [yearStr, monthStr] = monthParam.split('-');
  const anno = parseInt(yearStr, 10);
  const mese = parseInt(monthStr, 10); // 1-based

  const supabase = createServerClient();
  const primoGiorno = `${monthParam}-01`;
  const meseSuc    = mese === 12 ? `${anno + 1}-01-01` : `${anno}-${String(mese + 1).padStart(2, '0')}-01`;

  const { data: prenotazioni, error } = await supabase
    .from('bookings')
    .select('*, guests(full_name), properties(id, name)')
    .gte('check_in', primoGiorno)
    .lt('check_in', meseSuc)
    .neq('booking_type', 'block')
    .order('check_in', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (prenotazioni ?? []) as Record<string, unknown>[];

  // ── Riepilogo per alloggio ─────────────────────────────────────────────────
  const byProp = new Map<string, { nome: string; righe: Record<string, unknown>[] }>();
  for (const b of rows) {
    const pid  = (b.property_id as string) ?? '__none__';
    const nome = (b.properties as { name: string } | null)?.name ?? 'Senza alloggio';
    if (!byProp.has(pid)) byProp.set(pid, { nome, righe: [] });
    byProp.get(pid)!.righe.push(b);
  }

  type Totali = { lordo: number; commissioni: number; netto_ota: number; cedolare: number; netto_ricevuto: number; pulizie: number; utile: number };
  function sumFin(righe: Record<string, unknown>[]): Totali {
    const t: Totali = { lordo: 0, commissioni: 0, netto_ota: 0, cedolare: 0, netto_ricevuto: 0, pulizie: 0, utile: 0 };
    for (const b of righe) {
      const f = calcFin(b);
      if (!f) continue;
      if (!f.is_no_tax) t.lordo += (b.gross_amount as number) ?? 0;
      t.commissioni   += f.commissione_ota;
      t.netto_ota     += f.netto_dopo_comm;
      t.cedolare      += f.cedolare;
      t.netto_ricevuto+= f.netto_ricevuto;
      t.pulizie       += f.costi_pulizie;
      t.utile         += f.utile_reale;
    }
    return t;
  }

  const totaliGenerali = sumFin(rows);
  const nomesMese = MONTH_IT[mese - 1];

  // ── Genera PDF ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = require('jspdf-autotable').default ?? require('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.width;

  // ── Header pagina ─────────────────────────────────────────────────────────
  doc.setFillColor(...hexToRgb(TABACCO));
  doc.rect(0, 0, W, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...hexToRgb(LINO));
  doc.text('RS HOSPITALITY', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(SABBIA));
  doc.text(`Report Mensile \u2014 ${nomesMese} ${anno}`, W - 14, 12, { align: 'right' });

  // ── Sezione 1: Riepilogo per alloggio ─────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(CAMMELLO));
  doc.text('RIEPILOGO PER ALLOGGIO', 14, 26);

  const RIEPILOGO_HEADERS = ['Alloggio', 'Pren.', 'Lordo', 'Comm. OTA', 'Netto OTA', 'Cedolare', 'Netto Ric.', 'Pulizie', 'Utile'];
  const riepBody: string[][] = [];

  for (const [, { nome, righe }] of byProp) {
    const t = sumFin(righe);
    riepBody.push([nome, String(righe.length), eur(t.lordo), eur(t.commissioni), eur(t.netto_ota), eur(t.cedolare), eur(t.netto_ricevuto), eur(t.pulizie), eur(t.utile)]);
  }
  riepBody.push([
    'TOTALE GENERALE',
    String(rows.length),
    eur(totaliGenerali.lordo),
    eur(totaliGenerali.commissioni),
    eur(totaliGenerali.netto_ota),
    eur(totaliGenerali.cedolare),
    eur(totaliGenerali.netto_ricevuto),
    eur(totaliGenerali.pulizie),
    eur(totaliGenerali.utile),
  ]);

  const isUltimaRiga = (idx: number) => idx === riepBody.length - 1;

  autoTable(doc, {
    startY: 29,
    head: [RIEPILOGO_HEADERS],
    body: riepBody,
    styles:            { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: hexToRgb(TABACCO) },
    headStyles:        { fillColor: hexToRgb(TABACCO), textColor: hexToRgb(LINO), fontStyle: 'bold', halign: 'right' as const, fontSize: 7 },
    columnStyles:      { 0: { halign: 'left' as const }, 1: { halign: 'center' as const } },
    alternateRowStyles:{ fillColor: hexToRgb(LINO) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    willDrawCell: (data: any) => {
      if (data.section === 'body' && isUltimaRiga(data.row.index)) {
        doc.setFont('helvetica', 'bold');
        data.cell.styles.fillColor = hexToRgb(SABBIA);
      }
    },
  });

  // ── Sezione 2: Dettaglio prenotazioni ─────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY: number = (doc as any).lastAutoTable?.finalY ?? 80;
  const detStartY = lastY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(CAMMELLO));
  doc.text('DETTAGLIO PRENOTAZIONI', 14, detStartY);

  const DETTAGLIO_HEADERS = ['Ospite', 'Alloggio', 'Arrivo', 'Partenza', 'Notti', 'Canale', 'Lordo', 'Comm.', 'Netto OTA', 'Ced.', 'Netto Ric.', 'Pulizie', 'Utile'];

  const detBody: string[][] = rows.map(b => {
    const guestName = (b.guests as { full_name: string } | null)?.full_name ?? '\u2014';
    const propName  = (b.properties as { name: string } | null)?.name ?? '\u2014';
    const checkIn   = b.check_in as string;
    const checkOut  = b.check_out as string;
    const nn        = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
    const f         = calcFin(b);
    return [
      guestName,
      propName,
      fmtDate(checkIn),
      fmtDate(checkOut),
      String(nn),
      fmtCh(b.channel as string),
      b.gross_amount ? `\u20AC ${b.gross_amount}` : '\u2014',
      f ? eur(f.commissione_ota) : '\u2014',
      f ? eur(f.netto_dopo_comm) : '\u2014',
      f ? eur(f.cedolare)        : '\u2014',
      f ? eur(f.netto_ricevuto)  : '\u2014',
      f ? eur(f.costi_pulizie)   : '\u2014',
      f ? eur(f.utile_reale)     : '\u2014',
    ];
  });

  autoTable(doc, {
    startY: detStartY + 4,
    head: [DETTAGLIO_HEADERS],
    body: detBody,
    styles:            { font: 'helvetica', fontSize: 7, cellPadding: 2, textColor: hexToRgb(TABACCO) },
    headStyles:        { fillColor: hexToRgb(CAMMELLO), textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold', halign: 'right' as const, fontSize: 6.5 },
    columnStyles:      { 0: { halign: 'left' as const }, 1: { halign: 'left' as const } },
    alternateRowStyles:{ fillColor: [250, 250, 248] as [number, number, number] },
  });

  // ── Footer su ogni pagina ─────────────────────────────────────────────────
  const nPagine = doc.getNumberOfPages();
  const oggiStr = new Date().toLocaleDateString('it-IT');
  for (let i = 1; i <= nPagine; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(CAMMELLO));
    doc.text(
      `RS Hospitality \u00B7 Generato il ${oggiStr} \u00B7 Pag. ${i}/${nPagine}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  // ── Output ────────────────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  const nomeFile  = `RS_Report_${nomesMese.toUpperCase()}_${anno}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeFile}"`,
      'Cache-Control':       'no-store',
    },
  });
}
