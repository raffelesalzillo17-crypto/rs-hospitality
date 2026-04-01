import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ChatBot from "./ChatBot";
import WifiCard from "./WifiCard";

export const metadata: Metadata = {
  title: "Guida al soggiorno — RS Hospitality",
  robots: { index: false, follow: false },
};

const c = {
  tabacco:  "#2C2416",
  lino:     "#F0EBE0",
  cammello: "#8B7355",
  sabbia:   "#D4C9B5",
} as const;

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

type Property = {
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

async function getData(bookingId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: booking } = await supabase
    .from("bookings")
    .select("property_id, check_in, check_out, guest_id, guests(full_name)")
    .eq("id", bookingId)
    .single();

  if (!booking?.property_id) return null;

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address, city, checkin_time, checkout_time, wifi_name, wifi_password, istruzioni_accesso, contact_onsite_name, contact_onsite_phone")
    .eq("id", booking.property_id)
    .single();

  if (!property) return null;

  const guestRaw = booking.guests;
  const guestName: string = guestRaw
    ? (Array.isArray(guestRaw) ? (guestRaw[0]?.full_name ?? "") : ((guestRaw as { full_name: string }).full_name ?? ""))
    : "";

  return {
    booking: { check_in: booking.check_in, check_out: booking.check_out },
    property: property as Property,
    guestName,
  };
}

function waLink(phone: string, nome: string) {
  const clean = phone.replace(/\D/g, "");
  const intl  = clean.startsWith("39") ? clean : `39${clean}`;
  const text  = encodeURIComponent(`Ciao ${nome}, sono ospite di RS Hospitality.`);
  return `https://wa.me/${intl}?text=${text}`;
}

function fmt(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default async function GuidaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);

  // ── Not found ──────────────────────────────────────────────
  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: c.tabacco, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: c.sabbia, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 1.5rem" }}>RS Hospitality</p>
          <p style={{ color: c.lino, fontSize: 20, fontWeight: 300, margin: "0 0 0.75rem" }}>Link non valido o prenotazione non trovata.</p>
          <a href="https://wa.me/393661033691" style={{ color: c.cammello, fontSize: 13 }}>+39 366 103 3691</a>
        </div>
      </div>
    );
  }

  const { booking, property, guestName } = data;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${property.address ?? ""}, ${property.city ?? "Marcianise"}`)}`;
  const hasOnsite = !!(property.contact_onsite_name && property.contact_onsite_phone);

  return (
    <div style={{ minHeight: "100vh", background: c.lino, fontFamily: FONT, overscrollBehavior: "none" }}>

      {/* ══ SEZIONE 1 — Hero ══════════════════════════════════ */}
      <div style={{ background: c.tabacco, padding: "2rem 1.5rem 2rem", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.lino, letterSpacing: "-0.02em", lineHeight: 1 }}>RS</div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: c.cammello, marginTop: 3 }}>Hospitality</div>
        </div>

        <h1 style={{ fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 300, fontStyle: "italic", color: c.lino, margin: "0 0 0.5rem", lineHeight: 1.3 }}>
          La tua dimora e pronta.
        </h1>
        {guestName && (
          <p style={{ color: c.cammello, fontSize: 15, margin: "0 0 2rem" }}>{guestName}</p>
        )}

        {/* 4 info card */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", maxWidth: 400, margin: "0 auto" }}>

          {/* CHECK-IN */}
          <div style={{ background: c.sabbia, borderRadius: 10, padding: "1rem 0.75rem", textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 0.4rem" }}>Check-in</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: c.tabacco, margin: "0 0 0.2rem" }}>{fmt(booking.check_in)}</p>
            <p style={{ fontSize: 12, color: c.cammello, margin: 0 }}>dalle {property.checkin_time ?? "15:00"}</p>
          </div>

          {/* CHECK-OUT */}
          <div style={{ background: c.sabbia, borderRadius: 10, padding: "1rem 0.75rem", textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 0.4rem" }}>Check-out</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: c.tabacco, margin: "0 0 0.2rem" }}>{fmt(booking.check_out)}</p>
            <p style={{ fontSize: 12, color: c.cammello, margin: 0 }}>entro le {property.checkout_time ?? "11:00"}</p>
          </div>

          {/* WI-FI — client component per copy */}
          <WifiCard
            wifiName={property.wifi_name}
            wifiPassword={property.wifi_password}
          />

          {/* NAVIGA */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: c.sabbia, borderRadius: 10, padding: "1rem 0.75rem", textAlign: "center", textDecoration: "none", display: "block" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.cammello, margin: "0 0 0.4rem" }}>Naviga</p>
            <p style={{ fontSize: 13, color: c.tabacco, margin: "0 0 0.2rem", fontWeight: 500 }}>{property.address ?? "Via Clanio 60"}</p>
            <p style={{ fontSize: 11, color: c.cammello, margin: 0 }}>Apri in Maps</p>
          </a>

        </div>
      </div>

      {/* ══ SEZIONE 2 — Istruzioni accesso ════════════════════ */}
      <div style={{ padding: "2rem 1.5rem", maxWidth: 520, margin: "0 auto" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.tabacco, margin: "0 0 1rem" }}>
          Come accedere
        </h2>
        <p style={{ fontSize: 15, color: c.tabacco, lineHeight: 1.7, margin: 0 }}>
          {property.istruzioni_accesso ?? "Le istruzioni ti verranno inviate via WhatsApp prima del check-in."}
        </p>
      </div>

      {/* ══ SEZIONE 3 — Chatbot AI ════════════════════════════ */}
      <div style={{ background: "#fff", borderTop: `1px solid ${c.sabbia}`, borderBottom: `1px solid ${c.sabbia}` }}>
        <ChatBot
          bookingId={id}
          guestName={guestName}
          propertyName={property.name}
        />
      </div>

      {/* ══ SEZIONE 4 — Contatti ══════════════════════════════ */}
      <div style={{ background: c.sabbia, padding: "2rem 1.5rem", maxWidth: 520, margin: "0 auto" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.tabacco, margin: "0 0 1.25rem" }}>
          Hai bisogno di aiuto?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

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

      {/* Footer */}
      <div style={{ padding: "1.5rem", textAlign: "center", background: c.lino }}>
        <p style={{ fontSize: 12, color: c.cammello, margin: 0, lineHeight: 1.6 }}>
          Buon soggiorno.<br />RS Hospitality · Marcianise (CE)
        </p>
      </div>

    </div>
  );
}

function ContactCard({ label, sublabel, phone, waHref }: { label: string; sublabel: string; phone: string; waHref: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: c.tabacco, margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 12, color: c.cammello, margin: "0 0 2px" }}>{sublabel}</p>
        <p style={{ fontSize: 12, color: c.cammello, margin: 0 }}>{phone}</p>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flexShrink: 0, padding: "0.6rem 1rem",
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
