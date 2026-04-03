"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const c = {
  tabacco:  "#2C2416",
  lino:     "#F0EBE0",
  cammello: "#8B7355",
  sabbia:   "#D4C9B5",
} as const;

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

type DocType = "Carta d'identità" | "Passaporto" | "Patente";
type Property = { name: string; address: string | null; city: string | null };
type Booking  = { id: string; check_in: string; check_out: string; guest_id: string | null; properties: Property | Property[] | null };

function propName(p: Property | Property[] | null): string {
  if (!p) return "";
  return Array.isArray(p) ? (p[0]?.name ?? "") : (p.name ?? "");
}
function propAddress(p: Property | Property[] | null): string {
  if (!p) return "";
  const prop = Array.isArray(p) ? p[0] : p;
  if (!prop) return "";
  return [prop.address, prop.city].filter(Boolean).join(", ");
}

const emptyForm = {
  nome_completo:    "",
  telefono:         "",
  email:            "",
  document_type:    "Carta d'identità" as DocType,
  document_number:  "",
  nazionalita:      "Italiana",
  num_ospiti:       "1",
};

type CompagnoForm = {
  nome_completo:   string;
  document_type:   DocType;
  document_number: string;
  nazionalita:     string;
};

const emptyCompagno = (): CompagnoForm => ({
  nome_completo:   "",
  document_type:   "Carta d'identità",
  document_number: "",
  nazionalita:     "Italiana",
});

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [booking,     setBooking]    = useState<Booking | null>(null);
  const [notFound,    setNotFound]   = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [formOpen,    setFormOpen]   = useState(false);
  const [form,        setForm]       = useState(emptyForm);
  const [compagni,    setCompagni]   = useState<CompagnoForm[]>([]);
  const [submitting,  setSubmitting] = useState(false);
  const [error,       setError]      = useState("");

  // Carica prenotazione
  useEffect(() => {
    supabase
      .from("bookings")
      .select("id, check_in, check_out, guest_id, properties(name, address, city)")
      .eq("id", id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setNotFound(true); setLoading(false); return; }
        setBooking(data as Booking);
        setLoading(false);
      });
  }, [id]);

  // Se già fatto il check-in → guida
  useEffect(() => {
    if (booking?.guest_id) router.replace(`/checkin/${id}/guida`);
  }, [booking, id, router]);

  // Blocca scroll body quando form aperto
  useEffect(() => {
    document.body.style.overflow = formOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [formOpen]);

  // Aggiorna array compagni al cambio num_ospiti
  useEffect(() => {
    const n = parseInt(form.num_ospiti, 10);
    const extra = Math.max(0, n - 1);
    setCompagni(prev => {
      if (prev.length === extra) return prev;
      if (prev.length < extra) return [...prev, ...Array.from({ length: extra - prev.length }, emptyCompagno)];
      return prev.slice(0, extra);
    });
  }, [form.num_ospiti]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nome_completo.trim())   { setError("Inserisci il tuo nome completo."); return; }
    if (!form.telefono.trim())         { setError("Inserisci il numero di telefono."); return; }
    if (!form.document_number.trim()) { setError("Inserisci il numero del documento."); return; }

    for (let i = 0; i < compagni.length; i++) {
      if (!compagni[i].nome_completo.trim())   { setError(`Inserisci il nome dell'ospite ${i + 2}.`); return; }
      if (!compagni[i].document_number.trim()) { setError(`Inserisci il documento dell'ospite ${i + 2}.`); return; }
    }

    setSubmitting(true);

    // Salva ospite principale
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .insert({
        full_name:       form.nome_completo.trim(),
        phone:           form.telefono.trim(),
        email:           form.email.trim() || null,
        document_type:   form.document_type,
        document_number: form.document_number.trim().toUpperCase(),
        nationality:     form.nazionalita.trim(),
      })
      .select("id")
      .single();

    if (gErr || !guest) { setError("Errore nel salvataggio. Riprova."); setSubmitting(false); return; }

    // Aggiorna booking
    const { error: bErr } = await supabase
      .from("bookings")
      .update({ guest_id: guest.id, num_guests: parseInt(form.num_ospiti, 10) })
      .eq("id", id);

    if (bErr) { setError("Errore nel collegamento prenotazione. Riprova."); setSubmitting(false); return; }

    // Salva compagni
    if (compagni.length > 0) {
      const righe = compagni.map(c => ({
        guest_id:        guest.id,
        booking_id:      id,
        full_name:       c.nome_completo.trim(),
        document_type:   c.document_type,
        document_number: c.document_number.trim().toUpperCase(),
        citizenship:     c.nazionalita.trim(),
        companion_type:  "ospite",
      }));
      const { error: cErr } = await supabase.from("guest_companions").insert(righe);
      if (cErr) { setError("Errore nel salvataggio degli ospiti aggiuntivi. Riprova."); setSubmitting(false); return; }
    }

    router.push(`/checkin/${id}/guida`);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "14px 16px",
    border: `1px solid ${c.sabbia}`, borderRadius: 6,
    background: "#fff", color: c.tabacco,
    fontFamily: FONT, fontSize: 16, outline: "none",
    boxSizing: "border-box", WebkitAppearance: "none",
    appearance: "none",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 600,
    letterSpacing: "0.1em", textTransform: "uppercase",
    color: c.cammello, marginBottom: 6, fontFamily: FONT,
  };
  const selectStyle = {
    ...inp,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238B7355' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: c.tabacco, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${c.sabbia}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Not found ────────────────────────────────────────────────
  if (notFound) return (
    <div style={{ minHeight: "100vh", background: c.tabacco, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: FONT }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <p style={{ color: c.sabbia, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 1.5rem" }}>RS Hospitality</p>
        <p style={{ color: c.lino, fontSize: 20, fontWeight: 300, margin: "0 0 0.75rem", lineHeight: 1.4 }}>Link non valido o prenotazione non trovata.</p>
        <p style={{ color: c.cammello, fontSize: 14, lineHeight: 1.6, margin: "0 0 1.5rem" }}>Contatta il tuo host per ricevere il link corretto.</p>
        <a href="https://wa.me/393661033691" style={{ color: c.sabbia, fontSize: 13, textDecoration: "underline" }}>+39 366 103 3691</a>
      </div>
    </div>
  );

  const nome      = propName(booking?.properties ?? null);
  const indirizzo = propAddress(booking?.properties ?? null);

  // ── Landing ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: c.tabacco, fontFamily: FONT, position: "relative", overflowX: "hidden" }}>

      {/* Texture radiale */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(139,115,85,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.25) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Contenuto landing */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem 10rem", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "clamp(48px, 14vw, 72px)", fontWeight: 700, color: c.lino, letterSpacing: "-0.02em", lineHeight: 1 }}>RS</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: c.cammello, marginTop: 4 }}>Hospitality</div>
        </div>

        {/* Alloggio */}
        {nome && (
          <div style={{ marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "clamp(22px, 6vw, 30px)", fontStyle: "italic", fontWeight: 300, color: c.lino, margin: 0, letterSpacing: "0.01em" }}>{nome}</p>
          </div>
        )}
        {indirizzo && (
          <p style={{ fontSize: 13, color: c.cammello, margin: "0 0 3rem", letterSpacing: "0.03em" }}>{indirizzo}</p>
        )}
        {!nome && <div style={{ marginBottom: "3rem" }} />}

        {/* CTA */}
        <div style={{ width: "100%", maxWidth: 320 }}>
          <button
            onClick={() => setFormOpen(true)}
            style={{
              width: "100%", minHeight: 56, padding: "0 2rem",
              background: c.lino, color: c.tabacco,
              border: "none", borderRadius: 4,
              fontSize: 12, fontWeight: 700, fontFamily: FONT,
              letterSpacing: "0.18em", textTransform: "uppercase",
              cursor: "pointer",
            }}>
            Effettua il check-in
          </button>
          <p style={{ color: c.cammello, fontSize: 12, margin: "1rem 0 0", lineHeight: 1.6 }}>
            Compila i tuoi dati per accedere alla guida digitale
          </p>
        </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      {formOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setFormOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10 }}
          />
          {/* Sheet */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: c.lino, borderRadius: "20px 20px 0 0",
            zIndex: 11, maxHeight: "90vh", overflowY: "auto",
            WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            padding: "0 0 env(safe-area-inset-bottom, 24px)",
          } as React.CSSProperties}>

            {/* Handle */}
            <div style={{ width: 40, height: 4, background: c.sabbia, borderRadius: 2, margin: "14px auto 0" }} />

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem 1.5rem 2rem" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 1.5rem" }}>
                Dati ospite
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                <div>
                  <label style={lbl}>Nome completo *</label>
                  <input style={inp} type="text" autoComplete="name" placeholder="Mario Rossi"
                    value={form.nome_completo} onChange={e => setForm(f => ({ ...f, nome_completo: e.target.value }))} />
                </div>

                <div>
                  <label style={lbl}>Telefono *</label>
                  <input style={inp} type="tel" autoComplete="tel" placeholder="+39 333 0000000"
                    value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>

                <div>
                  <label style={lbl}>Email <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opzionale)</span></label>
                  <input style={inp} type="email" autoComplete="email" placeholder="mario@esempio.it"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={lbl}>Documento *</label>
                    <select style={selectStyle}
                      value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value as DocType }))}>
                      <option>Carta d&apos;identità</option>
                      <option>Passaporto</option>
                      <option>Patente</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Numero doc. *</label>
                    <input style={{ ...inp, textTransform: "uppercase" }} type="text" placeholder="CA000000"
                      value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value.toUpperCase() }))} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={lbl}>Nazionalita</label>
                    <input style={inp} type="text" placeholder="Italiana"
                      value={form.nazionalita} onChange={e => setForm(f => ({ ...f, nazionalita: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>N. ospiti</label>
                    <select style={selectStyle}
                      value={form.num_ospiti} onChange={e => setForm(f => ({ ...f, num_ospiti: e.target.value }))}>
                      {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

              </div>

              {/* ── Ospiti aggiuntivi ── */}
              {compagni.map((compagno, idx) => (
                <div key={idx} style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: `1px solid ${c.sabbia}` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 1rem" }}>
                    Ospite {idx + 2}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    <div>
                      <label style={lbl}>Nome completo *</label>
                      <input style={inp} type="text" placeholder="Mario Rossi"
                        value={compagno.nome_completo}
                        onChange={e => setCompagni(prev => prev.map((c, i) => i === idx ? { ...c, nome_completo: e.target.value } : c))} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={lbl}>Documento *</label>
                        <select style={selectStyle}
                          value={compagno.document_type}
                          onChange={e => setCompagni(prev => prev.map((c, i) => i === idx ? { ...c, document_type: e.target.value as DocType } : c))}>
                          <option>Carta d&apos;identità</option>
                          <option>Passaporto</option>
                          <option>Patente</option>
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Numero doc. *</label>
                        <input style={{ ...inp, textTransform: "uppercase" }} type="text" placeholder="CA000000"
                          value={compagno.document_number}
                          onChange={e => setCompagni(prev => prev.map((c, i) => i === idx ? { ...c, document_number: e.target.value.toUpperCase() } : c))} />
                      </div>
                    </div>

                    <div>
                      <label style={lbl}>Nazionalita</label>
                      <input style={inp} type="text" placeholder="Italiana"
                        value={compagno.nazionalita}
                        onChange={e => setCompagni(prev => prev.map((c, i) => i === idx ? { ...c, nazionalita: e.target.value } : c))} />
                    </div>

                  </div>
                </div>
              ))}

              {error && (
                <p style={{ color: "#a03030", fontSize: 13, marginTop: "1rem", textAlign: "center" }}>{error}</p>
              )}

              <button type="submit" disabled={submitting}
                style={{
                  marginTop: "1.5rem", width: "100%", padding: "1rem",
                  background: submitting ? c.cammello : c.tabacco,
                  color: c.lino, border: "none", borderRadius: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: FONT,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  cursor: submitting ? "default" : "pointer",
                }}>
                {submitting ? "Accesso in corso…" : "Accedi alla guida"}
              </button>

              <p style={{ fontSize: 11, color: c.cammello, textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
                Dati trattati ai sensi del GDPR e della normativa italiana sugli affitti brevi.
              </p>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
