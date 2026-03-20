"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const c = {
  tabacco: "#2C2416",
  lino:    "#F0EBE0",
  cammello:"#8B7355",
  sabbia:  "#D4C9B5",
} as const;

type Booking = {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  guest_id: string | null;
  properties: { name: string } | null;
};

const DOC_TYPES = ["Carta d'identità", "Passaporto", "Patente"] as const;

function fmt(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default function CheckInPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name:       "",
    phone:           "",
    email:           "",
    document_type:   "Carta d'identità" as (typeof DOC_TYPES)[number],
    document_number: "",
    nationality:     "Italiana",
  });

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, num_guests, guest_id, properties(name)")
        .eq("id", id)
        .single();

      if (error || !data) { setNotFound(true); }
      else { setBooking(data as Booking); }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.document_number.trim()) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }
    setSubmitting(true);
    setError("");

    // 1. Crea ospite
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .insert({
        full_name:       form.full_name.trim(),
        phone:           form.phone.trim(),
        email:           form.email.trim() || null,
        document_type:   form.document_type,
        document_number: form.document_number.trim(),
        nationality:     form.nationality.trim(),
      })
      .select("id")
      .single();

    if (gErr || !guest) {
      setError("Errore nel salvataggio. Riprova.");
      setSubmitting(false);
      return;
    }

    // 2. Collega guest alla prenotazione
    const { error: bErr } = await supabase
      .from("bookings")
      .update({ guest_id: guest.id })
      .eq("id", id);

    if (bErr) {
      setError("Errore nel collegamento. Riprova.");
      setSubmitting(false);
      return;
    }

    router.push(`/checkin/${id}/benvenuto`);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.lino, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: c.cammello, fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: 15 }}>
          Caricamento…
        </p>
      </div>
    );
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: c.lino, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
          <p style={{ color: c.tabacco, fontSize: 18, marginBottom: "0.5rem" }}>Prenotazione non trovata.</p>
          <p style={{ color: c.cammello, fontSize: 14 }}>
            Contatta Raffaele:{" "}
            <a href="https://wa.me/393661033691" style={{ color: c.cammello }}>+39 366 103 3691</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Already checked in ──
  if (booking?.guest_id) {
    router.replace(`/checkin/${id}/benvenuto`);
    return null;
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: `1px solid ${c.sabbia}`,
    borderRadius: 8,
    background: "#fff",
    color: c.tabacco,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: c.cammello,
    marginBottom: "0.4rem",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: c.lino, fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: c.tabacco, padding: "1.5rem 1.5rem 1.25rem", textAlign: "center" }}>
        <p style={{ color: c.sabbia, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
          RS Hospitality
        </p>
        <h1 style={{ color: c.lino, fontSize: 22, fontWeight: 400, margin: "0.4rem 0 0", letterSpacing: "0.02em" }}>
          Registrazione ospite
        </h1>
      </div>

      {/* Booking summary */}
      {booking && (
        <div style={{ background: c.sabbia, padding: "0.9rem 1.5rem", display: "flex", gap: "2rem", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: c.tabacco }}>
            <strong>Check-in</strong> {fmt(booking.check_in)}
          </span>
          <span style={{ fontSize: 13, color: c.tabacco }}>
            <strong>Check-out</strong> {fmt(booking.check_out)}
          </span>
          {booking.properties && (
            <span style={{ fontSize: 13, color: c.tabacco }}>
              {booking.properties.name}
            </span>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input
              style={inputStyle}
              type="text"
              autoComplete="name"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Es. Mario Rossi"
            />
          </div>

          <div>
            <label style={labelStyle}>Telefono *</label>
            <input
              style={inputStyle}
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+39 000 000 0000"
            />
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opzionale)</span></label>
            <input
              style={inputStyle}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="nome@esempio.it"
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo documento *</label>
            <select
              style={inputStyle}
              value={form.document_type}
              onChange={e => setForm(f => ({ ...f, document_type: e.target.value as typeof form.document_type }))}
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Numero documento *</label>
            <input
              style={{ ...inputStyle, textTransform: "uppercase" }}
              type="text"
              value={form.document_number}
              onChange={e => setForm(f => ({ ...f, document_number: e.target.value.toUpperCase() }))}
              placeholder="CA00000AA"
            />
          </div>

          <div>
            <label style={labelStyle}>Nazionalità *</label>
            <input
              style={inputStyle}
              type="text"
              value={form.nationality}
              onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
              placeholder="Italiana"
            />
          </div>

        </div>

        {error && (
          <p style={{ color: "#a03030", fontSize: 14, marginTop: "1.25rem", textAlign: "center" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: "2rem",
            width: "100%",
            padding: "1rem",
            background: submitting ? c.sabbia : c.tabacco,
            color: c.lino,
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {submitting ? "Salvataggio…" : "Completa il check-in →"}
        </button>

        <p style={{ fontSize: 12, color: c.cammello, textAlign: "center", marginTop: "1.25rem", lineHeight: 1.5 }}>
          I dati vengono trattati esclusivamente per la gestione del soggiorno,<br />
          nel rispetto del GDPR e della normativa italiana sugli affitti brevi.
        </p>
      </form>
    </div>
  );
}
