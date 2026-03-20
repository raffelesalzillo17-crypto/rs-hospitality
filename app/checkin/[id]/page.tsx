"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Palette ──────────────────────────────────────────────────
const c = {
  tabacco: "#2C2416",
  lino:    "#F0EBE0",
  cammello:"#8B7355",
  sabbia:  "#D4C9B5",
} as const;

// ── Types ─────────────────────────────────────────────────────
type Gender      = "M" | "F";
type DocType     = "Carta d'identità" | "Passaporto" | "Patente";
type GuestType   = "ospite_singolo" | "capo_famiglia" | "capogruppo";
type CompType    = "familiare" | "componente_gruppo";

type Companion = {
  companion_type: CompType;
  first_name:  string;
  last_name:   string;
  citizenship: string;
  birth_place: string;
  birth_date:  string;
  gender:      Gender;
};

type BookingProperty = { name: string };
type Booking = {
  id: string;
  check_in:   string;
  check_out:  string;
  num_guests: number;
  guest_id:   string | null;
  properties: BookingProperty | BookingProperty[] | null;
};

// ── Constants ─────────────────────────────────────────────────
const DOC_TYPES: DocType[]   = ["Carta d'identità", "Passaporto", "Patente"];
const GUEST_TYPES: { value: GuestType; label: string }[] = [
  { value: "ospite_singolo", label: "Ospite singolo" },
  { value: "capo_famiglia",  label: "Capo famiglia" },
  { value: "capogruppo",     label: "Capogruppo" },
];

const emptyMain = {
  first_name:      "",
  last_name:       "",
  citizenship:     "Italiana",
  birth_place:     "",
  birth_date:      "",
  gender:          "M" as Gender,
  phone:           "",
  email:           "",
  document_type:   "Carta d'identità" as DocType,
  document_number: "",
  document_place:  "",
  nationality:     "Italiana",
  guest_type:      "ospite_singolo" as GuestType,
};

const emptyCompanion = (): Companion => ({
  companion_type: "familiare",
  first_name:  "",
  last_name:   "",
  citizenship: "Italiana",
  birth_place: "",
  birth_date:  "",
  gender:      "M",
});

// ── Helpers ───────────────────────────────────────────────────
function fmt(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function propName(p: BookingProperty | BookingProperty[] | null) {
  if (!p) return null;
  return Array.isArray(p) ? p[0]?.name : p.name;
}

// ── Component ─────────────────────────────────────────────────
export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [booking,    setBooking]    = useState<Booking | null>(null);
  const [notFound,   setNotFound]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const [main,       setMain]       = useState(emptyMain);
  const [companions, setCompanions] = useState<Companion[]>([]);

  const needsCompanions = main.guest_type === "capo_famiglia" || main.guest_type === "capogruppo";
  const defaultCompType: CompType = main.guest_type === "capogruppo" ? "componente_gruppo" : "familiare";

  // ── Load booking ────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("bookings")
      .select("id, check_in, check_out, num_guests, guest_id, properties(name)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setBooking(data as Booking);
        setLoading(false);
      });
  }, [id]);

  // ── Companion helpers ───────────────────────────────────────
  function addCompanion() {
    setCompanions(cs => [...cs, { ...emptyCompanion(), companion_type: defaultCompType }]);
  }

  function removeCompanion(i: number) {
    setCompanions(cs => cs.filter((_, idx) => idx !== i));
  }

  function updateCompanion(i: number, field: keyof Companion, value: string) {
    setCompanions(cs => cs.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validazione base
    const required: [string, string][] = [
      [main.first_name,      "Nome"],
      [main.last_name,       "Cognome"],
      [main.birth_date,      "Data di nascita"],
      [main.birth_place,     "Luogo di nascita"],
      [main.phone,           "Telefono"],
      [main.document_number, "Numero documento"],
      [main.document_place,  "Luogo di rilascio documento"],
    ];
    const missing = required.filter(([v]) => !v.trim()).map(([, label]) => label);
    if (missing.length) {
      setError(`Campi obbligatori mancanti: ${missing.join(", ")}.`);
      return;
    }

    setSubmitting(true);

    // 1. Inserisci ospite principale
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .insert({
        full_name:       `${main.first_name.trim()} ${main.last_name.trim()}`,
        first_name:      main.first_name.trim(),
        last_name:       main.last_name.trim(),
        citizenship:     main.citizenship.trim(),
        birth_place:     main.birth_place.trim(),
        birth_date:      main.birth_date,
        gender:          main.gender,
        phone:           main.phone.trim(),
        email:           main.email.trim() || null,
        document_type:   main.document_type,
        document_number: main.document_number.trim().toUpperCase(),
        document_place:  main.document_place.trim(),
        nationality:     main.nationality.trim(),
        guest_type:      main.guest_type,
      })
      .select("id")
      .single();

    if (gErr || !guest) {
      setError("Errore nel salvataggio ospite. Riprova.");
      setSubmitting(false);
      return;
    }

    // 2. Inserisci accompagnatori
    if (companions.length > 0) {
      const { error: cErr } = await supabase.from("guest_companions").insert(
        companions.map(cp => ({
          guest_id:       guest.id,
          booking_id:     id,
          companion_type: cp.companion_type,
          first_name:     cp.first_name.trim(),
          last_name:      cp.last_name.trim(),
          citizenship:    cp.citizenship.trim(),
          birth_place:    cp.birth_place.trim(),
          birth_date:     cp.birth_date,
          gender:         cp.gender,
        }))
      );
      if (cErr) {
        setError("Errore nel salvataggio accompagnatori. Riprova.");
        setSubmitting(false);
        return;
      }
    }

    // 3. Collega guest_id alla prenotazione
    const { error: bErr } = await supabase
      .from("bookings")
      .update({ guest_id: guest.id })
      .eq("id", id);

    if (bErr) {
      setError("Errore nel collegamento prenotazione. Riprova.");
      setSubmitting(false);
      return;
    }

    router.push(`/checkin/${id}/benvenuto`);
  }

  // ── Styles ───────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem",
    border: `1px solid ${c.sabbia}`, borderRadius: 8,
    background: "#fff", color: c.tabacco,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: 16, outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: c.cammello, marginBottom: "0.4rem",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
  };
  const row2: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem",
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: c.cammello,
    margin: "1.75rem 0 1rem",
    paddingBottom: "0.5rem", borderBottom: `1px solid ${c.sabbia}`,
  };

  // ── Loading / Not found / Already done ───────────────────────
  if (loading) return (
    <Shell><p style={{ color: c.cammello, fontSize: 15 }}>Caricamento…</p></Shell>
  );

  if (notFound) return (
    <Shell>
      <p style={{ color: c.tabacco, fontSize: 18, marginBottom: "0.5rem" }}>Prenotazione non trovata.</p>
      <p style={{ color: c.cammello, fontSize: 14 }}>
        Contatta Raffaele:{" "}
        <a href="https://wa.me/393661033691" style={{ color: c.cammello }}>+39 366 103 3691</a>
      </p>
    </Shell>
  );

  if (booking?.guest_id) {
    router.replace(`/checkin/${id}/benvenuto`);
    return null;
  }

  // ── Render ────────────────────────────────────────────────────
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

      {/* Booking bar */}
      {booking && (
        <div style={{ background: c.sabbia, padding: "0.9rem 1.5rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: c.tabacco }}><strong>Check-in</strong> {fmt(booking.check_in)}</span>
          <span style={{ fontSize: 13, color: c.tabacco }}><strong>Check-out</strong> {fmt(booking.check_out)}</span>
          {propName(booking.properties) && (
            <span style={{ fontSize: 13, color: c.tabacco }}>{propName(booking.properties)}</span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 540, margin: "0 auto", padding: "1.5rem 1.5rem 3rem" }}>

        {/* ── SEZIONE 1: Ospite principale ── */}
        <p style={sectionTitle}>Dati ospite principale</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <div style={row2}>
            <div>
              <label style={lbl}>Nome *</label>
              <input style={inp} type="text" autoComplete="given-name" value={main.first_name}
                onChange={e => setMain(f => ({ ...f, first_name: e.target.value }))} placeholder="Mario" />
            </div>
            <div>
              <label style={lbl}>Cognome *</label>
              <input style={inp} type="text" autoComplete="family-name" value={main.last_name}
                onChange={e => setMain(f => ({ ...f, last_name: e.target.value }))} placeholder="Rossi" />
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Cittadinanza *</label>
              <input style={inp} type="text" value={main.citizenship}
                onChange={e => setMain(f => ({ ...f, citizenship: e.target.value }))} placeholder="Italiana" />
            </div>
            <div>
              <label style={lbl}>Nazionalità *</label>
              <input style={inp} type="text" value={main.nationality}
                onChange={e => setMain(f => ({ ...f, nationality: e.target.value }))} placeholder="Italiana" />
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Luogo di nascita *</label>
              <input style={inp} type="text" value={main.birth_place}
                onChange={e => setMain(f => ({ ...f, birth_place: e.target.value }))} placeholder="Roma" />
            </div>
            <div>
              <label style={lbl}>Data di nascita *</label>
              <input style={inp} type="date" value={main.birth_date}
                onChange={e => setMain(f => ({ ...f, birth_date: e.target.value }))} />
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Sesso *</label>
              <select style={inp} value={main.gender}
                onChange={e => setMain(f => ({ ...f, gender: e.target.value as Gender }))}>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Telefono *</label>
              <input style={inp} type="tel" autoComplete="tel" value={main.phone}
                onChange={e => setMain(f => ({ ...f, phone: e.target.value }))} placeholder="+39 333 0000000" />
            </div>
          </div>

          <div>
            <label style={lbl}>Email <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opzionale)</span></label>
            <input style={inp} type="email" autoComplete="email" value={main.email}
              onChange={e => setMain(f => ({ ...f, email: e.target.value }))} placeholder="nome@esempio.it" />
          </div>

        </div>

        {/* ── SEZIONE 2: Documento ── */}
        <p style={sectionTitle}>Documento d'identità</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <div style={row2}>
            <div>
              <label style={lbl}>Tipo documento *</label>
              <select style={inp} value={main.document_type}
                onChange={e => setMain(f => ({ ...f, document_type: e.target.value as DocType }))}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Numero documento *</label>
              <input style={{ ...inp, textTransform: "uppercase" }} type="text"
                value={main.document_number}
                onChange={e => setMain(f => ({ ...f, document_number: e.target.value.toUpperCase() }))}
                placeholder="CA00000AA" />
            </div>
          </div>

          <div>
            <label style={lbl}>Luogo di rilascio *</label>
            <input style={inp} type="text" value={main.document_place}
              onChange={e => setMain(f => ({ ...f, document_place: e.target.value }))}
              placeholder="Roma" />
          </div>

        </div>

        {/* ── SEZIONE 3: Tipo ospite ── */}
        <p style={sectionTitle}>Tipo di soggiorno</p>

        <div>
          <label style={lbl}>Tipo ospite *</label>
          <select style={inp} value={main.guest_type}
            onChange={e => {
              const gt = e.target.value as GuestType;
              setMain(f => ({ ...f, guest_type: gt }));
              if (gt === "ospite_singolo") setCompanions([]);
            }}>
            {GUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* ── SEZIONE 4: Accompagnatori ── */}
        {needsCompanions && (
          <>
            <p style={sectionTitle}>
              {main.guest_type === "capo_famiglia" ? "Familiari" : "Componenti del gruppo"}
            </p>

            {companions.map((cp, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 10, padding: "1.25rem",
                marginBottom: "1rem", border: `1px solid ${c.sabbia}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.tabacco }}>
                    Componente {i + 1}
                  </span>
                  <button type="button" onClick={() => removeCompanion(i)}
                    style={{ background: "none", border: "none", color: c.cammello, fontSize: 13, cursor: "pointer", padding: 0 }}>
                    Rimuovi
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div>
                    <label style={lbl}>Tipo *</label>
                    <select style={inp} value={cp.companion_type}
                      onChange={e => updateCompanion(i, "companion_type", e.target.value)}>
                      <option value="familiare">Familiare</option>
                      <option value="componente_gruppo">Componente gruppo</option>
                    </select>
                  </div>

                  <div style={row2}>
                    <div>
                      <label style={lbl}>Nome *</label>
                      <input style={inp} type="text" value={cp.first_name}
                        onChange={e => updateCompanion(i, "first_name", e.target.value)} placeholder="Mario" />
                    </div>
                    <div>
                      <label style={lbl}>Cognome *</label>
                      <input style={inp} type="text" value={cp.last_name}
                        onChange={e => updateCompanion(i, "last_name", e.target.value)} placeholder="Rossi" />
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Cittadinanza *</label>
                    <input style={inp} type="text" value={cp.citizenship}
                      onChange={e => updateCompanion(i, "citizenship", e.target.value)} placeholder="Italiana" />
                  </div>

                  <div style={row2}>
                    <div>
                      <label style={lbl}>Luogo di nascita *</label>
                      <input style={inp} type="text" value={cp.birth_place}
                        onChange={e => updateCompanion(i, "birth_place", e.target.value)} placeholder="Roma" />
                    </div>
                    <div>
                      <label style={lbl}>Data di nascita *</label>
                      <input style={inp} type="date" value={cp.birth_date}
                        onChange={e => updateCompanion(i, "birth_date", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Sesso *</label>
                    <select style={inp} value={cp.gender}
                      onChange={e => updateCompanion(i, "gender", e.target.value)}>
                      <option value="M">Maschio</option>
                      <option value="F">Femmina</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addCompanion}
              style={{
                width: "100%", padding: "0.75rem",
                background: "transparent", color: c.cammello,
                border: `1.5px dashed ${c.cammello}`, borderRadius: 8,
                fontSize: 14, fontFamily: "inherit", cursor: "pointer",
                letterSpacing: "0.03em", marginBottom: "0.5rem",
              }}>
              + Aggiungi componente
            </button>
          </>
        )}

        {/* ── Error / Submit ── */}
        {error && (
          <p style={{ color: "#a03030", fontSize: 14, margin: "1.25rem 0 0", textAlign: "center" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}
          style={{
            marginTop: "1.75rem", width: "100%", padding: "1rem",
            background: submitting ? c.sabbia : c.tabacco,
            color: c.lino, border: "none", borderRadius: 8,
            fontSize: 16, fontFamily: "inherit", fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}>
          {submitting ? "Salvataggio…" : "Completa il check-in →"}
        </button>

        <p style={{ fontSize: 12, color: c.cammello, textAlign: "center", marginTop: "1.25rem", lineHeight: 1.6 }}>
          I dati vengono trattati esclusivamente per la gestione del soggiorno,<br />
          nel rispetto del GDPR e della normativa italiana sugli affitti brevi.
        </p>
      </form>
    </div>
  );
}

// ── Shell per loading / not found ────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#F0EBE0",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", textAlign: "center",
      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    }}>
      {children}
    </div>
  );
}
