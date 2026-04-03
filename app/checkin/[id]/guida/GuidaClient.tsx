"use client";

import { useState } from "react";
import Image from "next/image";

const c = {
  tabacco:  "#2C2416",
  lino:     "#F0EBE0",
  cammello: "#8B7355",
  sabbia:   "#D4C9B5",
} as const;

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

export type GuidaData = {
  booking: { check_in: string; check_out: string };
  property: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    checkin_time: string | null;
    checkout_time: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
    istruzioni_accesso: string | null;
    contact_onsite_name: string | null;
    contact_onsite_phone: string | null;
  };
  guestName: string;
};

function fmt(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function waLink(phone: string, nome: string) {
  const clean = phone.replace(/\D/g, "");
  const intl  = clean.startsWith("39") ? clean : `39${clean}`;
  const text  = encodeURIComponent(`Ciao ${nome}, sono ospite di RS Hospitality.`);
  return `https://wa.me/${intl}?text=${text}`;
}

function renderMarkdown(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return null;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin: "0 0 10px", fontSize: 14, color: c.tabacco, lineHeight: 1.75, fontFamily: FONT }}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
      </p>
    );
  });
}

// ── Icone SVG inline ─────────────────────────────────────────────────────────

function IcoSole({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function IcoLuna({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function IcoWifi({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M10.09 17.1a6 6 0 0 1 3.82 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  );
}

function IcoPin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IcoCasa({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IcoForchetta({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  );
}

function IcoAuto({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17H5a2 2 0 0 1-2-2v-3l2.5-5h11l2.5 5v3a2 2 0 0 1-2 2z"/>
      <circle cx="7.5" cy="17" r="2"/>
      <circle cx="16.5" cy="17" r="2"/>
    </svg>
  );
}

function IcoChevron({ aperto }: { aperto: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: aperto ? "rotate(90deg)" : "none", flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconaBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 40, height: 40, flexShrink: 0,
      background: c.sabbia, borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: c.cammello,
    }}>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: "12px 0" }}>
      {[90, 70, 85, 60].map((w, i) => (
        <div key={i} style={{
          height: 13, background: c.sabbia, borderRadius: 4,
          marginBottom: 10, width: `${w}%`, opacity: 0.7,
          animation: "skpulse 1.5s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes skpulse{0%,100%{opacity:0.3}50%{opacity:0.7}}`}</style>
    </div>
  );
}

// ── Stili condivisi ──────────────────────────────────────────────────────────

const esploraCardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${c.sabbia}`,
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const esploraCardBtnStyle: React.CSSProperties = {
  width: "100%", padding: 16,
  display: "flex", alignItems: "center", gap: 12,
  border: "none", background: "transparent",
  cursor: "pointer", textAlign: "left", fontFamily: FONT,
};

const infoCardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${c.sabbia}`,
  borderRadius: 12,
  padding: 16,
  textAlign: "center",
};

// ── Componente principale ────────────────────────────────────────────────────

export default function GuidaClient({ data }: { data: GuidaData }) {
  const { booking, property, guestName } = data;

  const [aperto,       setAperto]       = useState<string | null>(null);
  const [contenuti,    setContenuti]    = useState<Record<string, string>>({});
  const [caricando,    setCaricando]    = useState<Record<string, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);

  const mapsUrl   = `https://maps.google.com/?q=${encodeURIComponent(`${property.address ?? ""}, ${property.city ?? "Marcianise"}`)}`;
  const hasOnsite = !!(property.contact_onsite_name && property.contact_onsite_phone);

  function copiaWifi() {
    if (!property.wifi_password) return;
    navigator.clipboard.writeText(property.wifi_password).then(() => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    });
  }

  async function toggleSezione(id: string) {
    if (aperto === id) { setAperto(null); return; }
    setAperto(id);
    if (id === "soggiorno") return;
    if (contenuti[id]) return;
    setCaricando(prev => ({ ...prev, [id]: true }));
    try {
      const res  = await fetch(`/api/guida?section=${id}&property_id=${property.id}`);
      const json = await res.json();
      if (json.error) {
        setContenuti(prev => ({ ...prev, [id]: `Errore: ${json.error}` }));
      } else {
        setContenuti(prev => ({ ...prev, [id]: json.content ?? "Informazioni non disponibili." }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setContenuti(prev => ({ ...prev, [id]: `Errore di rete: ${msg}` }));
    } finally {
      setCaricando(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: c.lino, fontFamily: FONT, overscrollBehavior: "none" }}>

      {/* ══ SEZIONE 1 — Hero ════════════════════════════════════ */}
      <div style={{ background: c.tabacco }}>
        <div style={{ position: "relative", height: 380, overflow: "hidden" }}>
          <Image
            src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"
            alt={property.name}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {/* Gradiente scuro */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(44,36,22,0.35) 0%, rgba(44,36,22,0.6) 100%)",
          }} />
          {/* Testo centrato */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: "0 28px",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: c.lino, letterSpacing: "-0.02em", lineHeight: 1 }}>RS</span>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.35em", textTransform: "uppercase", color: c.cammello }}>HOSPITALITY</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 300, fontStyle: "italic", color: c.lino, margin: "0 0 10px", lineHeight: 1.2, fontFamily: FONT }}>
              Il tuo soggiorno
            </h1>
            {guestName && (
              <p style={{ fontSize: 16, color: c.cammello, margin: 0, fontFamily: FONT }}>{guestName}</p>
            )}
          </div>
        </div>
      </div>

      {/* ══ 4 card info — sfondo lino ═══════════════════════════ */}
      <div style={{ background: c.lino, padding: "16px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>

          {/* CHECK-IN */}
          <div style={infoCardStyle}>
            <div style={{ color: c.cammello, display: "flex", justifyContent: "center", marginBottom: 8 }}><IcoSole /></div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Check-in</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: c.tabacco, margin: "0 0 2px" }}>{fmt(booking.check_in)}</p>
            <p style={{ fontSize: 11, color: c.cammello, margin: 0 }}>dalle {property.checkin_time ?? "15:00"}</p>
          </div>

          {/* CHECK-OUT */}
          <div style={infoCardStyle}>
            <div style={{ color: c.cammello, display: "flex", justifyContent: "center", marginBottom: 8 }}><IcoLuna /></div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Check-out</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: c.tabacco, margin: "0 0 2px" }}>{fmt(booking.check_out)}</p>
            <p style={{ fontSize: 11, color: c.cammello, margin: 0 }}>entro le {property.checkout_time ?? "11:00"}</p>
          </div>

          {/* WI-FI */}
          <button onClick={copiaWifi} style={{
            ...infoCardStyle,
            border: `1px solid ${c.sabbia}`,
            cursor: property.wifi_password ? "pointer" : "default",
            fontFamily: FONT, width: "100%",
          }}>
            <div style={{ color: c.cammello, display: "flex", justifyContent: "center", marginBottom: 8 }}><IcoWifi /></div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Wi-Fi</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: c.tabacco, margin: "0 0 2px", wordBreak: "break-all" }}>{property.wifi_name ?? "—"}</p>
            <p style={{ fontSize: 11, color: c.cammello, margin: 0 }}>
              {property.wifi_password ? "Tocca per copiare" : "—"}
            </p>
          </button>

          {/* NAVIGA */}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ ...infoCardStyle, textDecoration: "none", display: "block" }}>
            <div style={{ color: c.cammello, display: "flex", justifyContent: "center", marginBottom: 8 }}><IcoPin /></div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 4px" }}>Naviga</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: c.tabacco, margin: "0 0 2px" }}>{property.address ?? "Via Clanio 60"}</p>
            <p style={{ fontSize: 11, color: c.cammello, margin: 0 }}>Apri in Maps</p>
          </a>

        </div>
      </div>

      {/* ══ SEZIONE 2 — Benvenuto ════════════════════════════════ */}
      <div style={{ padding: 16 }}>
        <div style={{ background: c.tabacco, borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 15, color: c.lino, fontWeight: 300, fontStyle: "italic", lineHeight: 1.8, margin: "0 0 12px", fontFamily: FONT }}>
            &ldquo;Ogni dettaglio è curato perché il tuo soggiorno sia senza pensieri.&rdquo;
          </p>
          <p style={{ fontSize: 13, color: c.cammello, fontStyle: "italic", margin: 0, fontFamily: FONT }}>
            — RS Hospitality
          </p>
        </div>
      </div>

      {/* ══ SEZIONE 3 — Esplora la guida ════════════════════════ */}
      <div style={{ padding: "0 16px 24px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: c.tabacco, margin: "0 0 4px", fontFamily: FONT }}>
          Esplora la guida
        </h2>
        <p style={{ fontSize: 13, color: c.cammello, margin: "0 0 16px", fontFamily: FONT }}>
          Tutto quello che ti serve
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Card 1 — Il tuo soggiorno */}
          <div style={esploraCardStyle}>
            <button onClick={() => toggleSezione("soggiorno")} style={esploraCardBtnStyle}>
              <IconaBox><IcoCasa /></IconaBox>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.tabacco, margin: "0 0 3px", fontFamily: FONT }}>Il tuo soggiorno</p>
                <p style={{ fontSize: 12, color: c.cammello, margin: 0, fontFamily: FONT }}>Istruzioni accesso, regole della casa, Wi-Fi</p>
              </div>
              <div style={{ color: c.cammello }}><IcoChevron aperto={aperto === "soggiorno"} /></div>
            </button>
            {aperto === "soggiorno" && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${c.sabbia}` }}>
                <p style={{ fontSize: 14, color: c.tabacco, lineHeight: 1.75, margin: "14px 0 12px", fontFamily: FONT }}>
                  {property.istruzioni_accesso ?? "Le istruzioni ti verranno inviate via WhatsApp prima del check-in."}
                </p>
                <div style={{ background: c.lino, borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, color: c.tabacco, lineHeight: 2, margin: 0, fontFamily: FONT }}>
                    Check-in dalle {property.checkin_time ?? "15:00"} · Check-out entro le {property.checkout_time ?? "11:00"}<br />
                    Vietato fumare · Animali non ammessi
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2 — Dove mangiare */}
          <div style={esploraCardStyle}>
            <button onClick={() => toggleSezione("mangiare")} style={esploraCardBtnStyle}>
              <IconaBox><IcoForchetta /></IconaBox>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.tabacco, margin: "0 0 3px", fontFamily: FONT }}>Dove mangiare</p>
                <p style={{ fontSize: 12, color: c.cammello, margin: 0, fontFamily: FONT }}>Ristoranti e locali consigliati vicino a te</p>
              </div>
              <div style={{ color: c.cammello }}><IcoChevron aperto={aperto === "mangiare"} /></div>
            </button>
            {aperto === "mangiare" && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${c.sabbia}` }}>
                <div style={{ paddingTop: 12 }}>
                  {caricando.mangiare ? <Skeleton /> : renderMarkdown(contenuti.mangiare ?? "")}
                </div>
              </div>
            )}
          </div>

          {/* Card 3 — Luoghi da vedere */}
          <div style={esploraCardStyle}>
            <button onClick={() => toggleSezione("luoghi")} style={esploraCardBtnStyle}>
              <IconaBox><IcoPin size={20} /></IconaBox>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.tabacco, margin: "0 0 3px", fontFamily: FONT }}>Luoghi da vedere</p>
                <p style={{ fontSize: 12, color: c.cammello, margin: 0, fontFamily: FONT }}>Attrazioni e mete imperdibili</p>
              </div>
              <div style={{ color: c.cammello }}><IcoChevron aperto={aperto === "luoghi"} /></div>
            </button>
            {aperto === "luoghi" && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${c.sabbia}` }}>
                <div style={{ paddingTop: 12 }}>
                  {caricando.luoghi ? <Skeleton /> : renderMarkdown(contenuti.luoghi ?? "")}
                </div>
              </div>
            )}
          </div>

          {/* Card 4 — Come muoversi */}
          <div style={esploraCardStyle}>
            <button onClick={() => toggleSezione("muoversi")} style={esploraCardBtnStyle}>
              <IconaBox><IcoAuto /></IconaBox>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.tabacco, margin: "0 0 3px", fontFamily: FONT }}>Come muoversi</p>
                <p style={{ fontSize: 12, color: c.cammello, margin: 0, fontFamily: FONT }}>Trasporti, taxi, parcheggi</p>
              </div>
              <div style={{ color: c.cammello }}><IcoChevron aperto={aperto === "muoversi"} /></div>
            </button>
            {aperto === "muoversi" && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${c.sabbia}` }}>
                <div style={{ paddingTop: 12 }}>
                  {caricando.muoversi ? <Skeleton /> : renderMarkdown(contenuti.muoversi ?? "")}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══ SEZIONE 4 — Contatti ════════════════════════════════ */}
      <div style={{ background: c.sabbia, padding: "24px 16px" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.tabacco, margin: "0 0 16px", fontFamily: FONT }}>
          Hai bisogno di aiuto?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {hasOnsite && (
            <ContactCard
              label={property.contact_onsite_name!}
              sublabel="Referente sul posto"
              phone={property.contact_onsite_phone!}
              waHref={waLink(property.contact_onsite_phone!, property.contact_onsite_name!)}
            />
          )}
          <ContactCard
            label="Raffaele Salzillo"
            sublabel="RS Hospitality"
            phone="+39 366 103 3691"
            waHref="https://wa.me/393661033691?text=Ciao%20Raffaele%2C%20sono%20ospite%20di%20RS%20Hospitality."
          />
        </div>
      </div>

      {/* ══ Footer ══════════════════════════════════════════════ */}
      <div style={{ padding: "24px 16px 32px", textAlign: "center", background: c.lino }}>
        <p style={{ fontSize: 12, color: c.cammello, margin: 0, lineHeight: 1.9, fontFamily: FONT }}>
          Buon soggiorno.<br />
          RS Hospitality · Marcianise (CE)
        </p>
      </div>

      {/* Toast: password copiata */}
      <div style={{
        position: "fixed", bottom: 32, left: "50%",
        transform: `translateX(-50%) translateY(${toastVisible ? 0 : 10}px)`,
        background: c.tabacco, color: c.lino,
        padding: "10px 22px", borderRadius: 8,
        fontSize: 13, fontFamily: FONT, letterSpacing: "0.02em",
        opacity: toastVisible ? 1 : 0,
        transition: "opacity 0.22s, transform 0.22s",
        pointerEvents: "none",
        zIndex: 100,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      }}>
        Password copiata ✓
      </div>

    </div>
  );
}

function ContactCard({ label, sublabel, phone, waHref }: {
  label: string; sublabel: string; phone: string; waHref: string;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: c.tabacco, margin: "0 0 2px", fontFamily: FONT }}>{label}</p>
        <p style={{ fontSize: 12, color: c.cammello, margin: "0 0 2px", fontFamily: FONT }}>{sublabel}</p>
        <p style={{ fontSize: 12, color: c.cammello, margin: 0, fontFamily: FONT }}>{phone}</p>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flexShrink: 0, padding: "8px 16px",
          background: "#25D366", color: "#fff",
          borderRadius: 8, fontSize: 12, fontWeight: 600,
          textDecoration: "none", fontFamily: FONT,
          letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}>
        WhatsApp
      </a>
    </div>
  );
}
