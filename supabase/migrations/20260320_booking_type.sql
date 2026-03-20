-- Aggiunge booking_type a bookings
-- 'booking' = prenotazione normale
-- 'block'   = blocco manuale (non appare in lista prenotazioni)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'booking';

-- Aggiorna le righe esistenti senza tipo
UPDATE bookings SET booking_type = 'booking' WHERE booking_type IS NULL;
