import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

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

type Property = {
  name: string;
  address: string | null;
  city: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  contact_onsite_name: string | null;
  contact_onsite_phone: string | null;
};

async function getProperty(bookingId: string): Promise<Property | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: booking } = await supabase
    .from("bookings")
    .select("property_id")
    .eq("id", bookingId)
    .single();

  if (!booking?.property_id) return null;

  const { data: property } = await supabase
    .from("properties")
    .select("name, address, city, wifi_name, wifi_password, contact_onsite_name, contact_onsite_phone")
    .eq("id", booking.property_id)
    .single();

  return property ?? null;
}

function waLink(phone: string, name: string) {
  const clean = phone.replace(/\D/g, "");
  const intl = clean.startsWith("39") ? clean : `39${clean}`;
  const text = encodeURIComponent(`Ciao ${name}, sono ospite di RS Hospitality.`);
  return `https://wa.me/${intl}?text=${text}`;
}

export default async function BenvenutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);

  const address  = property?.address ?? "Via Clanio 60";
  const city     = property?.city    ?? "Marcianise";
  const mapsUrl  = `https://maps.google.com/?q=${encodeURIComponent(`${address}, ${city}`)}`;

  const hasWifi  = !!(property?.wifi_name && property?.wifi_password);
  const hasOnsite = !!(property?.contact_onsite_name && property?.contact_onsite_phone);

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
        {property?.name && (
          <p style={{ color: c.sabbia, fontSize: 14, margin: "0.5rem 0 0", opacity: 0.8 }}>
            {property.name}
          </p>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Orari */}
        <Section title="Orari">
          <Row icon="🕒" label="Check-in"  value="dalle 15:00" />
          <Row icon="🕙" label="Check-out" value="entro le 11:00" />
        </Section>

        {/* Indirizzo */}
        <Section title="Dove siamo">
          <p style={{ color: c.tabacco, fontSize: 16, margin: "0 0 0.75rem", lineHeight: 1.6 }}>
            {address}<br />
            {city} (CE)
          </p>
          <a
            href={mapsUrl}
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
          {hasWifi ? (
            <>
              <Row icon="📶" label="Rete"     value={property!.wifi_name!} />
              <Row icon="🔑" label="Password" value={property!.wifi_password!} />
            </>
          ) : (
            <>
              <Row icon="📶" label="Rete"     value="Disponibile all'arrivo" />
              <Row icon="🔑" label="Password" value="Disponibile all'arrivo" />
              <p style={{ fontSize: 12, color: c.cammello, margin: "0.5rem 0 0" }}>
                Le credenziali Wi-Fi sono affisse in camera.
              </p>
            </>
          )}
        </Section>

        {/* Assistenza */}
        <Section title="Assistenza">
          <p style={{ color: c.tabacco, fontSize: 15, margin: "0 0 1rem", lineHeight: 1.6 }}>
            Per qualsiasi necessità durante il soggiorno, scrivi su WhatsApp.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>

            {/* Referente sul posto */}
            {hasOnsite && (
              <WaButton
                href={waLink(property!.contact_onsite_phone!, property!.contact_onsite_name!)}
                label={`${property!.contact_onsite_name} — referente sul posto`}
                phone={`+39 ${property!.contact_onsite_phone}`}
              />
            )}

            {/* RS Hospitality — Raffaele */}
            <WaButton
              href="https://wa.me/393661033691?text=Ciao%20Raffaele%2C%20sono%20ospite%20di%20RS%20Hospitality."
              label="RS Hospitality — Raffaele"
              phone="+39 366 103 3691"
            />
          </div>
        </Section>

        {/* Footer */}
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

function WaButton({ href, label, phone }: { href: string; label: string; phone: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.85rem 1rem",
        background: "#25D366",
        color: "#fff",
        borderRadius: 8,
        textDecoration: "none",
      }}
    >
      <svg viewBox="0 0 24 24" width={20} height={20} fill="white" style={{ flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{phone}</div>
      </div>
    </a>
  );
}
