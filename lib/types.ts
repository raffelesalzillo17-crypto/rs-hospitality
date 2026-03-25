// ── Tipi condivisi tra API routes e componenti ────────────────────────────────

// --- Database models ---------------------------------------------------------

export type Guest = {
  full_name: string;
  phone: string | null;
  email: string | null;
};

export type Property = {
  id: string;
  name: string;
};

export type Booking = {
  id: string;
  property_id: string | null;
  check_in: string;
  check_out: string;
  num_guests: number;
  channel: string;
  notes: string | null;
  status: string;
  total_price: number | null;
  gross_amount: number | null;
  uid_ical: string | null;
  guest_id: string | null;
  booking_type: string | null;
  ota_booking_ref: string | null;
  guests: Guest | Guest[] | null;
  properties: Property | Property[] | null;
};

export type ImportLog = {
  id: string;
  created_at: string;
  channel: string | null;
  from_email: string | null;
  subject: string | null;
  action: string | null;
  booking_ref: string | null;
  guest_name: string | null;
  error_message: string | null;
};

// --- Email import ------------------------------------------------------------

export interface ParsedBooking {
  guest_name: string;
  check_in: string;
  check_out: string;
  gross_amount: number | null;
  ota_booking_ref: string;
  channel: string;
}

export interface EmailPayload {
  from: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: { filename?: string; content?: string; data?: string }[];
}

// --- iCal sync ---------------------------------------------------------------

export type VEvent = {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
};
