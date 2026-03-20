"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const c = {
  tabacco: "#2C2416",
  lino: "#F0EBE0",
  cammello: "#8B7355",
  sabbia: "#D4C9B5",
} as const;

type Property = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  channel: string;
  notes: string | null;
  status: string;
  created_at: string;
  guest_id: string | null;
  guests: { full_name: string; phone: string | null } | null;
  properties: { name: string } | null;
};

const CHANNELS = ["Airbnb", "Booking", "Diretto", "WhatsApp"] as const;
const STATUSES = ["pending", "confirmed", "cancelled"] as const;

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: "#d0ead0", color: "#1a4d1a" },
  pending:   { bg: "#fef3cd", color: "#6b4c00" },
  cancelled: { bg: "#fad7d7", color: "#7a1a1a" },
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "confermata",
  pending:   "in attesa",
  cancelled: "cancellata",
};

const emptyForm = {
  nome_ospite:  "",
  telefono:     "",
  check_in:     "",
  check_out:    "",
  num_guests:   "2",
  channel:      "Diretto" as (typeof CHANNELS)[number],
  notes:        "",
  status:       "pending" as (typeof STATUSES)[number],
  property_id:  "",
};

function fmt(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const ICAL_NOISE = new Set([
  "reserved",
  "airbnb (not available)",
  "closed - not available",
  "not available",
]);

function fmtNote(note: string | null) {
  if (!note) return "";
  return ICAL_NOISE.has(note.toLowerCase().trim()) ? "" : note;
}

const CHANNEL_LABEL: Record<string, string> = {
  airbnb:  "Airbnb",
  booking: "Booking",
  diretto: "Diretto",
  direct:  "Diretto",
  whatsapp:"WhatsApp",
};

function fmtChannel(ch: string) {
  return CHANNEL_LABEL[ch.toLowerCase()] ?? ch;
}

function notti(arrivo: string, partenza: string) {
  const ms = new Date(partenza).getTime() - new Date(arrivo).getTime();
  const n = Math.round(ms / 86_400_000);
  return n > 0 ? `${n}n` : "—";
}

export default function AdminPage() {
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [loading, setLoading]       = useState(true);
  const [dbError, setDbError]       = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [saved, setSaved]           = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState<{ sincronizzati: number; skippati: number; errori: string[] } | null>(null);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync-calendar");
      const data = await res.json();
      setSyncResult(data);
      await fetchBookings();
    } catch (e) {
      setSyncResult({ sincronizzati: 0, skippati: 0, errori: [(e as Error).message] });
    } finally {
      setSyncing(false);
    }
  }

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, guests(full_name, phone), properties(name)")
      .order("check_in", { ascending: false });
    if (error) setDbError(error.message);
    else setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
    supabase
      .from("properties")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProperties(data);
          setForm(f => ({ ...f, property_id: data[0].id }));
        }
      });
  }, [fetchBookings]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSaved(false);

    // 1 — inserisci ospite
    const { data: guest, error: guestErr } = await supabase
      .from("guests")
      .insert({ full_name: form.nome_ospite.trim(), phone: form.telefono.trim() || null })
      .select()
      .single();

    if (guestErr) { setFormError(guestErr.message); setSaving(false); return; }

    // 2 — inserisci prenotazione
    const { error: bookErr } = await supabase.from("bookings").insert({
      guest_id:    guest.id,
      property_id: form.property_id || null,
      check_in:    form.check_in,
      check_out:   form.check_out,
      num_guests:  parseInt(form.num_guests, 10),
      channel:     form.channel,
      notes:       form.notes.trim() || null,
      status:      form.status,
    });

    if (bookErr) { setFormError(bookErr.message); setSaving(false); return; }

    setForm(emptyForm);
    setSaved(true);
    setSaving(false);
    await fetchBookings();
  }

  function copyCheckinLink(id: string) {
    navigator.clipboard.writeText(`https://rs-hospitality.vercel.app/checkin/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ── styles ──────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.cammello}`,
    borderRadius: 3,
    background: "rgba(255,255,255,0.55)",
    color: c.tabacco,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: c.cammello,
    marginBottom: 6,
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: c.lino, color: c.tabacco, fontFamily: "inherit" }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: `1px solid ${c.sabbia}`,
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: c.lino,
      }}>
        <div>
          <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: c.cammello }}>
            RS Hospitality
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginTop: 2, color: c.tabacco }}>
            Pannello prenotazioni
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: "8px 18px",
              border: `1px solid ${c.tabacco}`,
              borderRadius: 3,
              background: c.tabacco,
              color: c.lino,
              fontSize: 13,
              cursor: syncing ? "default" : "pointer",
              opacity: syncing ? 0.6 : 1,
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            {syncing ? "Sincronizzazione..." : "⟳ Sincronizza calendario"}
          </button>
          <button
            onClick={fetchBookings}
            style={{
              padding: "8px 18px",
              border: `1px solid ${c.cammello}`,
              borderRadius: 3,
              background: "transparent",
              color: c.cammello,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ↻ Aggiorna
          </button>
        </div>
      </header>

      {syncResult && (
        <div style={{
          margin: "0 32px",
          padding: "12px 20px",
          borderRadius: 3,
          fontSize: 13,
          background: syncResult.errori.length > 0 ? "#fef3cd" : "#d0ead0",
          color: syncResult.errori.length > 0 ? "#6b4c00" : "#1a4d1a",
          borderLeft: `4px solid ${syncResult.errori.length > 0 ? "#e6a817" : "#2e7d32"}`,
        }}>
          <strong>Sincronizzazione completata:</strong>{" "}
          {syncResult.sincronizzati} nuove prenotazioni importate, {syncResult.skippati} già presenti.
          {syncResult.errori.length > 0 && (
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              {syncResult.errori.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── SEZIONE LISTA ── */}
        <section>
          <h2 style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: c.cammello, marginBottom: 20 }}>
            Prenotazioni
          </h2>

          {loading && <p style={{ color: c.cammello, fontSize: 14 }}>Caricamento...</p>}

          {dbError && (
            <div style={{ padding: "12px 16px", background: "#fad7d7", borderRadius: 3, color: "#7a1a1a", fontSize: 13, marginBottom: 16 }}>
              Errore Supabase: {dbError}
            </div>
          )}

          {!loading && !dbError && bookings.length === 0 && (
            <p style={{ color: c.cammello, fontSize: 14 }}>Nessuna prenotazione trovata.</p>
          )}

          {!loading && bookings.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${c.sabbia}` }}>
                    {["Ospite", "Telefono", "Alloggio", "Arrivo", "Partenza", "Notti", "Ospiti", "Canale", "Stato", "Note", "Check-in"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: c.cammello,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => {
                    const guestName = Array.isArray(b.guests)
                      ? b.guests[0]?.full_name
                      : b.guests?.full_name;
                    const guestPhone = Array.isArray(b.guests)
                      ? b.guests[0]?.phone
                      : b.guests?.phone;
                    const propName = Array.isArray(b.properties)
                      ? b.properties[0]?.name
                      : b.properties?.name;

                    return (
                      <tr
                        key={b.id}
                        style={{
                          borderBottom: `1px solid ${c.sabbia}`,
                          background: i % 2 === 0 ? c.lino : "rgba(212,201,181,0.18)",
                        }}
                      >
                        <td style={{ padding: "12px 14px", fontWeight: 500 }}>
                          {guestName ?? <span style={{ color: c.sabbia }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 14px", color: c.cammello }}>
                          {guestPhone ?? "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {propName ?? <span style={{ color: c.sabbia }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {fmt(b.check_in)}
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {fmt(b.check_out)}
                        </td>
                        <td style={{ padding: "12px 14px", color: c.cammello, textAlign: "center" }}>
                          {notti(b.check_in, b.check_out)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {b.num_guests}
                        </td>
                        <td style={{ padding: "12px 14px" }}>{fmtChannel(b.channel)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            background: STATUS_STYLE[b.status]?.bg ?? c.sabbia,
                            color: STATUS_STYLE[b.status]?.color ?? c.tabacco,
                          }}>
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6b5e4e", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fmtNote(b.notes) || <span style={{ color: c.sabbia }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {copiedId === b.id ? (
                            <span style={{ fontSize: 12, color: "#1a4d1a", fontWeight: 600 }}>Copiato!</span>
                          ) : b.guest_id !== null ? (
                            <span style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>Check-in completato</span>
                          ) : (
                            <button
                              onClick={() => copyCheckinLink(b.id)}
                              style={{
                                padding: "5px 12px",
                                background: c.cammello,
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 12,
                                fontFamily: "inherit",
                                fontWeight: 600,
                                cursor: "pointer",
                                letterSpacing: "0.03em",
                              }}
                            >
                              Link check-in
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── SEZIONE FORM ── */}
        <section>
          <h2 style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: c.cammello, marginBottom: 20 }}>
            Aggiungi prenotazione manuale
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{
              background: c.sabbia,
              borderRadius: 4,
              padding: "32px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px 28px",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Alloggio</label>
              <select name="property_id" value={form.property_id} onChange={handleChange} style={inputStyle} required>
                {properties.length === 0 && <option value="">Caricamento…</option>}
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Nome ospite</label>
              <input name="nome_ospite" value={form.nome_ospite} onChange={handleChange} required placeholder="Mario Rossi" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Telefono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+39 333 1234567" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Data arrivo</label>
              <input type="date" name="check_in" value={form.check_in} onChange={handleChange} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Data partenza</label>
              <input type="date" name="check_out" value={form.check_out} onChange={handleChange} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Numero ospiti</label>
              <select name="num_guests" value={form.num_guests} onChange={handleChange} style={inputStyle}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n} ospite{n > 1 ? "i" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Canale</label>
              <select name="channel" value={form.channel} onChange={handleChange} style={inputStyle}>
                {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Stato</label>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Note</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Check-in tardivo, richieste particolari..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {formError && (
              <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "#fad7d7", borderRadius: 3, color: "#7a1a1a", fontSize: 13 }}>
                Errore: {formError}
              </div>
            )}
            {saved && (
              <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "#d0ead0", borderRadius: 3, color: "#1a4d1a", fontSize: 13 }}>
                Prenotazione salvata con successo.
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "12px 32px",
                  background: c.tabacco,
                  color: c.lino,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 13,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  fontFamily: "inherit",
                  fontWeight: 500,
                }}
              >
                {saving ? "Salvataggio..." : "Aggiungi prenotazione"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
