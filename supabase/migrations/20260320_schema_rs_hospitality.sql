-- RS Hospitality — Schema completo
-- Migrazione: 2026-03-20

-- ============================================================
-- 1. properties
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text,                         -- "RS Comfort", "RS Superior"
  address       text,
  city          text DEFAULT 'Marcianise',
  price_min     numeric,
  price_max     numeric,
  airbnb_url    text,
  booking_url   text,
  ical_airbnb   text,
  ical_booking  text,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 2. guests
-- ============================================================
CREATE TABLE IF NOT EXISTS guests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL,
  phone           text,
  email           text,
  document_type   text,                       -- "carta identità", "passaporto"
  document_number text,
  nationality     text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 3. bookings (nuova tabella in inglese)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid REFERENCES properties(id) ON DELETE SET NULL,
  guest_id      uuid REFERENCES guests(id) ON DELETE SET NULL,
  check_in      date NOT NULL,
  check_out     date NOT NULL,
  num_guests    integer DEFAULT 1,
  channel       text DEFAULT 'direct',
  status        text DEFAULT 'confirmed',
  total_price   numeric,
  notes         text,
  uid_ical      text,
  created_at    timestamptz DEFAULT now()
);

-- Aggiunge colonne mancanti se bookings esiste già senza di esse
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_id    uuid REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes       text;

-- ============================================================
-- 4. messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES bookings(id) ON DELETE CASCADE,
  channel     text,                           -- "whatsapp", "email"
  direction   text,                           -- "inbound", "outbound"
  content     text,
  sent_at     timestamptz DEFAULT now()
);

-- ============================================================
-- 5. payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount      numeric NOT NULL,
  method      text,                           -- "stripe", "contanti", "bonifico"
  status      text DEFAULT 'pending',         -- "pending", "completed", "refunded"
  paid_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Record di test: Il Tulipano
-- ============================================================
-- Colonne aggiuntive properties (aggiornamento 2026-03-20)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_onsite_name  text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_onsite_phone text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_name            text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_password        text;

-- ============================================================
-- Record di test: Il Tulipano
-- ============================================================
INSERT INTO properties (name, category, address, city, price_min, price_max, airbnb_url, booking_url, ical_airbnb, ical_booking, active)
VALUES (
  'Il Tulipano',
  'RS Comfort',
  'Via Clanio 60',
  'Marcianise',
  55,
  80,
  'https://www.airbnb.it/rooms/1151100346729188269',
  'https://www.booking.com/Share-KLD1dK0',
  'https://www.airbnb.it/calendar/ical/1151100346729188269.ics?t=7df772bef1f3499f822c4b6270cbe231',
  'https://ical.booking.com/v1/export/t/28033739-d90f-4362-8f72-3cb8be1d31bc.ics',
  true
)
ON CONFLICT DO NOTHING;

UPDATE properties
SET
  contact_onsite_name  = 'Lella',
  contact_onsite_phone = '3394304429',
  wifi_name            = NULL,
  wifi_password        = NULL
WHERE name = 'Il Tulipano';
