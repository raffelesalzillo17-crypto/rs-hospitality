"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const c = {
  tabacco: "#2C2416",
  lino: "#F0EBE0",
  cammello: "#8B7355",
  sabbia: "#D4C9B5",
} as const;

type Prenotazione = {
  id: number;
  data_arrivo: string;
  data_partenza: string;
  num_ospiti: number;
  canale: string;
  note: string | null;
  stato: string;
  created_at: string;
  ospiti: { nome: string; telefono: string } | null;
  alloggi: { nome: string } | null;
};

const CANALI = ["Airbnb", "Booking", "Diretto", "WhatsApp"] as const;
const STATI = ["in attesa", "confermata", "cancellata"] as const;

const STATO_STYLE: Record<string, { bg: string; color: string }> = {
  confermata:   { bg: "#d0ead0", color: "#1a4d1a" },
  "in attesa":  { bg: "#fef3cd", color: "#6b4c00" },
  cancellata:   { bg: "#fad7d7", color: "#7a1a1a" },
};

const emptyForm = {
  nome_ospite: "",
  telefono: "",
  data_arrivo: "",
  data_partenza: "",
  num_ospiti: "2",
  canale: "Diretto" as (typeof CANALI)[number],
  note: "",
  stato: "in attesa" as (typeof STATI)[number],
};

function fmt(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function notti(arrivo: string, partenza: string) {
  const ms = new Date(partenza).getTime() - new Date(arrivo).getTime();
  const n = Math.round(ms / 86_400_000);
  return n > 0 ? `${n}n` : "—";
}

export default function AdminPage() {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dbError, setDbError]   = useState<string | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);

  const fetchPrenotazioni = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    const { data, error } = await supabase
      .from("prenotazioni")
      .select("*, ospiti(*), alloggi(*)")
      .order("data_arrivo", { ascending: false });
    if (error) setDbError(error.message);
    else setPrenotazioni(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrenotazioni(); }, [fetchPrenotazioni]);

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
    const { data: ospite, error: ospiteErr } = await supabase
      .from("ospiti")
      .insert({ nome: form.nome_ospite.trim(), telefono: form.telefono.trim() })
      .select()
      .single();

    if (ospiteErr) {
      setFormError(ospiteErr.message);
      setSaving(false);
      return;
    }

    // 2 — inserisci prenotazione
    const { error: prenotErr } = await supabase.from("prenotazioni").insert({
      ospite_id:     ospite.id,
      data_arrivo:   form.data_arrivo,
      data_partenza: form.data_partenza,
      num_ospiti:    parseInt(form.num_ospiti, 10),
      canale:        form.canale,
      note:          form.note.trim() || null,
      stato:         form.stato,
    });

    if (prenotErr) {
      setFormError(prenotErr.message);
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setSaved(true);
    setSaving(false);
    await fetchPrenotazioni();
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
        <button
          onClick={fetchPrenotazioni}
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
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── SEZIONE LISTA ── */}
        <section>
          <h2 style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: c.cammello, marginBottom: 20 }}>
            Prenotazioni
          </h2>

          {loading && (
            <p style={{ color: c.cammello, fontSize: 14 }}>Caricamento...</p>
          )}

          {dbError && (
            <div style={{ padding: "12px 16px", background: "#fad7d7", borderRadius: 3, color: "#7a1a1a", fontSize: 13, marginBottom: 16 }}>
              Errore Supabase: {dbError}
            </div>
          )}

          {!loading && !dbError && prenotazioni.length === 0 && (
            <p style={{ color: c.cammello, fontSize: 14 }}>Nessuna prenotazione trovata.</p>
          )}

          {!loading && prenotazioni.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${c.sabbia}` }}>
                    {["Ospite", "Telefono", "Alloggio", "Arrivo", "Partenza", "Notti", "Ospiti", "Canale", "Stato", "Note"].map((h) => (
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
                  {prenotazioni.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: `1px solid ${c.sabbia}`,
                        background: i % 2 === 0 ? c.lino : "rgba(212,201,181,0.18)",
                      }}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 500 }}>
                        {p.ospiti?.nome ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px", color: c.cammello }}>
                        {p.ospiti?.telefono ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {p.alloggi?.nome ?? <span style={{ color: c.sabbia }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        {fmt(p.data_arrivo)}
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        {fmt(p.data_partenza)}
                      </td>
                      <td style={{ padding: "12px 14px", color: c.cammello, textAlign: "center" }}>
                        {notti(p.data_arrivo, p.data_partenza)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {p.num_ospiti}
                      </td>
                      <td style={{ padding: "12px 14px" }}>{p.canale}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          background: STATO_STYLE[p.stato]?.bg ?? c.sabbia,
                          color: STATO_STYLE[p.stato]?.color ?? c.tabacco,
                        }}>
                          {p.stato}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b5e4e", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.note ?? ""}
                      </td>
                    </tr>
                  ))}
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
            {/* Nome ospite */}
            <div>
              <label style={labelStyle}>Nome ospite</label>
              <input
                name="nome_ospite"
                value={form.nome_ospite}
                onChange={handleChange}
                required
                placeholder="Mario Rossi"
                style={inputStyle}
              />
            </div>

            {/* Telefono */}
            <div>
              <label style={labelStyle}>Telefono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+39 333 1234567"
                style={inputStyle}
              />
            </div>

            {/* Data arrivo */}
            <div>
              <label style={labelStyle}>Data arrivo</label>
              <input
                type="date"
                name="data_arrivo"
                value={form.data_arrivo}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            {/* Data partenza */}
            <div>
              <label style={labelStyle}>Data partenza</label>
              <input
                type="date"
                name="data_partenza"
                value={form.data_partenza}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            {/* Numero ospiti */}
            <div>
              <label style={labelStyle}>Numero ospiti</label>
              <select
                name="num_ospiti"
                value={form.num_ospiti}
                onChange={handleChange}
                style={inputStyle}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n} ospite{n > 1 ? "i" : ""}</option>
                ))}
              </select>
            </div>

            {/* Canale */}
            <div>
              <label style={labelStyle}>Canale</label>
              <select
                name="canale"
                value={form.canale}
                onChange={handleChange}
                style={inputStyle}
              >
                {CANALI.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>

            {/* Stato */}
            <div>
              <label style={labelStyle}>Stato</label>
              <select
                name="stato"
                value={form.stato}
                onChange={handleChange}
                style={inputStyle}
              >
                {STATI.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Note — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={3}
                placeholder="Check-in tardivo, richieste particolari..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Feedback */}
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

            {/* Submit — full width */}
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
