import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Benvenuto — RS Hospitality",
  robots: { index: false, follow: false },
};

const c = {
  tabacco: "#2C2416",
  lino:    "#F0EBE0",
  cammello:"#8B7355",
  sabbia:  "#D4C9B5",
} as const;

export default function BenvenutoPage() {
  return (
    <div style={{ minHeight: "100vh", background: c.lino, fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ background: c.tabacco, padding: "2rem 1.5rem 1.75rem", textAlign: "center" }}>
        <p style={{ color: c.sabbia, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
          RS Hospitality
        </p>
        <h1 style={{
          color: c.lino,
          fontSize: "clamp(24px, 6vw, 32px)",
          fontWeight: 300,
          margin: "0.75rem 0 0",
          letterSpacing: "0.02em",
          lineHeight: 1.3,
        }}>
          La tua dimora è pronta.
        </h1>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Orari */}
        <Section title="Orari">
          <Row icon="🕒" label="Check-in" value="dalle 15:00" />
          <Row icon="🕙" label="Check-out" value="entro le 11:00" />
        </Section>

        {/* Indirizzo */}
        <Section title="Dove siamo">
          <p style={{ color: c.tabacco, fontSize: 16, margin: "0 0 0.75rem", lineHeight: 1.6 }}>
            Via Clanio 60<br />
            81025 Marcianise (CE)
          </p>
          <a
            href="https://maps.google.com/?q=Via+Clanio+60,+Marcianise+CE"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "0.6rem 1.25rem",
              background: c.tabacco,
              color: c.lino,
              borderRadius: 6,
              fontSize: 13,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Apri in Maps →
          </a>
        </Section>

        {/* Wi-Fi */}
        <Section title="Wi-Fi">
          <Row icon="📶" label="Rete" value="— disponibile all'arrivo" />
          <Row icon="🔑" label="Password" value="— disponibile all'arrivo" />
          <p style={{ fontSize: 12, color: c.cammello, margin: "0.5rem 0 0" }}>
            Le credenziali Wi-Fi sono affisse in camera.
          </p>
        </Section>

        {/* Contatto */}
        <Section title="Assistenza">
          <p style={{ color: c.tabacco, fontSize: 15, margin: "0 0 1rem", lineHeight: 1.6 }}>
            Per qualsiasi necessità durante il soggiorno, scrivici su WhatsApp.
            Rispondiamo sempre.
          </p>
          <a
            href="https://wa.me/393661033691?text=Ciao%20Raffaele%2C%20sono%20ospite%20di%20RS%20Hospitality."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.9rem 1.25rem",
              background: "#25D366",
              color: "#fff",
              borderRadius: 8,
              fontSize: 15,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Raffaele — +39 366 103 3691
          </a>
        </Section>

        {/* Footer note */}
        <p style={{
          marginTop: "2.5rem",
          fontSize: 13,
          color: c.cammello,
          textAlign: "center",
          lineHeight: 1.6,
          borderTop: `1px solid ${c.sabbia}`,
          paddingTop: "1.5rem",
        }}>
          Buon soggiorno.<br />
          <span style={{ fontSize: 12 }}>RS Hospitality · Marcianise (CE)</span>
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: "1.25rem",
      marginBottom: "1rem",
      boxShadow: "0 1px 4px rgba(44,36,22,0.07)",
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: c.cammello,
        margin: "0 0 0.9rem",
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
      <span style={{ fontSize: 18, minWidth: 26, textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: 14, color: c.cammello, minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: 15, color: c.tabacco, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
