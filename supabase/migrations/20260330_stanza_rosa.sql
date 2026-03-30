-- RS Hospitality — Stanza Rosa (seconda property privata)
-- Migrazione: 2026-03-30

-- Aggiunge colonna is_private alla tabella properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Inserisce la Stanza Rosa come property privata
INSERT INTO properties (name, category, address, city, active, is_private)
VALUES (
  'Stanza Rosa',
  'RS Comfort',
  'Via Clanio 60',
  'Marcianise',
  true,
  true
)
ON CONFLICT DO NOTHING;
