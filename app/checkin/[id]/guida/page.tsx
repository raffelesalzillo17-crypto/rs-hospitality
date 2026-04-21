import type { Metadata } from "next";
// TODO: migrazione in corso — sarà sostituito con Google Sheets
import GuidaClient, { type GuidaData } from "./GuidaClient";

export const metadata: Metadata = {
  title: "Guida al soggiorno — RS Hospitality",
  robots: { index: false, follow: false },
};

const c = {
  tabacco:  "#2C2416",
  lino:     "#F0EBE0",
  cammello: "#8B7355",
} as const;

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

async function getData(bookingId: string): Promise<GuidaData | null> {
  // TODO: migrazione in corso — sarà sostituito con Google Sheets
  const supabase = null as any;

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
    ? (Array.isArray(guestRaw)
        ? (guestRaw[0]?.full_name ?? "")
        : ((guestRaw as { full_name: string }).full_name ?? ""))
    : "";

  return {
    booking: { check_in: booking.check_in, check_out: booking.check_out },
    property: property as GuidaData["property"],
    guestName,
  };
}

export default async function GuidaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: c.tabacco, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#D4C9B5", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 1.5rem" }}>RS Hospitality</p>
          <p style={{ color: c.lino, fontSize: 20, fontWeight: 300, margin: "0 0 0.75rem" }}>Link non valido o prenotazione non trovata.</p>
          <a href="https://wa.me/393661033691" style={{ color: c.cammello, fontSize: 13 }}>+39 366 103 3691</a>
        </div>
      </div>
    );
  }

  return <GuidaClient data={data} />;
}
