"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import {
  CHANNELS, STATUSES, STATUS_STYLE, STATUS_LABEL,
  CHANNEL_LABEL, MONTH_IT, ICAL_NOISE_LABELS, PALETTE,
  OTA_COMMISSION, CEDOLARE_BY_CHANNEL, CEDOLARE_RATE, COSTI_PULIZIE,
} from "@/lib/constants";
import type { Booking, Guest, Property, ImportLog } from "@/lib/types";

const supabase = createSupabaseBrowser();

const c = PALETTE;

const emptyForm = {
  nome_ospite: "", telefono: "",
  check_in: "", check_out: "",
  num_guests: "2", channel: "Diretto" as (typeof CHANNELS)[number],
  notes: "", status: "pending" as (typeof STATUSES)[number],
  property_id: "", total_price: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function fmtShort(d: string) {
  if (!d) return "—";
  const [, m, day] = d.split("-");
  return `${parseInt(day, 10)} ${MONTH_IT[parseInt(m, 10) - 1]?.slice(0, 3).toLowerCase()}`;
}
function notti(a: string, b: string) {
  const n = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
  return n > 0 ? `${n}n` : "—";
}
function fmtNote(note: string | null) {
  if (!note) return "";
  return ICAL_NOISE_LABELS.has(note.toLowerCase().trim()) ? "" : note;
}
function fmtCh(ch: string) { return CHANNEL_LABEL[ch.toLowerCase()] ?? ch; }
function getGuest(b: Booking): Guest | null {
  if (!b.guests) return null;
  return Array.isArray(b.guests) ? b.guests[0] ?? null : b.guests;
}
function getPropName(b: Booking): string | null {
  if (!b.properties) return null;
  const p = Array.isArray(b.properties) ? b.properties[0] : b.properties;
  return p?.name ?? null;
}
function barColor(b: Booking): string {
  if (b.booking_type === "block") return "#555";
  if (b.uid_ical && !b.guest_id) return "#aaa";
  if (b.status === "pending") return "#c9963a";
  return "#2d6a4f";
}
function barLabel(b: Booking): string {
  if (b.booking_type === "block") return "Blocco";
  return getGuest(b)?.full_name ?? fmtCh(b.channel);
}

// ── Logica finanziaria ────────────────────────────────────────────────────────
function calcFin(b: Booking) {
  const ch = b.channel.toLowerCase();

  // Canale No Tax: escluso da logica fiscale, netto = total_price
  if (ch === "no tax") {
    const tp = b.total_price;
    if (!tp) return null;
    return {
      commissione_ota: 0,
      netto_dopo_comm: tp,
      cedolare:        0,
      cedRate:         0,
      netto_ricevuto:  tp,
      costi_pulizie:   COSTI_PULIZIE,
      utile_reale:     tp - COSTI_PULIZIE,
      is_no_tax:       true,
    };
  }

  const g = b.gross_amount;
  if (!g) return null;
  const rate            = OTA_COMMISSION[ch] ?? 0;
  const cedRate         = CEDOLARE_BY_CHANNEL[ch] ?? CEDOLARE_RATE;
  const commissione_ota = g * rate;
  const netto_dopo_comm = g - commissione_ota;
  const cedolare        = g * cedRate;           // cedolare sul lordo (Google Sheet)
  const netto_ricevuto  = netto_dopo_comm - cedolare;
  const utile_reale     = netto_ricevuto - COSTI_PULIZIE;
  return { commissione_ota, netto_dopo_comm, cedolare, cedRate, netto_ricevuto, costi_pulizie: COSTI_PULIZIE, utile_reale, is_no_tax: false };
}
function eur(n: number | null | undefined) {
  if (n == null) return "—";
  return `€\u202F${n.toFixed(2)}`;
}

function buildBookingMap(bookings: Booking[]) {
  const map = new Map<string, Map<string, { b: Booking; isStart: boolean; isEnd: boolean }>>();
  for (const bk of bookings) {
    const pid = bk.property_id;
    if (!pid) continue;
    if (!map.has(pid)) map.set(pid, new Map());
    const pm = map.get(pid)!;
    const start = new Date(bk.check_in + "T00:00:00");
    const end   = new Date(bk.check_out + "T00:00:00");
    const d = new Date(start);
    while (d < end) {
      const key = d.toISOString().slice(0, 10);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      pm.set(key, { b: bk, isStart: d.getTime() === start.getTime(), isEnd: next >= end });
      d.setDate(d.getDate() + 1);
    }
  }
  return map;
}

// ── Badge canale ──────────────────────────────────────────────────────────────
const CHANNEL_BADGE: Record<string, { bg: string; color: string }> = {
  airbnb:   { bg: "#FF5A5F", color: "#fff" },
  booking:  { bg: "#003580", color: "#fff" },
  diretto:  { bg: "#2d6a4f", color: "#fff" },
  "no tax": { bg: "#6b5c47", color: "#fff" },
  no_tax:   { bg: "#6b5c47", color: "#fff" },
};
function channelBadge(ch: string) {
  return CHANNEL_BADGE[ch.toLowerCase()] ?? { bg: c.cammello, color: "#fff" };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();

  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [dbError,    setDbError]    = useState<string | null>(null);

  const [activeTab,    setActiveTab]    = useState<"calendario" | "prenotazioni" | "import" | "report">("calendario");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deleteConfirm,   setDeleteConfirm]   = useState(false);
  const [copiedId,        setCopiedId]        = useState<string | null>(null);
  const [editPrice,       setEditPrice]       = useState<{ id: string; value: string } | null>(null);

  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);

  const [formOpen,   setFormOpen]   = useState(false);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);

  const [blockOpen,   setBlockOpen]   = useState(false);
  const [blockForm,   setBlockForm]   = useState({ check_in: "", check_out: "" });
  const [blockSaving, setBlockSaving] = useState(false);

  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult,    setCsvResult]    = useState<{ updated: number; created?: number; skipped: number; errors: string[] } | null>(null);

  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoading(true); setDbError(null);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, guests(full_name, phone, email), properties(id, name)")
      .order("check_in", { ascending: true });
    if (error) { setDbError(error.message); }
    else {
      const raw = (data ?? []) as Booking[];
      // Deduplicazione per uid_ical: tieni l'ultimo record per ogni uid_ical non null
      const seen = new Map<string, Booking>();
      for (const b of raw) {
        if (!b.uid_ical) { seen.set(`__id_${b.id}`, b); }
        else { seen.set(b.uid_ical, b); }
      }
      setBookings([...seen.values()]);
    }
    setLoading(false);
  }, []);

  const fetchImportLogs = useCallback(async () => {
    const { data } = await supabase
      .from("import_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setImportLogs((data ?? []) as ImportLog[]);
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchImportLogs();
    supabase.from("properties").select("id, name, is_private").eq("active", true).order("name")
      .then(({ data }) => {
        if (data?.length) {
          setProperties(data);
          const first = data[0];
          setForm(f => ({
            ...f,
            property_id: first.id,
            channel: first.is_private ? "No Tax" : f.channel,
          }));
        }
      });
  }, [fetchBookings, fetchImportLogs]);

  // ── Scroll lock body quando il modale è aperto ────────────────────────────
  useEffect(() => {
    if (selectedBooking) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedBooking]);

  // ── Form submit ───────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null); setSaved(false);
    const { data: guest, error: gErr } = await supabase
      .from("guests").insert({ full_name: form.nome_ospite.trim(), phone: form.telefono.trim() || null })
      .select().single();
    if (gErr) { setFormError(gErr.message); setSaving(false); return; }
    const { error: bErr } = await supabase.from("bookings").insert({
      guest_id: guest.id, property_id: form.property_id || null,
      check_in: form.check_in, check_out: form.check_out,
      num_guests: parseInt(form.num_guests, 10), channel: form.channel,
      notes: form.notes.trim() || null, status: form.status,
      total_price: form.total_price ? parseFloat(form.total_price) : null,
    });
    if (bErr) { setFormError(bErr.message); setSaving(false); return; }
    setForm(f => ({ ...emptyForm, property_id: f.property_id }));
    setSaved(true); setSaving(false); await fetchBookings();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selectedBooking) return;
    await supabase.from("bookings").delete().eq("id", selectedBooking.id);
    setSelectedBooking(null); setDeleteConfirm(false); await fetchBookings();
  }

  // ── Price update ───────────────────────────────────────────────────────────
  async function savePrice(id: string, value: string) {
    const num = value ? parseFloat(value) : null;
    await supabase.from("bookings").update({ total_price: num }).eq("id", id);
    setEditPrice(null); await fetchBookings();
    if (selectedBooking?.id === id) {
      setSelectedBooking(b => b ? { ...b, total_price: num } : null);
    }
  }

  // ── Blocca date ────────────────────────────────────────────────────────────
  async function handleBlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBlockSaving(true);
    const { data: prop } = await supabase.from("properties").select("id").eq("active", true).limit(1).maybeSingle();
    await supabase.from("bookings").insert({
      property_id:  prop?.id ?? null,
      check_in:     blockForm.check_in,
      check_out:    blockForm.check_out,
      booking_type: "block",
      status:       "confirmed",
      channel:      "diretto",
      num_guests:   0,
    });
    setBlockForm({ check_in: "", check_out: "" });
    setBlockOpen(false);
    setBlockSaving(false);
    await fetchBookings();
  }

  // ── Import CSV ─────────────────────────────────────────────────────────────
  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true); setCsvResult(null);
    try {
      const csv = (await file.text()).replace(/^\uFEFF/, ""); // strip UTF-8 BOM
      const res = await fetch("/api/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-RS-Secret": "rshospitality2026" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCsvResult({ updated: 0, skipped: 0, errors: [data?.error ?? `Errore ${res.status}`] });
      } else {
        setCsvResult(data);
        await fetchBookings();
      }
    } catch (err) {
      setCsvResult({ updated: 0, skipped: 0, errors: [(err as Error).message ?? "Errore sconosciuto"] });
    } finally {
      setCsvImporting(false);
      e.target.value = "";
    }
  }

  // ── Copy link ──────────────────────────────────────────────────────────────
  function copyLink(id: string) {
    navigator.clipboard.writeText(`https://rs-hospitality.vercel.app/checkin/${id}`);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  const nextArrival = useMemo(() =>
    [...bookings]
      .filter(b => b.booking_type !== "block" && b.check_in >= today)
      .sort((a, b) => a.check_in.localeCompare(b.check_in))[0] ?? null,
    [bookings, today]
  );

  const bookingMap = useMemo(() => buildBookingMap(bookings), [bookings]);

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) =>
      new Date(y, m, i + 1).toISOString().slice(0, 10)
    );
  }, [currentMonth]);

  const sortedBookings = useMemo(() => {
    const real   = bookings.filter(b => b.booking_type !== "block");
    const future = real.filter(b => b.check_out >= today);
    const past   = real.filter(b => b.check_out < today);
    return [...future, ...past];
  }, [bookings, today]);

  // ── Mobile: prenotazioni del mese corrente nel calendario ────────────────
  const mobileCalendarBookings = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const primoGiorno  = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const ultimoGiorno = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    return bookings
      .filter(b =>
        b.booking_type !== "block" &&
        b.check_in <= ultimoGiorno &&
        b.check_out > primoGiorno
      )
      .sort((a, bk) => a.check_in.localeCompare(bk.check_in));
  }, [bookings, currentMonth]);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: `1px solid ${c.cammello}`,
    borderRadius: 3, background: "rgba(255,255,255,0.55)",
    color: c.tabacco, fontSize: 14, fontFamily: "inherit", outline: "none",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: c.cammello, marginBottom: 6,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: c.lino, color: c.tabacco, fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: `1px solid ${c.sabbia}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.lino, gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: c.tabacco, letterSpacing: "-0.01em" }}>RS Central</h1>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={fetchBookings}
            style={{ padding: "0 10px", height: 32, border: `1px solid ${c.sabbia}`, borderRadius: 3, background: "transparent", color: c.cammello, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            ↻
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }}
            style={{ padding: "0 12px", height: 32, border: `1px solid ${c.sabbia}`, borderRadius: 3, background: "transparent", color: c.cammello, fontSize: 10, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Esci
          </button>
        </div>
      </header>


      {/* ── TAB BAR DESKTOP (nascosta su mobile) ── */}
      <div className="hidden md:flex" style={{ borderBottom: `1px solid ${c.sabbia}`, padding: "0 24px", background: c.lino }}>
        {(["calendario", "prenotazioni", "report", "import"] as const).map(tab => (
          <button key={tab}
            onClick={() => { setActiveTab(tab); if (tab === "import") fetchImportLogs(); }}
            style={{ padding: "12px 20px", border: "none", background: "none", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: activeTab === tab ? c.tabacco : c.cammello, borderBottom: `2px solid ${activeTab === tab ? c.tabacco : "transparent"}`, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {tab === "import" ? "Import Log" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── MAIN ── */}
      {/* pb-24 su mobile per la tab bar fissa in fondo */}
      <main className="pb-24 md:pb-16" style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 16px 0" }}>
        <div className="md:px-2">
          {dbError && <div style={{ padding: "12px 16px", background: "#fad7d7", borderRadius: 3, color: "#7a1a1a", fontSize: 13, marginBottom: 20 }}>Errore: {dbError}</div>}
          {loading && <p style={{ color: c.cammello, fontSize: 14 }}>Caricamento...</p>}

          {/* ══════════════════════════════════════════════════════════
              TAB: CALENDARIO
          ══════════════════════════════════════════════════════════ */}
          {!loading && activeTab === "calendario" && (
            <div>
              {/* Prossimo arrivo */}
              {nextArrival && (
                <div onClick={() => setSelectedBooking(nextArrival)}
                  style={{ background: c.tabacco, borderRadius: 10, padding: "16px 20px", marginBottom: 20, cursor: "pointer" }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sabbia, margin: "0 0 4px" }}>Prossimo arrivo</p>
                  <p style={{ fontSize: 20, fontWeight: 500, color: c.lino, margin: "0 0 10px" }}>
                    {getGuest(nextArrival)?.full_name ?? "—"}
                  </p>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[
                      ["Alloggio", getPropName(nextArrival) ?? "—"],
                      ["Arrivo",   fmt(nextArrival.check_in)],
                      ["Notti",    notti(nextArrival.check_in, nextArrival.check_out)],
                      ["Canale",   fmtCh(nextArrival.channel)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: c.sabbia, margin: "0 0 2px" }}>{k}</p>
                        <p style={{ fontSize: 13, color: c.lino, margin: 0, fontWeight: 500 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MOBILE: lista prenotazioni del mese corrente ──────── */}
              <div className="md:hidden">
                {/* Navigatore mese */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <button onClick={() => setCurrentMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n; })}
                    style={{ height: 44, padding: "0 14px", background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, cursor: "pointer", fontSize: 18, color: c.tabacco }}>‹</button>
                  <span style={{ fontSize: 15, fontWeight: 600, flex: 1, textAlign: "center" }}>
                    {MONTH_IT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button onClick={() => setCurrentMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n; })}
                    style={{ height: 44, padding: "0 14px", background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, cursor: "pointer", fontSize: 18, color: c.tabacco }}>›</button>
                </div>

                {mobileCalendarBookings.length === 0 ? (
                  <p style={{ color: c.cammello, fontSize: 14 }}>Nessuna prenotazione in {MONTH_IT[currentMonth.getMonth()]} {currentMonth.getFullYear()}.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {mobileCalendarBookings.map((b, idx) => {
                      const guest = getGuest(b);
                      const badge = channelBadge(b.channel);
                      const nn = Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000);
                      const inCorso = b.check_in < today && b.check_out > today;
                      return (
                        <div key={`cal-${b.id}-${idx}`} onClick={() => setSelectedBooking(b)}
                          style={{ background: "#fff", border: `1px solid ${c.sabbia}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", minHeight: 72 }}>
                          {/* Riga 1: nome + badge canale */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 500, color: c.tabacco, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {guest?.full_name ?? fmtCh(b.channel)}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              {inCorso && (
                                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c.lino, background: c.cammello, padding: "2px 6px", borderRadius: 4 }}>
                                  In corso
                                </span>
                              )}
                              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: badge.bg, color: badge.color }}>
                                {fmtCh(b.channel)}
                              </span>
                            </div>
                          </div>
                          {/* Riga 2: alloggio */}
                          {getPropName(b) && (
                            <div style={{ fontSize: 12, color: c.cammello, marginBottom: 4 }}>{getPropName(b)}</div>
                          )}
                          {/* Riga 3: date */}
                          <div style={{ fontSize: 13, color: c.tabacco }}>
                            {fmtShort(b.check_in)} → {fmtShort(b.check_out)}
                            <span style={{ color: c.cammello, marginLeft: 6 }}>({nn} {nn === 1 ? "notte" : "notti"})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DESKTOP: griglia calendario ────────────────────────── */}
              <div className="hidden md:block">
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <button onClick={() => setCurrentMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n; })}
                    style={{ background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 18, color: c.tabacco }}>‹</button>
                  <span style={{ fontSize: 15, fontWeight: 600, minWidth: 140, textAlign: "center" }}>
                    {MONTH_IT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button onClick={() => setCurrentMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n; })}
                    style={{ background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 18, color: c.tabacco }}>›</button>
                </div>

                <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${c.sabbia}` }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", minWidth: calendarDays.length * 36 + 120 }}>
                    <thead>
                      <tr style={{ background: c.sabbia }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.tabacco, minWidth: 120, position: "sticky", left: 0, background: c.sabbia, zIndex: 1 }}>Alloggio</th>
                        {calendarDays.map(day => {
                          const d = parseInt(day.slice(8));
                          const isToday = day === today;
                          return (
                            <th key={day} style={{ padding: "6px 0", textAlign: "center", fontSize: 11, color: isToday ? c.cammello : c.tabacco, fontWeight: isToday ? 700 : 400, minWidth: 32, border: isToday ? `1px solid ${c.cammello}` : undefined, borderRadius: 3 }}>
                              {d}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((prop, pi) => {
                        const propMap = bookingMap.get(prop.id);
                        return (
                          <tr key={prop.id} style={{ background: pi % 2 === 0 ? "#fff" : "rgba(212,201,181,0.15)", borderBottom: `1px solid ${c.sabbia}` }}>
                            <td style={{ padding: "6px 12px", fontSize: 13, fontWeight: 500, color: c.tabacco, whiteSpace: "nowrap", position: "sticky", left: 0, background: pi % 2 === 0 ? "#fff" : "rgba(240,235,224,0.9)", zIndex: 1 }}>
                              {prop.name}
                            </td>
                            {calendarDays.map(day => {
                              const cell = propMap?.get(day);
                              if (!cell) return <td key={day} style={{ minWidth: 32, height: 32 }} />;
                              const { b, isStart, isEnd } = cell;
                              const bg = barColor(b);
                              const br = isStart && isEnd ? "6px" : isStart ? "6px 0 0 6px" : isEnd ? "0 6px 6px 0" : "0";
                              return (
                                <td key={day} onClick={() => setSelectedBooking(b)}
                                  style={{ minWidth: 32, height: 32, background: bg, borderRadius: br, cursor: "pointer", verticalAlign: "middle", paddingLeft: isStart ? 6 : 0, overflow: "hidden", maxWidth: 80 }}>
                                  {isStart && (
                                    <span style={{ fontSize: 10, color: "#fff", whiteSpace: "nowrap", fontWeight: 600 }}>
                                      {barLabel(b)}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {properties.length === 0 && (
                        <tr><td colSpan={calendarDays.length + 1} style={{ padding: 20, color: c.cammello, fontSize: 13 }}>Nessun alloggio attivo.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
                  {[["#2d6a4f","Confermata"], ["#c9963a","In attesa"], ["#aaa","Blocco iCal"]].map(([col, label]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 16, height: 10, borderRadius: 3, background: col }} />
                      <span style={{ fontSize: 12, color: c.cammello }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB: PRENOTAZIONI
          ══════════════════════════════════════════════════════════ */}
          {!loading && activeTab === "prenotazioni" && (
            <div>
              {/* ── FORM AGGIUNGI PRENOTAZIONE (in cima) ── */}
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setFormOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.cammello, fontFamily: "inherit" }}>
                  <span style={{ fontSize: 18 }}>{formOpen ? "−" : "+"}</span>
                  Aggiungi prenotazione manuale
                </button>
                {formOpen && (
                  <form onSubmit={handleSubmit} style={{ marginTop: 16, background: c.sabbia, borderRadius: 6, padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={lbl}>Alloggio</label>
                      <select name="property_id" value={form.property_id} onChange={e => { const pid = e.target.value; const prop = properties.find(p => p.id === pid); setForm(f => ({ ...f, property_id: pid, channel: prop?.is_private ? "No Tax" : f.channel })); }} style={inp} required>
                        {properties.length === 0 && <option value="">Caricamento…</option>}
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Nome ospite</label><input value={form.nome_ospite} onChange={e => setForm(f => ({ ...f, nome_ospite: e.target.value }))} required placeholder="Mario Rossi" style={inp} /></div>
                    <div><label style={lbl}>Telefono</label><input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+39 333 0000000" style={inp} /></div>
                    <div><label style={lbl}>Arrivo</label><input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} required style={inp} /></div>
                    <div><label style={lbl}>Partenza</label><input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} required style={inp} /></div>
                    <div><label style={lbl}>Ospiti</label><select value={form.num_guests} onChange={e => setForm(f => ({ ...f, num_guests: e.target.value }))} style={inp}>{[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                    <div><label style={lbl}>Canale</label><select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as typeof form.channel }))} style={inp}>{CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}</select></div>
                    <div><label style={lbl}>Stato</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))} style={inp}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
                    <div><label style={lbl}>Pagamento (€)</label><input type="number" value={form.total_price} onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))} placeholder="0" style={inp} /></div>
                    <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Note</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Check-in tardivo…" style={{ ...inp, resize: "vertical" }} /></div>
                    {formError && <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "#fad7d7", borderRadius: 3, color: "#7a1a1a", fontSize: 13 }}>Errore: {formError}</div>}
                    {saved     && <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "#d0ead0", borderRadius: 3, color: "#1a4d1a", fontSize: 13 }}>Prenotazione salvata.</div>}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <button type="submit" disabled={saving} style={{ padding: "12px 32px", background: c.tabacco, color: c.lino, border: "none", borderRadius: 3, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: "inherit", fontWeight: 500 }}>
                        {saving ? "Salvataggio…" : "Aggiungi"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
              {/* ── BLOCCA DATE (in cima) ── */}
              <div style={{ marginBottom: 24 }}>
                <button onClick={() => setBlockOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.cammello, fontFamily: "inherit" }}>
                  <span style={{ fontSize: 18 }}>{blockOpen ? "−" : "+"}</span>
                  Blocca date
                </button>
                {blockOpen && (
                  <form onSubmit={handleBlockSubmit} style={{ marginTop: 12, background: c.sabbia, borderRadius: 6, padding: "20px 24px", display: "flex", flexWrap: "wrap", gap: "16px 24px", alignItems: "flex-end" }}>
                    <div><label style={lbl}>Arrivo</label><input type="date" required value={blockForm.check_in} onChange={e => setBlockForm(f => ({ ...f, check_in: e.target.value }))} style={{ ...inp, width: 160 }} /></div>
                    <div><label style={lbl}>Partenza</label><input type="date" required value={blockForm.check_out} onChange={e => setBlockForm(f => ({ ...f, check_out: e.target.value }))} style={{ ...inp, width: 160 }} /></div>
                    <button type="submit" disabled={blockSaving} style={{ padding: "10px 24px", background: "#555", color: "#fff", border: "none", borderRadius: 3, fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: blockSaving ? "default" : "pointer", opacity: blockSaving ? 0.6 : 1 }}>{blockSaving ? "Salvo…" : "Blocca"}</button>
                  </form>
                )}
              </div>

              {sortedBookings.length === 0
                ? <p style={{ color: c.cammello, fontSize: 14 }}>Nessuna prenotazione.</p>
                : (
                  <>
                    {/* MOBILE: card layout ────────────────────────────── */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {sortedBookings.map(b => {
                        const guest = getGuest(b);
                        const fin = calcFin(b);
                        const isPast = b.check_out < today;
                        const badge = channelBadge(b.channel);
                        return (
                          <div key={b.id} onClick={() => setSelectedBooking(b)}
                            style={{ background: "#fff", border: `1px solid ${c.sabbia}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", opacity: isPast ? 0.55 : 1 }}>
                            {/* Riga 1: nome ospite + badge canale */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                              <span style={{ fontSize: 16, fontWeight: 600, color: c.tabacco, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {guest?.full_name ?? <span style={{ color: c.cammello, fontStyle: "italic" }}>Ospite non identificato</span>}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                                {fmtCh(b.channel)}
                              </span>
                            </div>
                            {/* Riga 2: date + alloggio + copia link */}
                            <div style={{ fontSize: 13, color: c.cammello, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                {fmt(b.check_in)} → {fmt(b.check_out)}
                                {getPropName(b) && <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 4, background: c.sabbia, fontSize: 11, color: c.tabacco }}>{getPropName(b)}</span>}
                              </div>
                              <button onClick={e => { e.stopPropagation(); copyLink(b.id); }}
                                style={{ flexShrink: 0, padding: "4px 10px", height: 28, background: copiedId === b.id ? "#d0ead0" : c.sabbia, color: copiedId === b.id ? "#1a4d1a" : c.tabacco, border: "none", borderRadius: 4, fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                {copiedId === b.id ? "Copiato!" : "Copia link"}
                              </button>
                            </div>
                            {/* Riga 3: lordo + utile */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 20, fontWeight: 500, color: c.tabacco }}>
                                {b.gross_amount ? `€ ${b.gross_amount}` : null}
                              </span>
                              {fin ? (
                                <span style={{ fontSize: 18, fontWeight: 700, color: fin.utile_reale >= 0 ? "#1a4d1a" : "#a03030" }}>
                                  {eur(fin.utile_reale)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP: tabella ────────────────────────────────── */}
                    <div className="hidden md:block" style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${c.sabbia}` }}>
                            {["Ospite","Alloggio","Arrivo","Partenza","Notti","Canale","Lordo","Comm. OTA","Netto OTA","Cedolare","Netto Ric.","Pulizie","Utile","Stato","Pagamento","Check-in"].map(h => (
                              <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBookings.map((b, i) => {
                            const guest = getGuest(b);
                            const isPast = b.check_out < today;
                            const rowBg = i % 2 === 0 ? "#fff" : "#FAFAF8";
                            const fin = calcFin(b);
                            return (
                              <tr key={b.id} style={{ borderBottom: `1px solid ${c.sabbia}`, background: rowBg, opacity: isPast ? 0.5 : 1, cursor: "pointer" }} onClick={() => setSelectedBooking(b)}>
                                <td style={{ padding: "11px 12px" }}>
                                  {guest?.full_name
                                    ? <div style={{ fontWeight: 500 }}>{guest.full_name}</div>
                                    : <div style={{ color: c.cammello, fontStyle: "italic" }}>Ospite non identificato</div>
                                  }
                                  {guest?.phone && <div style={{ fontSize: 11, color: c.cammello }}>{guest.phone}</div>}
                                </td>
                                <td style={{ padding: "11px 12px" }}>{getPropName(b) ?? <span style={{ color: c.sabbia }}>—</span>}</td>
                                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>{fmt(b.check_in)}</td>
                                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>{fmt(b.check_out)}</td>
                                <td style={{ padding: "11px 12px", color: c.cammello, textAlign: "center" }}>{notti(b.check_in, b.check_out)}</td>
                                <td style={{ padding: "11px 12px" }}>{fmtCh(b.channel)}</td>
                                <td style={{ padding: "11px 12px", color: b.gross_amount ? c.tabacco : c.sabbia }}>
                                  {b.gross_amount ? `€ ${b.gross_amount}` : "—"}
                                </td>
                                <td style={{ padding: "11px 12px", color: fin ? c.cammello : c.sabbia }}>{fin ? eur(fin.commissione_ota) : "—"}</td>
                                <td style={{ padding: "11px 12px", color: fin ? c.tabacco : c.sabbia }}>{fin ? eur(fin.netto_dopo_comm) : "—"}</td>
                                <td style={{ padding: "11px 12px", color: fin ? c.cammello : c.sabbia }}>{fin ? eur(fin.cedolare) : "—"}</td>
                                <td style={{ padding: "11px 12px", color: fin ? c.tabacco : c.sabbia }}>{fin ? eur(fin.netto_ricevuto) : "—"}</td>
                                <td style={{ padding: "11px 12px", color: fin ? c.cammello : c.sabbia }}>{fin ? eur(fin.costi_pulizie) : "—"}</td>
                                <td style={{ padding: "11px 12px", fontWeight: 600, color: fin ? c.tabacco : c.sabbia }}>{fin ? eur(fin.utile_reale) : "—"}</td>
                                <td style={{ padding: "11px 12px" }}>
                                  <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUS_STYLE[b.status]?.bg ?? c.sabbia, color: STATUS_STYLE[b.status]?.color ?? c.tabacco }}>
                                    {STATUS_LABEL[b.status] ?? b.status}
                                  </span>
                                </td>
                                <td style={{ padding: "11px 12px" }} onClick={e => { e.stopPropagation(); setEditPrice({ id: b.id, value: b.total_price?.toString() ?? "" }); }}>
                                  {editPrice?.id === b.id ? (
                                    <input
                                      autoFocus
                                      style={{ width: 80, padding: "4px 6px", border: `1px solid ${c.cammello}`, borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                                      value={editPrice.value}
                                      onChange={e => setEditPrice({ id: b.id, value: e.target.value })}
                                      onBlur={() => savePrice(b.id, editPrice.value)}
                                      onKeyDown={e => { if (e.key === "Enter") savePrice(b.id, editPrice.value); if (e.key === "Escape") setEditPrice(null); }}
                                    />
                                  ) : (
                                    <span style={{ color: b.total_price ? c.tabacco : c.sabbia }}>
                                      {b.total_price ? `€${b.total_price}` : "—"}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                                  {copiedId === b.id
                                    ? <span style={{ fontSize: 12, color: c.tabacco, fontWeight: 600 }}>Copiato!</span>
                                    : <button onClick={() => copyLink(b.id)} style={{ padding: "4px 10px", background: c.sabbia, color: c.tabacco, border: "none", borderRadius: 4, fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>Copia link</button>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB: IMPORT LOG
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "import" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: c.tabacco, margin: 0, letterSpacing: "-0.01em" }}>Ultimi 10 import email</h2>
                <button onClick={fetchImportLogs} style={{ padding: "6px 14px", border: `1px solid ${c.sabbia}`, borderRadius: 3, background: "none", fontSize: 12, color: c.cammello, fontFamily: "inherit", cursor: "pointer" }}>Aggiorna</button>
              </div>
              <div style={{ marginBottom: 32, background: c.sabbia, borderRadius: 6, padding: "20px 24px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.tabacco, margin: "0 0 4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Import storico CSV</p>
                <p style={{ fontSize: 12, color: c.cammello, margin: "0 0 14px" }}>Carica il CSV esportato da Airbnb per aggiornare nome ospite e importo sulle prenotazioni esistenti.</p>
                <label style={{ display: "inline-block", padding: "9px 18px", background: c.tabacco, color: c.lino, borderRadius: 3, fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: csvImporting ? "default" : "pointer", opacity: csvImporting ? 0.6 : 1, letterSpacing: "0.04em" }}>
                  {csvImporting ? "Importazione…" : "Scegli file CSV"}
                  <input type="file" accept=".csv" style={{ display: "none" }} disabled={csvImporting} onChange={handleCsvImport} />
                </label>
                {csvResult && (
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 4, background: (csvResult.errors?.length ?? 0) > 0 ? "#fef3cd" : "#d0ead0", color: (csvResult.errors?.length ?? 0) > 0 ? "#6b4c00" : "#1a4d1a", fontSize: 13 }}>
                    {(csvResult.created ?? 0) > 0 && <><strong>{csvResult.created} create</strong>, </>}
                    <strong>{csvResult.updated} aggiornate</strong>{csvResult.skipped > 0 ? `, ${csvResult.skipped} saltate` : ""}.
                    {(csvResult.errors?.length ?? 0) > 0 && <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>{csvResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                  </div>
                )}
              </div>

              {importLogs.length === 0
                ? <p style={{ color: c.cammello, fontSize: 14 }}>Nessun import ancora.</p>
                : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${c.sabbia}` }}>
                          {["Data", "Canale", "Ospite", "Ref.", "Azione", "Errore"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importLogs.map((log, i) => {
                          const actionStyle: Record<string, { bg: string; color: string }> = {
                            created: { bg: "#d0ead0", color: "#1a4d1a" },
                            updated: { bg: "#fef3cd", color: "#6b4c00" },
                            skipped: { bg: "#e8e8e8", color: "#555" },
                            error:   { bg: "#fad7d7", color: "#7a1a1a" },
                          };
                          const style = actionStyle[log.action ?? ""] ?? { bg: c.sabbia, color: c.tabacco };
                          const dt = log.created_at ? new Date(log.created_at) : null;
                          const dateStr = dt ? `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")} ${dt.getHours().toString().padStart(2,"0")}:${dt.getMinutes().toString().padStart(2,"0")}` : "—";
                          return (
                            <tr key={log.id} style={{ borderBottom: `1px solid ${c.sabbia}`, background: i % 2 === 0 ? c.lino : "rgba(212,201,181,0.18)" }}>
                              <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: c.cammello, fontSize: 12 }}>{dateStr}</td>
                              <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{log.channel ?? "—"}</td>
                              <td style={{ padding: "10px 12px" }}>{log.guest_name ?? "—"}</td>
                              <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: c.cammello }}>{log.booking_ref ?? "—"}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>{log.action ?? "—"}</span>
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: 12, color: "#7a1a1a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.error_message ?? ""}>{log.error_message ?? ""}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB: REPORT
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "report" && (() => {
            const { year, month } = reportMonth;

            const monthBookings = bookings.filter(b =>
              b.booking_type !== "block" &&
              b.check_in.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
            );

            const byProp = new Map<string, { name: string; rows: Booking[] }>();
            for (const b of monthBookings) {
              const pid  = b.property_id ?? "__none__";
              const name = getPropName(b) ?? "Senza alloggio";
              if (!byProp.has(pid)) byProp.set(pid, { name, rows: [] });
              byProp.get(pid)!.rows.push(b);
            }

            type FinTotals = { lordo: number; commissioni: number; netto_ota: number; cedolare: number; netto_ricevuto: number; pulizie: number; utile: number; count: number };
            function sumFin(rows: Booking[]): FinTotals {
              const t: FinTotals = { lordo: 0, commissioni: 0, netto_ota: 0, cedolare: 0, netto_ricevuto: 0, pulizie: 0, utile: 0, count: 0 };
              for (const b of rows) {
                const f = calcFin(b);
                if (!f) continue;
                t.count++;
                // No Tax escluse dal lordo fiscale, incluse nell'utile reale
                if (!f.is_no_tax) t.lordo += b.gross_amount ?? 0;
                t.commissioni   += f.commissione_ota;
                t.netto_ota     += f.netto_dopo_comm;
                t.cedolare      += f.cedolare;
                t.netto_ricevuto+= f.netto_ricevuto;
                t.pulizie       += f.costi_pulizie;
                t.utile         += f.utile_reale;
              }
              return t;
            }
            function totRow(t: FinTotals) {
              return [t.lordo, t.commissioni, t.netto_ota, t.cedolare, t.netto_ricevuto, t.pulizie, t.utile];
            }

            const propEntries = [...byProp.entries()];
            const totali = sumFin(monthBookings);
            const COL_LABELS = ["Lordo", "Comm. OTA", "Netto OTA", "Cedolare", "Netto Ric.", "Pulizie", "Utile"];
            const thStyle: React.CSSProperties = { padding: "9px 12px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.cammello, textAlign: "right", whiteSpace: "nowrap" };
            const tdNum: React.CSSProperties   = { padding: "9px 12px", textAlign: "right", fontSize: 13 };

            return (
              <div>
                {/* MOBILE ─────────────────────────────────────────────── */}
                <div className="md:hidden">
                  {/* Navigazione mese */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <button onClick={() => setReportMonth(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })}
                      style={{ height: 44, padding: "0 16px", background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, cursor: "pointer", fontSize: 18, color: c.tabacco }}>‹</button>
                    <span style={{ fontSize: 15, fontWeight: 600, flex: 1, textAlign: "center" }}>
                      {MONTH_IT[month]} {year}
                    </span>
                    <button onClick={() => setReportMonth(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })}
                      style={{ height: 44, padding: "0 16px", background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, cursor: "pointer", fontSize: 18, color: c.tabacco }}>›</button>
                  </div>

                  {monthBookings.length === 0 ? (
                    <p style={{ color: c.cammello, fontSize: 14 }}>Nessuna prenotazione in {MONTH_IT[month]} {year}.</p>
                  ) : (
                    <>
                      {/* Totali grandi */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        <div style={{ background: c.tabacco, borderRadius: 10, padding: "16px 18px" }}>
                          <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.sabbia, margin: "0 0 6px" }}>Lordo mese</p>
                          <p style={{ fontSize: 22, fontWeight: 700, color: c.lino, margin: 0, lineHeight: 1 }}>{eur(totali.lordo)}</p>
                        </div>
                        <div style={{ background: c.cammello, borderRadius: 10, padding: "16px 18px" }}>
                          <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.lino, margin: "0 0 6px" }}>Utile reale</p>
                          <p style={{ fontSize: 22, fontWeight: 700, color: c.lino, margin: 0, lineHeight: 1 }}>{eur(totali.utile)}</p>
                        </div>
                      </div>
                      {/* Stat secondarie */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                        {[
                          ["Prenotazioni", String(monthBookings.length)],
                          ["Cedolare",     eur(totali.cedolare)],
                          ["Pulizie",      eur(totali.pulizie)],
                        ].map(([label, val]) => (
                          <div key={label} style={{ background: c.sabbia, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                            <p style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: c.tabacco, margin: 0 }}>{val}</p>
                          </div>
                        ))}
                      </div>
                      {/* Lista prenotazioni compatta */}
                      <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, margin: "0 0 10px" }}>Dettaglio</p>
                      <div className="flex flex-col gap-2">
                        {monthBookings.map(b => {
                          const g = getGuest(b);
                          const f = calcFin(b);
                          const badge = channelBadge(b.channel);
                          return (
                            <div key={b.id} onClick={() => setSelectedBooking(b)}
                              style={{ background: "#fff", border: `1px solid ${c.sabbia}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minHeight: 56 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: c.tabacco, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {g?.full_name ?? "—"}
                                </div>
                                <div style={{ fontSize: 11, color: c.cammello }}>{fmt(b.check_in)} · {notti(b.check_in, b.check_out)}</div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: c.tabacco }}>{b.gross_amount ? `€ ${b.gross_amount}` : "—"}</div>
                                {f && <div style={{ fontSize: 12, fontWeight: 700, color: c.tabacco }}>{eur(f.utile_reale)}</div>}
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                                {fmtCh(b.channel)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* DESKTOP ─────────────────────────────────────────────── */}
                <div className="hidden md:block">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => setReportMonth(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })}
                        style={{ background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 18, color: c.tabacco }}>‹</button>
                      <span style={{ fontSize: 15, fontWeight: 600, minWidth: 160, textAlign: "center" }}>
                        {MONTH_IT[month]} {year}
                      </span>
                      <button onClick={() => setReportMonth(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })}
                        style={{ background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 18, color: c.tabacco }}>›</button>
                    </div>
                    <span style={{ fontSize: 12, color: c.cammello }}>{monthBookings.length} prenotazioni · {totali.count} con importo lordo</span>
                  </div>

                  {monthBookings.length === 0 ? (
                    <p style={{ color: c.cammello, fontSize: 14 }}>Nessuna prenotazione in {MONTH_IT[month]} {year}.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: c.sabbia }}>
                            <th style={{ ...thStyle, textAlign: "left", minWidth: 140 }}>Alloggio</th>
                            <th style={{ ...thStyle, textAlign: "center" }}>Pren.</th>
                            {COL_LABELS.map(h => <th key={h} style={thStyle}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {propEntries.map(([pid, { name, rows }], pi) => {
                            const t = sumFin(rows);
                            const vals = totRow(t);
                            return (
                              <tr key={pid} style={{ borderBottom: `1px solid ${c.sabbia}`, background: pi % 2 === 0 ? "#fff" : "rgba(212,201,181,0.15)" }}>
                                <td style={{ padding: "10px 12px", fontWeight: 600, color: c.tabacco }}>{name}</td>
                                <td style={{ ...tdNum, textAlign: "center", color: c.cammello }}>{rows.length}</td>
                                {vals.map((v, vi) => (
                                  <td key={vi} style={{ ...tdNum, fontWeight: vi === vals.length - 1 ? 700 : 400, color: vi === vals.length - 1 ? c.tabacco : vi % 2 === 1 ? c.cammello : c.tabacco }}>
                                    {eur(v)}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                          <tr style={{ borderTop: `2px solid ${c.tabacco}`, background: "rgba(44,36,22,0.06)" }}>
                            <td style={{ padding: "11px 12px", fontWeight: 700, fontSize: 13, color: c.tabacco }}>Totale generale</td>
                            <td style={{ ...tdNum, textAlign: "center", fontWeight: 700, color: c.tabacco }}>{monthBookings.length}</td>
                            {totRow(totali).map((v, vi) => (
                              <td key={vi} style={{ ...tdNum, fontWeight: 700, color: vi === COL_LABELS.length - 1 ? c.tabacco : vi % 2 === 1 ? c.cammello : c.tabacco }}>
                                {eur(v)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {monthBookings.length > 0 && (
                    <div style={{ marginTop: 36 }}>
                      <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, marginBottom: 10 }}>Dettaglio prenotazioni</p>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${c.sabbia}` }}>
                              {["Ospite","Alloggio","Arrivo","Notti","Canale","Lordo","Comm.","Netto OTA","Ced.","Netto Ric.","Pulizie","Utile"].map(h => (
                                <th key={h} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.cammello, textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthBookings.map((b, i) => {
                              const g  = getGuest(b);
                              const f  = calcFin(b);
                              const nn = Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000);
                              return (
                                <tr key={b.id} onClick={() => setSelectedBooking(b)} style={{ borderBottom: `1px solid ${c.sabbia}`, background: i % 2 === 0 ? "#fff" : "#FAFAF8", cursor: "pointer" }}>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{g?.full_name ?? <span style={{ color: c.cammello, fontStyle: "italic" }}>—</span>}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{getPropName(b) ?? "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>{fmt(b.check_in)}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{nn}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmtCh(b.channel)}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{b.gross_amount ? `€ ${b.gross_amount}` : "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: c.cammello }}>{f ? eur(f.commissione_ota) : "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{f ? eur(f.netto_dopo_comm) : "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: c.cammello }}>{f ? eur(f.cedolare) : "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{f ? eur(f.netto_ricevuto) : "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", color: c.cammello }}>{f ? eur(f.costi_pulizie) : "—"}</td>
                                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: f ? c.tabacco : c.sabbia }}>{f ? eur(f.utile_reale) : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          TAB BAR MOBILE — fissa in basso (nascosta su desktop)
      ══════════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden"
        style={{ background: c.lino, borderTop: `1px solid ${c.sabbia}`, zIndex: 50 }}>
        <div style={{ display: "flex" }}>
          {([
            {
              tab: "calendario",
              label: "Calendario",
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
            },
            {
              tab: "prenotazioni",
              label: "Pren.",
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>,
            },
            {
              tab: "report",
              label: "Report",
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="20" x2="21" y2="20"/><rect x="5" y="12" width="4" height="8"/><rect x="10" y="6" width="4" height="14"/><rect x="15" y="9" width="4" height="11"/></svg>,
            },
          ] as { tab: "calendario" | "prenotazioni" | "report"; label: string; svg: React.ReactNode }[]).map(({ tab, label, svg }) => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "10px 0 14px", gap: 3,
                background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                color: activeTab === tab ? c.tabacco : c.cammello,
                borderTop: `2px solid ${activeTab === tab ? c.tabacco : "transparent"}`,
                minHeight: 56,
              }}>
              {svg}
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM SHEET — dettaglio prenotazione
      ══════════════════════════════════════════════════════════════ */}
      {selectedBooking && (() => {
        const b = selectedBooking;
        const guest = getGuest(b);
        const fin = calcFin(b);
        return (
          <div onClick={() => { setSelectedBooking(null); setDeleteConfirm(false); }}
            style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

              {/* Handle */}
              <div style={{ width: 40, height: 4, background: c.sabbia, borderRadius: 2, margin: "0 auto 20px" }} />

              {/* Ospite */}
              <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Ospite</p>
              <p style={{ fontSize: 20, fontWeight: 600, color: c.tabacco, margin: "0 0 4px" }}>{guest?.full_name ?? "—"}</p>
              {guest?.phone && <p style={{ fontSize: 14, color: c.cammello, margin: "0 0 2px" }}>{guest.phone}</p>}
              {guest?.email && <p style={{ fontSize: 14, color: c.cammello, margin: "0 0 16px" }}>{guest.email}</p>}
              {!guest?.phone && !guest?.email && <div style={{ marginBottom: 16 }} />}

              {/* Dettagli */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 20 }}>
                {[
                  ["Alloggio",  getPropName(b) ?? "—"],
                  ["Canale",    fmtCh(b.channel)],
                  ["Arrivo",    fmt(b.check_in)],
                  ["Partenza",  fmt(b.check_out)],
                  ["Notti",     notti(b.check_in, b.check_out)],
                  ["Ospiti",    String(b.num_guests)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, margin: "0 0 2px" }}>{k}</p>
                    <p style={{ fontSize: 14, color: c.tabacco, fontWeight: 500, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Stato */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Stato</p>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_STYLE[b.status]?.bg ?? c.sabbia, color: STATUS_STYLE[b.status]?.color ?? c.tabacco }}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </div>

              {/* Pagamento */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, margin: "0 0 6px" }}>Pagamento</p>
                {editPrice?.id === b.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input autoFocus style={{ width: 100, padding: "6px 10px", border: `1px solid ${c.cammello}`, borderRadius: 6, fontSize: 14, fontFamily: "inherit" }}
                      value={editPrice.value}
                      onChange={e => setEditPrice({ id: b.id, value: e.target.value })}
                      onBlur={() => savePrice(b.id, editPrice.value)}
                      onKeyDown={e => { if (e.key === "Enter") savePrice(b.id, editPrice.value); if (e.key === "Escape") setEditPrice(null); }}
                    />
                    <span style={{ fontSize: 13, color: c.cammello, alignSelf: "center" }}>€ — Invio per salvare</span>
                  </div>
                ) : (
                  <button onClick={() => setEditPrice({ id: b.id, value: b.total_price?.toString() ?? "" })}
                    style={{ background: "none", border: `1px solid ${c.sabbia}`, borderRadius: 6, padding: "6px 14px", fontSize: 14, color: b.total_price ? c.tabacco : c.cammello, cursor: "pointer", fontFamily: "inherit" }}>
                    {b.total_price ? `€ ${b.total_price}` : "Aggiungi pagamento"}
                  </button>
                )}
              </div>

              {/* Riepilogo economico */}
              {fin && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, margin: "0 0 8px" }}>Riepilogo economico</p>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <tbody>
                      {([
                        ["Lordo OTA",       eur(b.gross_amount),       false],
                        [`Comm. ${fmtCh(b.channel)} (${((OTA_COMMISSION[b.channel.toLowerCase()] ?? 0) * 100).toFixed(2)}%)`, `− ${eur(fin.commissione_ota)}`, true],
                        ["Netto OTA",       eur(fin.netto_dopo_comm),  false],
                        [`Cedolare ${(fin.cedRate * 100).toFixed(0)}%`, `− ${eur(fin.cedolare)}`, true],
                        ["Netto ricevuto",  eur(fin.netto_ricevuto),   false],
                        ["Pulizie",         `− ${eur(fin.costi_pulizie)}`, true],
                      ] as [string, string, boolean][]).map(([label, value, isDeduction]) => (
                        <tr key={label} style={{ borderBottom: `1px solid ${c.sabbia}` }}>
                          <td style={{ padding: "7px 0", color: isDeduction ? "#a03030" : c.tabacco }}>{label}</td>
                          <td style={{ padding: "7px 0", textAlign: "right", color: isDeduction ? "#a03030" : c.tabacco }}>{value}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: `2px solid ${c.tabacco}` }}>
                        <td style={{ padding: "9px 0", fontWeight: 700, color: fin.utile_reale >= 0 ? "#1a4d1a" : "#a03030", fontSize: 14 }}>Utile reale</td>
                        <td style={{ padding: "9px 0", textAlign: "right", fontWeight: 700, color: fin.utile_reale >= 0 ? "#1a4d1a" : "#a03030", fontSize: 14 }}>{eur(fin.utile_reale)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Note */}
              {fmtNote(b.notes) && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Note</p>
                  <p style={{ fontSize: 14, color: c.tabacco, margin: 0 }}>{fmtNote(b.notes)}</p>
                </div>
              )}

              {/* Azioni */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                {b.guest_id === null && (
                  <button onClick={() => copyLink(b.id)} style={{ padding: "14px", background: c.tabacco, color: c.lino, border: "none", borderRadius: 8, fontSize: 14, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" }}>
                    {copiedId === b.id ? "Copiato!" : "Copia link check-in"}
                  </button>
                )}
                {b.guest_id !== null && (
                  <div style={{ padding: "12px 14px", background: "#d0ead0", borderRadius: 8, fontSize: 13, color: "#1a4d1a", textAlign: "center", fontWeight: 500 }}>
                    Check-in completato
                  </div>
                )}

                {!deleteConfirm
                  ? <button onClick={() => setDeleteConfirm(true)} style={{ padding: "14px", background: "none", color: "#a03030", border: "1px solid #f0c0c0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
                      Elimina prenotazione
                    </button>
                  : <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleDelete} style={{ flex: 1, padding: "14px", background: "#a03030", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>
                        Conferma eliminazione
                      </button>
                      <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, padding: "14px", background: "none", color: c.tabacco, border: `1px solid ${c.sabbia}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
                        Annulla
                      </button>
                    </div>
                }
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
