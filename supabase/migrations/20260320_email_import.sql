-- Email import system — 2026-03-20

-- Colonne aggiuntive su bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ota_booking_ref text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gross_amount    numeric;

-- Tabella log import email
CREATE TABLE IF NOT EXISTS import_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  channel       text,
  from_email    text,
  subject       text,
  action        text,        -- 'created' | 'updated' | 'skipped' | 'error'
  booking_ref   text,
  guest_name    text,
  error_message text
);
