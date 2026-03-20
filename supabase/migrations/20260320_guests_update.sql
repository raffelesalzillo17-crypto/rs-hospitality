-- RS Hospitality — Alloggiati Web update
-- Migrazione: 2026-03-20

-- ============================================================
-- Aggiorna tabella guests con campi Alloggiati Web
-- ============================================================
ALTER TABLE guests ADD COLUMN IF NOT EXISTS first_name       text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS last_name        text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS birth_date       date;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS birth_place      text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS gender           text;  -- "M" o "F"
ALTER TABLE guests ADD COLUMN IF NOT EXISTS document_place   text;  -- luogo rilascio doc
ALTER TABLE guests ADD COLUMN IF NOT EXISTS citizenship      text;  -- cittadinanza
ALTER TABLE guests ADD COLUMN IF NOT EXISTS guest_type       text;  -- ospite_singolo / capo_famiglia / capogruppo

-- ============================================================
-- Nuova tabella guest_companions
-- ============================================================
CREATE TABLE IF NOT EXISTS guest_companions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id         uuid REFERENCES guests(id) ON DELETE CASCADE,
  booking_id       uuid REFERENCES bookings(id) ON DELETE CASCADE,
  companion_type   text,           -- "familiare" o "componente_gruppo"
  first_name       text,
  last_name        text,
  birth_date       date,
  birth_place      text,
  gender           text,           -- "M" o "F"
  citizenship      text,
  created_at       timestamptz DEFAULT now()
);
